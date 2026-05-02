/**
 * app.js — Application Entry Point
 * Pomodoro Timer + Task Tracker
 *
 * Initializes all modules on DOMContentLoaded.
 * Modules communicate via custom DOM events and share state through
 * dedicated module APIs. No global variables are exposed.
 */

import {
  initTimer,
  startTimer,
  pauseTimer,
  resetTimer,
  setMode,
  skip,
  getState,
  setAutoStart,
  resetSessionCounter,
  TIMER_MODES,
} from './timer.js';

import {
  addTask,
  deleteTask,
  toggleTask,
  getTasks,
} from './tasks.js';

import {
  initStats,
  renderStats,
} from './stats.js';

import { initTheme } from './theme.js';
import { initConfetti } from './confetti.js';
import { initPWA } from './pwa.js';
import { initAudio } from './audio.js';

/**
 * Initialize the application.
 * Called when the DOM is fully parsed and ready.
 */
function initApp() {
  console.log('[Pomodoro] App initializing...');

  // --- Timer module ---
  initTimer();
  wireTimerButtons();
  wireModeButtons();
  wireSkipButton();
  console.log('[Pomodoro] Timer initialised.');

  // --- Task module ---
  initTasks();
  console.log('[Pomodoro] Tasks initialised.');

  // --- Stats module ---
  initStats();
  renderStats();
  console.log('[Pomodoro] Stats initialised.');

  // --- Theme module ---
  initTheme();
  console.log('[Pomodoro] Theme initialised.');

  // --- Confetti module ---
  initConfetti();
  console.log('[Pomodoro] Confetti initialised.');

  // --- PWA module (install prompt) ---
  initPWA();
  console.log('[Pomodoro] PWA initialised.');

  // --- Audio module (session-end notification) ---
  initAudio();
  console.log('[Pomodoro] Audio initialised.');

  // --- Keyboard shortcuts ---
  setupKeyboardShortcuts();
  console.log('[Pomodoro] Keyboard shortcuts initialised.');

  // --- Service Worker registration ---
  registerServiceWorker();

  console.log('[Pomodoro] App ready.');
}

// ---------------------------------------------------------------------------
// Timer button wiring
// ---------------------------------------------------------------------------

/**
 * Attach click handlers to the timer control buttons already present in the
 * HTML so the user can interact with the timer immediately.
 */
function wireTimerButtons() {
  const toggleBtn = document.getElementById('timerToggleBtn');
  const resetBtn  = document.getElementById('timerResetBtn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      const { state } = getState();
      if (state === 'RUNNING') {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetTimer();
    });
  }
}

/**
 * Attach click handlers to the mode switcher buttons so the user can
 * switch between FOCUS, SHORT_BREAK, and LONG_BREAK modes.
 */
function wireModeButtons() {
  const modeButtons = document.querySelectorAll('[data-mode]');

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetMode = btn.getAttribute('data-mode');
      if (targetMode && TIMER_MODES[targetMode]) {
        setMode(targetMode);
      }
    });
  });
}

/**
 * Attach click handler to the skip button.
 */
function wireSkipButton() {
  const skipBtn = document.getElementById('timerSkipBtn');
  if (skipBtn) {
    skipBtn.addEventListener('click', function () {
      skip();
    });
  }
}

// ---------------------------------------------------------------------------
// Task wiring
// ---------------------------------------------------------------------------

/**
 * Initialize the task list: render existing tasks from storage, then attach
 * event listeners for the add button and input field.
 */
function initTasks() {
  renderTaskList();
  wireTaskInput();
}

/**
 * Re-render the full task list from the data store.
 * Called after every mutation (add / delete / toggle).
 */
