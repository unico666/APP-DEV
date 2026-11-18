// ---------------------------------------------------------
// The Docket — To-Do List
// State management, DOM rendering, validation, persistence
// ---------------------------------------------------------

const STORAGE_KEY = "docket.tasks";

// ---- Single source of truth ------------------------------
// state.tasks is the ONLY place task data lives while the app
// runs. Every user action updates this array, then calls
// render() and persist() so the UI and localStorage both
// reflect the new state.
const state = {
  tasks: [], // { id, text, done, createdAt }
};

// ---- DOM references ---------------------------------------
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const errorEl = document.getElementById("task-error");
const listEl = document.getElementById("task-list");
const statsEl = document.getElementById("task-stats");
const boardEl = document.querySelector(".board");
const deleteAllBtn = document.getElementById("delete-all-btn");

// ---- Persistence (Local Storage) ---------------------------

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive shape-check so corrupted storage can't crash the app
    return parsed.filter(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        typeof t.done === "boolean"
    );
  } catch {
    return [];
  }
}

// ---- Rendering ----------------------------------------------
// Fully re-renders the list from state.tasks. Because state is
// the single source of truth, render() never reads from the DOM.

function render() {
  listEl.innerHTML = "";

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " is-done" : "");
    li.dataset.id = task.id;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "task__toggle";
    toggle.setAttribute("aria-label", task.done ? "Mark as not done" : "Mark as done");
    toggle.innerHTML = `<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const body = document.createElement("div");
    body.className = "task__body";
    const text = document.createElement("span");
    text.className = "task__text";
    text.textContent = task.text;
    body.appendChild(text);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "task__delete";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete "${task.text}"`);

    li.appendChild(toggle);
    li.appendChild(body);
    li.appendChild(del);
    listEl.appendChild(li);
  });

  updateStats();
  boardEl.classList.toggle("is-empty", state.tasks.length === 0);
  deleteAllBtn.disabled = state.tasks.length === 0;
}

function updateStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  statsEl.textContent = total === 0 ? "No tasks yet" : `${done} of ${total} done`;
}

// ---- Validation -----------------------------------------------

function validateInput(value) {
  if (value.trim().length === 0) {
    return "Task can't be empty. Type something first.";
  }
  if (value.trim().length > 140) {
    return "Keep tasks under 140 characters.";
  }
  return null;
}

function showError(message) {
  errorEl.textContent = message;
  input.classList.toggle("is-invalid", Boolean(message));
}

// ---- State-mutating actions ------------------------------------

function addTask(rawText) {
  const task = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    text: rawText.trim(),
    done: false,
    createdAt: Date.now(),
  };
  state.tasks.push(task);
  persist();
  render();
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  persist();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  persist();
  render();
}

// Simulated async clear: shows a loading state for ~2s before
// actually wiping storage and state, per the assignment spec.
function deleteAllTasks() {
  if (state.tasks.length === 0) return;

  deleteAllBtn.disabled = true;
  deleteAllBtn.classList.add("is-loading");

  clearAllAsync()
    .then(() => {
      state.tasks = [];
      persist();
      render();
    })
    .finally(() => {
      deleteAllBtn.classList.remove("is-loading");
    });
}

function clearAllAsync() {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

// ---- Event handling ------------------------------------------

form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop default browser form submission

  const value = input.value;
  const error = validateInput(value);

  if (error) {
    showError(error);
    input.focus();
    return;
  }

  showError("");
  addTask(value);
  form.reset();
  input.focus();
});

input.addEventListener("input", () => {
  if (errorEl.textContent) showError("");
});

// Event delegation: one listener handles toggle/delete for
// every task, including ones added after page load.
listEl.addEventListener("click", (event) => {
  const li = event.target.closest(".task");
  if (!li) return;
  const id = li.dataset.id;

  if (event.target.closest(".task__toggle")) {
    toggleTask(id);
  } else if (event.target.closest(".task__delete")) {
    deleteTask(id);
  }
});

deleteAllBtn.addEventListener("click", deleteAllTasks);

// ---- Init -------------------------------------------------------

function init() {
  state.tasks = loadFromStorage();
  render();
}

init();