(() => {
  const store = window.TeamFlowStore;
  const pageNames = { overview: "Overview", projects: "My projects", tasks: "My tasks", team: "Team members", activity: "Activity", "project-detail": "Project board", "task-detail": "Task details", planner: "AI task planner" };
  const pageCopy = {
    overview: ["Your workspace", "Here’s what’s happening with your team today."],
    projects: ["Projects", "All your team's projects, in one place."],
    tasks: ["Tasks", "Make progress, one task at a time."],
    team: ["Your people", "Meet the people moving your projects forward."],
    activity: ["Team activity", "A quick look at what your team is working on."],
    "project-detail": ["Project board", "Plan, share and track work together."],
    "task-detail": ["Task details", "Everything the team needs to move work forward."],
    planner: ["AI task planner", "Turn your project goals into a clear next-step plan."]
  };
  let currentPage = "overview";
  let searchTerm = "";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const showToast = (message, isError = false) => {
    const region = document.getElementById("toast-region");
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " toast-error" : ""}`;
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3600);
  };

  const setPage = (page, updateHistory = true) => {
    currentPage = pageNames[page] ? page : "overview";
    if (updateHistory) {
      const url = new URL(window.location.href);
      if (currentPage === "overview") url.searchParams.delete("view");
      else url.searchParams.set("view", currentPage);
      window.history.pushState({ view: currentPage }, "", url);
    }
    document.body.dataset.page = currentPage;
    document.getElementById("breadcrumb-current").textContent = pageNames[currentPage];
    document.getElementById("page-title").innerHTML = `${pageCopy[currentPage][0]}${currentPage === "overview" ? `, ${escapeHtml(window.TeamFlowAuth.currentUser().name.split(" ")[0])} <span class="wave">✦</span>` : ""}`;
    document.getElementById("page-subtitle").textContent = pageCopy[currentPage][1];
    document.querySelectorAll(".nav-link[data-page]").forEach((button) => {
      const active = button.dataset.page === currentPage;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.getElementById("projects-heading").textContent = currentPage === "projects" ? "All projects" : "Recent projects";
    document.getElementById("tasks-heading").textContent = currentPage === "tasks" ? "All tasks" : "Your tasks";
    document.getElementById("create-project-button").hidden = !["overview", "projects"].includes(currentPage);
    document.getElementById("project-detail-view").hidden = currentPage !== "project-detail";
    document.getElementById("task-detail-view").hidden = currentPage !== "task-detail";
    document.getElementById("planner-view").hidden = currentPage !== "planner";
    document.getElementById("activity-view").hidden = currentPage !== "activity";
    if (currentPage === "project-detail") {
      window.TeamFlowProjects.renderDetail(new URL(window.location.href).searchParams.get("id"));
      window.TeamFlowProjects.setTab("board");
    }
    if (currentPage === "task-detail") {
      window.TeamFlowTasks.renderDetail(new URL(window.location.href).searchParams.get("id"));
      const projectId = new URL(window.location.href).searchParams.get("projectId");
      document.getElementById("task-detail-back").dataset.pageLink = projectId ? "project-detail" : "tasks";
      document.getElementById("task-detail-back").dataset.projectId = projectId || "";
    }
    if (currentPage === "planner") renderPlannerOptions();
    closeMobileMenu();
  };

  const navigate = (page, id = "", projectId = "") => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", page);
    if (id) url.searchParams.set("id", id);
    else url.searchParams.delete("id");
    if (projectId) url.searchParams.set("projectId", projectId);
    else url.searchParams.delete("projectId");
    window.history.pushState({ view: page }, "", url);
    setPage(page, false);
    render();
  };

  const renderStats = () => {
    const { projects, tasks } = store.getData();
    document.getElementById("stat-projects").textContent = projects.length;
    document.getElementById("stat-completed").textContent = tasks.filter((task) => task.status === "completed").length;
    document.getElementById("stat-progress").textContent = tasks.filter((task) => task.status === "in-progress").length;
    document.getElementById("stat-open").textContent = tasks.filter((task) => task.status === "todo").length;
  };

  const renderTeam = () => {
    const { members, tasks } = store.getData();
    document.getElementById("team-count-label").textContent = `(${members.length})`;
    document.getElementById("team-list").innerHTML = members.map((member) => {
      const activeTasks = tasks.filter((task) => task.assignee === member.id && task.status !== "completed").length;
      const roleLabel = member.role === "Workspace admin" ? "Admin" : member.role;
      return `<div class="member-row"><span class="avatar avatar-${member.color}">${store.initials(member.name)[0]}</span><div class="member-info"><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.role)}</small></div><span class="member-status"><i></i>${activeTasks} ${activeTasks === 1 ? "task" : "tasks"}</span><button class="member-overflow" type="button" aria-label="${escapeHtml(member.name)} is ${escapeHtml(roleLabel)}">···</button></div>`;
    }).join("");
  };

  const populateTaskOptions = () => {
    const { projects, members } = store.getData();
    document.getElementById("task-project-select").innerHTML = projects.length
      ? projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`).join("")
      : `<option value="" disabled selected>Create a project first</option>`;
    document.getElementById("task-assignee-select").innerHTML = members.length
      ? members.map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`).join("")
      : `<option value="" disabled selected>Invite a teammate first</option>`;
    document.querySelector('#task-form button[type="submit"]').disabled = !projects.length || !members.length;
  };

  const render = () => {
    renderStats();
    window.TeamFlowProjects.render(searchTerm);
    window.TeamFlowTasks.render(searchTerm);
    renderTeam();
    populateTaskOptions();
    renderActivity();
    if (currentPage === "project-detail") window.TeamFlowProjects.renderDetail(new URL(window.location.href).searchParams.get("id"));
    if (currentPage === "task-detail") window.TeamFlowTasks.renderDetail(new URL(window.location.href).searchParams.get("id"));
  };

  function renderPlannerOptions() {
    const select = document.getElementById("planner-project-select");
    if (!select) return;
    const { projects } = store.getData();
    select.innerHTML = projects.length
      ? projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`).join("")
      : `<option value="" disabled selected>Create a project first</option>`;
  }

  const renderActivity = () => {
    const { tasks, projects, members } = store.getData();
    const activity = tasks.slice(0, 8).map((task) => {
      const project = projects.find((item) => item.id === task.projectId);
      const member = members.find((item) => item.id === task.assignee);
      const status = task.status === "completed" ? "completed" : task.status === "in-progress" ? "is working on" : "is ready to start";
      const suffix = task.status === "completed" ? "" : ` in ${project ? escapeHtml(project.name) : "your workspace"}`;
      return `<article class="activity-item"><span class="avatar avatar-${member?.color || "blue"}">${member ? store.initials(member.name)[0] : "T"}</span><div><p><strong>${escapeHtml(member?.name || "Your team")}</strong> ${status} <strong>${escapeHtml(task.title)}</strong>${suffix}.</p><time>${task.status === "completed" ? "Completed task" : task.status === "in-progress" ? "In progress" : "Up next"}</time></div></article>`;
    });
    document.getElementById("activity-list").innerHTML = activity.length ? activity.join("") : `<div class="empty-state"><strong>No activity yet</strong><p>Create a task to get your team moving.</p></div>`;
  };

  const openDialog = (id) => {
    const dialog = document.getElementById(id);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    const field = dialog.querySelector("input:not([type='hidden']), textarea");
    if (field) window.setTimeout(() => field.focus(), 20);
  };

  const closeDialog = (dialog) => {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  };

  const showMobileMenu = (open) => {
    document.getElementById("sidebar").classList.toggle("is-open", open);
    document.getElementById("sidebar-backdrop").classList.toggle("is-visible", open);
    document.getElementById("menu-button").setAttribute("aria-expanded", String(open));
  };
  const closeMobileMenu = () => showMobileMenu(false);

  const bindEvents = () => {
    document.querySelectorAll(".nav-link[data-page]").forEach((button) => {
      button.addEventListener("click", () => setPage(button.dataset.page));
    });
    document.querySelectorAll("[data-page-link]").forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.dataset.projectId) {
          event.preventDefault();
          navigate("project-detail", button.dataset.projectId);
        } else {
          setPage(button.dataset.pageLink);
        }
      });
    });
    document.getElementById("create-project-button").addEventListener("click", () => openDialog("project-dialog"));
    document.getElementById("create-task-button").addEventListener("click", () => openDialog("task-dialog"));
    ["invite-button", "invite-shortcut", "invite-link"].forEach((id) => {
      document.getElementById(id).addEventListener("click", () => openDialog("invite-dialog"));
    });
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(button.closest("dialog")));
    });
    document.querySelectorAll("dialog.app-dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });

    document.getElementById("project-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        store.addProject({ name: form.get("name").trim(), description: form.get("description").trim(), color: form.get("color") });
        event.currentTarget.reset();
        closeDialog(document.getElementById("project-dialog"));
        render();
        showToast("Your new project is ready.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("task-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        store.addTask({
          title: form.get("title").trim(),
          projectId: form.get("projectId"),
          assignee: form.get("assignee"),
          dueDate: form.get("dueDate"),
          priority: form.get("priority")
        });
        event.currentTarget.reset();
        closeDialog(document.getElementById("task-dialog"));
        render();
        showToast("Task added to your workspace.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("invite-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = form.get("email").trim();
      const duplicate = store.getData().members.some((member) => member.email.toLowerCase() === email.toLowerCase());
      if (duplicate) {
        showToast("This email is already part of your team.", true);
        return;
      }
      try {
        store.addMember({ name: form.get("name").trim(), email, role: form.get("role") });
        event.currentTarget.reset();
        closeDialog(document.getElementById("invite-dialog"));
        render();
        showToast("Your teammate has been added.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("task-filters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      window.TeamFlowTasks.setFilter(button.dataset.filter);
      render();
    });

    document.getElementById("task-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-task-open]");
      if (button) navigate("task-detail", button.dataset.taskOpen);
    });

    document.getElementById("project-grid").addEventListener("click", (event) => {
      const card = event.target.closest(".project-card");
      if (card && !event.target.closest("[data-delete-project]")) navigate("project-detail", card.dataset.projectId);
    });

    document.getElementById("project-board").addEventListener("click", (event) => {
      const button = event.target.closest("[data-task-open]");
      if (button) navigate("task-detail", button.dataset.taskOpen, new URL(window.location.href).searchParams.get("id"));
    });

    document.getElementById("project-board").addEventListener("change", (event) => {
      const select = event.target.closest("[data-task-status]");
      if (!select) return;
      try {
        store.updateTask(select.dataset.taskStatus, { status: select.value });
        render();
        showToast("Task status updated.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("project-board").addEventListener("dragstart", (event) => {
      const card = event.target.closest("[data-drag-task]");
      if (card) event.dataTransfer.setData("text/plain", card.dataset.dragTask);
    });
    document.getElementById("project-board").addEventListener("dragover", (event) => {
      const column = event.target.closest("[data-drop-status]");
      if (!column) return;
      event.preventDefault();
      column.classList.add("is-drag-target");
    });
    document.getElementById("project-board").addEventListener("dragleave", (event) => {
      const column = event.target.closest("[data-drop-status]");
      if (column && !column.contains(event.relatedTarget)) column.classList.remove("is-drag-target");
    });
    document.getElementById("project-board").addEventListener("drop", (event) => {
      const column = event.target.closest("[data-drop-status]");
      const taskId = event.dataTransfer.getData("text/plain");
      if (!column || !taskId) return;
      event.preventDefault();
      column.classList.remove("is-drag-target");
      try {
        store.updateTask(taskId, { status: column.dataset.dropStatus });
        render();
        showToast("Task moved to a new stage.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.querySelectorAll("[data-project-tab]").forEach((button) => {
      button.addEventListener("click", () => window.TeamFlowProjects.setTab(button.dataset.projectTab));
    });

    document.getElementById("detail-create-task").addEventListener("click", () => {
      const currentProject = new URL(window.location.href).searchParams.get("id");
      const select = document.getElementById("task-project-select");
      if (currentProject && [...select.options].some((option) => option.value === currentProject)) select.value = currentProject;
      openDialog("task-dialog");
    });

    document.getElementById("task-detail-view").addEventListener("change", (event) => {
      const checkbox = event.target.closest("#detail-task-complete");
      const select = event.target.closest("[data-task-status]");
      const taskId = new URL(window.location.href).searchParams.get("id");
      if (!taskId || (!checkbox && !select)) return;
      try {
        store.updateTask(taskId, { status: checkbox ? (checkbox.checked ? "completed" : "todo") : select.value });
        render();
        showToast("Task details updated.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("task-comment-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const taskId = new URL(window.location.href).searchParams.get("id");
      try {
        store.addTaskComment(taskId, new FormData(event.currentTarget).get("comment").trim());
        event.currentTarget.reset();
        render();
        showToast("Your comment has been posted.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("project-comment-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const projectId = new URL(window.location.href).searchParams.get("id");
      try {
        store.addProjectComment(projectId, new FormData(event.currentTarget).get("comment").trim());
        event.currentTarget.reset();
        render();
        window.TeamFlowProjects.setTab("files");
        showToast("Your project update has been posted.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("planner-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const project = store.getData().projects.find((item) => item.id === formData.get("projectId"));
      if (!project) {
        showToast("Create a project before generating a plan.", true);
        return;
      }
      const goal = formData.get("goal").trim();
      const firstStep = goal ? `Define success for: ${goal}` : `Agree on the next milestone for ${project.name}`;
      const steps = [firstStep, `Break ${project.name} into owner-ready work`, "Review progress with your team and adjust priorities"];
      const results = document.getElementById("planner-results");
      results.innerHTML = `<h3>Suggested next steps for ${escapeHtml(project.name)}</h3>${steps.map((step, index) => `<div class="planner-step"><span>${index + 1}</span><span>${escapeHtml(step)}</span><button type="button" data-add-planned-task="${escapeHtml(project.id)}" data-plan-task="${escapeHtml(step)}">Add task</button></div>`).join("")}`;
      results.hidden = false;
      results.dataset.projectId = project.id;
    });

    document.getElementById("planner-results").addEventListener("click", (event) => {
      const button = event.target.closest("[data-add-planned-task]");
      if (!button) return;
      try {
        store.addTask({ title: button.dataset.planTask, projectId: button.dataset.addPlannedTask, assignee: store.getData().members[0]?.id || "", dueDate: "", priority: "medium" });
        button.textContent = "Added";
        button.disabled = true;
        render();
        showToast("Suggested task added to your workspace.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("task-list").addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-complete-task]");
      const statusSelect = event.target.closest("[data-task-status]");
      const taskId = checkbox?.dataset.completeTask || statusSelect?.dataset.taskStatus;
      if (!taskId) return;
      try {
        const status = checkbox ? (checkbox.checked ? "completed" : "todo") : statusSelect.value;
        store.updateTask(taskId, { status });
        render();
        showToast(status === "completed" ? "Task marked as complete." : "Task status updated.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("project-grid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-project]");
      if (!button) return;
      const project = store.getData().projects.find((item) => item.id === button.dataset.deleteProject);
      if (!project || !window.confirm(`Delete "${project.name}" and its tasks? This cannot be undone.`)) return;
      try {
        store.removeProject(project.id);
        render();
        showToast("Project and its tasks have been removed.");
      } catch (error) {
        showToast(error.message, true);
      }
    });

    document.getElementById("global-search").addEventListener("input", (event) => {
      searchTerm = event.target.value;
      render();
    });
    document.getElementById("menu-button").addEventListener("click", () => {
      showMobileMenu(!document.getElementById("sidebar").classList.contains("is-open"));
    });
    document.getElementById("sidebar-backdrop").addEventListener("click", closeMobileMenu);
    document.getElementById("profile-menu").addEventListener("click", () => showToast(`${window.TeamFlowAuth.currentUser().name} · Workspace admin`));
    document.getElementById("topbar-user").addEventListener("click", () => showToast(`${window.TeamFlowAuth.currentUser().name} · Workspace admin`));
    document.getElementById("notification-button").addEventListener("click", () => showToast("You're all caught up. No new notifications."));
    document.getElementById("workspace-picker").addEventListener("click", () => showToast("You're viewing the TeamFlow Studio workspace."));
    document.getElementById("upgrade-button").addEventListener("click", () => showToast("You're on the Free workspace plan."));

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search").focus();
      }
      if (event.key === "Escape") closeMobileMenu();
    });
    window.addEventListener("popstate", () => {
      setPage(new URL(window.location.href).searchParams.get("view") || "overview", false);
      render();
    });
  };

  const start = () => {
    window.TeamFlowDashboard = { escapeHtml };
    const user = window.TeamFlowAuth.currentUser();
    document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
    document.getElementById("current-year").textContent = new Date().getFullYear();
    document.querySelectorAll(".avatar-blue").forEach((avatar) => { avatar.textContent = store.initials(user.name)[0]; });
    document.querySelectorAll(".profile-copy strong").forEach((name) => { name.textContent = user.name; });
    document.getElementById("global-search").setAttribute("aria-label", "Search projects and tasks");
    bindEvents();
    setPage(new URL(window.location.href).searchParams.get("view") || "overview", false);
    render();
    if (store.getLoadError()) showToast(store.getLoadError().message, true);
  };

  document.addEventListener("DOMContentLoaded", start);
  window.TeamFlowDashboard = { escapeHtml };
})();