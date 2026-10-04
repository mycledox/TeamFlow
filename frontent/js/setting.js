(() => {
  const api = window.TeamFlow;
  const form = document.querySelector("[data-settings-form]");
  const nameField = form.querySelector("[data-setting-name]");
  const emailField = form.querySelector("[data-setting-email]");
  const emailNotifications = form.querySelector("[data-setting-email-notifications]");
  const reminders = form.querySelector("[data-setting-reminders]");
  const workspaceField = form.querySelector("[data-setting-workspace]");
  let touched = false;
  function syncForm() {
    if (touched) return;
    const profile = api.getState().user;
    nameField.value = profile.name;
    emailField.value = profile.email;
    emailNotifications.checked = profile.emailNotifications !== false;
    reminders.checked = profile.taskReminders !== false;
    workspaceField.value = api.getState().workspace.name;
  }
  syncForm();
  form.addEventListener("input", () => { touched = true; });
  form.addEventListener("change", () => { touched = true; });
  window.addEventListener("teamflow:statechange", syncForm);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const changes = {
      name: nameField.value.trim(),
      email: emailField.value.trim().toLowerCase(),
      emailNotifications: emailNotifications.checked,
      taskReminders: reminders.checked
    };
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    api.updateProfile(changes, workspaceField.value.trim()).then(() => {
      form.querySelector(".form-message").textContent = "Your settings have been saved.";
      api.showToast("Settings saved to the database.");
    }).catch((error) => {
      console.error("Unable to save settings to the TeamFlow API.", error);
      api.showToast(error.message || "Unable to save settings.");
    }).finally(() => { submit.disabled = false; });
  });
})();