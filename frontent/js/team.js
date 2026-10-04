(() => {
  const api = window.TeamFlow;
  const host = document.querySelector("[data-member-list]");
  const search = document.querySelector("[data-member-search]");

  function render() {
    const state = api.getState();
    const query = search.value.trim().toLowerCase();
    document.querySelector("[data-team-count]").textContent = state.members.length;
    document.querySelector("[data-team-projects]").textContent = state.projects.filter((item) => item.status !== "completed").length;
    document.querySelector("[data-team-tasks]").textContent = state.tasks.filter((task) => task.status !== "done").length;
    const items = state.members.filter((person) => `${person.name} ${person.email} ${person.role}`.toLowerCase().includes(query));
    host.innerHTML = items.map((person) => `<article class="member-card"><span class="avatar">${api.initials(person.name)}</span><div class="member-info"><strong>${api.escape(person.name)}</strong><span>${api.escape(person.role)} · ${api.escape(person.email)}</span></div><span class="member-status" title="Active"></span></article>`).join("");
    if (!items.length) host.innerHTML = '<div class="empty-inline">No team members match your search.</div>';
  }

  search.addEventListener("input", render);
  window.addEventListener("teamflow:statechange", render);
  window.addEventListener("teamflow:members-updated", render);
  render();
})();