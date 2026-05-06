import { t } from './i18n.js';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initPWA(): void {
  window.addEventListener('beforeinstallprompt', function (e: Event) {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    renderInstallButton();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    removeInstallButton();
  });
}

function renderInstallButton(): void {
  const existing = document.getElementById('pwaInstallBtn');
  if (existing) return;

  const footer = document.querySelector('.app-footer');
  if (!footer) return;

  const btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.className = 'btn btn-secondary btn-sm pwa-install-btn';
  btn.textContent = '\u{1F4F1} ' + t('installApp');
  btn.setAttribute('aria-label', t('installAppLabel'));

  btn.addEventListener('click', handleInstallClick);

  footer.insertBefore(btn, footer.firstChild);
}

function removeInstallButton(): void {
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.remove();
}

async function handleInstallClick(): Promise<void> {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;
  console.log('[PWA] Install prompt outcome:', outcome);

  deferredPrompt = null;
  removeInstallButton();
}
