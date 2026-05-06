import { t, tf } from './i18n.js';
import { TIMER_TICK, TIMER_COMPLETE, TIMER_SESSION_COMPLETE, TIMER_RESET, TIMER_MODE_CHANGE, TIMER_INCREMENT_POMODOROS, fire, on } from './events.js';

type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
type TimerMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface TimerStateSnapshot {
  state: TimerState;
  mode: TimerMode;
  remaining: number;
  elapsed: number;
  duration: number;
  sessionCount: number;
  autoStart: boolean;
}

export const TIMER_MODES: Record<string, { duration: number }> = {
  FOCUS:       { duration: 25 * 60 },
  SHORT_BREAK: { duration:  5 * 60 },
  LONG_BREAK:  { duration: 15 * 60 },
};

export const TIMER_STATES: Record<string, string> = {
  IDLE:      'IDLE',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  COMPLETED: 'COMPLETED',
};

const SESSION_COUNTER_KEY: string = 'pomodoro_pomo_counter';

const MODE_I18N_KEYS: Record<TimerMode, string> = {
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

let worker: Worker | null = null;
let state: TimerState = TIMER_STATES.IDLE as TimerState;
let mode: TimerMode = 'FOCUS';
let remaining: number = TIMER_MODES.FOCUS.duration;
let elapsed: number = 0;
let focusSessionsCompleted: number = loadSessionCounter();
let autoStartBreaks: boolean = true;
let useFallbackTimer: boolean = false;
let fallbackIntervalId: ReturnType<typeof setInterval> | null = null;
let fallbackStartTime: number | null = null;
let fallbackElapsedAtStart: number = 0;
let fallbackDuration: number = 0;
let sessionStartElapsed: number = 0;

let domCache: Record<string, HTMLElement | null> = {};

function cacheDomElements(): void {
  domCache = {
    timerSection: document.querySelector('.timer-section'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerModeIndicator: document.getElementById('timerModeIndicator'),
    timerToggleBtn: document.getElementById('timerToggleBtn'),
    timerRingProgress: document.getElementById('timerRingProgress'),
  };
}

function loadSessionCounter(): number {
  try {
    const raw: string | null = localStorage.getItem(SESSION_COUNTER_KEY);
    if (raw !== null) {
      const val: number = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (e) {
    console.warn('[Timer] Failed to load session counter:', e);
  }
  return 0;
}

function saveSessionCounter(): void {
  try {
    localStorage.setItem(SESSION_COUNTER_KEY, String(focusSessionsCompleted));
  } catch (e) {
    console.warn('[Timer] Failed to save session counter:', e);
  }
}

export function initTimer(): void {
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

  worker.onmessage = function (e: MessageEvent): void {
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

  worker.onerror = function (err: ErrorEvent): void {
    console.error('[Timer] Worker error:', err.message || err);
  };

  on(TIMER_SESSION_COMPLETE, function (e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.mode === 'FOCUS') {
      fire(TIMER_INCREMENT_POMODOROS, { taskId: null });
    }
  });

  console.log('[Timer] Worker initialised.');
}

function showWorkerFallbackNotice(): void {
  const liveRegion: HTMLElement | null = document.getElementById('liveRegion');
  if (liveRegion) {
    liveRegion.textContent = t('workerFallbackNotice');
  }
}

function fallbackStart(duration?: number): void {
  fallbackStop();
  if (duration !== undefined) {
    fallbackDuration = duration;
    fallbackElapsedAtStart = 0;
  }
  fallbackStartTime = Date.now();
  fallbackIntervalId = setInterval(function (): void {
    const wallElapsed: number = Math.floor((Date.now() - fallbackStartTime!) / 1000);
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

function fallbackPause(): void {
  if (fallbackIntervalId !== null) {
    fallbackElapsedAtStart = elapsed;
    clearInterval(fallbackIntervalId);
    fallbackIntervalId = null;
  }
}

function fallbackReset(): void {
  fallbackStop();
  elapsed = 0;
  fallbackDuration = 0;
  fallbackElapsedAtStart = 0;
}

function fallbackStop(): void {
  if (fallbackIntervalId !== null) {
    clearInterval(fallbackIntervalId);
    fallbackIntervalId = null;
  }
}

export function startTimer(duration?: number): void {
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
      worker!.postMessage({ command: 'START', duration: duration });
    } else if (state === TIMER_STATES.PAUSED) {
      worker!.postMessage({ command: 'START' });
    } else {
      remaining = TIMER_MODES[mode].duration;
      elapsed = 0;
      worker!.postMessage({ command: 'START', duration: remaining });
    }
  }

  sessionStartElapsed = elapsed;
  state = TIMER_STATES.RUNNING as TimerState;
  updateUI();
}

export function pauseTimer(): void {
  if (state !== TIMER_STATES.RUNNING) return;

  if (useFallbackTimer) {
    fallbackPause();
  } else {
    if (!worker) return;
    worker.postMessage({ command: 'PAUSE' });
  }

  state = TIMER_STATES.PAUSED as TimerState;
  updateUI();
}

export function resetTimer(): void {
  if (!worker && !useFallbackTimer) initTimer();

  if (useFallbackTimer) {
    fallbackReset();
  } else {
    worker!.postMessage({ command: 'RESET' });
  }

  state    = TIMER_STATES.IDLE as TimerState;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  sessionStartElapsed = 0;
  updateUI();
  fire(TIMER_RESET, { mode });
}

export function skip(): void {
  if (!worker && !useFallbackTimer) initTimer();

  if (state === TIMER_STATES.IDLE) {
    console.log('[Timer] Skip ignored: timer is idle, mode already switched');
    return;
  }

  if (useFallbackTimer) {
    fallbackReset();
  } else {
    worker!.postMessage({ command: 'RESET' });
  }

  if (mode === 'FOCUS') {
    const nextMode: TimerMode = (focusSessionsCompleted % 4 === 0 && focusSessionsCompleted > 0)
      ? 'LONG_BREAK'
      : 'SHORT_BREAK';
    switchToMode(nextMode, false);
  } else {
    switchToMode('FOCUS', false);
  }
}

export function setMode(newMode: string): void {
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

  mode      = newMode as TimerMode;
  state     = TIMER_STATES.IDLE as TimerState;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  sessionStartElapsed = 0;
  updateUI();
  fire(TIMER_MODE_CHANGE, { mode });
}

export function setAutoStart(enabled: boolean): void {
  autoStartBreaks = Boolean(enabled);
}

export function resetSessionCounter(): void {
  focusSessionsCompleted = 0;
  saveSessionCounter();
}

export function getState(): TimerStateSnapshot {
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

function handleComplete(): void {
  const actualDuration: number = elapsed || TIMER_MODES[mode].duration;

  state = TIMER_STATES.COMPLETED as TimerState;

  if (mode === 'FOCUS') {
    focusSessionsCompleted++;
    saveSessionCounter();
  }

  updateUI();
  fire(TIMER_COMPLETE, { mode, completedSessions: focusSessionsCompleted, actualDuration });
  fire(TIMER_SESSION_COMPLETE, { mode, sessionCount: focusSessionsCompleted, actualDuration });

  announceTimerComplete(mode, focusSessionsCompleted);

  if (mode === 'FOCUS') {
    const nextMode: TimerMode = (focusSessionsCompleted % 4 === 0) ? 'LONG_BREAK' : 'SHORT_BREAK';
    switchToMode(nextMode, autoStartBreaks);
  }
}

function switchToMode(newMode: TimerMode, shouldStart: boolean): void {
  if (useFallbackTimer) {
    if (state !== TIMER_STATES.IDLE) fallbackReset();
  } else {
    if (worker && state !== TIMER_STATES.IDLE) {
      worker.postMessage({ command: 'RESET' });
    }
  }

  mode      = newMode;
  state     = TIMER_STATES.IDLE as TimerState;
  remaining = TIMER_MODES[mode].duration;
  elapsed   = 0;
  sessionStartElapsed = 0;
  updateUI();
  fire(TIMER_MODE_CHANGE, { mode });

  if (shouldStart) {
    startTimer();
  }
}

function updateUI(): void {
  const container: HTMLElement | null = domCache.timerSection || document.querySelector('.timer-section');
  if (container) {
    const modeColors: Record<TimerMode, string> = {
      FOCUS:       'var(--color-accent)',
      SHORT_BREAK: 'var(--color-success)',
      LONG_BREAK:  'var(--color-long-break)',
    };
    container.style.setProperty('--timer-ring-color', modeColors[mode] || modeColors.FOCUS);
  }

  const display: HTMLElement | null = domCache.timerDisplay || document.getElementById('timerDisplay');
  if (display) {
    const mins: number = Math.floor(remaining / 60);
    const secs: number = remaining % 60;
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

  const indicator: HTMLElement | null = domCache.timerModeIndicator || document.getElementById('timerModeIndicator');
  if (indicator) {
    indicator.textContent = t(MODE_I18N_KEYS[mode]);
  }

  const toggleBtn: HTMLElement | null = domCache.timerToggleBtn || document.getElementById('timerToggleBtn');
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

  const ring: HTMLElement | null = domCache.timerRingProgress || document.getElementById('timerRingProgress');
  if (ring) {
    const total: number = TIMER_MODES[mode].duration;
    const fraction: number = total > 0 ? remaining / total : 0;
    const circumference: number = 2 * Math.PI * 108;
    (ring as unknown as SVGElement).style.strokeDasharray = String(circumference);
    (ring as unknown as SVGElement).style.strokeDashoffset = String(circumference * (1 - fraction));

    if (state === TIMER_STATES.RUNNING) {
      ring.classList.add('running');
    } else {
      ring.classList.remove('running');
    }
  }

  const modeButtons: NodeListOf<Element> = document.querySelectorAll('[data-mode]');
  modeButtons.forEach(function (btn: Element): void {
    const btnMode: string | null = btn.getAttribute('data-mode');
    if (btnMode === mode) {
      btn.classList.add('mode-btn--active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('mode-btn--active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

function announceTimerComplete(completedMode: TimerMode, sessionCount: number): void {
  const liveRegion: HTMLElement | null = document.getElementById('liveRegion');
  if (!liveRegion) return;

  let message: string = '';

  if (completedMode === 'FOCUS') {
    const messages: string[] = [
      tf('focusSessionEnd1', [String(sessionCount)]),
      tf('focusSessionEnd2', [String(sessionCount)]),
      tf('focusSessionEnd3', [String(sessionCount)]),
    ];
    message = messages[Math.floor(Math.random() * messages.length)];
  } else if (completedMode === 'SHORT_BREAK') {
    message = tf('shortBreakEnd');
  } else if (completedMode === 'LONG_BREAK') {
    message = tf('longBreakEnd');
  }

  liveRegion.textContent = message;
}
