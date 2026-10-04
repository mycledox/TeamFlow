(() => {
  const api = window.TeamFlow;
  const grid = document.querySelector("[data-project-grid]");
  const empty = document.querySelector("[data-project-empty]");
  const search = document.querySelector("[data-project-search]");
  const sort = document.querySelector("[data-project-sort]");
  let filter = "all";

  function render() {
    const query = search.value.trim().toLowerCase();
    const items = api.getState().projects.filter((item) => {
      const matchesStatus = filter === "all" || (filter === "completed" ? item.status === "completed" : item.status !== "completed");
      return matchesStatus && `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query);
    });
    if (sort.value === "name") items.sort((a, b) => a.name.localeCompare(b.name));
    if (sort.value === "due") items.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    if (sort.value === "updated") items.sort((a, b) => b.createdAt - a.createdAt);
    grid.innerHTML = items.map((item) => {
      const [color, bg] = api.colorFor(item.color);
      const members = item.memberIds.map(api.member).filter(Boolean);
      const progress = api.percent(item.id);
      const selected = item.status === "completed";
      return `<article class="project-card"><div class="project-card-top"><span class="project-card-mark" style="--project-color:${color};--project-bg:${bg}" aria-hidden="true"></span><span class="badge ${selected ? "badge-green" : "badge-blue"}">${selected ? "Completed" : "Active"}</span></div><h2><a class="row-title" href="project-details.html?id=${encodeURIComponent(item.id)}">${api.escape(item.name)}</a></h2><p>${api.escape(item.description || item.category)}</p><div class="project-card-bottom"><span class="project-card-meta">${api.escape(item.category)} · Due ${api.escape(api.formatDate(item.dueDate))}</span><span class="avatar-stack">${members.slice(0, 3).map((person) => `<span class="avatar avatar-small" title="${api.escape(person.name)}">${api.initials(person.name)}</span>`).join("")}</span></div><div class="project-card-footer"><span>${progress}% complete</span><label class="sr-only" for="status-${api.escape(item.id)}">Project status</label><select class="status-select" id="status-${api.escape(item.id)}" data-project-status="${api.escape(item.id)}" aria-label="Set ${api.escape(item.name)} status"><option value="active"${selected ? "" : " selected"}>Active</option><option value="completed"${selected ? " selected" : ""}>Completed</option></select><button class="row-delete" type="button" data-action="delete-project" data-project-id="${api.escape(item.id)}">Delete</button></div></article>`;
    }).join("");
    empty.hidden = items.length !== 0;
    grid.hidden = items.length === 0;
  }

  document.querySelectorAll("[data-project-filter]").forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.projectFilter;
    document.querySelectorAll("[data-project-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    render();
  }));
  search.addEventListener("input", render);
  sort.addEventListener("change", render);
  document.addEventListener("change", (event) => {
    const projectId = event.target.dataset.projectStatus;
    if (!projectId) return;
    const item = api.project(projectId);
    if (item) { item.status = event.target.value; api.save(); render(); }
  });
  window.addEventListener("teamflow:statechange", render);
  window.addEventListener("teamflow:projects-updated", render);
  render();
})();