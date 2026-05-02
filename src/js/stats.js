/**
 * stats.js — Focus session statistics module
 *
 * Records every completed focus session to LocalStorage and exposes helpers
 * for querying daily, weekly, and all-time stats.
 *
 * LocalStorage schema (key: "pomodoro_stats"):
 *   Array of { date: "YYYY-MM-DD", duration: seconds, taskId: null|string, timestamp: ISO }
 *
 * Exports:
 *   initStats()          — attach event listeners, bootstrap
 *   getStats()           — return all raw session records
 *   getTodayStats()      — { sessions, totalMinutes }
 *   getWeeklyStats()     — [{ date, sessions, minutes }] for last 7 days
 *   getDailyStats(date)  — { date, sessions, totalMinutes, records } for a given date
 *   getHeatmapLevel(minutes) — 0-4 level index for heatmap colouring
 *   renderStats()        — update the DOM (today card + heatmap)
 */

import { TIMER_MODES } from './timer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pomodoro_stats';

/** Minutes thresholds for heatmap colour levels. */
const HEATMAP_THRESHOLDS = [0, 25, 50, 100, 150];

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

/**
 * Read all session records from LocalStorage.
 * @returns {Array<{date: string, duration: number, taskId: string|null, timestamp: string}>}
 */
export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[Stats] Failed to read from LocalStorage:', e);
    return [];
  }
}

/**
 * Persist the full records array back to LocalStorage.
 * @param {Array} records
 */
function saveStats(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('[Stats] Failed to write to LocalStorage:', e);
    showStorageWarning();
  }
}

/**
 * Show a storage warning banner at the top of the statistics section.
 * The banner is dismissible and auto-hides after 3 seconds.
 */
function showStorageWarning() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;

  // Avoid stacking multiple warnings
  const existing = statsSection.querySelector('.storage-warning');
  if (existing) return;

  const warning = document.createElement('div');
  warning.className = 'storage-warning';
  warning.setAttribute('role', 'alert');
  warning.style.cssText =
    'background:#fff3cd;color:#856404;border:1px solid #ffc107;' +
    'border-radius:8px;padding:12px 40px 12px 16px;margin-bottom:12px;' +
    'font-size:14px;line-height:1.5;position:relative;animation:fadeIn 0.3s ease;';
  warning.textContent = '⚠️ 存储空间不足，统计数据可能无法保存。请清理浏览器数据。';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'storage-warning-close';
  closeBtn.setAttribute('aria-label', '关闭警告');
  closeBtn.textContent = '\u00D7';
  closeBtn.style.cssText =
    'position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
    'background:none;border:none;cursor:pointer;font-size:20px;' +
    'color:#856404;line-height:1;padding:4px 8px;border-radius:4px;';
  closeBtn.addEventListener('click', function () {
    warning.remove();
  });
  warning.appendChild(closeBtn);

  // Insert at the top of the stats section (before first child)
  statsSection.insertBefore(warning, statsSection.firstChild);

  // Auto-dismiss after 3 seconds
  setTimeout(function () {
    if (warning.parentNode) {
      warning.remove();
    }
  }, 3000);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date object to "YYYY-MM-DD".
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return the day-of-week label in Chinese.
 * @param {Date} date
 * @returns {string} e.g. "周一"
 */
function weekdayLabel(date) {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return labels[date.getDay()];
}

/**
 * Return a short date label like "04/28".
 * @param {Date} date
 * @returns {string}
 */
