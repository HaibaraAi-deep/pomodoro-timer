const LANG_KEY = 'pomodoro_lang';

let currentLang: 'zh' | 'en' = loadLang();

function loadLang(): 'zh' | 'en' {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch (e) {
    console.warn('[i18n] Failed to load language preference:', e);
  }
  return 'zh';
}

function saveLang(): void {
  try {
    localStorage.setItem(LANG_KEY, currentLang);
  } catch (e) {
    console.warn('[i18n] Failed to save language preference:', e);
  }
}

const translations: Record<string, Record<string, string>> = {
  zh: {
    focus: '专注',
    shortBreak: '短休息',
    longBreak: '长休息',
    start: '开始',
    pause: '暂停',
    resume: '继续',
    reset: '重置计时器',
    skip: '跳过当前计时',
    remaining: '剩余时间',
    modeGroup: '切换计时模式',
    tasks: '任务',
    addTaskPlaceholder: '添加新任务...',
    addTask: '添加任务',
    noTasks: '暂无任务',
    noTasksHint: '添加一个任务开始专注吧',
    taskList: '任务列表',
    stats: '统计',
    statsSection: '专注统计',
    todayFocus: '今日专注',
    last7Days: '最近 7 天',
    focusEveryMoment: '专注每一刻',
    sessionsMinutes: '{0} 次 · {1} 分钟',
    noFocusToday: '还没有专注记录',
    markIncomplete: '标记未完成',
    markComplete: '标记完成',
    deleteTask: '删除任务',
    taskCompleted: '任务已完成',
    taskRestored: '任务已恢复',
    setFocusTask: '点击设为当前专注任务',
    setAsFocus: '已设为专注任务',
    pomodorosCompleted: '{0} 个番茄钟已完成',
    shortBreakEnd: '短休息结束',
    longBreakEnd: '长休息结束',
    dataManagement: '数据管理',
    close: '关闭',
    exportTitle: '数据导出',
    exportDesc: '将数据下载为 JSON 文件。',
    exportBtn: '导出全部数据',
    importTitle: '数据导入',
    importDesc: '从备份文件恢复数据。导入将覆盖当前数据。',
    importBtn: '导入数据',
    importSupported: '支持: JSON 备份文件',
    clearTitle: '清除数据',
    clearDesc: '删除所有本地数据，不可撤销。',
    clearBtn: '清除全部数据',
    clearWillRemove: '将清除: 任务、统计、主题偏好',
    clearConfirm: '确定要清除所有数据吗？此操作不可撤销。',
    clearConfirmTitle: '清除数据',
    exportSuccess: '数据已导出',
    importSuccess: '数据导入成功',
    importFailFormat: '导入失败：文件格式不正确',
    importFailParse: '导入失败：无法解析文件',
    importFailTooLarge: '导入失败：文件过大（最大 1MB）',
    importFailInvalidData: '导入失败：数据格式校验不通过',
    clearSuccess: '所有数据已清除',
    clearFail: '清除数据失败',
    storageWarning: '⚠️ 存储空间不足，数据可能无法保存。',
    cancel: '取消',
    confirm: '确认',
    installApp: '安装',
    installAppLabel: '安装应用到桌面',
    toggleTheme: '切换主题',
    switchToLight: '切换到亮色主题',
    switchToDark: '切换到暗色主题',
    switchToHighContrast: '切换到高对比度主题',
    dataManage: '数据管理',
    closeSettings: '关闭设置',
    containsData: '包含: 任务 + 统计',
    pauseTimer: '暂停计时',
    resumeTimer: '继续计时',
    startTimer: '开始计时',
    taskAdded: '已添加任务: {0}',
    taskDeleted: '任务 "{0}" 已删除',
    taskMarkedComplete: '任务 "{0}" 已标记为完成',
    taskMarkedIncomplete: '任务 "{0}" 已标记为未完成',
    taskSetAsFocus: '已将 "{0}" 设为当前专注任务',
    workerFallbackNotice: '计时器使用降级模式，后台标签页时可能不够精确',
    focusSessionEnd1: '{0} 个番茄钟已完成',
    focusSessionEnd2: '专注阶段结束，共完成 {0} 个番茄钟',
    focusSessionEnd3: '计时完成，您已完成 {0} 个专注时段',
    sessionsUnit: '次',
    minutesUnit: '分钟',
    containsLabel: '包含: 任务 + 统计',
    storageWarningClose: '关闭警告',
    storageWarningTask: '⚠️ 存储空间不足，任务数据可能无法保存。请清理浏览器数据。',
    storageWarningStats: '⚠️ 存储空间不足，统计数据可能无法保存。请清理浏览器数据。',
  },
  en: {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset timer',
    skip: 'Skip current session',
    remaining: 'Remaining time',
    modeGroup: 'Switch timer mode',
    tasks: 'Tasks',
    addTaskPlaceholder: 'Add a new task...',
    addTask: 'Add task',
    noTasks: 'No tasks yet',
    noTasksHint: 'Add a task to start focusing',
    taskList: 'Task list',
    stats: 'Stats',
    statsSection: 'Focus statistics',
    todayFocus: "Today's Focus",
    last7Days: 'Last 7 Days',
    focusEveryMoment: 'Focus on every moment',
    sessionsMinutes: '{0} sessions · {1} min',
    noFocusToday: 'No focus sessions today',
    markIncomplete: 'Mark incomplete',
    markComplete: 'Mark complete',
    deleteTask: 'Delete task',
    taskCompleted: 'Task completed',
    taskRestored: 'Task restored',
    setFocusTask: 'Click to set as focus task',
    setAsFocus: 'Set as focus task',
    pomodorosCompleted: '{0} pomodoros completed',
    shortBreakEnd: 'Short break ended',
    longBreakEnd: 'Long break ended',
    dataManagement: 'Data Management',
    close: 'Close',
    exportTitle: 'Export Data',
    exportDesc: 'Download your data as a JSON file.',
    exportBtn: 'Export All Data',
    importTitle: 'Import Data',
    importDesc: 'Restore data from a backup file. Import will overwrite current data.',
    importBtn: 'Import Data',
    importSupported: 'Supported: JSON backup file',
    clearTitle: 'Clear Data',
    clearDesc: 'Delete all local data. This cannot be undone.',
    clearBtn: 'Clear All Data',
    clearWillRemove: 'Will clear: tasks, stats, theme preference',
    clearConfirm: 'Are you sure you want to clear all data? This cannot be undone.',
    clearConfirmTitle: 'Clear Data',
    exportSuccess: 'Data exported',
    importSuccess: 'Data imported successfully',
    importFailFormat: 'Import failed: invalid file format',
    importFailParse: 'Import failed: cannot parse file',
    importFailTooLarge: 'Import failed: file too large (max 1MB)',
    importFailInvalidData: 'Import failed: data validation failed',
    clearSuccess: 'All data cleared',
    clearFail: 'Failed to clear data',
    storageWarning: '⚠️ Storage full, data may not be saved.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    installApp: 'Install',
    installAppLabel: 'Install app to desktop',
    toggleTheme: 'Toggle theme',
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
    switchToHighContrast: 'Switch to high contrast theme',
    dataManage: 'Data management',
    closeSettings: 'Close settings',
    containsData: 'Contains: Tasks + Stats',
    pauseTimer: 'Pause timer',
    resumeTimer: 'Resume timer',
    startTimer: 'Start timer',
    taskAdded: 'Task added: {0}',
    taskDeleted: 'Task "{0}" deleted',
    taskMarkedComplete: 'Task "{0}" marked as complete',
    taskMarkedIncomplete: 'Task "{0}" marked as incomplete',
    taskSetAsFocus: '"{0}" set as focus task',
    workerFallbackNotice: 'Timer using fallback mode, may be inaccurate in background tabs',
    focusSessionEnd1: '{0} pomodoros completed',
    focusSessionEnd2: 'Focus session ended, {0} pomodoros completed',
    focusSessionEnd3: 'Timer complete, {0} focus sessions done',
    sessionsUnit: 'sessions',
    minutesUnit: 'min',
    containsLabel: 'Contains: Tasks + Stats',
    storageWarningClose: 'Close warning',
    storageWarningTask: '⚠️ Storage full, task data may not be saved. Please clear browser data.',
    storageWarningStats: '⚠️ Storage full, stats data may not be saved. Please clear browser data.',
  },
};

const weekdaysZh: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekdaysEn: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function t(key: string): string {
  const dict = translations[currentLang] || translations.zh;
  return dict[key] || translations.zh[key] || key;
}

export function tf(key: string, args?: string[]): string {
  let str = t(key);
  if (args) {
    for (let i = 0; i < args.length; i++) {
      str = str.replace('{' + i + '}', args[i]);
    }
  }
  return str;
}

export function getCurrentLang(): 'zh' | 'en' {
  return currentLang;
}

export function getWeekdays(): string[] {
  return currentLang === 'zh' ? weekdaysZh : weekdaysEn;
}

export function toggleLang(): void {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  saveLang();
  applyI18n();
}

export function applyI18n(): void {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key!);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key!));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key!));
  });
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  const langLabel = document.getElementById('langLabel');
  if (langLabel) langLabel.textContent = currentLang === 'zh' ? 'EN' : '中';
}
