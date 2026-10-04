(function () {
  const root = location.pathname.toLowerCase().includes("/pages/") ? ".." : ".";

  class TeamNavbar extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `<link rel="stylesheet" href="${root}/css/components/navbar.css"><header class="navbar"><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"></button><label class="nav-search"><span class="sr-only">Search TeamFlow</span><input type="search" placeholder="Search projects, tasks..." autocomplete="off"></label><div class="search-results" hidden></div><span class="nav-spacer"></span><a class="nav-action" href="${root}/pages/notifications.html" data-icon="notifications" aria-label="Notifications"><span class="nav-dot"></span></a><div class="nav-profile"><span class="avatar" data-user-initial>S</span><button class="nav-name" type="button" data-user-name>Sonu Kumar</button><span class="nav-chevron" aria-hidden="true">⌄</span></div></header>`;
      const menuButton = shadow.querySelector(".menu-toggle");
      menuButton.addEventListener("click", () => {
        const sidebar = document.querySelector("team-sidebar");
        if (matchMedia("(max-width: 760px)").matches) {
          sidebar.toggleAttribute("mobile-open");
          menuButton.setAttribute("aria-expanded", String(sidebar.hasAttribute("mobile-open")));
        } else {
          sidebar.toggleAttribute("collapsed");
          menuButton.setAttribute("aria-expanded", String(!sidebar.hasAttribute("collapsed")));
        }
      });
      document.addEventListener("teamflow:sidebar-closed", () => menuButton.setAttribute("aria-expanded", "false"));
      const search = shadow.querySelector("input");
      const results = shadow.querySelector(".search-results");
      search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        if (!query) { results.hidden = true; results.replaceChildren(); return; }
        const state = window.TeamFlow ? window.TeamFlow.getState() : { projects: [], tasks: [] };
        const matches = [
          ...state.projects.filter((item) => item.name.toLowerCase().includes(query)).map((item) => ({ label: item.name, href: `${root}/pages/project-details.html?id=${encodeURIComponent(item.id)}` })),
          ...state.tasks.filter((item) => item.title.toLowerCase().includes(query)).map((item) => ({ label: item.title, href: `${root}/pages/tasks.html` }))
        ].slice(0, 8);
        results.innerHTML = matches.length ? matches.map((item) => `<a href="${item.href}">${escapeText(item.label)}</a>`).join("") : "<p>No matching projects or tasks.</p>";
        results.hidden = false;
      });
      search.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { results.hidden = true; search.blur(); }
        if (event.key === "Enter") results.querySelector("a")?.click();
      });
      shadow.addEventListener("click", (event) => {
        if (!event.target.closest(".nav-search") && !event.target.closest(".search-results")) results.hidden = true;
      });
    }
  }

  function escapeText(value) {
    return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  if (!customElements.get("team-navbar")) customElements.define("team-navbar", TeamNavbar);
})();
