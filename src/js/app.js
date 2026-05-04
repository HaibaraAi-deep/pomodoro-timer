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
  getTaskById,
  incrementPomodoros,
  getActiveTaskId,
  setActiveTaskId,
  reloadTasks,
  sanitizeForAria,
} from './tasks.js';

import {
  initStats,
  renderStats,
  invalidateStatsCache,
} from './stats.js';

import { initTheme } from './theme.js';
import { initConfetti } from './confetti.js';
import { initPWA } from './pwa.js';
import { initAudio } from './audio.js';
import { initSettings } from './settings.js';

// ---------------------------------------------------------------------------
// Global Error Handling
// ---------------------------------------------------------------------------

function setupGlobalErrorHandling() {
  window.addEventListener('error', function (e) {
    console.error('[Pomodoro] Uncaught error:', e.error || e.message);
  });

  window.addEventListener('unhandledrejection', function (e) {
    console.error('[Pomodoro] Unhandled promise rejection:', e.reason);
  });
}

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

function initApp() {
  console.log('[Pomodoro] App initializing...');

  setupGlobalErrorHandling();

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

  // --- Settings module (data export/clear) ---
  initSettings();
  console.log('[Pomodoro] Settings initialised.');

  // --- Listen for timer:incrementPomodoros event ---
  document.addEventListener('timer:incrementPomodoros', function () {
    const activeId = getActiveTaskId();
    if (activeId) {
      incrementPomodoros(activeId);
      console.log('[App] Incremented pomodoros for active task:', activeId);
    } else {
      const allTasks = getTasks();
      const firstIncomplete = allTasks.find(t => !t.completed);
      if (firstIncomplete) {
        incrementPomodoros(firstIncomplete.id);
        console.log('[App] Incremented pomodoros for first incomplete task:', firstIncomplete.title);
      }
    }
    renderTaskList();
  });

  // --- Listen for settings:dataChanged ---
  document.addEventListener('settings:dataChanged', function () {
    reloadTasks();
    renderTaskList();
    resetTimer();
    resetSessionCounter();
  });

  // --- Keyboard shortcuts ---
  setupKeyboardShortcuts();
  console.log('[Pomodoro] Keyboard shortcuts initialised.');

  // --- Settings shortcut (Control/Cmd + ,) ---
  document.addEventListener('keydown', function (e) {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON';
    if (isInput && e.key !== ',') return;

    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      initSettings();
      const settingsContainer = document.getElementById('settingsContainer');
      if (settingsContainer) {
        settingsContainer.classList.remove('hidden');
      }
    }
  });

  // --- Settings container close on Escape ---
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const settingsContainer = document.getElementById('settingsContainer');
      if (settingsContainer && !settingsContainer.classList.contains('hidden')) {
        settingsContainer.classList.add('hidden');
      }
    }
  });

  // --- Service Worker registration ---
  registerServiceWorker();

  console.log('[Pomodoro] App ready.');
}

// ---------------------------------------------------------------------------
// Timer button wiring
// ---------------------------------------------------------------------------

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

function initTasks() {
  renderTaskList();
  wireTaskInput();
}

function renderTaskList() {
  const listEl = document.getElementById('taskList');
  const emptyEl = document.getElementById('taskEmptyState');

  if (!listEl) return;

  const allTasks = getTasks();
  const currentActiveId = getActiveTaskId();

  // Diff-based update: compare existing DOM with data
  const existingItems = listEl.querySelectorAll('.task-item');
  const existingMap = new Map();
  existingItems.forEach(function (li) {
    existingMap.set(li.getAttribute('data-task-id'), li);
  });

  const taskIds = new Set(allTasks.map(t => t.id));

  // Remove items that no longer exist in data
  existingMap.forEach(function (li, id) {
    if (!taskIds.has(id)) {
      li.remove();
    }
  });

  // Add or update items in order
  allTasks.forEach(function (task, index) {
    const existingLi = existingMap.get(task.id);

    if (existingLi) {
      // Update existing item
      const checkbox = existingLi.querySelector('.task-checkbox');
      if (checkbox) checkbox.checked = task.completed;

      const titleSpan = existingLi.querySelector('.task-title');
      if (titleSpan) titleSpan.textContent = task.title;

      const pomoBadge = existingLi.querySelector('.task-pomodoros');
      if (pomoBadge) {
        if (task.pomodoros > 0) {
          pomoBadge.textContent = String.fromCharCode(0x1F345) + ' ' + task.pomodoros;
          pomoBadge.classList.remove('hidden');
        } else {
          pomoBadge.classList.add('hidden');
        }
      }

      const deleteBtn = existingLi.querySelector('.task-delete-btn');
      if (deleteBtn) {
        deleteBtn.setAttribute('aria-label', '删除任务: ' + sanitizeForAria(task.title));
      }

      if (task.completed) {
        existingLi.classList.add('completed');
      } else {
        existingLi.classList.remove('completed');
      }

      existingLi.classList.remove('slide-in');

      // Update active task highlight
      if (task.id === currentActiveId && !task.completed) {
        existingLi.classList.add('task-active');
      } else {
        existingLi.classList.remove('task-active');
      }

      // Ensure correct order
      const currentItems = listEl.querySelectorAll('.task-item');
      if (currentItems[index] !== existingLi) {
        listEl.insertBefore(existingLi, currentItems[index] || null);
      }
    } else {
      // Create new item
      const li = createTaskElement(task, currentActiveId);
      const currentItems = listEl.querySelectorAll('.task-item');
      if (currentItems[index]) {
        listEl.insertBefore(li, currentItems[index]);
      } else {
        listEl.appendChild(li);
      }
    }
  });

  // Toggle empty state visibility
  if (allTasks.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
  } else {
    if (emptyEl) emptyEl.classList.add('hidden');
  }
}

