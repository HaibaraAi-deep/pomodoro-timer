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
import { initVitals } from './vitals.js';
import { t, tf, applyI18n, toggleLang, getCurrentLang } from './i18n.js';
import { TIMER_INCREMENT_POMODOROS, SETTINGS_DATA_CHANGED, TIMER_SESSION_COMPLETE, on } from './events.js';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodoros: number;
  createdAt: string;
  completedAt: string | null;
}

interface TimerStateSnapshot {
  state: string;
  mode: string;
  remaining: number;
  elapsed: number;
  duration: number;
  sessionCount: number;
  autoStart: boolean;
}

function setupGlobalErrorHandling(): void {
  window.addEventListener('error', function (e: ErrorEvent): void {
    console.error('[Pomodoro] Uncaught error:', e.error || e.message);
  });

  window.addEventListener('unhandledrejection', function (e: PromiseRejectionEvent): void {
    console.error('[Pomodoro] Unhandled promise rejection:', e.reason);
  });
}

function initApp(): void {
  console.log('[Pomodoro] App initializing...');

  setupGlobalErrorHandling();

  applyI18n();

  initTimer();
  wireTimerButtons();
  wireModeButtons();
  wireSkipButton();
  console.log('[Pomodoro] Timer initialised.');

  initTasks();
  console.log('[Pomodoro] Tasks initialised.');

  initStats();
  renderStats();
  console.log('[Pomodoro] Stats initialised.');

  initTheme();
  console.log('[Pomodoro] Theme initialised.');

  initConfetti();
  console.log('[Pomodoro] Confetti initialised.');

  initPWA();
  console.log('[Pomodoro] PWA initialised.');

  initAudio();
  console.log('[Pomodoro] Audio initialised.');

  initSettings();
  console.log('[Pomodoro] Settings initialised.');

  initVitals();
  console.log('[Pomodoro] Vitals initialised.');

  on(TIMER_INCREMENT_POMODOROS, function (): void {
    const activeId: string | null = getActiveTaskId();
    if (activeId) {
      incrementPomodoros(activeId);
      console.log('[App] Incremented pomodoros for active task:', activeId);
    } else {
      const allTasks: Task[] = getTasks();
      const firstIncomplete: Task | undefined = allTasks.find((t: Task) => !t.completed);
      if (firstIncomplete) {
        incrementPomodoros(firstIncomplete.id);
        console.log('[App] Incremented pomodoros for first incomplete task:', firstIncomplete.title);
      }
    }
    renderTaskList();
  });

  on(SETTINGS_DATA_CHANGED, function (): void {
    reloadTasks();
    renderTaskList();
    resetTimer();
    resetSessionCounter();
    applyI18n();
  });

  wireLangToggle();

  setupKeyboardShortcuts();
  console.log('[Pomodoro] Keyboard shortcuts initialised.');

  document.addEventListener('keydown', function (e: KeyboardEvent): void {
    const target: EventTarget | null = e.target;
    const isInput: boolean = (target as HTMLElement).tagName === 'INPUT' || (target as HTMLElement).tagName === 'TEXTAREA' || (target as HTMLElement).tagName === 'BUTTON';
    if (isInput && e.key !== ',') return;

    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      initSettings();
      const settingsContainer: HTMLElement | null = document.getElementById('settingsContainer');
      if (settingsContainer) {
        settingsContainer.classList.remove('hidden');
      }
    }
  });

  document.addEventListener('keydown', function (e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      const settingsContainer: HTMLElement | null = document.getElementById('settingsContainer');
      if (settingsContainer && !settingsContainer.classList.contains('hidden')) {
        settingsContainer.classList.add('hidden');
      }
    }
  });

  registerServiceWorker();

  console.log('[Pomodoro] App ready.');
}

function wireTimerButtons(): void {
  const toggleBtn: HTMLElement | null = document.getElementById('timerToggleBtn');
  const resetBtn: HTMLElement | null = document.getElementById('timerResetBtn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (): void {
      const snapshot: TimerStateSnapshot = getState();
      if (snapshot.state === 'RUNNING') {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function (): void {
      resetTimer();
    });
  }
}

