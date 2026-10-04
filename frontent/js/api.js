(() => {
  const STORAGE_KEY = "teamflow.workspace.v1";
  const now = new Date();
  const daysFromNow = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const initials = (name) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const seed = {
    user: { name: "Sonu Kumar", email: "sonu@teamflow.app" },
    members: [
      { id: "sonu", name: "Sonu Kumar", role: "Workspace admin", color: "blue", email: "sonu@teamflow.app" },
      { id: "riya", name: "Riya Sharma", role: "Product designer", color: "rose", email: "riya@teamflow.app" },
      { id: "arjun", name: "Arjun Mehta", role: "Developer", color: "teal", email: "arjun@teamflow.app" },
      { id: "rahul", name: "Rahul Singh", role: "Project manager", color: "lilac", email: "rahul@teamflow.app" }
    ],
    projects: [
      { id: "annual-fest", name: "Annual Fest 2026", description: "College Fest Organization", color: "pink", status: "Active", createdAt: now.toISOString() },
      { id: "college-system", name: "College Academic System", description: "Academic Management System", color: "blue", status: "Active", createdAt: now.toISOString() },
      { id: "helphistory", name: "HelpHistory", description: "Community Help Platform", color: "green", status: "Active", createdAt: now.toISOString() }
    ],
    tasks: [
      { id: "poster-design", title: "Design event poster", projectId: "annual-fest", assignee: "riya", dueDate: daysFromNow(2), priority: "high", status: "in-progress" },
      { id: "venue-booking", title: "Confirm venue booking", projectId: "annual-fest", assignee: "sonu", dueDate: daysFromNow(3), priority: "medium", status: "todo" },
      { id: "course-flow", title: "Map student enrollment flow", projectId: "college-system", assignee: "arjun", dueDate: daysFromNow(4), priority: "medium", status: "todo" },
      { id: "help-center", title: "Review help center feedback", projectId: "helphistory", assignee: "rahul", dueDate: daysFromNow(-1), priority: "low", status: "completed" }
    ]
  };

  const load = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(seed);
    try {
      const value = JSON.parse(stored);
      if (!value || !Array.isArray(value.projects) || !Array.isArray(value.tasks) || !Array.isArray(value.members)) {
        throw new Error("The saved workspace data has an invalid format.");
      }
      return value;
    } catch (error) {
      throw new Error(`Could not load your saved workspace: ${error.message}`);
    }
  };
  let data;
  let loadError = null;
  try {
    data = load();
  } catch (error) {
    loadError = error;
    data = structuredClone(seed);
  }

  const save = (next) => {
    if (loadError) throw new Error("Your saved workspace could not be loaded, so changes are disabled to protect your data.");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      throw new Error(`Could not save your changes: ${error.message}`);
    }
    data = next;
  };
  const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  window.TeamFlowStore = {
    getData: () => data,
    getLoadError: () => loadError,
    makeId,
    initials,
    addProject(project) {
      const record = { ...project, id: makeId(), status: "Active", createdAt: new Date().toISOString() };
      save({ ...data, projects: [record, ...data.projects] });
      return record;
    },
    removeProject(projectId) {
      save({
        ...data,
        projects: data.projects.filter((project) => project.id !== projectId),
        tasks: data.tasks.filter((task) => task.projectId !== projectId)
      });
    },
    addTask(task) {
      const record = { ...task, id: makeId(), status: "todo" };
      save({ ...data, tasks: [record, ...data.tasks] });
      return record;
    },
    updateTask(taskId, changes) {
      const task = data.tasks.find((item) => item.id === taskId);
      if (!task) throw new Error("This task could not be found.");
      const updated = { ...task, ...changes };
      save({ ...data, tasks: data.tasks.map((item) => item.id === taskId ? updated : item) });
      return updated;
    },
    addMember(member) {
      const record = { ...member, id: makeId(), color: ["sky", "amber", "teal", "rose"][data.members.length % 4] };
      save({ ...data, members: [...data.members, record] });
      return record;
    },
    addProjectComment(projectId, message) {
      const project = data.projects.find((item) => item.id === projectId);
      if (!project) throw new Error("This project could not be found.");
      const comment = { id: makeId(), authorId: data.user.id || "sonu", message, createdAt: new Date().toISOString() };
      const updated = { ...project, comments: [...(project.comments || []), comment] };
      save({ ...data, projects: data.projects.map((item) => item.id === projectId ? updated : item) });
      return comment;
    },
    addTaskComment(taskId, message) {
      const task = data.tasks.find((item) => item.id === taskId);
      if (!task) throw new Error("This task could not be found.");
      const comment = { id: makeId(), authorId: data.user.id || "sonu", message, createdAt: new Date().toISOString() };
      const updated = { ...task, comments: [...(task.comments || []), comment] };
      save({ ...data, tasks: data.tasks.map((item) => item.id === taskId ? updated : item) });
      return comment;
    }
  };
})();