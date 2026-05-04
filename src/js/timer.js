/**
 * timer.js — Main-thread timer controller module
 *
 * Owns the Web Worker lifecycle, exposes a clean API (start / pause / reset /
 * skip / setAutoStart / resetSessionCounter), and bridges worker messages
 * to the DOM and to other modules via custom events.
 *
 * Exports:
 *   initTimer()                           — spawn worker, register listeners
 *   startTimer(duration?)                 — begin or resume countdown
 *   pauseTimer()                          — pause without resetting
 *   resetTimer()                          — stop and reset to initial state
 *   skip()                                — skip current session
 *   setMode(mode)                         — switch Pomodoro mode
 *   setAutoStart(enabled)                 — toggle auto-start after focus
 *   resetSessionCounter()                 — reset completed focus count to 0
 *   getState()                            — snapshot of current timer state
 *   TIMER_MODES, TIMER_STATES             — constant enums for other modules
 *
 * Custom events (fired on `document`):
 *   timer:tick            — every second, detail: { remaining, elapsed, mode }
 *   timer:complete        — countdown finished, detail: { mode, completedSessions, actualDuration }
 *   timer:sessionComplete — any session finished, detail: { mode, sessionCount, actualDuration }
 *   timer:reset           — user reset, detail: { mode }
 *   timer:modeChange      — mode switched, detail: { mode }
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pomodoro modes and their default durations (seconds). */
export const TIMER_MODES = {
  FOCUS:       { label: '专注',   duration: 25 * 60 },
  SHORT_BREAK: { label: '短休息', duration:  5 * 60 },
  LONG_BREAK:  { label: '长休息', duration: 15 * 60 },
};

/** Finite-state-machine states for the timer. */
export const TIMER_STATES = {
  IDLE:      'IDLE',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  COMPLETED: 'COMPLETED',
};

const SESSION_COUNTER_KEY = 'pomodoro_pomo_counter';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// DOM element cache
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Session counter persistence
// ---------------------------------------------------------------------------

function loadSessionCounter() {
  try {
    const raw = localStorage.getItem(SESSION_COUNTER_KEY);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (e) {
    // ignore
  }
  return 0;
}

function saveSessionCounter() {
  try {
    localStorage.setItem(SESSION_COUNTER_KEY, String(focusSessionsCompleted));
  } catch (e) {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the Web Worker and attach message/error handlers.
 * Falls back to setInterval if Worker creation fails.
 */
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
        fire('timer:tick', { remaining, elapsed, mode });
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

  document.addEventListener('timer:sessionComplete', function (e) {
    if (e.detail && e.detail.mode === 'FOCUS') {
      fire('timer:incrementPomodoros', { taskId: null });
    }
  });

  console.log('[Timer] Worker initialised.');
}

function showWorkerFallbackNotice() {
  const liveRegion = document.getElementById('liveRegion');
  if (liveRegion) {
    liveRegion.textContent = '计时器使用降级模式，后台标签页时可能不够精确';
  }
}

// ---------------------------------------------------------------------------
// Fallback timer (setInterval-based)
// ---------------------------------------------------------------------------

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
    fire('timer:tick', { remaining, elapsed, mode });
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

// ---------------------------------------------------------------------------
// Timer control functions
// ---------------------------------------------------------------------------

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
  fire('timer:reset', { mode });
}

/**
 * Skip the current session.
 *
 * - During FOCUS: cancel without counting the session, switch to the
 *   appropriate break based on current completed count (not +1).
 * - During BREAK: cancel and switch back to FOCUS mode.
 */
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
  fire('timer:modeChange', { mode });
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function handleComplete() {
  const actualDuration = elapsed || TIMER_MODES[mode].duration;

  state = TIMER_STATES.COMPLETED;

  if (mode === 'FOCUS') {
    focusSessionsCompleted++;
    saveSessionCounter();
  }

  updateUI();
  fire('timer:complete', { mode, completedSessions: focusSessionsCompleted, actualDuration });
  fire('timer:sessionComplete', { mode, sessionCount: focusSessionsCompleted, actualDuration });

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
  fire('timer:modeChange', { mode });

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
    indicator.textContent = TIMER_MODES[mode].label;
  }

  const toggleBtn = domCache.timerToggleBtn || document.getElementById('timerToggleBtn');
  if (toggleBtn) {
    if (state === TIMER_STATES.RUNNING) {
      toggleBtn.textContent = '暂停';
      toggleBtn.setAttribute('aria-label', '暂停计时');
    } else if (state === TIMER_STATES.PAUSED) {
      toggleBtn.textContent = '继续';
      toggleBtn.setAttribute('aria-label', '继续计时');
    } else {
      toggleBtn.textContent = '开始';
      toggleBtn.setAttribute('aria-label', '开始计时');
    }
  }

  const ring = domCache.timerRingProgress || document.getElementById('timerRingProgress');
  if (ring) {
    const total = TIMER_MODES[mode].duration;
    const fraction = total > 0 ? remaining / total : 0;
    const circumference = 2 * Math.PI * 90;
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

function fire(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

function announceTimerComplete(mode, sessionCount) {
  const liveRegion = document.getElementById('liveRegion');
  if (!liveRegion) return;

  let message = '';

  if (mode === 'FOCUS') {
    const messages = [
      `${sessionCount} 个番茄钟已完成`,
      `专注阶段结束，共完成 ${sessionCount} 个番茄钟`,
      `计时完成，您已完成 ${sessionCount} 个专注时段`
    ];
    message = messages[Math.floor(Math.random() * messages.length)];
  } else if (mode === 'SHORT_BREAK') {
    message = `短休息结束`;
  } else if (mode === 'LONG_BREAK') {
    message = `长休息结束`;
  }

  liveRegion.textContent = message;
}
