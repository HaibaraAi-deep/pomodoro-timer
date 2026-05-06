import { TIMER_MODES } from './timer.js';
import { t, tf, getWeekdays } from './i18n.js';
import { TIMER_SESSION_COMPLETE, SETTINGS_DATA_CHANGED, fire, on } from './events.js';

export interface StatsRecord {
  date: string;
  duration: number;
  taskId: string | null;
  timestamp: string;
}

export interface TodayStats {
  sessions: number;
  totalMinutes: number;
}

export interface WeeklyDayStats {
  date: string;
  sessions: number;
  minutes: number;
}

export interface DailyStats {
  date: string;
  sessions: number;
  totalMinutes: number;
  records: StatsRecord[];
}

const STORAGE_KEY = 'pomodoro_stats';

const HEATMAP_THRESHOLDS = [0, 25, 50, 100, 150];

let statsCache: StatsRecord[] | null = null;
let statsCacheDirty: boolean = true;

export function invalidateStatsCache(): void {
  statsCacheDirty = true;
  statsCache = null;
}

function readRawStats(): StatsRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[Stats] LocalStorage data is not an array, clearing corrupted data');
      return [];
    }
    const validRecords: StatsRecord[] = [];
    parsed.forEach((record: any, index: number) => {
      if (typeof record !== 'object' || record === null) {
        console.warn(`[Stats] Invalid record at index ${index}, skipping`);
        return;
      }
      if (typeof record.date !== 'string') {
        console.warn(`[Stats] Record at index ${index} has invalid date, skipping`);
        return;
      }
      if (typeof record.duration !== 'number') {
        console.warn(`[Stats] Record at index ${index} has invalid duration, defaulting to 0`);
        record.duration = 0;
      }
      if (record.duration < 0) {
        console.warn(`[Stats] Record at index ${index} has negative duration, clamping to 0`);
        record.duration = 0;
      }
      if (typeof record.taskId !== 'string' && record.taskId !== null) {
        console.warn(`[Stats] Record at index ${index} has invalid taskId, defaulting to null`);
        record.taskId = null;
      }
      if (typeof record.timestamp !== 'string') {
        console.warn(`[Stats] Record at index ${index} has invalid timestamp, skipping`);
        return;
      }
      if (!record.timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        console.warn(`[Stats] Record at index ${index} has invalid timestamp format, skipping`);
        return;
      }
      validRecords.push(record);
    });
    return validRecords;
  } catch (e) {
    console.warn('[Stats] Failed to read from LocalStorage:', e);
    return [];
  }
}

export function getStats(): StatsRecord[] {
  if (!statsCacheDirty && statsCache !== null) {
    return statsCache;
  }

  const validRecords = readRawStats();

  const maxAgeDays = 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  const cutoffDateString = cutoffDate.toISOString().split('T')[0];

  const filteredRecords = validRecords.filter(record => record.date >= cutoffDateString);

  if (filteredRecords.length !== validRecords.length) {
    saveStats(filteredRecords);
  }

  statsCache = filteredRecords;
  statsCacheDirty = false;
  return filteredRecords;
}

function saveStats(records: StatsRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('[Stats] Failed to write to LocalStorage:', e);
    showStorageWarning();
  }
}