function createTaskElement(task, activeId) {
  const li = document.createElement('li');
  li.className = 'task-item slide-in' + (task.completed ? ' completed' : '') +
    (task.id === activeId && !task.completed ? ' task-active' : '');
  li.setAttribute('data-task-id', task.id);

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? '标记未完成' : '标记完成');
  checkbox.addEventListener('change', function () {
    const updatedTask = toggleTask(task.id);
    if (updatedTask) {
      updateLiveRegion(updatedTask.completed
        ? `任务 "${updatedTask.title}" 已标记为完成`
        : `任务 "${updatedTask.title}" 已标记为未完成`);
      renderTaskList();
    }
  });

  // Title (clickable to set as active task)
  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title;
  titleSpan.addEventListener('click', function () {
    if (!task.completed) {
      setActiveTaskId(task.id);
      renderTaskList();
      updateLiveRegion(`已将 "${task.title}" 设为当前专注任务`);
    }
  });
  titleSpan.setAttribute('title', '点击设为当前专注任务');

  // Pomodoro count badge
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
  deleteBtn.setAttribute('aria-label', '删除任务: ' + sanitizeForAria(task.title));
  deleteBtn.textContent = '\u00D7';
  deleteBtn.addEventListener('click', function (e) {
    e.stopPropagation();

    deleteBtn.disabled = true;
    li.classList.add('fade-out');

    li.addEventListener('animationend', function handler() {
      li.removeEventListener('animationend', handler);
      deleteBtn.disabled = false;
      const success = deleteTask(task.id);
      if (success) {
        updateLiveRegion(`任务 "${task.title}" 已删除`);
      }
      renderTaskList();
    }, { once: true });
  });

  li.appendChild(checkbox);
  li.appendChild(titleSpan);
  li.appendChild(pomoBadge);
  li.appendChild(deleteBtn);

  return li;
}

function wireTaskInput() {
  const inputEl = document.getElementById('taskInput');
  const addBtn = document.getElementById('taskAddBtn');

  if (!inputEl) return;

  function handleAdd() {
    const raw = inputEl.value;
    if (!raw.trim()) return;
    try {
      const task = addTask(raw);
      inputEl.value = '';

      updateLiveRegion(`已添加任务: ${task.title}`);

      renderTaskList();
    } catch (err) {
      console.warn('[Tasks] Add failed:', err.message);
    }
  }

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  if (addBtn) {
    addBtn.addEventListener('click', handleAdd);
  }
}

// ---------------------------------------------------------------------------
// Live Region for Screen Reader Notifications
// ---------------------------------------------------------------------------

function updateLiveRegion(message) {
  const liveRegion = document.getElementById('liveRegion');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

// ---------------------------------------------------------------------------
// Service Worker registration
// ---------------------------------------------------------------------------

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Pomodoro] Service Worker not supported in this browser.');
    return;
  }

  navigator.serviceWorker
    .register('sw.js')
    .then(function (registration) {
      console.log('[Pomodoro] Service Worker registered with scope:', registration.scope);

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

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    var target = e.target;
    var isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    function isTyping() {
      return isInput && e.key !== 'n' && e.key !== 'N';
    }

    switch (e.key) {
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

      case 'n':
      case 'N':
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

      case '1':
        if (isTyping()) return;
        setMode('FOCUS');
        break;

      case '2':
        if (isTyping()) return;
        setMode('SHORT_BREAK');
        break;

      case '3':
        if (isTyping()) return;
        setMode('LONG_BREAK');
        break;

      case 'r':
      case 'R':
        if (isTyping()) return;
        resetTimer();
        break;

      case 's':
      case 'S':
        if (isTyping()) return;
        skip();
        break;

      default:
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
  initApp();
}
