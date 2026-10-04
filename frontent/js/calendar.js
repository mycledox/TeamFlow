(() => {
  const api = window.TeamFlow;
  const title = document.querySelector("[data-calendar-title]");
  const grid = document.querySelector("[data-calendar-grid]");
  const agenda = document.querySelector("[data-calendar-agenda]");
  let shown = new Date();
  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  function render() {
    const year = shown.getFullYear();
    const month = shown.getMonth();
    title.textContent = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(shown);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const firstDay = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - firstDay.getDay());
    const tasksByDate = new Map();
    api.getState().tasks.filter((task) => task.dueDate).forEach((task) => {
      if (!tasksByDate.has(task.dueDate)) tasksByDate.set(task.dueDate, []);
      tasksByDate.get(task.dueDate).push(task);
    });
    const today = dateKey(new Date());
    const cells = [];
    weekdays.forEach((day) => cells.push(`<div class="calendar-weekday">${day}</div>`));
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const key = dateKey(date);
      const dayTasks = tasksByDate.get(key) || [];
      const classes = ["calendar-day", date.getMonth() !== month ? "is-outside" : "", key === today ? "is-today" : ""].filter(Boolean).join(" ");
      cells.push(`<div class="${classes}" aria-label="${date.toLocaleDateString()}"><span>${date.getDate()}</span>${dayTasks.slice(0, 2).map((task) => `<span class="calendar-event ${task.status === "done" ? "done" : task.status === "in-progress" ? "in-progress" : ""}" title="${api.escape(task.title)}">${api.escape(task.title)}</span>`).join("")}${dayTasks.length > 2 ? `<span class="calendar-event">+${dayTasks.length - 2} more</span>` : ""}</div>`);
    }
    grid.innerHTML = cells.join("");
    const futureTasks = api.getState().tasks.filter((task) => task.dueDate && task.status !== "done").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 8);
    agenda.innerHTML = futureTasks.map((task) => `<div class="agenda-item"><span class="agenda-date">${api.escape(api.formatDate(task.dueDate))}</span><div class="agenda-copy"><strong>${api.escape(task.title)}</strong><span>${api.escape(api.project(task.projectId)?.name || "General task")} · ${api.statusLabel(task.status)}</span></div></div>`).join("") || '<div class="empty-inline">No upcoming tasks with a due date.</div>';
  }

  document.querySelector("[data-calendar-prev]").addEventListener("click", () => { shown = new Date(shown.getFullYear(), shown.getMonth() - 1, 1); render(); });
  document.querySelector("[data-calendar-next]").addEventListener("click", () => { shown = new Date(shown.getFullYear(), shown.getMonth() + 1, 1); render(); });
  document.querySelector("[data-calendar-today]").addEventListener("click", () => { shown = startOfDay(new Date()); render(); });
  window.addEventListener("teamflow:statechange", render);
  window.addEventListener("teamflow:tasks-updated", render);
  render();
})();