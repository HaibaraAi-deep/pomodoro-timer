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
 *   getActiveTaskId()     — get the currently active task id
 *   setActiveTaskId(id)   — set the currently active task id
 *   reloadTasks()         — reload tasks from localStorage
 */

// ---------------------------------------------------------------------------
// UUID generator
// ---------------------------------------------------------------------------

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const hex = '0123456789abcdef';
  const rand = new Uint8Array(16);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(rand);
  } else {
    for (let i = 0; i < 16; i++) {
      rand[i] = Math.floor(Math.random() * 256);
    }
  }

  rand[6] = (rand[6] & 0x0f) | 0x40;
  rand[8] = (rand[8] & 0x3f) | 0x80;

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
// Helpers
// ---------------------------------------------------------------------------

function sanitizeForAria(text) {
  return String(text).replace(/[\x00-\x1F\x7F]/g, '').trim();
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pomodoro_tasks';
const ACTIVE_TASK_KEY = 'pomodoro_active_task';

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.warn('[Tasks] LocalStorage data is not an array, clearing corrupted data');
      return [];
    }

    const validTasks = [];
    parsed.forEach((task, index) => {
      if (typeof task !== 'object' || task === null) {
        console.warn(`[Tasks] Invalid task at index ${index}, skipping`);
        return;
      }

      if (typeof task.id !== 'string') {
        console.warn(`[Tasks] Task at index ${index} has invalid id, skipping`);
        return;
      }

      if (typeof task.title !== 'string') {
        console.warn(`[Tasks] Task at index ${index} has invalid title, skipping`);
        return;
      }

      if (typeof task.completed !== 'boolean') {
        console.warn(`[Tasks] Task at index ${index} has invalid completed, defaulting to false`);
        task.completed = false;
      }

      if (typeof task.pomodoros !== 'number') {
        console.warn(`[Tasks] Task at index ${index} has invalid pomodoros, defaulting to 0`);
        task.pomodoros = 0;
      }

      if (typeof task.createdAt !== 'string') {
        console.warn(`[Tasks] Task at index ${index} has invalid createdAt, defaulting to now`);
        task.createdAt = new Date().toISOString();
      }

      if (!task.createdAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        console.warn(`[Tasks] Task at index ${index} has invalid createdAt format, using default`);
        task.createdAt = new Date().toISOString();
      }

      validTasks.push(task);
    });

    return validTasks;
  } catch (err) {
    console.warn('[Tasks] Failed to load tasks from LocalStorage:', err);
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (err) {
    console.error('[Tasks] Failed to save tasks to LocalStorage:', err);
    showStorageWarning();
    return false;
  }
}

function showStorageWarning() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;

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

  taskList.parentNode.insertBefore(warning, taskList);

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
let activeTaskId = loadActiveTaskId();

function loadActiveTaskId() {
  try {
    return localStorage.getItem(ACTIVE_TASK_KEY) || null;
  } catch (e) {
    return null;
  }
}

function saveActiveTaskId() {
  try {
    if (activeTaskId) {
      localStorage.setItem(ACTIVE_TASK_KEY, activeTaskId);
    } else {
      localStorage.removeItem(ACTIVE_TASK_KEY);
    }
  } catch (e) {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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

  const saved = saveTasks([...tasks, task]);
  if (saved) {
    tasks.push(task);
  } else {
    tasks.push(task);
  }

  return task;
}

export function deleteTask(id) {
  const index = tasks.findIndex(function (t) { return t.id === id; });
  if (index === -1) return false;

  const removed = tasks.splice(index, 1)[0];
  const saved = saveTasks(tasks);
  if (!saved) {
    tasks.splice(index, 0, removed);
    return false;
  }

  if (activeTaskId === id) {
    activeTaskId = null;
    saveActiveTaskId();
  }

  return true;
}

export function toggleTask(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return null;

  const oldCompleted = task.completed;
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;

  const saved = saveTasks(tasks);
  if (!saved) {
    task.completed = oldCompleted;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    return null;
  }

  if (task.completed && activeTaskId === id) {
    activeTaskId = null;
    saveActiveTaskId();
  }

  return task;
}

export function incrementPomodoros(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return null;

  task.pomodoros = (task.pomodoros || 0) + 1;
  const saved = saveTasks(tasks);
  if (!saved) {
    task.pomodoros = (task.pomodoros || 0) - 1;
    return null;
  }

  return task;
}

export function getTasks() {
  return tasks.slice().sort(function (a, b) {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export function getTaskById(id) {
  return tasks.find(function (t) { return t.id === id; });
}

export function getActiveTaskId() {
  if (activeTaskId) {
    const task = tasks.find(t => t.id === activeTaskId && !t.completed);
    if (task) return activeTaskId;
  }
  return null;
}

export function setActiveTaskId(id) {
  if (id === null) {
    activeTaskId = null;
  } else {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      activeTaskId = id;
    } else {
      activeTaskId = null;
    }
  }
  saveActiveTaskId();
}

export function reloadTasks() {
  tasks = loadTasks();
  activeTaskId = loadActiveTaskId();
}

export { sanitizeForAria };
