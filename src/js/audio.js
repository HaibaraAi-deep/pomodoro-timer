/**
 * audio.js — Session-end notification sound module
 *
 * Self-contained module that plays programmatically generated sound effects
 * when a timer session completes. Uses Web Audio API (AudioContext + OscillatorNode)
 * with zero external dependencies — works offline for PWA.
 *
 * Exports:
 *   initAudio() — bind event listeners and set up AudioContext unlocking
 *
 * Listens to:
 *   timer:sessionComplete (on document) — plays appropriate sound
 */

// ---------------------------------------------------------------------------
// Single shared AudioContext (lazily created)
// ---------------------------------------------------------------------------

/** @type {AudioContext|null} */
let audioCtx = null;

/**
 * Get or create the shared AudioContext.
 * Handles browser autoplay restrictions by attempting resume() if suspended.
 *
 * @returns {AudioContext|null} — null if Web Audio API is not available
 */
function getAudioContext() {
  if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
    console.warn('[Audio] Web Audio API not available in this browser.');
    return null;
  }

  if (!audioCtx) {
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctor();
    } catch (err) {
      console.error('[Audio] Failed to create AudioContext:', err);
      return null;
    }
  }

  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(function (err) {
      console.warn('[Audio] AudioContext resume failed:', err);
    });
  }

  return audioCtx;
}

// ---------------------------------------------------------------------------
// Beep — single tone
// ---------------------------------------------------------------------------

/**
 * Play a single beep (oscillator tone) with a smooth gain envelope to prevent
 * audio pops/clicks.
 *
 * @param {number} freq     — frequency in Hz
 * @param {number} duration — tone duration in milliseconds
 * @param {OscillatorType} type — waveform type ('sine', 'triangle', 'square', etc.)
 * @param {number} [delay=0] — delay before sounding, in milliseconds
 */
function beep(freq, duration, type, delay) {
  if (delay === undefined) delay = 0;

  var ctx = getAudioContext();
  if (!ctx) return;

  var now = ctx.currentTime;
  var startTime = now + delay / 1000;
  var durationSec = duration / 1000;

  try {
    // Gain node for volume control with a smooth ADSR-like envelope
    var gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Quick attack ramp-up (linear) — prevents click at note-on
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.005);

    // Sustain until near the end
    gain.gain.setValueAtTime(0.3, startTime + durationSec - 0.01);

    // Exponential ramp-down to silence — prevents click at note-off
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec + 0.04);

    // Oscillator
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(gain);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.05);

    // Clean up graph references after the oscillator stops
    osc.onended = function () {
      osc.disconnect();
      gain.disconnect();
    };
  } catch (err) {
    console.warn('[Audio] beep failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Sound effect compositions
// ---------------------------------------------------------------------------

/**
 * Play the FOCUS completion sound — rising double-tone.
 *
 *   Tone 1: 660 Hz, 150 ms (sine)
 *   Gap:    150 ms
 *   Tone 2: 880 Hz, 200 ms (sine)
 */
function playFocusEnd() {
  beep(660, 150, 'sine', 0);               // 0 ms
  beep(880, 200, 'sine', 150 + 150);       // 300 ms — rising second tone
}

/**
 * Play the BREAK completion sound — soft triple-tone.
 *
 *   Three tones at 523 Hz, 120 ms each (triangle), 150 ms gap between.
 *   Total duration: ~660 ms from first note-on to last note-off.
 */
function playBreakEnd() {
  beep(523, 120, 'triangle', 0);                   // 0 ms
  beep(523, 120, 'triangle', 120 + 150);            // 270 ms
  beep(523, 120, 'triangle', 2 * (120 + 150));      // 540 ms
}

// ---------------------------------------------------------------------------
// AudioContext autoplay unlocking
// ---------------------------------------------------------------------------

/**
 * Attempt to unlock the AudioContext by resuming it.
 * Browsers require a user gesture before allowing audio playback.
 * Bound once to click/touchstart and self-removes on success.
 */
function unlockAudioContext() {
  var ctx = getAudioContext();
  if (!ctx) return;

  // Already running — nothing to unlock, remove listeners
  if (ctx.state === 'running') {
    removeUnlockListeners();
    return;
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(function () {
      console.log('[Audio] AudioContext unlocked by user gesture.');
      removeUnlockListeners();
    }).catch(function (err) {
      console.warn('[Audio] AudioContext unlock failed:', err);
    });
  }
}

/**
 * Remove the one-time unlock listeners.
 */
function removeUnlockListeners() {
  document.removeEventListener('click',     unlockAudioContext);
  document.removeEventListener('touchstart', unlockAudioContext);
}

// ---------------------------------------------------------------------------
// Event handler
// ---------------------------------------------------------------------------

/**
 * Handle the timer:sessionComplete custom event and play the appropriate sound.
 *
 * @param {CustomEvent} e — detail: { mode, sessionCount }
 */
function handleSessionComplete(e) {
  try {
    var mode = e.detail && e.detail.mode;

    switch (mode) {
      case 'FOCUS':
        playFocusEnd();
        break;
      case 'SHORT_BREAK':
      case 'LONG_BREAK':
        playBreakEnd();
        break;
      default:
        break;
    }
  } catch (err) {
    console.warn('[Audio] handleSessionComplete error:', err);
  }
}

// ---------------------------------------------------------------------------
// Initialization (public API)
// ---------------------------------------------------------------------------

/**
 * Initialize the audio notification module.
 * Call once during app startup (e.g., from app.js).
 *
 * - Binds to the timer:sessionComplete custom event on document
 * - Sets up one-time click/touch listeners to unlock the AudioContext
 *   for browsers with autoplay restrictions
 */
export function initAudio() {
  // Listen for session completion events
  document.addEventListener('timer:sessionComplete', handleSessionComplete);

  // Unlock AudioContext on first user interaction (autoplay policy)
  document.addEventListener('click',     unlockAudioContext);
  document.addEventListener('touchstart', unlockAudioContext);

  console.log('[Audio] Notification sounds initialized.');
}
