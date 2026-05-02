/**
 * timer-worker.js — Web Worker for precise countdown timing
 *
 * Runs the timer countdown in a dedicated background thread so that
 * setTimeout/setInterval callbacks are not throttled when the main
 * tab is hidden or the UI thread is busy.
 *
 * Communication protocol (messages received from main thread):
 *   { command: 'START', duration?: number }  — start/resume countdown
 *   { command: 'PAUSE' }                      — pause, preserve elapsed
 *   { command: 'RESET' }                      — stop and reset to zero
 *   { command: 'SET_DURATION', duration: N }  — change duration, reset elapsed
 *
 * Messages posted to main thread:
 *   { type: 'TICK', remaining: number, elapsed: number }  — every second
 *   { type: 'COMPLETE' }                                   — countdown reached 0
 */

let duration = 0;          // Total duration in seconds
let elapsed = 0;           // Seconds already counted (survives pause/resume)
let intervalId = null;     // setInterval handle
let tickStartTime = null;  // Date.now() when the current tick session began
let elapsedAtStart = 0;    // frozen elapsed value at the start of tick session

// ---------------------------------------------------------------------------
// Message handler — dispatches commands from the main thread
// ---------------------------------------------------------------------------

self.onmessage = function (e) {
  const { command, duration: dur } = e.data;

  switch (command) {
    case 'START':
      // If a duration is supplied, treat this as a fresh start.
      if (dur !== undefined) {
        duration = dur;
        elapsed = 0;
      }
      startTicking();
      break;

    case 'PAUSE':
      pauseTicking();
      break;

    case 'RESET':
      resetTimer();
      break;

    case 'SET_DURATION':
      if (dur !== undefined) {
        duration = dur;
        elapsed = 0;
        // Stop any running tick so main thread sees consistent state.
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
        tickStartTime = null;
        elapsedAtStart = 0;
      }
      break;

    default:
      // Unknown command — silently ignore
      break;
  }
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Begin (or resume) the 1-second tick loop.
 *
 * Uses wall-clock time (Date.now()) to compute actual elapsed seconds rather
 * than relying on setInterval perfect regularity, so the timer stays accurate
 * even when the tab is backgrounded.
 */
function startTicking() {
  // Clear any previously running interval.
  if (intervalId !== null) {
    clearInterval(intervalId);
  }

  tickStartTime = Date.now();
  elapsedAtStart = elapsed;

  intervalId = setInterval(function () {
    // Seconds truly elapsed since the tick loop started,
    // rounded down so we don't fire early.
    const wallElapsed = Math.floor((Date.now() - tickStartTime) / 1000);
    elapsed = Math.min(elapsedAtStart + wallElapsed, duration);
    const remaining = Math.max(0, duration - elapsed);

    self.postMessage({ type: 'TICK', remaining: remaining, elapsed: elapsed });

    if (remaining <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      self.postMessage({ type: 'COMPLETE' });
    }
  }, 1000);
}

/** Pause the tick loop, preserving current elapsed time. */
function pauseTicking() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Full reset — stop ticking and zero everything. */
function resetTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  elapsed = 0;
  duration = 0;
  tickStartTime = null;
  elapsedAtStart = 0;
}
