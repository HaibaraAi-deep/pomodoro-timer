/**
 * audio.js — Audio Notification Module
 *
 * Plays a short notification sound when a focus or break session completes.
 * Uses the Web Audio API to synthesize a tone so no external audio files
 * are required.
 *
 * Exports:
 *   initAudio() — register event listener for session completion
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let audioCtx = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initAudio() {
  document.addEventListener('timer:sessionComplete', function (e) {
    const { mode } = e.detail;
    playNotificationSound(mode);
  });
}

// ---------------------------------------------------------------------------
// Audio synthesis
// ---------------------------------------------------------------------------

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('[Audio] Web Audio API not supported');
      return null;
    }
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

function playNotificationSound(mode) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const isFocus = mode === 'FOCUS';

  const frequencies = isFocus
    ? [523.25, 659.25, 783.99]
    : [783.99, 659.25, 523.25];

  const duration = isFocus ? 0.15 : 0.2;
  const gap = isFocus ? 0.12 : 0.18;

  frequencies.forEach(function (freq, i) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    const startTime = ctx.currentTime + i * (duration + gap);
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  });
}
