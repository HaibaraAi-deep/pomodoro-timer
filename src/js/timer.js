import { t, tf } from './i18n.js';
import { TIMER_TICK, TIMER_COMPLETE, TIMER_SESSION_COMPLETE, TIMER_RESET, TIMER_MODE_CHANGE, TIMER_INCREMENT_POMODOROS, fire, on } from './events.js';

export const TIMER_MODES = {
  FOCUS:       { duration: 25 * 60 },
  SHORT_BREAK: { duration:  5 * 60 },
  LONG_BREAK:  { duration: 15 * 60 },
};

export const TIMER_STATES = {
  IDLE:      'IDLE',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  COMPLETED: 'COMPLETED',
};

const SESSION_COUNTER_KEY = 'pomodoro_pomo_counter';

const MODE_I18N_KEYS = {
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

let worker     = null;
let state      = TIMER_STATES.IDLE;
let mode       = 'FOCUS';
let remaining  = TIMER_MODES.FOCUS.duration;
let elapsed    = 0;
let focusSessionsCompleted = loadSessionCounter();
let autoStartBreaks = true;
let useFallbackTimer = false;
let fallbackIntervalId = null;
let fallbackStartTime = null;
let fallbackElapsedAtStart = 0;
let fallbackDuration = 0;
let sessionStartElapsed = 0;

let domCache = {};

function cacheDomElements() {
  domCache = {
    timerSection: document.querySelector('.timer-section'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerModeIndicator: document.getElementById('timerModeIndicator'),
    timerToggleBtn: document.getElementById('timerToggleBtn'),
    timerRingProgress: document.getElementById('timerRingProgress'),
  };
}

function loadSessionCounter() {
  try {
    const raw = localStorage.getItem(SESSION_COUNTER_KEY);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (e) {
    console.warn('[Timer] Failed to load session counter:', e);
  }
  return 0;
}

function saveSessionCounter() {
  try {
    localStorage.setItem(SESSION_COUNTER_KEY, String(focusSessionsCompleted));
  } catch (e) {
    console.warn('[Timer] Failed to save session counter:', e);
  }
}

export function initTimer() {
  if (worker || useFallbackTimer) return;

  cacheDomElements();

  try {
    worker = new Worker('js/timer-worker.js');
  } catch (err) {
    console.error('[Timer] Failed to create Web Worker:', err);
    console.log('[Timer] Falling back to setInterval timer');
    useFallbackTimer = true;
    showWorkerFallbackNotice();
    return;
  }

  worker.onmessage = function (e) {
    const msg = e.data;

    switch (msg.type) {
      case 'TICK':
        remaining = msg.remaining;
        elapsed   = msg.elapsed;
        updateUI();
        fire(TIMER_TICK, { remaining, elapsed, mode });
        break;

      case 'COMPLETE':
        handleComplete();
        break;

      default:
        break;
    }
  };

  worker.onerror = function (err) {
    console.error('[Timer] Worker error:', err.message || err);
  };

  on(TIMER_SESSION_COMPLETE, function (e) {
    if (e.detail && e.detail.mode === 'FOCUS') {
      fire(TIMER_INCREMENT_POMODOROS, { taskId: null });
    }
  });

  console.log('[Timer] Worker initialised.');
}

function showWorkerFallbackNotice() {
  const liveRegion = document.getElementById('liveRegion');
  if (liveRegion) {
    liveRegion.textContent = t('workerFallbackNotice');
  }
}

function fallbackStart(duration) {
  fallbackStop();
  if (duration !== undefined) {
    fallbackDuration = duration;
    fallbackElapsedAtStart = 0;
  }
  fallbackStartTime = Date.now();
  fallbackIntervalId = setInterval(function () {
    const wallElapsed = Math.floor((Date.now() - fallbackStartTime) / 1000);
    elapsed = Math.min(fallbackElapsedAtStart + wallElapsed, fallbackDuration);
    remaining = Math.max(0, fallbackDuration - elapsed);
    updateUI();
    fire(TIMER_TICK, { remaining, elapsed, mode });
    if (remaining <= 0) {
      fallbackStop();
      handleComplete();
    }
  }, 1000);
}

function fallbackPause() {
  if (fallbackIntervalId !== null) {
    fallbackElapsedAtStart = elapsed;
    clearInterval(fallbackIntervalId);
    fallbackIntervalId = null;
  }
}

function fallbackReset() {
  fallbackStop();
  elapsed = 0;
  fallbackDuration = 0;
  fallbackElapsedAtStart = 0;
}

function fallbackStop() {
  if (fallbackIntervalId !== null) {
    clearInterval(fallbackIntervalId);
    fallbackIntervalId = null;
  }
}

export function startTimer(duration) {
  if (!worker && !useFallbackTimer) initTimer();
  if (state === TIMER_STATES.RUNNING) return;

  if (useFallbackTimer) {
    if (duration !== undefined) {
      remaining = duration;
      elapsed = 0;
      fallbackStart(duration);
    } else if (state === TIMER_STATES.PAUSED) {
      fallbackStart();
    } else {
      remaining = TIMER_MODES[mode].duration;
      elapsed = 0;
      fallbackStart(remaining);
    }
  } else {
    if (duration !== undefined) {
      remaining = duration;
      elapsed = 0;
      worker.postMessage({ command: 'START', duration: duration });
    } else if (state === TIMER_STATES.PAUSED) {
      worker.postMessage({ command: 'START' });
    } else {
      remaining = TIMER_MODES[mode].duration;
      elapsed = 0;
      worker.postMessage({ command: 'START', duration: remaining });
    }
  }

  sessionStartElapsed = elapsed;
  state = TIMER_STATES.RUNNING;
  updateUI();
}

export function pauseTimer() {
  if (state !== TIMER_STATES.RUNNING) return;

  if (useFallbackTimer) {
    fallbackPause();
  } else {
    if (!worker) return;
    worker.postMessage({ command: 'PAUSE' });
  }

  state = TIMER_STATES.PAUSED;
  updateUI();
}

export function resetTimer() {
  if (!worker && !useFallbackTimer) initTimer();

  if (useFallbackTimer) {
    fallbackReset();
  } else {
    worker.postMessage({ command: 'RESET' });
  }

  state    = TIMER_STATES.IDLE;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  sessionStartElapsed = 0;
  updateUI();
  fire(TIMER_RESET, { mode });
}

export function skip() {
  if (!worker && !useFallbackTimer) initTimer();

  if (state === TIMER_STATES.IDLE) {
    console.log('[Timer] Skip ignored: timer is idle, mode already switched');
    return;
  }

  if (useFallbackTimer) {
    fallbackReset();
  } else {
    worker.postMessage({ command: 'RESET' });
  }

  if (mode === 'FOCUS') {
    const nextMode = (focusSessionsCompleted % 4 === 0 && focusSessionsCompleted > 0)
      ? 'LONG_BREAK'
      : 'SHORT_BREAK';
    switchToMode(nextMode, false);
  } else {
    switchToMode('FOCUS', false);
  }
}

export function setMode(newMode) {
  if (!TIMER_MODES[newMode]) {
    console.warn('[Timer] Unknown mode:', newMode);
    return;
  }
  if (newMode === mode && state !== TIMER_STATES.IDLE) return;

  if (useFallbackTimer) {
    if (state !== TIMER_STATES.IDLE) fallbackReset();
  } else {
    if (worker && state !== TIMER_STATES.IDLE) {
      worker.postMessage({ command: 'RESET' });
    }
  }

  mode      = newMode;
  state     = TIMER_STATES.IDLE;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  sessionStartElapsed = 0;
  updateUI();
  fire(TIMER_MODE_CHANGE, { mode });
}

export function setAutoStart(enabled) {
  autoStartBreaks = Boolean(enabled);
}

export function resetSessionCounter() {
  focusSessionsCompleted = 0;
  saveSessionCounter();
}

export function getState() {
  return {
    state,
    mode,
    remaining,
    elapsed,
    duration: TIMER_MODES[mode].duration,
    sessionCount: focusSessionsCompleted,
    autoStart: autoStartBreaks,
  };
}

function handleComplete() {
  const actualDuration = elapsed || TIMER_MODES[mode].duration;

  state = TIMER_STATES.COMPLETED;

  if (mode === 'FOCUS') {
    focusSessionsCompleted++;
    saveSessionCounter();
  }

  updateUI();
  fire(TIMER_COMPLETE, { mode, completedSessions: focusSessionsCompleted, actualDuration });
  fire(TIMER_SESSION_COMPLETE, { mode, sessionCount: focusSessionsCompleted, actualDuration });

  announceTimerComplete(mode, focusSessionsCompleted);

  if (mode === 'FOCUS') {
    const nextMode = (focusSessionsCompleted % 4 === 0) ? 'LONG_BREAK' : 'SHORT_BREAK';
    switchToMode(nextMode, autoStartBreaks);
  }
}

function switchToMode(newMode, shouldStart) {
  if (useFallbackTimer) {
    if (state !== TIMER_STATES.IDLE) fallbackReset();
  } else {
    if (worker && state !== TIMER_STATES.IDLE) {
      worker.postMessage({ command: 'RESET' });
    }
  }

  mode      = newMode;
  state     = TIMER_STATES.IDLE;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  sessionStartElapsed = 0;
  updateUI();
  fire(TIMER_MODE_CHANGE, { mode });

  if (shouldStart) {
    startTimer();
  }
}

function updateUI() {
  const container = domCache.timerSection || document.querySelector('.timer-section');
  if (container) {
    const modeColors = {
      FOCUS:       'var(--color-accent)',
      SHORT_BREAK: 'var(--color-success)',
      LONG_BREAK:  'var(--color-long-break)',
    };
    container.style.setProperty('--timer-ring-color', modeColors[mode] || modeColors.FOCUS);
  }

  const display = domCache.timerDisplay || document.getElementById('timerDisplay');
  if (display) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (remaining <= 60 && remaining > 0 && state === TIMER_STATES.RUNNING) {
      display.classList.add('warning');
    } else {
      display.classList.remove('warning');
    }

    if (state === TIMER_STATES.PAUSED) {
      display.classList.add('paused');
    } else {
      display.classList.remove('paused');
    }
  }

  const indicator = domCache.timerModeIndicator || document.getElementById('timerModeIndicator');
  if (indicator) {
    indicator.textContent = t(MODE_I18N_KEYS[mode]);
  }

  const toggleBtn = domCache.timerToggleBtn || document.getElementById('timerToggleBtn');
  if (toggleBtn) {
    if (state === TIMER_STATES.RUNNING) {
      toggleBtn.textContent = t('pause');
      toggleBtn.setAttribute('aria-label', t('pauseTimer'));
    } else if (state === TIMER_STATES.PAUSED) {
      toggleBtn.textContent = t('resume');
      toggleBtn.setAttribute('aria-label', t('resumeTimer'));
    } else {
      toggleBtn.textContent = t('start');
      toggleBtn.setAttribute('aria-label', t('startTimer'));
    }
  }

  const ring = domCache.timerRingProgress || document.getElementById('timerRingProgress');
  if (ring) {
    const total = TIMER_MODES[mode].duration;
    const fraction = total > 0 ? remaining / total : 0;
    const circumference = 2 * Math.PI * 108;
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - fraction));

    if (state === TIMER_STATES.RUNNING) {
      ring.classList.add('running');
    } else {
      ring.classList.remove('running');
    }
  }

  const modeButtons = document.querySelectorAll('[data-mode]');
  modeButtons.forEach(function (btn) {
    const btnMode = btn.getAttribute('data-mode');
    if (btnMode === mode) {
      btn.classList.add('mode-btn--active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('mode-btn--active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

function announceTimerComplete(mode, sessionCount) {
  const liveRegion = document.getElementById('liveRegion');
  if (!liveRegion) return;

  let message = '';

  if (mode === 'FOCUS') {
    const messages = [
      tf('focusSessionEnd1', sessionCount),
      tf('focusSessionEnd2', sessionCount),
      tf('focusSessionEnd3', sessionCount),
    ];
    message = messages[Math.floor(Math.random() * messages.length)];
  } else if (mode === 'SHORT_BREAK') {
    message = tf('shortBreakEnd');
  } else if (mode === 'LONG_BREAK') {
    message = tf('longBreakEnd');
  }

  liveRegion.textContent = message;
}