function wireModeButtons(): void {
  const modeButtons: NodeListOf<Element> = document.querySelectorAll('[data-mode]');

  modeButtons.forEach(function (btn: Element): void {
    btn.addEventListener('click', function (): void {
      const targetMode: string | null = btn.getAttribute('data-mode');
      if (targetMode && TIMER_MODES[targetMode]) {
        setMode(targetMode);
      }
    });
  });
}

function wireSkipButton(): void {
  const skipBtn: HTMLElement | null = document.getElementById('timerSkipBtn');
  if (skipBtn) {
    skipBtn.addEventListener('click', function (): void {
      skip();
    });
  }
}

function initTasks(): void {
  renderTaskList();
  wireTaskInput();
}

function renderTaskList(): void {
  const listEl: HTMLElement | null = document.getElementById('taskList');
  const emptyEl: HTMLElement | null = document.getElementById('taskEmptyState');

  if (!listEl) return;

  const allTasks: Task[] = getTasks();
  const currentActiveId: string | null = getActiveTaskId();

  const existingItems: NodeListOf<HTMLLIElement> = listEl.querySelectorAll('.task-item');
  const existingMap: Map<string | null, HTMLLIElement> = new Map();
  existingItems.forEach(function (li: HTMLLIElement): void {
    existingMap.set(li.getAttribute('data-task-id'), li);
  });

  const taskIds: Set<string | null> = new Set(allTasks.map((t: Task) => t.id));

  existingMap.forEach(function (li: HTMLLIElement, id: string | null): void {
    if (!taskIds.has(id)) {
      li.remove();
    }
  });

  allTasks.forEach(function (task: Task, index: number): void {
    const existingLi: HTMLLIElement | undefined = existingMap.get(task.id) as HTMLLIElement | undefined;

    if (existingLi) {
      const checkbox: HTMLInputElement | null = existingLi.querySelector('.task-checkbox');
      if (checkbox) checkbox.checked = task.completed;

      const titleSpan: HTMLSpanElement | null = existingLi.querySelector('.task-title');
      if (titleSpan) titleSpan.textContent = task.title;

      const pomoBadge: HTMLSpanElement | null = existingLi.querySelector('.task-pomodoros');
      if (pomoBadge) {
        if (task.pomodoros > 0) {
          pomoBadge.textContent = String.fromCharCode(0x1F345) + ' ' + task.pomodoros;
          pomoBadge.classList.remove('hidden');
        } else {
          pomoBadge.classList.add('hidden');
        }
      }

      const deleteBtn: HTMLButtonElement | null = existingLi.querySelector('.task-delete-btn');
      if (deleteBtn) {
        deleteBtn.setAttribute('aria-label', t('deleteTask') + ': ' + sanitizeForAria(task.title));
      }

      if (task.completed) {
        existingLi.classList.add('completed');
      } else {
        existingLi.classList.remove('completed');
      }

      existingLi.classList.remove('slide-in');

      if (task.id === currentActiveId && !task.completed) {
        existingLi.classList.add('task-active');
      } else {
        existingLi.classList.remove('task-active');
      }

      const currentItems: NodeListOf<HTMLLIElement> = listEl.querySelectorAll('.task-item');
      if (currentItems[index] !== existingLi) {
        listEl.insertBefore(existingLi, currentItems[index] || null);
      }
    } else {
      const li: HTMLLIElement = createTaskElement(task, currentActiveId);
      const currentItems: NodeListOf<HTMLLIElement> = listEl.querySelectorAll('.task-item');
      if (currentItems[index]) {
        listEl.insertBefore(li, currentItems[index]);
      } else {
        listEl.appendChild(li);
      }
    }
  });

  if (allTasks.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
  } else {
    if (emptyEl) emptyEl.classList.add('hidden');
  }
}

