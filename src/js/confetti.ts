import { TIMER_SESSION_COMPLETE, on } from './events.js';

const PARTICLE_COUNT = 40;

const COLORS = [
  '#e74c3c',
  '#f1c40f',
  '#2ecc71',
  '#3498db',
  '#e91e63',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
];

const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 3000;

let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

const MIN_DISTANCE = 60;
const MAX_DISTANCE = 180;

const MIN_SIZE = 6;
const MAX_SIZE = 14;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getConfettiContainer(): HTMLElement | null {
  let container = document.getElementById('confettiContainer');
  if (container) return container;

  const ringWrapper = document.querySelector('.timer-ring-wrapper');
  if (!ringWrapper) {
    console.warn('[Confetti] .timer-ring-wrapper not found in DOM.');
    return null;
  }

  container = document.createElement('div');
  container.id = 'confettiContainer';
  container.className = 'confetti-container';
  container.setAttribute('aria-hidden', 'true');
  ringWrapper.appendChild(container);

  return container;
}

function createParticle(): HTMLDivElement {
  const particle = document.createElement('div');
  particle.className = 'confetti-particle';

  const size = randomBetween(MIN_SIZE, MAX_SIZE);
  const color = randomPick(COLORS);
  const duration = randomBetween(MIN_DURATION_MS, MAX_DURATION_MS) / 1000;
  const delay = randomBetween(0, 300) / 1000;
  const rotation = randomBetween(0, 720);

  const angle = randomBetween(0, 360);
  const rad = (angle * Math.PI) / 180;
  const distX = randomBetween(MIN_DISTANCE, MAX_DISTANCE) * Math.cos(rad);
  const distY = randomBetween(MIN_DISTANCE, MAX_DISTANCE) * Math.sin(rad);

  const shapes: string[] = ['50%', '2px', '0'];
  const borderRadius = randomPick(shapes);

  particle.style.cssText = [
    `width: ${size}px`,
    `height: ${size}px`,
    `background-color: ${color}`,
    `border-radius: ${borderRadius}`,
    `animation-duration: ${duration}s`,
    `animation-delay: ${delay}s`,
    `--confetti-end-x: ${distX}px`,
    `--confetti-end-y: ${distY}px`,
    `--confetti-rotation: ${rotation}deg`,
  ].join(';');

  return particle;
}

function launchConfetti(): void {
  const container = getConfettiContainer();
  if (!container) return;

  const oldParticles = container.querySelectorAll('.confetti-particle');
  oldParticles.forEach(p => p.remove());

  if (cleanupTimer !== null) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    fragment.appendChild(createParticle());
  }

  container.appendChild(fragment);

  const maxLifetime = (MAX_DURATION_MS + 300 + 200);
  cleanupTimer = setTimeout(function () {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    cleanupTimer = null;
  }, maxLifetime);
}

export function initConfetti(): void {
  on(TIMER_SESSION_COMPLETE, function () {
    launchConfetti();
  });

  console.log('[Confetti] Listener attached — ready to celebrate!');
}
