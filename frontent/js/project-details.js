(() => {
  const api = window.TeamFlow;
  const state = api.getState();
  const query = new URLSearchParams(location.search);
  let activeProject = api.project(query.get("id")) || state.projects[0];
  const tbody = document.querySelector("[data-project-tasks]");
  const filter = document.querySelector("[data-project-task-filter]");
  const empty = document.querySelector("[data-detail-empty]");

  function render() {
    if (!activeProject || !api.project(activeProject.id)) {
      activeProject = state.projects[0];
    }
    if (!activeProject) {
      document.querySelectorAll("[data-detail-name]").forEach((element) => { element.textContent = "No projects yet"; });
      document.querySelector("[data-detail-description]").textContent = "Create a project to start organizing your team's work.";
      document.querySelector("[data-project-task-count]").textContent = "0";
      tbody.replaceChildren();
      empty.hidden = false;
      return;
    }
    document.querySelectorAll("[data-detail-name]").forEach((element) => { element.textContent = activeProject.name; });
    document.querySelector("[data-detail-category]").textContent = activeProject.category.toUpperCase();
    document.querySelector("[data-detail-description]").textContent = activeProject.description || "Project overview and team tasks.";
    const allTasks = api.tasksForProject(activeProject.id);
    const completed = allTasks.filter((task) => task.status === "done").length;
    const remaining = allTasks.length - completed;
    const progress = allTasks.length ? Math.round(completed / allTasks.length * 100) : 0;
    document.querySelector("[data-project-progress]").textContent = `${progress}%`;
    document.querySelector("[data-project-progress-label]").textContent = `${progress}% complete`;
    document.querySelector("[data-project-progress-bar]").style.width = `${progress}%`;
    document.querySelector("[data-project-done-label]").textContent = `${completed} completed`;
    document.querySelector("[data-project-open-label]").textContent = `${remaining} remaining`;
    document.querySelector("[data-project-task-count]").textContent = allTasks.length;
    document.querySelector("[data-project-members]").innerHTML = activeProject.memberIds.map(api.member).filter(Boolean).map((person) => `<span class="project-member"><span class="avatar avatar-small">${api.initials(person.name)}</span>${api.escape(person.name)}</span>`).join("") || '<span class="muted">No members assigned.</span>';
    const selected = filter.value;
    const shownTasks = allTasks.filter((task) => selected === "all" || task.status === selected);
    tbody.innerHTML = shownTasks.map((task) => {
      const person = api.member(task.assigneeId);
      return `<tr data-task-id="${api.escape(task.id)}"><td>${api.escape(task.title)}</td><td>${person ? `<span class="avatar avatar-small" title="${api.escape(person.name)}">${api.initials(person.name)}</span> ${api.escape(person.name)}` : "Unassigned"}</td><td><span class="priority priority-${api.escape(task.priority)}">${api.escape(task.priority)}</span></td><td>${api.escape(api.formatDate(task.dueDate))}</td><td><select class="status-select" data-task-status="${api.escape(task.id)}" aria-label="Task status">${["todo", "in-progress", "done"].map((status) => `<option value="${status}"${task.status === status ? " selected" : ""}>${api.statusLabel(status)}</option>`).join("")}</select></td><td><button class="row-delete" type="button" data-action="delete-task" data-task-id="${api.escape(task.id)}">Delete</button></td></tr>`;
    }).join("");
    empty.hidden = shownTasks.length !== 0;
    document.querySelector(".table-wrap").hidden = shownTasks.length === 0;
    document.querySelector("[data-action=create-task]").closest("button").dataset.projectId = activeProject.id;
  }

  filter.addEventListener("change", render);
  document.addEventListener("change", (event) => {
    const taskId = event.target.dataset.taskStatus;
    if (taskId) api.run(api.updateTask(taskId, { status: event.target.value }), "Task updated.");
  });
  window.addEventListener("teamflow:statechange", render);
  window.addEventListener("teamflow:tasks-updated", render);
  window.addEventListener("teamflow:members-updated", render);
  render();
})();
