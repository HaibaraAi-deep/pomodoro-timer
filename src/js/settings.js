/**
 * settings.js — Settings Module for Data Export and Clear
 *
 * Provides utilities for exporting tasks and stats data to JSON files
 * and clearing all stored data. Exports are downloaded to the user's
 * device for backup or migration purposes.
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
 *   exportTasks()           — export only tasks
 *   exportStats()           — export only stats
 *   clearAllData()          — clear all stored data
 *   clearTasks()            — clear only tasks
 *   clearStats()            — clear only stats
 *   clearTheme()            — clear only theme preference
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SETTINGS_CONTAINER_ID = 'settingsContainer';
const EXPORT_BUTTON_ID = 'exportBtn';
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

  <!-- Settings trigger button -->
  <button id="settingsTriggerBtn" class="settings-trigger-btn" aria-label="打开数据管理" title="数据管理">
    <span class="settings-trigger-icon" aria-hidden="true">⚙</span>
  </button>
`;

// ---------------------------------------------------------------------------
// Data Export
// ---------------------------------------------------------------------------

/**
 * Export all data to a JSON file.
 * Downloads a file named "pomodoro_backup_[timestamp].json"
 */
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

/**
 * Export only tasks to a JSON file.
 */
export function exportTasks() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: getTasks(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `pomodoro_tasks_${timestamp}.json`;

  downloadFile(url, filename);
  console.log('[Settings] Tasks exported:', filename);
}

/**
 * Export only stats to a JSON file.
 */
export function exportStats() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stats: getStats(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `pomodoro_stats_${timestamp}.json`;

  downloadFile(url, filename);
  console.log('[Settings] Stats exported:', filename);
}

/**
 * Download a file from a Blob URL.
 *
 * @param {string} url - Blob URL
 * @param {string} filename - Desired filename
 */
function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ---------------------------------------------------------------------------
// Data Clear
// ---------------------------------------------------------------------------

/**
 * Clear all stored data from LocalStorage.
 * This is a destructive operation - all data will be lost.
 */
export function clearAllData() {
  if (!confirm('确定要清除所有数据吗？\n\n此操作不可撤销。')) {
    return;
  }

  try {
    localStorage.removeItem('pomodoro_tasks');
    localStorage.removeItem('pomodoro_stats');
    localStorage.removeItem('pomodoro_theme');
    localStorage.removeItem('pomodoro_pomo_counter');
    console.log('[Settings] All data cleared');
    alert('所有数据已清除');
  } catch (e) {
    console.error('[Settings] Failed to clear data:', e);
    alert('清除数据失败，请检查浏览器设置');
  }
}

/**
 * Clear only tasks data.
 */
export function clearTasks() {
  if (!confirm('确定要清除所有任务吗？\n\n此操作不可撤销。')) {
    return;
  }

  try {
    localStorage.removeItem('pomodoro_tasks');
    console.log('[Settings] Tasks cleared');
  } catch (e) {
    console.error('[Settings] Failed to clear tasks:', e);
  }
}

/**
 * Clear only stats data.
 */
export function clearStats() {
  if (!confirm('确定要清除所有统计数据吗？\n\n此操作不可撤销。')) {
    return;
  }

  try {
    localStorage.removeItem('pomodoro_stats');
    console.log('[Settings] Stats cleared');
  } catch (e) {
    console.error('[Settings] Failed to clear stats:', e);
  }
}

/**
 * Clear only theme preference.
 */
export function clearTheme() {
  try {
    localStorage.removeItem('pomodoro_theme');
    console.log('[Settings] Theme preference cleared');
  } catch (e) {
    console.error('[Settings] Failed to clear theme:', e);
  }
}

// ---------------------------------------------------------------------------
// DOM Rendering
// ---------------------------------------------------------------------------

/**
 * Render the settings container in the footer area.
 */
function renderSettingsContainer() {
  // Remove existing trigger button if any
  const existingTrigger = document.getElementById(SETTINGS_CONTAINER_ID);
  if (existingTrigger) return;

  // Get footer
  const footer = document.querySelector('.app-footer');
  if (!footer) return;

  // Insert before footer
  const container = document.createElement('div');
  container.innerHTML = SETTINGS_HTML;
  const content = container.firstElementChild;
  footer.parentNode.insertBefore(content, footer);
}

/**
 * Attach event listeners for the settings UI.
 */
function wireSettingsUI() {
  const container = document.getElementById(SETTINGS_CONTAINER_ID);
  if (!container) return;

  // Export button
  const exportBtn = document.getElementById(EXPORT_BUTTON_ID);
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  // Clear all button
  const clearAllBtn = document.getElementById(CLEAR_ALL_BUTTON_ID);
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllData);
  }

  // Close buttons (two close buttons for accessibility)
  const closeButtons = container.querySelectorAll('[id$="CloseBtn"]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      container.classList.add('hidden');
    });
  });
}

/**
 * Toggle the settings container visibility.
 */
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

/**
 * Initialize the settings module.
 * Creates the settings UI and wires up event listeners.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initSettings() {
  // Guard against double-initialization
  if (initSettings._initialised) return;
  initSettings._initialised = true;

  renderSettingsContainer();
  wireSettingsUI();

  console.log('[Settings] Initialised');
}
