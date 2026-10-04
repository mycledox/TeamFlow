(() => {
  const STORAGE_KEY = "teamflow-workspace-v1";
  const today = new Date();
  const dateOffset = (days) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const starterState = {
    user: { name: "Sonu Kumar", email: "sonu@example.com", emailNotifications: true, taskReminders: true },
    members: [
      { id: "member-sonu", name: "Sonu Kumar", email: "sonu@example.com", role: "Workspace admin" },
      { id: "member-nora", name: "Nora Patel", email: "nora@example.com", role: "Product designer" },
      { id: "member-mason", name: "Mason Lee", email: "mason@example.com", role: "Engineering" },
      { id: "member-ava", name: "Ava Chen", email: "ava@example.com", role: "Product lead" }
    ],
    projects: [
      { id: "project-website", name: "TeamFlow website", category: "Product design", description: "Refresh the public website and improve the onboarding experience.", dueDate: dateOffset(8), memberIds: ["member-sonu", "member-nora", "member-ava"], color: "blue", status: "active", createdAt: Date.now() - 300000 },
      { id: "project-mobile", name: "Mobile App", category: "Mobile product", description: "Build a simple mobile experience for teams on the go.", dueDate: dateOffset(13), memberIds: ["member-sonu", "member-mason"], color: "purple", status: "active", createdAt: Date.now() - 200000 },
      { id: "project-backend", name: "Backend API", category: "Engineering", description: "Deliver secure and dependable APIs for the TeamFlow workspace.", dueDate: dateOffset(19), memberIds: ["member-mason", "member-ava"], color: "orange", status: "active", createdAt: Date.now() - 100000 },
      { id: "project-ux", name: "UX Design", category: "Research", description: "Make daily planning clear and comfortable for every team member.", dueDate: dateOffset(25), memberIds: ["member-nora", "member-ava"], color: "green", status: "active", createdAt: Date.now() }
    ],
    tasks: [
      { id: "task-1", title: "Create landing page", projectId: "project-website", status: "in-progress", priority: "high", dueDate: dateOffset(2), assigneeId: "member-sonu" },
      { id: "task-2", title: "Design dashboard", projectId: "project-website", status: "todo", priority: "medium", dueDate: dateOffset(5), assigneeId: "member-nora" },
      { id: "task-3", title: "Set up project structure", projectId: "project-mobile", status: "done", priority: "low", dueDate: dateOffset(-1), assigneeId: "member-mason" },
      { id: "task-4", title: "Build authentication API", projectId: "project-backend", status: "in-progress", priority: "high", dueDate: dateOffset(4), assigneeId: "member-mason" },
      { id: "task-5", title: "Review user flows", projectId: "project-ux", status: "todo", priority: "medium", dueDate: dateOffset(7), assigneeId: "member-ava" }
    ],
    notifications: [
      { id: "notification-1", message: "Nora Patel updated the dashboard design task.", time: Date.now() - 1000 * 60 * 42, read: false, kind: "task" },
      { id: "notification-2", message: "Your TeamFlow website project is moving forward.", time: Date.now() - 1000 * 60 * 60 * 4, read: false, kind: "project" },
      { id: "notification-3", message: "Mason Lee completed Set up project structure.", time: Date.now() - 1000 * 60 * 60 * 20, read: true, kind: "complete" }
    ]
  };

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return structuredCopy(starterState);
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.members)) {
        throw new Error("Stored TeamFlow workspace data has an unexpected shape.");
      }
      return { ...structuredCopy(starterState), ...parsed };
    } catch (error) {
      console.error("Unable to load TeamFlow workspace data.", error);
      return structuredCopy(starterState);
    }
  }

  function structuredCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  let state = loadState();
  const colors = {
    blue: ["#347bd8", "#eaf2ff"],
    purple: ["#8057e8", "#f0eaff"],
    orange: ["#d99036", "#fff1df"],
    green: ["#21a879", "#e9f7f0"]
  };
  const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const member = (memberId) => state.members.find((person) => person.id === memberId);
  const project = (projectId) => state.projects.find((item) => item.id === projectId);
  const tasksForProject = (projectId) => state.tasks.filter((task) => task.projectId === projectId);
  const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
  const formatDate = (value) => {
    if (!value) return "No date";
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  };
  const percent = (projectId) => {
    const list = tasksForProject(projectId);
    return list.length ? Math.round(list.filter((task) => task.status === "done").length / list.length * 100) : 0;
  };
  const statusLabel = (status) => ({ todo: "To do", "in-progress": "In progress", done: "Done" })[status] || "To do";
  const badgeClass = (status) => ({ todo: "", "in-progress": "badge-blue", done: "badge-green" })[status] || "";

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Unable to save TeamFlow workspace data.", error);
      showToast("Your changes could not be saved in this browser.");
    }
    syncUserUI();
    syncCounts();
    window.dispatchEvent(new CustomEvent("teamflow:statechange", { detail: { state } }));
  }

  function syncUserUI() {
    document.querySelectorAll("[data-user-name]").forEach((element) => { element.textContent = state.user.name; });
    document.querySelectorAll("[data-user-initial]").forEach((element) => { element.textContent = initials(state.user.name).slice(0, 1); });
    document.querySelectorAll("team-sidebar, team-navbar").forEach((host) => {
      if (!host.shadowRoot) return;
      host.shadowRoot.querySelectorAll("[data-user-name]").forEach((element) => { element.textContent = state.user.name; });
      host.shadowRoot.querySelectorAll("[data-user-initial]").forEach((element) => { element.textContent = initials(state.user.name).slice(0, 1); });
    });
  }

  function syncCounts() {
    document.querySelectorAll("team-sidebar").forEach((host) => {
      if (!host.shadowRoot) return;
      const projectCount = host.shadowRoot.querySelector('[data-count="projects"]');
      const taskCount = host.shadowRoot.querySelector('[data-count="tasks"]');
      if (projectCount) projectCount.textContent = state.projects.length;
      if (taskCount) taskCount.textContent = state.tasks.filter((task) => task.status !== "done").length;
    });
  }

  function showToast(message) {
    let toast = document.querySelector(".teamflow-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "teamflow-toast";
      toast.setAttribute("role", "status");
      toast.style.cssText = "position:fixed;z-index:1200;right:18px;bottom:18px;max-width:calc(100vw - 36px);padding:12px 16px;border:1px solid #dfe7f0;border-radius:10px;background:#fff;color:#30445f;box-shadow:0 12px 32px #1a2d4a22;font:600 13px 'DM Sans',sans-serif";
      document.body.append(toast);
    }
    toast.textContent = message;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.remove(), 2800);
  }

  function openModal(title, body, onSubmit) {
    const root = document.querySelector("#modal-root") || document.body;
    root.innerHTML = `<div class="modal-backdrop" data-modal-close><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><h2 id="modal-title">${escape(title)}</h2><button type="button" class="icon-button" data-modal-dismiss data-symbol="×" aria-label="Close dialog"></button></header><form data-modal-form>${body}<footer class="modal-footer"><button class="button button-outline" type="button" data-modal-dismiss>Cancel</button><button class="button button-primary" type="submit">Save</button></footer></form></section></div>`;
    const backdrop = root.querySelector(".modal-backdrop");
    const form = root.querySelector("[data-modal-form]");
    const close = () => root.replaceChildren();
    root.querySelectorAll("[data-modal-dismiss]").forEach((button) => button.addEventListener("click", close));
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    document.addEventListener("keydown", function onEscape(event) {
      if (event.key === "Escape" && root.querySelector(".modal")) {
        close();
        document.removeEventListener("keydown", onEscape);
      }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const result = onSubmit(new FormData(form));
      if (result !== false) close();
    });
    form.querySelector("input,select,textarea")?.focus();
  }

  function projectForm() {
    const body = `<label class="field">Project name<input class="input" name="name" maxlength="70" required placeholder="e.g. Website redesign"></label><label class="field">Category<input class="input" name="category" maxlength="40" placeholder="e.g. Product design"></label><label class="field">Description<textarea class="textarea" name="description" maxlength="240" placeholder="What will your team work on?"></textarea></label><label class="field">Due date<input class="input" type="date" name="dueDate"></label>`;
    openModal("Create a project", body, (form) => {
      const name = String(form.get("name")).trim();
      const item = { id: id("project"), name, category: String(form.get("category") || "General").trim() || "General", description: String(form.get("description") || "").trim(), dueDate: String(form.get("dueDate") || ""), memberIds: [state.members[0]?.id].filter(Boolean), color: ["blue", "purple", "orange", "green"][state.projects.length % 4], status: "active", createdAt: Date.now() };
      state.projects.unshift(item);
      state.notifications.unshift({ id: id("notification"), message: `${state.user.name} created the ${item.name} project.`, time: Date.now(), read: false, kind: "project" });
      save();
      showToast("Project created.");
      if (location.pathname.endsWith("/projects.html")) window.dispatchEvent(new CustomEvent("teamflow:projects-updated"));
    });
  }

  function taskForm(projectId = "") {
    const projectOptions = state.projects.map((item) => `<option value="${escape(item.id)}"${projectId === item.id ? " selected" : ""}>${escape(item.name)}</option>`).join("");
    const memberOptions = state.members.map((person) => `<option value="${escape(person.id)}">${escape(person.name)}</option>`).join("");
    const body = `<label class="field">Task name<input class="input" name="title" maxlength="90" required placeholder="What needs to be done?"></label><label class="field">Project<select class="select" name="projectId"><option value="">General task</option>${projectOptions}</select></label><div class="form-grid" style="grid-template-columns:1fr 1fr"><label class="field">Priority<select class="select" name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select></label><label class="field">Status<select class="select" name="status"><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label></div><div class="form-grid" style="grid-template-columns:1fr 1fr"><label class="field">Due date<input class="input" type="date" name="dueDate"></label><label class="field">Assignee<select class="select" name="assigneeId"><option value="">Unassigned</option>${memberOptions}</select></label></div>`;
    openModal("Add a task", body, (form) => {
      const task = { id: id("task"), title: String(form.get("title")).trim(), projectId: String(form.get("projectId") || ""), priority: String(form.get("priority") || "medium"), status: String(form.get("status") || "todo"), dueDate: String(form.get("dueDate") || ""), assigneeId: String(form.get("assigneeId") || "") };
      state.tasks.unshift(task);
      state.notifications.unshift({ id: id("notification"), message: `${state.user.name} added the ${task.title} task.`, time: Date.now(), read: false, kind: "task" });
      save();
      showToast("Task added.");
      window.dispatchEvent(new CustomEvent("teamflow:tasks-updated"));
    });
  }

  function inviteMember() {
    const body = `<label class="field">Full name<input class="input" name="name" maxlength="70" required placeholder="Teammate name"></label><label class="field">Email address<input class="input" type="email" name="email" required placeholder="teammate@example.com"></label><label class="field">Role<select class="select" name="role"><option>Member</option><option>Product designer</option><option>Engineering</option><option>Product lead</option></select></label>`;
    openModal("Invite a team member", body, (form) => {
      const email = String(form.get("email")).trim().toLowerCase();
      if (state.members.some((person) => person.email.toLowerCase() === email)) {
        showToast("This email is already in your team.");
        return false;
      }
      const person = { id: id("member"), name: String(form.get("name")).trim(), email, role: String(form.get("role")) };
      state.members.push(person);
      state.notifications.unshift({ id: id("notification"), message: `${state.user.name} invited ${person.name} to the workspace.`, time: Date.now(), read: false, kind: "member" });
      save();
      showToast("Team member added.");
      window.dispatchEvent(new CustomEvent("teamflow:members-updated"));
    });
  }

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "create-project") projectForm();
    if (action === "create-task") taskForm(event.target.closest("[data-project-id]")?.dataset.projectId || new URLSearchParams(location.search).get("id") || "");
    if (action === "invite") inviteMember();
    if (action === "delete-task") {
      const taskId = event.target.closest("[data-task-id]")?.dataset.taskId;
      if (taskId && confirm("Delete this task? This cannot be undone.")) {
        state.tasks = state.tasks.filter((task) => task.id !== taskId);
        save();
        window.dispatchEvent(new CustomEvent("teamflow:tasks-updated"));
      }
    }
    if (action === "delete-project") {
      const projectId = event.target.closest("[data-project-id]")?.dataset.projectId;
      const item = project(projectId);
      if (item && confirm(`Delete "${item.name}" and its tasks? This cannot be undone.`)) {
        state.projects = state.projects.filter((entry) => entry.id !== projectId);
        state.tasks = state.tasks.filter((task) => task.projectId !== projectId);
        save();
        window.dispatchEvent(new CustomEvent("teamflow:projects-updated"));
        window.dispatchEvent(new CustomEvent("teamflow:tasks-updated"));
      }
    }
  });

  document.addEventListener("teamflow:invite", inviteMember);
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.querySelector("team-navbar")?.shadowRoot?.querySelector("input")?.focus();
    }
  });
  window.addEventListener("load", () => { syncUserUI(); syncCounts(); });
  window.TeamFlow = {
    getState: () => state,
    save,
    escape,
    id,
    member,
    project,
    tasksForProject,
    initials,
    formatDate,
    percent,
    statusLabel,
    badgeClass,
    colorFor: (key) => colors[key] || colors.blue,
    showToast,
    openModal,
    addTask: taskForm
  };
})();
