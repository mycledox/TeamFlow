(() => {
  const api = window.TeamFlow;
  const state = api.getState();
  const tbody = document.querySelector("[data-task-list]");
  const empty = document.querySelector("[data-task-empty]");
  const projectFilter = document.querySelector("[data-task-project-filter]");
  let statusFilter = "all";
  let projectChoice = "all";

  function render() {
    const currentProjects = api.getState().projects;
    const selection = projectFilter.value;
    projectFilter.innerHTML = `<option value="all">All projects</option>${currentProjects.map((item) => `<option value="${api.escape(item.id)}">${api.escape(item.name)}</option>`).join("")}`;
    projectFilter.value = currentProjects.some((item) => item.id === selection) ? selection : projectChoice;
    projectChoice = projectFilter.value || "all";
    const counts = { all: state.tasks.length, todo: 0, "in-progress": 0, done: 0 };
    state.tasks.forEach((task) => { counts[task.status] = (counts[task.status] || 0) + 1; });
    Object.entries(counts).forEach(([key, count]) => {
      const badge = document.querySelector(`[data-task-filter-count="${key}"]`);
      if (badge) badge.textContent = count;
    });
    const tasks = state.tasks.filter((task) => (statusFilter === "all" || task.status === statusFilter) && (projectChoice === "all" || task.projectId === projectChoice));
    tbody.innerHTML = tasks.map((task) => {
      const project = api.project(task.projectId);
      const projectName = project ? `<a class="row-title" href="project-details.html?id=${encodeURIComponent(project.id)}">${api.escape(project.name)}</a>` : "General task";
      return `<tr class="${task.status === "done" ? "is-done" : ""}"><td>${api.escape(task.title)}<span class="row-subtitle">${api.escape(api.member(task.assigneeId)?.name || "Unassigned")}</span></td><td>${projectName}</td><td><span class="priority priority-${api.escape(task.priority)}">${api.escape(task.priority)}</span></td><td>${api.escape(api.formatDate(task.dueDate))}</td><td><label class="sr-only" for="task-status-${api.escape(task.id)}">${api.escape(task.title)} status</label><select class="status-select" id="task-status-${api.escape(task.id)}" data-task-status="${api.escape(task.id)}">${["todo", "in-progress", "done"].map((status) => `<option value="${status}"${task.status === status ? " selected" : ""}>${api.statusLabel(status)}</option>`).join("")}</select></td><td><input type="checkbox" data-task-complete="${api.escape(task.id)}" aria-label="Mark ${api.escape(task.title)} complete"${task.status === "done" ? " checked" : ""}></td></tr>`;
    }).join("");
    empty.hidden = tasks.length !== 0;
    document.querySelector(".task-table").hidden = tasks.length === 0;
  }

  document.querySelectorAll("[data-task-filter]").forEach((button) => button.addEventListener("click", () => {
    statusFilter = button.dataset.taskFilter;
    document.querySelectorAll("[data-task-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    render();
  }));
  projectFilter.addEventListener("change", () => { projectChoice = projectFilter.value; render(); });
  document.addEventListener("change", (event) => {
    const taskId = event.target.dataset.taskStatus || event.target.dataset.taskComplete;
    if (!taskId) return;
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.status = event.target.dataset.taskComplete ? event.target.checked ? "done" : "todo" : event.target.value;
    api.save();
    render();
  });
  window.addEventListener("teamflow:statechange", render);
  window.addEventListener("teamflow:tasks-updated", render);
  window.addEventListener("teamflow:projects-updated", render);
  render();
})();