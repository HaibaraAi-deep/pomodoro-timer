import { t } from './i18n.js';
import { SETTINGS_DATA_CHANGED, fire } from './events.js';

const SETTINGS_CONTAINER_ID = 'settingsContainer';
const EXPORT_BUTTON_ID = 'exportBtn';
const IMPORT_BUTTON_ID = 'importBtn';
const CLEAR_ALL_BUTTON_ID = 'clearAllBtn';

function buildSettingsHTML() {
  return `
  <div id="${SETTINGS_CONTAINER_ID}" class="settings-container hidden">
    <div class="settings-header">
      <h2 class="settings-title">${t('dataManagement')}</h2>
      <button class="settings-close-btn" id="settingsCloseBtn" aria-label="${t('closeSettings')}">&times;</button>
    </div>
    <div class="settings-content">
      <div class="settings-section">
        <h3 class="settings-section-title">${t('exportTitle')}</h3>
        <p class="settings-section-desc">${t('exportDesc')}</p>
        <div class="settings-actions">
          <button class="btn btn-secondary" id="${EXPORT_BUTTON_ID}">
            <span class="btn-icon" aria-hidden="true">⬇</span> ${t('exportBtn')}
          </button>
          <div class="settings-data-type-labels">
            <span class="data-type-label">${t('containsData')}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">${t('importTitle')}</h3>
        <p class="settings-section-desc">${t('importDesc')}</p>
        <div class="settings-actions">
          <button class="btn btn-secondary" id="${IMPORT_BUTTON_ID}">
            <span class="btn-icon" aria-hidden="true">⬆</span> ${t('importBtn')}
          </button>
          <input type="file" id="importFileInput" accept=".json" style="display:none">
          <div class="settings-data-type-labels">
            <span class="data-type-label">${t('importSupported')}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">${t('clearTitle')}</h3>
        <p class="settings-section-desc">${t('clearDesc')}</p>
        <div class="settings-actions settings-actions-danger">
          <button class="btn btn-danger" id="${CLEAR_ALL_BUTTON_ID}">
            <span class="btn-icon" aria-hidden="true">🗑</span> ${t('clearBtn')}
          </button>
        </div>
        <div class="settings-data-type-labels">
          <span class="data-type-label">${t('clearWillRemove')}</span>
        </div>
      </div>

      <div class="settings-footer">
        <button class="btn btn-secondary btn-sm" id="settingsCloseBtn2">${t('close')}</button>
      </div>
    </div>
  </div>
`;
}

function getFocusableElements(container) {
  const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selectors));
}

function trapFocus(container, event) {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}

function showModal(title, message, onConfirm) {
  const existing = document.getElementById('appModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'appModal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modalTitle');

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';

  const titleEl = document.createElement('h3');
  titleEl.id = 'modalTitle';
  titleEl.className = 'modal-title';
  titleEl.textContent = title;

  const messageEl = document.createElement('p');
  messageEl.className = 'modal-message';
  messageEl.textContent = message;

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary btn-sm';
  cancelBtn.textContent = t('cancel');
  cancelBtn.addEventListener('click', function () {
    cleanup();
    overlay.remove();
  });

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger btn-sm';
  confirmBtn.textContent = t('confirm');
  confirmBtn.addEventListener('click', function () {
    cleanup();
    overlay.remove();
    if (onConfirm) onConfirm();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);

  dialog.appendChild(titleEl);
  dialog.appendChild(messageEl);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  confirmBtn.focus();

  function keyHandler(e) {
    if (e.key === 'Escape') {
      cleanup();
      overlay.remove();
    } else if (e.key === 'Tab') {
      trapFocus(dialog, e);
    }
  }

  function cleanup() {
    document.removeEventListener('keydown', keyHandler);
  }

  document.addEventListener('keydown', keyHandler);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      cleanup();
      overlay.remove();
    }
  });
}

