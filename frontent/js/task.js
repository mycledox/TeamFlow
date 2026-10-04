(() => {
  const store = window.TeamFlowStore;
  let activeFilter = "all";

  const dateLabel = (value) => {
    if (!value) return "No due date";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${value}T00:00:00`);
    const difference = Math.round((due - today) / 86400000);
    if (difference === 0) return "Today";
    if (difference === 1) return "Tomorrow";
    if (difference === -1) return "Yesterday";
    return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const renderTasks = (query = "") => {
    const { tasks, projects, members } = store.getData();
    const normalizedQuery = query.trim().toLowerCase();
    const visibleTasks = tasks.filter((task) => {
      const project = projects.find((item) => item.id === task.projectId);
      const member = members.find((item) => item.id === task.assignee);
      const matchesQuery = `${task.title} ${project?.name || ""} ${member?.name || ""}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (activeFilter === "all" || task.status === activeFilter);
    });
    const list = document.getElementById("task-list");
    document.getElementById("task-count-label").textContent = `(${visibleTasks.length})`;
    document.getElementById("task-nav-count").textContent = tasks.filter((task) => task.status !== "completed").length;
    if (!visibleTasks.length) {
      list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">☷</span><strong>${tasks.length ? "No tasks match this view" : "A clear list is a great start"}</strong><p>${tasks.length ? "Try another filter or search term." : "Add a task and turn your next idea into action."}</p></div>`;
      return;
    }
    list.innerHTML = visibleTasks.map((task) => {
      const project = projects.find((item) => item.id === task.projectId);
      const member = members.find((item) => item.id === task.assignee);
      const completed = task.status === "completed";
      const statusLabel = task.status === "in-progress" ? "In progress" : completed ? "Done" : "To do";
      return `<article class="task-row${completed ? " is-complete" : ""}">
        <input class="task-check" type="checkbox" data-complete-task="${task.id}" aria-label="${completed ? "Mark incomplete" : "Mark complete"}: ${window.TeamFlowDashboard.escapeHtml(task.title)}" ${completed ? "checked" : ""}>
        <div class="task-info"><button class="task-open-button" data-task-open="${task.id}" type="button">${window.TeamFlowDashboard.escapeHtml(task.title)}</button><span class="task-project-label">${window.TeamFlowDashboard.escapeHtml(project?.name || "No project")}</span></div>
        <select class="task-status-select" data-task-status="${task.id}" aria-label="Status: ${window.TeamFlowDashboard.escapeHtml(task.title)}"><option value="todo" ${task.status === "todo" ? "selected" : ""}>To do</option><option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In progress</option><option value="completed" ${completed ? "selected" : ""}>Done</option></select>
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        ${member ? `<span class="avatar task-assignee avatar-${member.color}" title="${window.TeamFlowDashboard.escapeHtml(member.name)}">${store.initials(member.name)[0]}</span>` : ""}
        <time class="task-due" datetime="${task.dueDate || ""}">${dateLabel(task.dueDate)}</time>
      </article>`;
    }).join("");
  };

  const renderDetail = (taskId) => {
    const { tasks, projects, members } = store.getData();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      document.getElementById("detail-task-title").textContent = "Task not found";
      document.getElementById("detail-task-project").textContent = "This task may have been removed.";
      document.getElementById("detail-task-description").textContent = "";
      document.getElementById("detail-task-meta").innerHTML = "";
      document.getElementById("task-comment-list").innerHTML = "";
      document.getElementById("task-attachment-list").innerHTML = "";
      return;
    }
    const project = projects.find((item) => item.id === task.projectId);
    const member = members.find((item) => item.id === task.assignee);
    document.getElementById("detail-task-title").textContent = task.title;
    document.getElementById("detail-task-project").textContent = project ? `In ${project.name}` : "No project";
    document.getElementById("detail-task-description").textContent = task.description || "No description yet. Add a comment to share context with your team.";
    document.getElementById("detail-task-complete").checked = task.status === "completed";
    document.getElementById("detail-task-meta").innerHTML = `
      <div class="task-meta-cell">STATUS<strong><select class="task-status-select" data-task-status="${task.id}" aria-label="Task status"><option value="todo" ${task.status === "todo" ? "selected" : ""}>To do</option><option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In progress</option><option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option></select></strong></div>
      <div class="task-meta-cell">PRIORITY<strong><span class="priority-badge priority-${task.priority}">${task.priority}</span></strong></div>
      <div class="task-meta-cell">ASSIGNEE<strong>${member ? `${window.TeamFlowDashboard.escapeHtml(member.name)} · ${window.TeamFlowDashboard.escapeHtml(member.role)}` : "Unassigned"}</strong></div>
      <div class="task-meta-cell">DUE DATE<strong>${dateLabel(task.dueDate)}</strong></div>`;
    const comments = task.comments || [];
    window.TeamFlowProjects.renderComments(comments, document.getElementById("task-comment-list"));
    const attachments = task.attachments || [];
    document.getElementById("task-attachment-count").textContent = attachments.length ? `${attachments.length} files` : "No files yet";
    document.getElementById("task-attachment-list").innerHTML = attachments.length
      ? attachments.map((file) => `<div class="file-row"><span class="file-kind">${window.TeamFlowDashboard.escapeHtml(file.type || "FILE")}</span><span class="file-name">${window.TeamFlowDashboard.escapeHtml(file.name)}</span><span class="file-meta">${window.TeamFlowDashboard.escapeHtml(file.size || "Shared")}</span></div>`).join("")
      : `<p class="attachment-note">No files have been attached to this task.</p>`;
  };

  const renderFilters = () => {
    document.querySelectorAll(".filter-tab").forEach((button) => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  window.TeamFlowTasks = {
    render: renderTasks,
    renderDetail,
    setFilter(filter) {
      activeFilter = filter;
      renderFilters();
    }
  };
})();