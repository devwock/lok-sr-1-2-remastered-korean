"use strict";

document.querySelectorAll(".screenshot-carousel").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll(".screenshot-slide")];
  const dots = [...carousel.querySelectorAll(".carousel-dot")];
  const previous = carousel.querySelector(".previous");
  const next = carousel.querySelector(".next");
  let activeIndex = 0;
  let isHovered = false;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.toggleAttribute("aria-current", isActive);
    });
  };

  previous.addEventListener("click", () => showSlide(activeIndex - 1));
  next.addEventListener("click", () => showSlide(activeIndex + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => showSlide(index)));
  carousel.addEventListener("mouseenter", () => { isHovered = true; });
  carousel.addEventListener("mouseleave", () => { isHovered = false; });

  window.setInterval(() => {
    if (!isHovered) showSlide(activeIndex + 1);
  }, 10_000);
});

document.querySelectorAll(".feedback-form").forEach((form) => {
  const status = form.querySelector(".feedback-status");
  const submitButton = form.querySelector("button[type=submit]");
  const updateSubmitState = () => {
    submitButton.disabled = !form.checkValidity();
  };

  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
  updateSubmitState();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const endpoint = form.dataset.endpoint;

    if (!endpoint || endpoint.includes("YOUR-WORKER")) {
      status.textContent = "Worker API 주소를 설정한 뒤 전송할 수 있습니다.";
      status.className = "feedback-status is-error";
      return;
    }

    const payload = Object.fromEntries(new FormData(form));
    submitButton.disabled = true;
    status.textContent = "전송 중…";
    status.className = "feedback-status";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("request failed");

      form.reset();
      updateSubmitState();
      status.textContent = "의견이 전송되었습니다. 감사합니다.";
      status.className = "feedback-status is-success";
    } catch {
      status.textContent = "전송하지 못했습니다. 잠시 후 다시 시도해주세요.";
      status.className = "feedback-status is-error";
    } finally {
      submitButton.disabled = false;
    }
  });
});
