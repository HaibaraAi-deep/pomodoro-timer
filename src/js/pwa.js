/**
 * pwa.js — PWA Install Prompt & Lifecycle Module
 * Pomodoro Timer + Task Tracker
 *
 * Handles the `beforeinstallprompt` event, manages a deferred install prompt,
 * and shows a bottom-bar invitation after the first focus session completes
 * or after a 3-second delay.
 *
 * Exports:
 *   initPWA() — attach all PWA listeners and wire the install prompt UI
 */

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {BeforeInstallPromptEvent|null} */
let deferredPrompt = null;

/** Whether the user has permanently dismissed the install prompt. */
let installPromptDismissed = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize PWA features. Safe to call multiple times — subsequent calls are no-ops.
 */
export function initPWA() {
  // Guard against double-initialization
  if (initPWA._initialised) return;
  initPWA._initialised = true;

  console.log('[PWA] Initialising...');

  // --- Before Install Prompt ---
  window.addEventListener('beforeinstallprompt', function (e) {
    // Prevent the default mini-infobar from appearing
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt captured (available for deferred install)');

    // Show the prompt after a short delay if not already dismissed
    if (!installPromptDismissed) {
      setTimeout(function () {
        showInstallPrompt();
      }, 3000);
    }
  });

  // --- App Installed ---
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideInstallPrompt();
    console.log('[PWA] App was installed successfully.');
  });

  // --- Trigger install prompt after first focus session completed ---
  document.addEventListener('timer:sessionComplete', function (e) {
    if (e.detail && e.detail.mode === 'FOCUS' && e.detail.sessionCount === 1) {
      // User has completed their first focus session — a good moment to invite install
      if (deferredPrompt && !installPromptDismissed) {
        console.log('[PWA] First focus session completed — showing install prompt');
        showInstallPrompt();
      }
    }
  });

  // --- Wire install prompt UI buttons ---
  wireInstallPrompt();

  console.log('[PWA] Initialised.');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Show the install prompt bar at the bottom of the screen.
 */
function showInstallPrompt() {
  var container = document.getElementById('installPrompt');
  if (container) {
    container.classList.add('visible');
    console.log('[PWA] Install prompt shown');
  }
}

/**
 * Hide the install prompt bar.
 */
function hideInstallPrompt() {
  var container = document.getElementById('installPrompt');
  if (container) {
    container.classList.remove('visible');
  }
}

/**
 * Attach event listeners to the install and dismiss buttons inside the prompt.
 * Uses event delegation on the prompt container.
 */
function wireInstallPrompt() {
  var container = document.getElementById('installPrompt');
  if (!container) return;

  container.addEventListener('click', function (e) {
    // Distinguish between install and dismiss clicks
    var installBtn = e.target.closest('#installBtn');
    var dismissBtn = e.target.closest('#installDismissBtn');

    // --- Install button ---
    if (installBtn && deferredPrompt) {
      // Show the native install dialog
      deferredPrompt.prompt().then(function () {
        return deferredPrompt.userChoice;
      }).then(function (choiceResult) {
        console.log('[PWA] User install choice:', choiceResult.outcome);
        deferredPrompt = null;
        hideInstallPrompt();
      }).catch(function (err) {
        console.error('[PWA] Install prompt error:', err);
      });
      return;
    }

    // --- Dismiss button ---
    if (dismissBtn) {
      installPromptDismissed = true;
      hideInstallPrompt();
      console.log('[PWA] Install prompt dismissed by user');
      return;
    }
  });
}
