(() => {
  const api = window.TeamFlow;
  document.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const message = form.querySelector(".form-message");
      if (form.dataset.authForm === "register") {
        const password = String(values.get("password"));
        if (password !== String(values.get("confirmPassword"))) {
          message.textContent = "Passwords do not match.";
          message.style.color = "#bb4949";
          form.elements.confirmPassword.focus();
          return;
        }
        api.getState().user = { ...api.getState().user, name: String(values.get("name")).trim(), email: String(values.get("email")).trim().toLowerCase() };
        api.save();
        window.location.href = "dashboard.html";
        return;
      }
      const email = String(values.get("email")).trim().toLowerCase();
      if (!api.getState().user.email || api.getState().user.email === "sonu@example.com") {
        api.getState().user.email = email;
        api.getState().user.name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
        api.save();
      }
      message.textContent = "Signed in. Opening your workspace...";
      window.setTimeout(() => { window.location.href = "dashboard.html"; }, 350);
    });
  });

  document.querySelector("[data-reset-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const message = form.querySelector(".form-message");
    message.textContent = "If an account exists for this address, a reset link will be sent.";
    form.querySelector("button[type=submit]").textContent = "Request sent";
  });

  document.querySelectorAll("[data-demo-social]").forEach((button) => {
    button.addEventListener("click", () => api.showToast(`${button.dataset.demoSocial} sign-in needs an authentication provider.`));
  });
})();