(function () {
  const root = location.pathname.includes("/pages/") ? ".." : ".";
  const links = [
    ["Overview", "pages/dashboard.html", "⌂", "workspace"],
    ["My projects", "pages/projects.html", "▦", "projects"],
    ["My tasks", "pages/tasks.html", "☷", "tasks"],
    ["Team", "pages/team.html", "♧", "team"],
    ["Calendar", "pages/calendar.html", "▦", "calendar"],
    ["Notifications", "pages/notifications.html", "◉", "notifications"],
    ["Settings", "pages/settings.html", "⚙", "settings"]
  ];

  class TeamSidebar extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const current = location.pathname.split("/").pop().replace(".html", "");
      const active = current === "index" || current === "" ? "landing" : current === "dasboard" ? "dashboard" : current;
      const selected = active === "project-details" ? "projects" : active === "setting" ? "settings" : active === "notification" ? "notifications" : active;
      const navItems = links.map(([label, href, symbol, key]) => {
        const isActive = selected === key;
        return `<a class="side-link${isActive ? " active" : ""}" href="${root}/${href}"${isActive ? ' aria-current="page"' : ""}><span class="side-icon" data-symbol="${symbol}" aria-hidden="true"></span><span class="side-label-text">${label}</span>${key === "projects" || key === "tasks" ? `<span class="side-count" data-count="${key}">0</span>` : ""}</a>`;
      }).join("");
      shadow.innerHTML = `<link rel="stylesheet" href="${root}/css/components/sidebar.css"><aside class="sidebar"><div class="sidebar-head"><a class="brand" href="${root}/index.html"><span class="brand-mark" aria-hidden="true"></span><span>TeamFlow</span></a></div><div class="workspace"><span class="workspace-icon">T</span><div class="workspace-copy"><strong>TeamFlow Studio</strong><span>Free workspace</span></div><span class="workspace-caret">⌄</span></div><div class="side-label">Workspace</div><nav class="side-nav" aria-label="Workspace navigation">${navItems}</nav><div class="side-label team-label"><span>Your team</span><button class="side-plus" type="button" data-action="invite" aria-label="Invite a team member">+</button></div><nav class="side-nav" aria-label="Team navigation"><a class="side-link" href="${root}/pages/team.html#members"><span class="side-icon" data-symbol="♧" aria-hidden="true"></span><span class="side-label-text">Members</span></a><a class="side-link" href="${root}/pages/notifications.html"><span class="side-icon" data-symbol="◷" aria-hidden="true"></span><span class="side-label-text">Activity</span></a></nav><div class="sidebar-bottom"><div class="sidebar-divider"></div><div class="account"><span class="avatar" data-user-initial>S</span><div class="account-info"><strong data-user-name>Sonu Kumar</strong><span>Workspace admin</span></div><span class="collapse-mark" aria-hidden="true">···</span></div></div></aside><div class="sidebar-backdrop" data-action="close-sidebar"></div>`;
      shadow.querySelector('[data-action="invite"]').addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("teamflow:invite", { bubbles: true, composed: true }));
      });
      shadow.querySelector('[data-action="close-sidebar"]').addEventListener("click", () => this.removeAttribute("mobile-open"));
    }
  }

  if (!customElements.get("team-sidebar")) customElements.define("team-sidebar", TeamSidebar);
})();
