/**
 * pwa.js — Progressive Web App Module
 *
 * Handles the "Add to Home Screen" install prompt and provides
 * a user-friendly UI for the install experience.
 *
 * Exports:
 *   initPWA() — register beforeinstallprompt listener and render install UI
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let deferredPrompt = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initPWA() {
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    renderInstallButton();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    removeInstallButton();
  });
}

// ---------------------------------------------------------------------------
// Install UI
// ---------------------------------------------------------------------------

function renderInstallButton() {
  const existing = document.getElementById('pwaInstallBtn');
  if (existing) return;

  const footer = document.querySelector('.app-footer');
  if (!footer) return;

  const btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.className = 'btn btn-secondary btn-sm pwa-install-btn';
  btn.textContent = '\u{1F4F1} 安装应用';
  btn.setAttribute('aria-label', '安装应用到桌面');

  btn.addEventListener('click', handleInstallClick);

  footer.insertBefore(btn, footer.firstChild);
}

function removeInstallButton() {
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.remove();
}

async function handleInstallClick() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;
  console.log('[PWA] Install prompt outcome:', outcome);

  deferredPrompt = null;
  removeInstallButton();
}
