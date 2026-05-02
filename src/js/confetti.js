/**
 * confetti.js — Celebration confetti animation module
 *
 * Listens for the `timer:sessionComplete` custom event fired by the timer
 * module and renders a burst of colourful particles from the centre of the
 * timer ring. Pure CSS/JS — zero external dependencies.
 *
 * Exports:
 *   initConfetti() — attach event listener, ready the confetti container
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of confetti particles to spawn per celebration. */
const PARTICLE_COUNT = 40;

/** Palette of celebration colours. */
const COLORS = [
  '#e74c3c',   // tomato red
  '#f1c40f',   // gold
  '#2ecc71',   // green
  '#3498db',   // blue
  '#e91e63',   // pink
  '#9b59b6',   // purple
  '#1abc9c',   // teal
  '#e67e22',   // orange
];

/** Animation duration range (milliseconds). */
const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 3000;

/** Tracks the active cleanup timer so it can be cancelled before a new burst. */
let cleanupTimer = null;

/** Throw distance range (pixels in each axis). */
const MIN_DISTANCE   = 60;
const MAX_DISTANCE   = 180;

/** Particle size range (pixels). */
const MIN_SIZE = 6;
const MAX_SIZE = 14;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return a random floating-point number between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Pick a random element from an array.
 *
 * @param {Array} arr
 * @returns {*}
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get or create the confetti container element that sits inside the timer
 * section so particles are positioned relative to the timer ring.
 *
 * @returns {HTMLElement}
 */
function getConfettiContainer() {
  let container = document.getElementById('confettiContainer');
  if (container) return container;

  // Find the timer ring wrapper as the natural anchor point
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

/**
 * Create a single confetti particle element with randomised appearance
 * and animation properties.
 *
 * @returns {HTMLElement}
 */
function createParticle() {
  const particle = document.createElement('div');
  particle.className = 'confetti-particle';

  // --- Random appearance ---
  const size      = randomBetween(MIN_SIZE, MAX_SIZE);
  const color     = randomPick(COLORS);
  const duration  = randomBetween(MIN_DURATION_MS, MAX_DURATION_MS) / 1000;  // seconds
  const delay     = randomBetween(0, 300) / 1000;  // seconds
  const rotation  = randomBetween(0, 720);

  // --- Random trajectory ---
  const angle  = randomBetween(0, 360);
  const rad    = (angle * Math.PI) / 180;
  const distX  = randomBetween(MIN_DISTANCE, MAX_DISTANCE) * Math.cos(rad);
  const distY  = randomBetween(MIN_DISTANCE, MAX_DISTANCE) * Math.sin(rad);

  // --- Shape variety — square, rectangle, or circle ---
  const shapes = ['50%', '2px', '0'];
  const borderRadius = randomPick(shapes);

  // --- Apply inline styles ---
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

/**
 * Spawn and animate the full confetti burst.
 * Self-cleaning: particles are removed from the DOM after their
 * animation completes.
 */
function launchConfetti() {
  const container = getConfettiContainer();
  if (!container) return;

  // Clear any particles still present from a previous burst
  const oldParticles = container.querySelectorAll('.confetti-particle');
  oldParticles.forEach(p => p.remove());

  // Cancel any pending cleanup timer from a previous burst
  if (cleanupTimer !== null) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    fragment.appendChild(createParticle());
  }

  container.appendChild(fragment);

  // Schedule cleanup — wait for the longest possible animation to finish
  // plus a small buffer (delay + duration + extra 200 ms)
  const maxLifetime = (MAX_DURATION_MS + 300 + 200);
  cleanupTimer = setTimeout(function () {
    // Remove all particles
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    cleanupTimer = null;
  }, maxLifetime);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attach the confetti listener so that every completed session
 * (focus or break) triggers a celebration burst.
 */
export function initConfetti() {
  document.addEventListener('timer:sessionComplete', function () {
    launchConfetti();
  });

  console.log('[Confetti] Listener attached — ready to celebrate!');
}
