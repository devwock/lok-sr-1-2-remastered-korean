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
    // Turnstile 위젯이 주입하는 cf-turnstile-response를 워커가 기대하는 turnstileToken으로 변환한다.
    payload.turnstileToken = payload["cf-turnstile-response"] || "";
    delete payload["cf-turnstile-response"];

    if (!payload.turnstileToken) {
      status.textContent = "스팸 방지 확인을 완료해주세요.";
      status.className = "feedback-status is-error";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "전송 중…";
    status.className = "feedback-status";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        form.reset();
        updateSubmitState();
        status.innerHTML = result.url
          ? `의견이 전송되었습니다. 감사합니다. <a href="${result.url}" target="_blank" rel="noreferrer">등록된 이슈 보기</a>`
          : "의견이 전송되었습니다. 감사합니다.";
        status.className = "feedback-status is-success";
      } else if (response.status === 429) {
        status.textContent = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        status.className = "feedback-status is-error";
      } else if (response.status === 403) {
        status.textContent = "스팸 방지 확인에 실패했습니다. 다시 시도해주세요.";
        status.className = "feedback-status is-error";
      } else {
        status.textContent = "전송하지 못했습니다. 입력을 확인해주세요.";
        status.className = "feedback-status is-error";
      }
    } catch {
      status.textContent = "전송하지 못했습니다. 잠시 후 다시 시도해주세요.";
      status.className = "feedback-status is-error";
    } finally {
      submitButton.disabled = false;
      // Turnstile 토큰은 1회용이라 제출 후 위젯을 리셋해 새 토큰을 받게 한다.
      window.turnstile?.reset();
    }
  });
});