function createTaskElement(task: Task, activeId: string | null): HTMLLIElement {
  const li: HTMLLIElement = document.createElement('li');
  li.className = 'task-item slide-in' + (task.completed ? ' completed' : '') +
    (task.id === activeId && !task.completed ? ' task-active' : '');
  li.setAttribute('data-task-id', task.id);

  const checkbox: HTMLInputElement = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? t('markIncomplete') : t('markComplete'));
  checkbox.addEventListener('change', function (): void {
    const updatedTask: Task | null = toggleTask(task.id);
    if (updatedTask) {
      updateLiveRegion(updatedTask.completed
        ? tf('taskMarkedComplete', [updatedTask.title])
        : tf('taskMarkedIncomplete', [updatedTask.title]));
      renderTaskList();
    }
  });

  const titleSpan: HTMLSpanElement = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title;
  titleSpan.addEventListener('click', function (): void {
    if (!task.completed) {
      setActiveTaskId(task.id);
      renderTaskList();
      updateLiveRegion(tf('taskSetAsFocus', [task.title]));
    }
  });
  titleSpan.setAttribute('title', t('setFocusTask'));

  const pomoBadge: HTMLSpanElement = document.createElement('span');
  pomoBadge.className = 'task-pomodoros';
  if (task.pomodoros > 0) {
    pomoBadge.textContent = String.fromCharCode(0x1F345) + ' ' + task.pomodoros;
  } else {
    pomoBadge.classList.add('hidden');
  }

  const deleteBtn: HTMLButtonElement = document.createElement('button');
  deleteBtn.className = 'task-delete-btn';
  deleteBtn.setAttribute('aria-label', t('deleteTask') + ': ' + sanitizeForAria(task.title));
  deleteBtn.textContent = '\u00D7';
  deleteBtn.addEventListener('click', function (e: MouseEvent): void {
    e.stopPropagation();

    deleteBtn.disabled = true;
    li.classList.add('fade-out');

    li.addEventListener('animationend', function handler(): void {
      li.removeEventListener('animationend', handler);
      deleteBtn.disabled = false;
      const success: boolean = deleteTask(task.id);
      if (success) {
        updateLiveRegion(tf('taskDeleted', [task.title]));
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

function wireTaskInput(): void {
  const inputEl: HTMLInputElement | null = document.getElementById('taskInput') as HTMLInputElement | null;
  const addBtn: HTMLElement | null = document.getElementById('taskAddBtn');

  if (!inputEl) return;

  function handleAdd(): void {
    if (!inputEl) return;
    const raw: string = inputEl.value;
    if (!raw.trim()) return;
    try {
      const task: Task = addTask(raw);
      inputEl.value = '';

      updateLiveRegion(tf('taskAdded', [task.title]));

      renderTaskList();
    } catch (err) {
      console.warn('[Tasks] Add failed:', (err as Error).message);
    }
  }

  inputEl.addEventListener('keydown', function (e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  if (addBtn) {
    addBtn.addEventListener('click', handleAdd);
  }
}

function updateLiveRegion(message: string): void {
  const liveRegion: HTMLElement | null = document.getElementById('liveRegion');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

function wireLangToggle(): void {
  const langToggleBtn: HTMLElement | null = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', function (): void {
      toggleLang();
      applyI18n();
      renderStats();
      renderTaskList();
    });
  }
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Pomodoro] Service Worker not supported in this browser.');
    return;
  }

  navigator.serviceWorker
    .register('sw.js')
    .then(function (registration: ServiceWorkerRegistration): void {
      console.log('[Pomodoro] Service Worker registered with scope:', registration.scope);

      registration.addEventListener('updatefound', function (): void {
        const installingWorker: ServiceWorker | null = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', function (): void {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Pomodoro] New Service Worker available — refresh to update.');
          }
        });
      });
    })
    .catch(function (err: Error): void {
      console.error('[Pomodoro] Service Worker registration failed:', err);
    });
}

function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', function (e: KeyboardEvent): void {
    const target: EventTarget | null = e.target;
    const isInput: boolean = (target as HTMLElement).tagName === 'INPUT' || (target as HTMLElement).tagName === 'TEXTAREA';

    function isTyping(): boolean {
      return isInput && e.key !== 'n' && e.key !== 'N';
    }

    switch (e.key) {
      case ' ':
        if (isTyping()) return;
        e.preventDefault();
        {
          const s: string = getState().state;
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
          const taskInputEl: HTMLElement | null = document.getElementById('taskInput');
          if (taskInputEl) {
            e.preventDefault();
            taskInputEl.focus();
            (taskInputEl as HTMLInputElement).select();
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
