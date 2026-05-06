import { TIMER_SESSION_COMPLETE, on } from './events.js';

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  on(TIMER_SESSION_COMPLETE, function (e: Event) {
    const detail = (e as CustomEvent).detail;
    const { mode } = detail;
    playNotificationSound(mode);
  });
}

function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    const AudioContextCtor = window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext;
    if (!AudioContextCtor) {
      console.warn('[Audio] Web Audio API not supported');
      return null;
    }
    audioCtx = new AudioContextCtor();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

function playNotificationSound(mode: string): void {
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
