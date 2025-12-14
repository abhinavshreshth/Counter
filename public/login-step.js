// STEP SWITCHING JS
document.addEventListener("DOMContentLoaded", () => {

  const step1 = document.getElementById("step1-form");
  const step2 = document.querySelector('[data-form="step2-form"]');

  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backToStep1");

  const username = document.getElementById("username");
  const displayUsername = document.getElementById("display-username");

  const refreshCaptcha = document.getElementById("login-refreshCaptcha");
  const captchaImage = document.getElementById("captchaImage");

  // STEP 1 → STEP 2
  nextBtn.onclick = () => {
    if (!username.checkValidity()) {
      username.reportValidity(); // Show browser balloon
      return;
    }

    // Show username visually
    displayUsername.textContent = username.value.trim();

    // Store username for backend login
    document.getElementById("hidden-username").value = username.value.trim();

    step1.style.display = "none";
    step2.style.display = "block";
  };

  // STEP 2 → STEP 1
  // STEP 2 → STEP 1
  backBtn.onclick = () => {
    step2.style.display = "none";
    step1.style.display = "block";

    // Clear password
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.type = "password";
    }
  };

  // CAPTCHA Refresh (safe)
  if (refreshCaptcha && captchaImage) {
    refreshCaptcha.onclick = () => {
      captchaImage.src = "/captcha?t=" + Date.now();
    };
  }

});
