(() => {
  const api = window.TeamFlow;
  const state = api.getState();
  const currentHour = new Date().getHours();
  document.querySelector("[data-greeting]").textContent = currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";

  function render() {
    const projects = state.projects;
    const tasks = state.tasks;
    const values = {
      projects: projects.length,
      tasks: tasks.length,
      inProgress: tasks.filter((task) => task.status === "in-progress").length,
      completed: tasks.filter((task) => task.status === "done").length
    };
    Object.entries(values).forEach(([key, value]) => {
      const target = document.querySelector(`[data-stat="${key}"]`);
      if (target) target.textContent = value;
    });
    const projectHost = document.querySelector("[data-dashboard-projects]");
    const taskHost = document.querySelector("[data-dashboard-tasks]");
    const deadlinesHost = document.querySelector("[data-dashboard-deadlines]");
    const activityHost = document.querySelector("[data-dashboard-activity]");
    const activeProjects = projects.filter((item) => item.status !== "completed").slice(0, 4);
    projectHost.innerHTML = activeProjects.length ? activeProjects.map((item) => {
      const done = api.tasksForProject(item.id).filter((task) => task.status === "done").length;
      const progress = api.percent(item.id);
      const [color, bg] = api.colorFor(item.color);
      return `<article class="project-row"><div class="project-row-main"><span class="project-color" style="color:${color};background:${bg}" aria-hidden="true"></span><div><a class="project-row-title" href="project-details.html?id=${encodeURIComponent(item.id)}">${api.escape(item.name)}</a><span class="project-row-sub">${api.escape(item.category)} · ${done} task${done === 1 ? "" : "s"} complete</span></div></div><div class="project-row-progress"><span>${progress}%</span><div class="progress-track"><span style="width:${progress}%"></span></div></div></article>`;
    }).join("") : '<div class="empty-inline">No projects yet. Create one to get started.</div>';

    const openTasks = tasks.filter((task) => task.status !== "done").slice(0, 5);
    taskHost.innerHTML = openTasks.length ? openTasks.map((task) => {
      const project = api.project(task.projectId);
      return `<div class="task-row"><input class="task-checkbox" type="checkbox" data-dashboard-complete="${api.escape(task.id)}" aria-label="Mark ${api.escape(task.title)} complete"><div><span class="task-row-title">${api.escape(task.title)}</span><span class="task-row-meta">${api.escape(project?.name || "General task")}</span></div><span class="priority priority-${api.escape(task.priority)}">${api.escape(task.priority)}</span></div>`;
    }).join("") : '<div class="empty-inline">You are all caught up.</div>';

    const deadlines = tasks.filter((task) => task.dueDate && task.status !== "done").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
    deadlinesHost.innerHTML = deadlines.length ? deadlines.map((task) => {
      const [year, month, day] = task.dueDate.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return `<div class="deadline-row"><span class="deadline-date"><strong>${day}</strong><span>${date.toLocaleString(undefined, { month: "short" })}</span></span><div class="deadline-copy"><strong>${api.escape(task.title)}</strong><span>${api.escape(api.project(task.projectId)?.name || "General task")}</span></div><span class="priority priority-${api.escape(task.priority)}">${api.escape(task.priority)}</span></div>`;
    }).join("") : '<div class="empty-inline">No upcoming deadlines.</div>';

    activityHost.innerHTML = state.notifications.slice(0, 4).map((notice) => {
      const ago = Math.max(1, Math.round((Date.now() - notice.time) / 60000));
      const time = ago < 60 ? `${ago} min ago` : ago < 1440 ? `${Math.round(ago / 60)} hr ago` : `${Math.round(ago / 1440)} days ago`;
      return `<div class="activity-row"><span class="avatar">${api.initials(state.user.name).slice(0, 1)}</span><div class="activity-copy"><strong>${api.escape(notice.message)}</strong><span>${time}</span></div></div>`;
    }).join("") || '<div class="empty-inline">Activity will show up here.</div>';
  }

  document.addEventListener("change", (event) => {
    const taskId = event.target.dataset.dashboardComplete;
    if (!taskId || !event.target.checked) return;
    api.run(api.updateTask(taskId, { status: "done" }), "Task completed.");
  });
  window.addEventListener("teamflow:statechange", render);
  window.addEventListener("teamflow:tasks-updated", render);
  render();
})();