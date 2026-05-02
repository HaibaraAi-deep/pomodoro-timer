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
 *   timer:complete        — countdown finished, detail: { mode, completedSessions }
 *   timer:sessionComplete — any session finished, detail: { mode, sessionCount }
 *   timer:reset           — user reset, detail: { mode }
 *   timer:modeChange      — mode switched, detail: { mode }
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pomodoro modes and their default durations (seconds). */
export const TIMER_MODES = {
  FOCUS:       { label: '专注',   duration: 25 * 60 },   // 25 minutes
  SHORT_BREAK: { label: '短休息', duration:  5 * 60 },   //  5 minutes
  LONG_BREAK:  { label: '长休息', duration: 15 * 60 },   // 15 minutes
};

/** Finite-state-machine states for the timer. */
export const TIMER_STATES = {
  IDLE:      'IDLE',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  COMPLETED: 'COMPLETED',
};

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let worker     = null;
let state      = TIMER_STATES.IDLE;
let mode       = 'FOCUS';
let remaining  = TIMER_MODES.FOCUS.duration;
let elapsed    = 0;
let focusSessionsCompleted = 0;   // count of completed focus sessions
let autoStartBreaks = true;       // whether to auto-start break after focus

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the Web Worker and attach message/error handlers.
 * Safe to call multiple times — subsequent calls are no-ops if already initialised.
 */
