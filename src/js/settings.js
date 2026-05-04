/**
 * settings.js — Settings Module for Data Export, Import and Clear
 *
 * Provides utilities for exporting/importing tasks and stats data to/from JSON
 * files and clearing all stored data. Uses custom modal dialogs instead of
 * native confirm/alert.
 *
 * LocalStorage keys managed:
 *   - pomodoro_tasks
 *   - pomodoro_stats
 *   - pomodoro_theme
 *   - pomodoro_pomo_counter
 *
 * Exports:
 *   initSettings()          — attach event listeners, create settings UI if not exists
 *   exportData()            — trigger data export to JSON file
 *   clearAllData()          — clear all stored data
 *   toggleSettings()        — toggle settings panel visibility
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SETTINGS_CONTAINER_ID = 'settingsContainer';
const EXPORT_BUTTON_ID = 'exportBtn';
const IMPORT_BUTTON_ID = 'importBtn';
const CLEAR_ALL_BUTTON_ID = 'clearAllBtn';

// ---------------------------------------------------------------------------
// Settings UI HTML (inline)
// ---------------------------------------------------------------------------

const SETTINGS_HTML = `
  <div id="${SETTINGS_CONTAINER_ID}" class="settings-container hidden">
    <div class="settings-header">
      <h2 class="settings-title">数据管理</h2>
      <button class="settings-close-btn" id="settingsCloseBtn" aria-label="关闭设置">&times;</button>
    </div>
    <div class="settings-content">
      <div class="settings-section">
        <h3 class="settings-section-title">数据导出</h3>
        <p class="settings-section-desc">将您的数据下载为 JSON 文件，用于备份或迁移。</p>
        <div class="settings-actions">
          <button class="btn btn-secondary" id="${EXPORT_BUTTON_ID}">
            <span class="btn-icon" aria-hidden="true">⬇</span> 导出全部数据
          </button>
          <div class="settings-data-type-labels">
            <span class="data-type-label">包含: 任务 + 统计</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">数据导入</h3>
        <p class="settings-section-desc">从备份文件恢复数据。导入将覆盖当前数据。</p>
        <div class="settings-actions">
          <button class="btn btn-secondary" id="${IMPORT_BUTTON_ID}">
            <span class="btn-icon" aria-hidden="true">⬆</span> 导入数据
          </button>
          <input type="file" id="importFileInput" accept=".json" style="display:none">
          <div class="settings-data-type-labels">
            <span class="data-type-label">支持: JSON 备份文件</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">清除数据</h3>
        <p class="settings-section-desc">删除本地存储的所有数据。此操作不可撤销，请谨慎操作。</p>
        <div class="settings-actions settings-actions-danger">
          <button class="btn btn-danger" id="${CLEAR_ALL_BUTTON_ID}">
            <span class="btn-icon" aria-hidden="true">🗑</span> 清除全部数据
          </button>
        </div>
        <div class="settings-data-type-labels">
          <span class="data-type-label">将清除: 任务、统计、主题偏好</span>
        </div>
      </div>

      <div class="settings-footer">
        <button class="btn btn-secondary btn-sm" id="settingsCloseBtn2">关闭</button>
      </div>
    </div>
  </div>
`;

// ---------------------------------------------------------------------------
// Custom Modal Dialog
// ---------------------------------------------------------------------------

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
  cancelBtn.textContent = '取消';
  cancelBtn.addEventListener('click', function () {
    overlay.remove();
  });

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger btn-sm';
  confirmBtn.textContent = '确认';
  confirmBtn.addEventListener('click', function () {
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

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.remove();
  });

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handler);
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

// ---------------------------------------------------------------------------
// Data Export
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Data Import
// ---------------------------------------------------------------------------

function importData() {
  const fileInput = document.getElementById('importFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      if (typeof data !== 'object' || data === null) {
        showToast('导入失败：文件格式不正确');
        return;
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        localStorage.setItem('pomodoro_tasks', JSON.stringify(data.tasks));
      }

      if (data.stats && Array.isArray(data.stats)) {
        localStorage.setItem('pomodoro_stats', JSON.stringify(data.stats));
      }

      showToast('数据导入成功');

      document.dispatchEvent(new CustomEvent('settings:dataChanged'));
    } catch (err) {
      console.error('[Settings] Import failed:', err);
      showToast('导入失败：无法解析文件');
    }
  };

  reader.readAsText(file);
  e.target.value = '';
}

// ---------------------------------------------------------------------------
// Data Clear
// ---------------------------------------------------------------------------

export function clearAllData() {
  showModal('清除数据', '确定要清除所有数据吗？此操作不可撤销。', function () {
    try {
      localStorage.removeItem('pomodoro_tasks');
      localStorage.removeItem('pomodoro_stats');
      localStorage.removeItem('pomodoro_theme');
      localStorage.removeItem('pomodoro_pomo_counter');
      console.log('[Settings] All data cleared');
      showToast('所有数据已清除');
      document.dispatchEvent(new CustomEvent('settings:dataChanged'));
    } catch (e) {
      console.error('[Settings] Failed to clear data:', e);
      showToast('清除数据失败，请检查浏览器设置');
    }
  });
}

// ---------------------------------------------------------------------------
// DOM Rendering
// ---------------------------------------------------------------------------

function renderSettingsContainer() {
  const existingTrigger = document.getElementById(SETTINGS_CONTAINER_ID);
  if (existingTrigger) return;

  const footer = document.querySelector('.app-footer');
  if (!footer) return;

  const container = document.createElement('div');
  container.innerHTML = SETTINGS_HTML;
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

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export function initSettings() {
  if (initSettings._initialised) return;
  initSettings._initialised = true;

  renderSettingsContainer();
  wireSettingsUI();

  console.log('[Settings] Initialised');
}