function shortDateLabel(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}`;
}

// ---------------------------------------------------------------------------
// Public query API
// ---------------------------------------------------------------------------

/**
 * Get statistics for today.
 * @returns {{ sessions: number, totalMinutes: number }}
 */
export function getTodayStats() {
  const today = formatDate(new Date());
  const stats = getStats();
  const todaySessions = stats.filter(s => s.date === today);
  const totalSeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  return {
    sessions: todaySessions.length,
    totalMinutes: Math.round(totalSeconds / 60),
  };
}

/**
 * Get daily aggregated stats for the last 7 days (including today).
 * Returns data from oldest to newest (index 0 is 6 days ago).
 * @returns {Array<{ date: string, sessions: number, minutes: number }>}
 */
export function getWeeklyStats() {
  const stats = getStats();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const daySessions = stats.filter(s => s.date === dateStr);
    const totalSeconds = daySessions.reduce((sum, s) => sum + s.duration, 0);
    result.push({
      date: dateStr,
      sessions: daySessions.length,
      minutes: Math.round(totalSeconds / 60),
    });
  }
  return result;
}

/**
 * Get detailed stats for a specific date.
 * @param {string} date - "YYYY-MM-DD"
 * @returns {{ date: string, sessions: number, totalMinutes: number, records: Array }}
 */
export function getDailyStats(date) {
  const stats = getStats();
  const daySessions = stats.filter(s => s.date === date);
  const totalSeconds = daySessions.reduce((sum, s) => sum + s.duration, 0);
  return {
    date,
    sessions: daySessions.length,
    totalMinutes: Math.round(totalSeconds / 60),
    records: daySessions,
  };
}

/**
 * Map total minutes to a heatmap colour level (0-4).
 * @param {number} minutes
 * @returns {number} 0 = empty, 4 = deepest colour
 */
export function getHeatmapLevel(minutes) {
  if (minutes <= 0) return 0;
  if (minutes <= 25) return 1;
  if (minutes <= 50) return 2;
  if (minutes <= 100) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Session recording
// ---------------------------------------------------------------------------

/**
 * Record a completed focus session.
 * @param {number} duration - session duration in seconds
 */
function recordSession(duration) {
  const stats = getStats();
  const now = new Date();
  const record = {
    date: formatDate(now),
    duration: duration || TIMER_MODES.FOCUS.duration,
    taskId: null,
    timestamp: now.toISOString(),
  };
  stats.push(record);
  saveStats(stats);
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

/**
 * Update the stats section in the DOM — today's summary card and 7-day heatmap.
 * Safe to call repeatedly; used on initial load and after each session completes.
 */
export function renderStats() {
  renderTodayCard();
  renderHeatmap();
}

/**
 * Render the today summary card: "N 次 · M 分钟"
 */
function renderTodayCard() {
  const el = document.getElementById('todaySummary');
  if (!el) return;

  const { sessions, totalMinutes } = getTodayStats();

  if (sessions === 0) {
    el.textContent = '今天还没有专注记录';
    el.classList.add('stats-empty');
  } else {
    el.textContent = `${sessions} 次 · ${totalMinutes} 分钟`;
    el.classList.remove('stats-empty');
  }
}

/**
 * Render the 7-day heatmap grid inside #heatmap.
 */
function renderHeatmap() {
  const container = document.getElementById('heatmap');
  if (!container) return;

  const weekly = getWeeklyStats(); // [{ date, sessions, minutes }]

  // Build DOM
  container.innerHTML = '';

  weekly.forEach(day => {
    const level = getHeatmapLevel(day.minutes);

    const col = document.createElement('div');
    col.className = 'heatmap-column';

    // Colour block
    const block = document.createElement('div');
    block.className = `heatmap-block heatmap-level-${level}`;
    block.setAttribute('title', `${day.date}\n${day.sessions} 次 · ${day.minutes} 分钟`);
    block.setAttribute('aria-label', `${day.date}: ${day.sessions} 次, ${day.minutes} 分钟`);

    // Date label (weekday + short date)
    const label = document.createElement('span');
    label.className = 'heatmap-label';

    // Parse day.date string to get weekday
    const parts = day.date.split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    label.textContent = shortDateLabel(d);

    // Weekend label
    const weekdayEl = document.createElement('span');
    weekdayEl.className = 'heatmap-weekday';
    weekdayEl.textContent = weekdayLabel(d);

    col.appendChild(block);
    col.appendChild(label);
    col.appendChild(weekdayEl);
    container.appendChild(col);
  });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Attach event listeners so that every completed FOCUS session is recorded
 * and the stats panel is re-rendered.
 */
export function initStats() {
  document.addEventListener('timer:sessionComplete', function (e) {
    const { mode } = e.detail;
    if (mode === 'FOCUS') {
      recordSession(TIMER_MODES.FOCUS.duration);
      renderStats();
    }
  });
}