function showToast(message) {
  const existing = document.getElementById('appToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'appToast';
  toast.className = 'toast-notification';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add('visible');
  });

  setTimeout(function () {
    toast.classList.remove('visible');
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 3000);
}

export function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: getTasks(),
    stats: getStats(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `pomodoro_backup_${timestamp}.json`;

  downloadFile(url, filename);
  console.log('[Settings] Data exported:', filename);
}

function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function importData() {
  const fileInput = document.getElementById('importFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

function isValidTask(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.completed === 'boolean' &&
    typeof item.pomodoros === 'number'
  );
}

function isValidStat(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.duration === 'number' &&
    item.duration >= 0 &&
    typeof item.timestamp === 'string'
  );
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 1048576) {
    showToast(t('importFailTooLarge'));
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      if (typeof data !== 'object' || data === null) {
        showToast(t('importFailFormat'));
        return;
      }

      let hasValidData = false;

      if (data.tasks && Array.isArray(data.tasks)) {
        const validTasks = data.tasks.filter(isValidTask);
        if (validTasks.length > 0) {
          localStorage.setItem('pomodoro_tasks', JSON.stringify(validTasks));
          hasValidData = true;
        }
      }

      if (data.stats && Array.isArray(data.stats)) {
        const validStats = data.stats.filter(isValidStat);
        if (validStats.length > 0) {
          localStorage.setItem('pomodoro_stats', JSON.stringify(validStats));
          hasValidData = true;
        }
      }

      if (!hasValidData) {
        showToast(t('importFailInvalidData'));
        return;
      }

      showToast(t('importSuccess'));

      fire(SETTINGS_DATA_CHANGED);
    } catch (err) {
      console.error('[Settings] Import failed:', err);
      showToast(t('importFailParse'));
    }
  };

  reader.onerror = function () {
    console.error('[Settings] File read error');
    showToast(t('importFailParse'));
  };

  reader.readAsText(file);
  e.target.value = '';
}

export function clearAllData() {
  showModal(t('clearTitle'), t('clearConfirm'), function () {
    try {
      localStorage.removeItem('pomodoro_tasks');
      localStorage.removeItem('pomodoro_stats');
      localStorage.removeItem('pomodoro_theme');
      localStorage.removeItem('pomodoro_pomo_counter');
      console.log('[Settings] All data cleared');
      showToast(t('clearSuccess'));
      fire(SETTINGS_DATA_CHANGED);
    } catch (e) {
      console.error('[Settings] Failed to clear data:', e);
      showToast(t('clearFail'));
    }
  });
}

function renderSettingsContainer() {
  const existingTrigger = document.getElementById(SETTINGS_CONTAINER_ID);
  if (existingTrigger) return;

  const footer = document.querySelector('.app-footer');
  if (!footer) return;

  const container = document.createElement('div');
  container.innerHTML = buildSettingsHTML();
  const content = container.firstElementChild;
  footer.parentNode.insertBefore(content, footer);
}

function wireSettingsUI() {
  const container = document.getElementById(SETTINGS_CONTAINER_ID);
  if (!container) return;

  const exportBtn = document.getElementById(EXPORT_BUTTON_ID);
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  const importBtn = document.getElementById(IMPORT_BUTTON_ID);
  if (importBtn) {
    importBtn.addEventListener('click', importData);
  }

  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', handleImportFile);
  }

  const clearAllBtn = document.getElementById(CLEAR_ALL_BUTTON_ID);
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllData);
  }

  const closeButtons = container.querySelectorAll('[id$="CloseBtn"]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      container.classList.add('hidden');
    });
  });
}

export function toggleSettings() {
  const container = document.getElementById(SETTINGS_CONTAINER_ID);
  if (!container) return;

  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

export function initSettings() {
  if (initSettings._initialised) return;
  initSettings._initialised = true;

  renderSettingsContainer();
  wireSettingsUI();

  console.log('[Settings] Initialised');
}