export function initTimer() {
  if (worker) return;   // already initialised

  try {
    // Use classic worker (no { type: 'module' }) so we don't need
    // CORS-friendly module serving in dev.
    worker = new Worker('js/timer-worker.js');
  } catch (err) {
    console.error('[Timer] Failed to create Web Worker:', err);
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

  console.log('[Timer] Worker initialised.');
}

/**
 * Start (or resume) the countdown.
 *
 * @param {number} [duration] - If provided, overrides the current mode duration
 *   and starts a fresh countdown. If omitted while IDLE/COMPLETED the current
 *   mode's default duration is used. If omitted while PAUSED, resumes from
 *   where it left off.
 */
export function startTimer(duration) {
  if (!worker) initTimer();
  if (state === TIMER_STATES.RUNNING) return;

  if (duration !== undefined) {
    // Explicit duration = fresh start with custom length
    remaining = duration;
    elapsed = 0;
    worker.postMessage({ command: 'START', duration: duration });
  } else if (state === TIMER_STATES.PAUSED) {
    // Resume — worker still has our elapsed preserved
    worker.postMessage({ command: 'START' });
  } else {
    // IDLE or COMPLETED — use current mode's default
    remaining = TIMER_MODES[mode].duration;
    elapsed = 0;
    worker.postMessage({ command: 'START', duration: remaining });
  }

  state = TIMER_STATES.RUNNING;
  updateUI();
}

/**
 * Pause the countdown without resetting.
 * Call startTimer() (without duration) to resume later.
 */
export function pauseTimer() {
  if (!worker || state !== TIMER_STATES.RUNNING) return;

  worker.postMessage({ command: 'PAUSE' });
  state = TIMER_STATES.PAUSED;
  updateUI();
}

/**
 * Reset the timer back to IDLE using the current mode's initial duration.
 */
export function resetTimer() {
  if (!worker) initTimer();

  worker.postMessage({ command: 'RESET' });
  state    = TIMER_STATES.IDLE;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  updateUI();
  fire('timer:reset', { mode });
}

/**
 * Skip the current session.
 *
 * - During FOCUS: cancel without counting the session, then switch to the
 *   appropriate break mode (IDLE, not auto-started).
 * - During BREAK: cancel and switch back to FOCUS mode (IDLE, not started).
 */
export function skip() {
  if (!worker) initTimer();

  // Stop the worker regardless of current state
  worker.postMessage({ command: 'RESET' });

  if (mode === 'FOCUS') {
    // Skip focus — do NOT count this session, switch to break
    // +1 simulates what the counter would be after this skipped focus,
    // matching handleComplete's increment-then-check semantics.
    const nextMode = ((focusSessionsCompleted + 1) % 4 === 0) ? 'LONG_BREAK' : 'SHORT_BREAK';
    switchToMode(nextMode, false);
  } else {
    // Skip break — go back to focus
    switchToMode('FOCUS', false);
  }
}

/**
 * Switch the active Pomodoro mode.
 * Resets the timer if it is currently running or paused.
 *
 * @param {'FOCUS'|'SHORT_BREAK'|'LONG_BREAK'} newMode
 */
export function setMode(newMode) {
  if (!TIMER_MODES[newMode]) {
    console.warn('[Timer] Unknown mode:', newMode);
    return;
  }
  if (newMode === mode && state !== TIMER_STATES.IDLE) return;

  // Reset worker state before switching
  if (worker && state !== TIMER_STATES.IDLE) {
    worker.postMessage({ command: 'RESET' });
  }

  mode      = newMode;
  state     = TIMER_STATES.IDLE;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  updateUI();
  fire('timer:modeChange', { mode });
}

/**
 * Enable or disable automatic break start after a focus session completes.
 *
 * @param {boolean} enabled - true to auto-start breaks, false to require manual start
 */
export function setAutoStart(enabled) {
  autoStartBreaks = Boolean(enabled);
}

/**
 * Reset the completed focus session counter back to zero.
 * Useful for daily resets or when the user wants to re-align
 * long-break cadence.
 */
export function resetSessionCounter() {
  focusSessionsCompleted = 0;
}

/**
 * Return a snapshot of all current timer state.
 * Useful for other modules (stats, UI) that need to query the timer.
 *
 * @returns {{ state, mode, remaining, elapsed, duration, sessionCount, autoStart }}
 */
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

/**
 * Called when the worker signals that the countdown has reached zero.
 * Increments the session counter (for focus), fires events, and handles
 * auto mode switching for focus → break.
 */
function handleComplete() {
  state = TIMER_STATES.COMPLETED;

  if (mode === 'FOCUS') {
    focusSessionsCompleted++;
  }

  updateUI();
  fire('timer:complete', { mode, completedSessions: focusSessionsCompleted });
  fire('timer:sessionComplete', { mode, sessionCount: focusSessionsCompleted });

  // Auto mode switching: after focus → appropriate break type
  if (mode === 'FOCUS') {
    const nextMode = (focusSessionsCompleted % 4 === 0) ? 'LONG_BREAK' : 'SHORT_BREAK';
    switchToMode(nextMode, autoStartBreaks);
  }
}

/**
 * Internal mode switch without the guard checks of setMode().
 * Used by handleComplete and skip.
 *
 * @param {'FOCUS'|'SHORT_BREAK'|'LONG_BREAK'} newMode
 * @param {boolean} shouldStart - whether to auto-start the timer in the new mode
 */
function switchToMode(newMode, shouldStart) {
  // Reset worker state before switching
  if (worker && state !== TIMER_STATES.IDLE) {
    worker.postMessage({ command: 'RESET' });
  }

  mode      = newMode;
  state     = TIMER_STATES.IDLE;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  updateUI();
  fire('timer:modeChange', { mode });

  if (shouldStart) {
    startTimer();
  }
}

/** Push the current state into the DOM. */
function updateUI() {
  // --- Dynamic ring colour per mode ---
  const container = document.querySelector('.timer-container');
  if (container) {
    const modeColors = {
      FOCUS:       'var(--color-accent)',
      SHORT_BREAK: 'var(--color-success)',
      LONG_BREAK:  'var(--color-long-break)',
    };
    container.style.setProperty('--timer-ring-color', modeColors[mode] || modeColors.FOCUS);
  }

  // --- Countdown display (MM:SS) ---
  const display = document.getElementById('timerDisplay');
  if (display) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Last-minute warning (optional red glow)
    if (remaining <= 60 && remaining > 0 && state === TIMER_STATES.RUNNING) {
      display.classList.add('warning');
    } else {
      display.classList.remove('warning');
    }
  }

  // --- Mode indicator ---
  const indicator = document.getElementById('timerModeIndicator');
  if (indicator) {
    indicator.textContent = TIMER_MODES[mode].label;
  }

  // --- Toggle button (Start / Pause) ---
  const toggleBtn = document.getElementById('timerToggleBtn');
  if (toggleBtn) {
    if (state === TIMER_STATES.RUNNING) {
      toggleBtn.textContent = '暂停';
      toggleBtn.setAttribute('aria-label', '暂停计时');
    } else {
      toggleBtn.textContent = '开始';
      toggleBtn.setAttribute('aria-label', '开始计时');
    }
  }

  // --- SVG progress ring ---
  const ring = document.getElementById('timerRingProgress');
  if (ring) {
    const total = TIMER_MODES[mode].duration;
    const fraction = total > 0 ? remaining / total : 0;
    const circumference = 2 * Math.PI * 90;   // r = 90 from the SVG viewBox
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - fraction));

    // Glow pulse animation: running only
    if (state === TIMER_STATES.RUNNING) {
      ring.classList.add('running');
    } else {
      ring.classList.remove('running');
    }
  }

  // --- Mode switcher buttons (highlight active) ---
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

/**
 * Fire a custom DOM event so other modules can react without direct coupling.
 *
 * @param {string} name   - event name (e.g. 'timer:tick')
 * @param {object} detail - payload attached to event.detail
 */
function fire(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}
