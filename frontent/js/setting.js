(() => {
  const api = window.TeamFlow;
  const form = document.querySelector("[data-settings-form]");
  const profile = api.getState().user;
  const nameField = form.querySelector("[data-setting-name]");
  const emailField = form.querySelector("[data-setting-email]");
  const emailNotifications = form.querySelector("[data-setting-email-notifications]");
  const reminders = form.querySelector("[data-setting-reminders]");
  nameField.value = profile.name;
  emailField.value = profile.email;
  emailNotifications.checked = profile.emailNotifications !== false;
  reminders.checked = profile.taskReminders !== false;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    Object.assign(profile, {
      name: nameField.value.trim(),
      email: emailField.value.trim().toLowerCase(),
      emailNotifications: emailNotifications.checked,
      taskReminders: reminders.checked
    });
    api.save();
    const message = form.querySelector(".form-message");
    message.textContent = "Your settings have been saved.";
    api.showToast("Settings saved.");
  });
})();