function renderTaskList() {
  const listEl = document.getElementById('taskList');
  const emptyEl = document.getElementById('taskEmptyState');

  if (!listEl) return;

  const tasks = getTasks();

  // Clear existing list
  listEl.innerHTML = '';

  // Toggle empty state visibility
  if (tasks.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  tasks.forEach(function (task) {
    const li = createTaskElement(task);
    listEl.appendChild(li);
  });
}

/**
 * Create a single <li> element for a given task.
 *
 * @param {object} task — { id, title, completed, pomodoros }
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item slide-in' + (task.completed ? ' completed' : '');
  li.setAttribute('data-task-id', task.id);

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? '标记未完成' : '标记完成');
  checkbox.addEventListener('change', function () {
    toggleTask(task.id);
    renderTaskList();
  });

  // Title
  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title;

  // Pomodoro count badge (only show if > 0)
  const pomoBadge = document.createElement('span');
  pomoBadge.className = 'task-pomodoros';
  if (task.pomodoros > 0) {
    pomoBadge.textContent = String.fromCharCode(0x1F345) + ' ' + task.pomodoros;
  } else {
    pomoBadge.classList.add('hidden');
  }

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete-btn';
  deleteBtn.setAttribute('aria-label', '删除任务: ' + task.title);
  deleteBtn.textContent = '\u00D7';   // multiplication sign ×
  deleteBtn.addEventListener('click', function (e) {
    e.stopPropagation();   // prevent any parent click handlers
    // Animate out then remove
    li.classList.add('fade-out');
    li.addEventListener('animationend', function handler() {
      li.removeEventListener('animationend', handler);
      deleteTask(task.id);
      renderTaskList();
    }, { once: true });
  });

  li.appendChild(checkbox);
  li.appendChild(titleSpan);
  li.appendChild(pomoBadge);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Attach event listeners to the task input and add button so the user can
 * create new tasks by pressing Enter or clicking the + button.
 */
function wireTaskInput() {
  const inputEl = document.getElementById('taskInput');
  const addBtn = document.getElementById('taskAddBtn');

  if (!inputEl) return;

  /**
   * Attempt to add a task from the current input value.
   * Trims whitespace; does nothing for empty input.
   * Clears the input on success.
   */
  function handleAdd() {
    const raw = inputEl.value;
    if (!raw.trim()) return;
    try {
      addTask(raw);
      inputEl.value = '';
      renderTaskList();
    } catch (err) {
      // addTask throws on empty title, we already guard above
      console.warn('[Tasks] Add failed:', err.message);
    }
  }

  // Enter key
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  // Add button click
  if (addBtn) {
    addBtn.addEventListener('click', handleAdd);
  }
}

// ---------------------------------------------------------------------------
// Service Worker registration
// ---------------------------------------------------------------------------

/**
 * Register the Service Worker for offline support and caching.
 * Safely no-ops in unsupported browsers.
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Pomodoro] Service Worker not supported in this browser.');
    return;
  }

  navigator.serviceWorker
    .register('sw.js', { scope: '/' })
    .then(function (registration) {
      console.log('[Pomodoro] Service Worker registered with scope:', registration.scope);

      // Check for updates on page load
      registration.addEventListener('updatefound', function () {
        var installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', function () {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Pomodoro] New Service Worker available — refresh to update.');
          }
        });
      });
    })
    .catch(function (err) {
      console.error('[Pomodoro] Service Worker registration failed:', err);
    });
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

/**
 * Register global keyboard shortcuts for the application.
 *
 * Shortcuts:
 *   Space  — toggle timer start/pause (not when inside input/textarea)
 *   N      — focus the task input (#taskInput)
 *   1      — switch to FOCUS mode
 *   2      — switch to SHORT_BREAK mode
 *   3      — switch to LONG_BREAK mode
 *   R      — reset timer
 *   S      — skip current phase
 *
 * Shortcuts are suppressed when the user is typing in an <input> or <textarea>,
 * with the exception of N which always focuses the task input.
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    var target = e.target;
    var isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    // Helper: ignore events from input/textarea unless this is the N key
    function isTyping() {
      return isInput && e.key !== 'n' && e.key !== 'N';
    }

    switch (e.key) {
      // Space — toggle start/pause (prevent page scroll)
      case ' ':
        if (isTyping()) return;
        e.preventDefault();
        {
          var s = getState().state;
          if (s === 'RUNNING') {
            pauseTimer();
          } else {
            startTimer();
          }
        }
        break;

      // N — focus the task input (always works, even when inside another input)
      case 'n':
      case 'N':
        // Only handle N when it's a plain shortcut (no modifier keys)
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        {
          var taskInputEl = document.getElementById('taskInput');
          if (taskInputEl) {
            e.preventDefault();
            taskInputEl.focus();
            taskInputEl.select();
          }
        }
        break;

      // 1 — FOCUS mode
      case '1':
        if (isTyping()) return;
        setMode('FOCUS');
        break;

      // 2 — SHORT_BREAK mode
      case '2':
        if (isTyping()) return;
        setMode('SHORT_BREAK');
        break;

      // 3 — LONG_BREAK mode
      case '3':
        if (isTyping()) return;
        setMode('LONG_BREAK');
        break;

      // R — reset timer
      case 'r':
      case 'R':
        if (isTyping()) return;
        resetTimer();
        break;

      // S — skip current phase
      case 's':
      case 'S':
        if (isTyping()) return;
        skip();
        break;

      default:
        // no-op for unhandled keys
        break;
    }
  });
}

// ---------------------------------------------------------------------------
// Bootstrap — wait for DOM, then start
// ---------------------------------------------------------------------------

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM already loaded (script injected after load)
  initApp();
}
