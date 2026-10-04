(() => {
  const store = window.TeamFlowStore;
  const iconByColor = { purple: "✦", blue: "◈", green: "↗", orange: "✳", pink: "✿" };

  const renderProjects = (query = "") => {
    const { projects, tasks, members } = store.getData();
    const normalizedQuery = query.trim().toLowerCase();
    const visibleProjects = projects.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(normalizedQuery));
    const grid = document.getElementById("project-grid");
    document.getElementById("project-count-label").textContent = `(${visibleProjects.length})`;
    document.getElementById("project-nav-count").textContent = projects.length;

    if (!visibleProjects.length) {
      grid.innerHTML = `<div class="empty-state"><span class="empty-state-icon">▦</span><strong>${projects.length ? "No matching projects" : "Your next big idea starts here"}</strong><p>${projects.length ? "Try a different search term." : "Create a project to bring your team and work together."}</p></div>`;
      grid.style.gridTemplateColumns = "minmax(0, 1fr)";
      return;
    }
    grid.style.gridTemplateColumns = "";
    grid.innerHTML = visibleProjects.map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const completed = projectTasks.filter((task) => task.status === "completed").length;
      const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
      const assignedMembers = [...new Set(projectTasks.map((task) => task.assignee))].slice(0, 3).map((id) => members.find((member) => member.id === id)).filter(Boolean);
      const avatars = assignedMembers.map((member) => `<span class="avatar avatar-${member.color}" title="${window.TeamFlowDashboard.escapeHtml(member.name)}">${store.initials(member.name)[0]}</span>`).join("");
      return `<article class="project-card" data-project-id="${window.TeamFlowDashboard.escapeHtml(project.id)}" tabindex="0" aria-label="Open project ${window.TeamFlowDashboard.escapeHtml(project.name)}">
        <div class="project-card-top"><span class="project-icon project-icon-${project.color}">${iconByColor[project.color] || "✦"}</span><button class="project-more" type="button" data-delete-project="${project.id}" aria-label="Delete ${window.TeamFlowDashboard.escapeHtml(project.name)}">···</button></div>
        <h3>${window.TeamFlowDashboard.escapeHtml(project.name)}</h3><p class="project-description">${window.TeamFlowDashboard.escapeHtml(project.description || "A shared space for your team's work.")}</p>
        <div class="project-progress-meta"><span>${completed} of ${projectTasks.length} tasks completed</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-label="${window.TeamFlowDashboard.escapeHtml(project.name)} progress" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div class="project-card-bottom"><div class="avatar-stack">${avatars}<span class="project-members-label">${assignedMembers.length || 0} members</span></div><span class="project-status${project.status === "Planning" ? " status-planning" : ""}">${window.TeamFlowDashboard.escapeHtml(project.status)}</span></div>
      </article>`;
    }).join("");
  };

  const renderComments = (comments, element) => {
    const { members } = store.getData();
    if (!comments?.length) {
      element.innerHTML = `<div class="empty-state"><strong>No updates yet</strong><p>Start the conversation with your team.</p></div>`;
      return;
    }
    element.innerHTML = comments.slice().reverse().map((comment) => {
      const member = members.find((item) => item.id === comment.authorId) || store.getData().user;
      return `<article class="comment-item"><span class="avatar avatar-${member.color || "blue"}">${store.initials(member.name)[0]}</span><div class="comment-body"><span class="comment-author">${window.TeamFlowDashboard.escapeHtml(member.name)}</span><time class="comment-time">${new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time><p>${window.TeamFlowDashboard.escapeHtml(comment.message)}</p></div></article>`;
    }).join("");
  };

  const renderDetail = (projectId) => {
    const { projects, tasks, members } = store.getData();
    const project = projects.find((item) => item.id === projectId);
    const title = document.getElementById("detail-project-name");
    if (!project) {
      title.textContent = "Project not found";
      document.getElementById("detail-project-description").textContent = "This project may have been removed.";
      document.getElementById("detail-project-summary").innerHTML = "";
      document.getElementById("project-board").innerHTML = "";
      return;
    }
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const completeCount = projectTasks.filter((task) => task.status === "completed").length;
    const assignedMembers = [...new Set(projectTasks.map((task) => task.assignee))].map((id) => members.find((member) => member.id === id)).filter(Boolean);
    title.textContent = project.name;
    document.getElementById("detail-project-description").textContent = project.description || "A shared space for your team's work.";
    document.getElementById("detail-project-summary").innerHTML = `
      <span class="detail-summary-item">◷ <span>Progress</span><strong>${projectTasks.length ? Math.round(completeCount / projectTasks.length * 100) : 0}%</strong></span>
      <span class="detail-summary-item">☷ <span>Tasks</span><strong>${projectTasks.length}</strong></span>
      <span class="detail-summary-item">♧ <span>Team</span><strong>${assignedMembers.length} ${assignedMembers.length === 1 ? "member" : "members"}</strong></span>
      <span class="detail-summary-item"><span class="project-status">${window.TeamFlowDashboard.escapeHtml(project.status)}</span></span>`;
    document.getElementById("project-board").innerHTML = ["todo", "in-progress", "completed"].map((status) => {
      const columnTasks = projectTasks.filter((task) => task.status === status);
      const heading = status === "todo" ? "To do" : status === "in-progress" ? "In progress" : "Completed";
      const cards = columnTasks.map((task) => {
        const member = members.find((item) => item.id === task.assignee);
        const dateText = task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date";
        return `<article class="board-task" draggable="true" data-drag-task="${task.id}"><button class="board-task-title" data-task-open="${task.id}" type="button">${window.TeamFlowDashboard.escapeHtml(task.title)}</button><div class="board-task-meta"><span class="priority-badge priority-${task.priority}">${task.priority}</span>${member ? `<span class="avatar avatar-${member.color}" title="${window.TeamFlowDashboard.escapeHtml(member.name)}">${store.initials(member.name)[0]}</span>` : ""}<time class="task-due">${dateText}</time></div><label class="board-status-label">Move to<select class="task-status-select" data-task-status="${task.id}" aria-label="Move ${window.TeamFlowDashboard.escapeHtml(task.title)}"><option value="todo" ${status === "todo" ? "selected" : ""}>To do</option><option value="in-progress" ${status === "in-progress" ? "selected" : ""}>In progress</option><option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option></select></label></article>`;
      }).join("");
      return `<section class="board-column" data-status="${status}" data-drop-status="${status}"><h3 class="board-column-heading"><span class="board-status-dot"></span>${heading}<span>${columnTasks.length}</span></h3>${cards || `<p class="board-empty">Nothing here yet.</p>`}</section>`;
    }).join("");

    const comments = project.comments || [];
    const commentList = document.getElementById("project-comment-list");
    renderComments(comments, commentList);
    const taskCommentList = document.getElementById("task-comment-list");
    renderComments(comments, taskCommentList);
    const files = project.files || [];
    document.getElementById("project-file-list").innerHTML = files.length
      ? files.map((file) => `<div class="file-row"><span class="file-kind">${window.TeamFlowDashboard.escapeHtml(file.type || "FILE")}</span><span class="file-name">${window.TeamFlowDashboard.escapeHtml(file.name)}</span><span class="file-meta">${window.TeamFlowDashboard.escapeHtml(file.size || "Shared")}</span></div>`).join("")
      : `<div class="empty-state"><span class="empty-state-icon">↥</span><strong>No shared files yet</strong><p>Files can be added to this project when connected to a file storage service.</p></div>`;
    document.getElementById("project-about-view").innerHTML = `<div><strong>About this project</strong><p>${window.TeamFlowDashboard.escapeHtml(project.description || "No project description has been added.")}</p><p><strong>Created</strong> ${new Date(project.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}</p><p><strong>Project status</strong> ${window.TeamFlowDashboard.escapeHtml(project.status)}</p></div>`;
  };

  const setTab = (tab) => {
    document.querySelectorAll("[data-project-tab]").forEach((button) => {
      const active = button.dataset.projectTab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.getElementById("project-board").hidden = tab !== "board";
    document.getElementById("project-files-view").hidden = tab !== "files";
    document.getElementById("project-about-view").hidden = tab !== "about";
  };

  window.TeamFlowProjects = { render: renderProjects, renderDetail, renderComments, setTab };
})();