function showStorageWarning(): void {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;

  const existing = statsSection.querySelector('.storage-warning');
  if (existing) return;

  const warning = document.createElement('div');
  warning.className = 'storage-warning';
  warning.setAttribute('role', 'alert');
  warning.style.cssText =
    'background:#fff3cd;color:#856404;border:1px solid #ffc107;' +
    'border-radius:8px;padding:12px 40px 12px 16px;margin-bottom:12px;' +
    'font-size:14px;line-height:1.5;position:relative;animation:fadeIn 0.3s ease;';
  warning.textContent = t('storageWarningStats');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'storage-warning-close';
  closeBtn.setAttribute('aria-label', t('storageWarningClose'));
  closeBtn.textContent = '\u00D7';
  closeBtn.style.cssText =
    'position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
    'background:none;border:none;cursor:pointer;font-size:20px;' +
    'color:#856404;line-height:1;padding:4px 8px;border-radius:4px;';
  closeBtn.addEventListener('click', function () {
    warning.remove();
  });
  warning.appendChild(closeBtn);

  statsSection.insertBefore(warning, statsSection.firstChild);

  setTimeout(function () {
    if (warning.parentNode) {
      warning.remove();
    }
  }, 3000);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function weekdayLabel(date: Date): string {
  const labels = getWeekdays();
  return labels[date.getDay()];
}

function shortDateLabel(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}`;
}

export function getTodayStats(): TodayStats {
  const today = formatDate(new Date());
  const stats = getStats();
  const todaySessions = stats.filter(s => s.date === today);
  const totalSeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  return {
    sessions: todaySessions.length,
    totalMinutes: Math.round(totalSeconds / 60),
  };
}

export function getWeeklyStats(): WeeklyDayStats[] {
  const stats = getStats();
  const result: WeeklyDayStats[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
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

export function getDailyStats(date: string): DailyStats {
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

export function getHeatmapLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 25) return 1;
  if (minutes <= 50) return 2;
  if (minutes <= 100) return 3;
  return 4;
}

function recordSession(duration: number): void {
  const stats = getStats();
  const now = new Date();
  const actualDuration = duration || TIMER_MODES.FOCUS.duration;
  const record: StatsRecord = {
    date: formatDate(now),
    duration: actualDuration,
    taskId: null,
    timestamp: now.toISOString(),
  };
  stats.push(record);
  saveStats(stats);
  invalidateStatsCache();
}

export function renderStats(): void {
  renderTodayCard();
  renderHeatmap();
}

function renderTodayCard(): void {
  const el = document.getElementById('todaySummary');
  if (!el) return;

  const { sessions, totalMinutes } = getTodayStats();

  if (sessions === 0) {
    el.textContent = t('noFocusToday');
    el.classList.add('stats-empty');
  } else {
    el.textContent = tf('sessionsMinutes', [String(sessions), String(totalMinutes)]);
    el.classList.remove('stats-empty');
  }
}

function renderHeatmap(): void {
  const container = document.getElementById('heatmap');
  if (!container) return;

  const weekly = getWeeklyStats();

  if (container.children.length === 7) {
    let mismatch = false;
    weekly.forEach((day, index) => {
      if (mismatch) return;
      const col = container.children[index] as HTMLElement;
      if (!col || col.getAttribute('data-date') !== day.date) {
        mismatch = true;
        return;
      }
      const block = col.querySelector('.heatmap-block');
      if (block) {
        const level = getHeatmapLevel(day.minutes);
        block.className = `heatmap-block heatmap-level-${level}`;
        block.setAttribute('title', `${day.date}\n${day.sessions} ${t('sessionsUnit')} · ${day.minutes} ${t('minutesUnit')}`);
        block.setAttribute('aria-label', `${day.date}: ${day.sessions} ${t('sessionsUnit')}, ${day.minutes} ${t('minutesUnit')}`);
      }
    });
    if (!mismatch) return;
  }

  renderHeatmapFull(container, weekly);
}

function renderHeatmapFull(container: HTMLElement, weekly: WeeklyDayStats[]): void {
  container.innerHTML = '';

  weekly.forEach(day => {
    const level = getHeatmapLevel(day.minutes);

    const col = document.createElement('div');
    col.className = 'heatmap-column';
    col.setAttribute('data-date', day.date);

    const block = document.createElement('div');
    block.className = `heatmap-block heatmap-level-${level}`;
    block.setAttribute('title', `${day.date}\n${day.sessions} ${t('sessionsUnit')} · ${day.minutes} ${t('minutesUnit')}`);
    block.setAttribute('aria-label', `${day.date}: ${day.sessions} ${t('sessionsUnit')}, ${day.minutes} ${t('minutesUnit')}`);

    const label = document.createElement('span');
    label.className = 'heatmap-label';

    const parts = day.date.split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    label.textContent = shortDateLabel(d);

    const weekdayEl = document.createElement('span');
    weekdayEl.className = 'heatmap-weekday';
    weekdayEl.textContent = weekdayLabel(d);

    col.appendChild(block);
    col.appendChild(label);
    col.appendChild(weekdayEl);
    container.appendChild(col);
  });
}

export function initStats(): void {
  on(TIMER_SESSION_COMPLETE, function (e: any) {
    const { mode, actualDuration } = e.detail;
    if (mode === 'FOCUS') {
      recordSession(actualDuration);
      renderStats();
    }
  });

  on(SETTINGS_DATA_CHANGED, function () {
    invalidateStatsCache();
    renderStats();
  });
}
