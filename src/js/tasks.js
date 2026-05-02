/**
 * tasks.js — Task CRUD Module with LocalStorage Persistence
 *
 * Manages an in-memory task array with full CRUD operations and automatic
 * persistence to LocalStorage under the key `pomodoro_tasks`.
 *
 * Data model:
 *   { id, title, completed, pomodoros, createdAt, completedAt }
 *
 * LocalStorage schema:
 *   pomodoro_tasks → JSON array of task objects
 *
 * Exports:
 *   addTask(title)        — create and persist a new task
 *   deleteTask(id)        — remove a task by id
 *   toggleTask(id)        — flip completed state, set/clear completedAt
 *   getTasks()            — return sorted array (incomplete first, then by createdAt desc)
 *   getTaskById(id)       — find a single task by id
 *   incrementPomodoros(id)— increment the pomodoro counter for a task
 */

// ---------------------------------------------------------------------------
// UUID generator
// ---------------------------------------------------------------------------

/**
 * Generate a UUID v4 string.
 * Uses crypto.randomUUID() when available (secure contexts), otherwise falls
 * back to a manual implementation with crypto.getRandomValues() or Math.random().
 *
 * @returns {string} UUID v4 string
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: RFC 4122 version 4 UUID
  const hex = '0123456789abcdef';
  const rand = new Uint8Array(16);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(rand);
  } else {
    // Non-secure fallback — adequate for task IDs
    for (let i = 0; i < 16; i++) {
      rand[i] = Math.floor(Math.random() * 256);
    }
  }

  rand[6] = (rand[6] & 0x0f) | 0x40;   // version 4
  rand[8] = (rand[8] & 0x3f) | 0x80;   // variant 10

  const parts = [];
  for (let i = 0; i < 16; i++) {
    const byte = rand[i];
    parts.push(hex[(byte >>> 4) & 0xf]);
    parts.push(hex[byte & 0xf]);
    if (i === 3 || i === 5 || i === 7 || i === 9) {
      parts.push('-');
    }
  }

  return parts.join('');
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pomodoro_tasks';

/**
 * Load tasks from LocalStorage.
 * Returns an empty array if nothing is stored or if parsing fails.
 *
 * @returns {Array<object>}
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('[Tasks] Failed to load tasks from LocalStorage:', err);
    return [];
  }
}

/**
 * Persist the full task array to LocalStorage.
 *
 * @param {Array<object>} tasks
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('[Tasks] Failed to save tasks to LocalStorage:', err);
    showStorageWarning();
  }
}

/**
 * Show a storage warning banner at the top of the task list area.
 * The banner is dismissible and auto-hides after 3 seconds.
 */
function showStorageWarning() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;

  // Avoid stacking multiple warnings
  const existing = document.querySelector('.storage-warning');
  if (existing) return;

  const warning = document.createElement('div');
  warning.className = 'storage-warning';
  warning.setAttribute('role', 'alert');
  warning.style.cssText =
    'background:#fff3cd;color:#856404;border:1px solid #ffc107;' +
    'border-radius:8px;padding:12px 40px 12px 16px;margin-bottom:12px;' +
    'font-size:14px;line-height:1.5;position:relative;animation:fadeIn 0.3s ease;';
  warning.textContent = '⚠️ 存储空间不足，任务数据可能无法保存。请清理浏览器数据。';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'storage-warning-close';
  closeBtn.setAttribute('aria-label', '关闭警告');
  closeBtn.textContent = '\u00D7';
  closeBtn.style.cssText =
    'position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
    'background:none;border:none;cursor:pointer;font-size:20px;' +
    'color:#856404;line-height:1;padding:4px 8px;border-radius:4px;';
  closeBtn.addEventListener('click', function () {
    warning.remove();
  });
  warning.appendChild(closeBtn);

  // Insert before the task list
  taskList.parentNode.insertBefore(warning, taskList);

  // Auto-dismiss after 3 seconds
  setTimeout(function () {
    if (warning.parentNode) {
      warning.remove();
    }
  }, 3000);
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

let tasks = loadTasks();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Add a new task with the given title.
 *
 * @param {string} title - Task description (trimmed, max 200 chars)
 * @returns {object} The newly created task object
 */
export function addTask(title) {
  const trimmed = String(title).trim();
  if (!trimmed) {
    throw new Error('Task title cannot be empty.');
  }

  const now = new Date().toISOString();
  const task = {
    id: generateId(),
    title: trimmed.slice(0, 200),
    completed: false,
    pomodoros: 0,
    createdAt: now,
    completedAt: null,
  };

  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/**
 * Delete a task by its id. No-op if the id is not found.
 *
 * @param {string} id - The task UUID
 * @returns {boolean} true if a task was removed, false otherwise
 */
export function deleteTask(id) {
  const index = tasks.findIndex(function (t) { return t.id === id; });
  if (index === -1) return false;

  tasks.splice(index, 1);
  saveTasks(tasks);
  return true;
}

/**
 * Toggle the completed state of a task.
 * Sets completedAt to now when completing, clears it when un-completing.
 *
 * @param {string} id - The task UUID
 * @returns {object|null} The updated task, or null if not found
 */
export function toggleTask(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return null;

  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;
  saveTasks(tasks);
  return task;
}

/**
 * Increment the pomodoro counter for a given task.
 *
 * @param {string} id - The task UUID
 * @returns {object|null} The updated task, or null if not found
 */
export function incrementPomodoros(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return null;

  task.pomodoros = (task.pomodoros || 0) + 1;
  saveTasks(tasks);
  return task;
}

/**
 * Get all tasks, sorted:
 *   1. Incomplete tasks first
 *   2. Within each group, newest createdAt first (descending)
 *
 * @returns {Array<object>} Sorted shallow copy of the task array
 */
export function getTasks() {
  return tasks.slice().sort(function (a, b) {
    // Incomplete before completed
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Newest first within each group
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Find a single task by its id.
 *
 * @param {string} id - The task UUID
 * @returns {object|undefined} The matching task, or undefined
 */
export function getTaskById(id) {
  return tasks.find(function (t) { return t.id === id; });
}
