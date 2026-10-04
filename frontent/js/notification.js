(() => {
  const api = window.TeamFlow;
  const list = document.querySelector("[data-notification-list]");
  let filter = "all";
  const symbols = { task: "✓", project: "▦", complete: "✓", member: "+" };

  function render() {
    const notices = api.getState().notifications.slice().sort((a, b) => b.time - a.time);
    const unread = notices.filter((notice) => !notice.read).length;
    document.querySelector("[data-unread-count]").textContent = unread;
    const filtered = filter === "unread" ? notices.filter((notice) => !notice.read) : notices;
    list.innerHTML = filtered.map((notice) => {
      const age = Math.max(1, Math.round((Date.now() - notice.time) / 60000));
      const ageLabel = age < 60 ? `${age} min ago` : age < 1440 ? `${Math.round(age / 60)} hr ago` : `${Math.round(age / 1440)} days ago`;
      return `<article class="notification-item${notice.read ? "" : " is-unread"}"><span class="notification-icon" data-symbol="${symbols[notice.kind] || "•"}" aria-hidden="true"></span><div class="notification-copy"><p>${api.escape(notice.message)}</p><time>${ageLabel}</time></div>${notice.read ? "" : '<span class="notification-unread" aria-label="Unread"></span>'}</article>`;
    }).join("") || '<div class="notification-empty">You are all caught up.</div>';
  }

  document.querySelectorAll("[data-notification-filter]").forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.notificationFilter;
    document.querySelectorAll("[data-notification-filter]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    render();
  }));
  document.querySelector("[data-mark-read]").addEventListener("click", () => {
    api.getState().notifications.forEach((notice) => { notice.read = true; });
    api.save();
    render();
  });
  window.addEventListener("teamflow:statechange", render);
  render();
})();