(function () {
  'use strict';

  // ========================================================================
  // i18n Module
  // ========================================================================

  var LANG_KEY = 'pomodoro_lang';
  var currentLang = loadLang();

  function loadLang() {
    try { var saved = localStorage.getItem(LANG_KEY); if (saved === 'zh' || saved === 'en') return saved; } catch (e) {}
    return 'zh';
  }

  function saveLang() {
    try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) {}
  }

  var translations = {
    zh: {
      focus: '专注', shortBreak: '短休息', longBreak: '长休息',
      start: '开始', pause: '暂停', resume: '继续',
      reset: '重置计时器', skip: '跳过当前计时', remaining: '剩余时间',
      modeGroup: '切换计时模式',
      tasks: '任务', addTaskPlaceholder: '添加新任务...', addTask: '添加任务',
      noTasks: '暂无任务', noTasksHint: '添加一个任务开始专注吧',
      taskList: '任务列表',
      stats: '统计', statsSection: '专注统计',
      todayFocus: '今日专注', last7Days: '最近 7 天',
      focusEveryMoment: '专注每一刻',
      sessionsMinutes: '{0} 次 · {1} 分钟',
      noFocusToday: '还没有专注记录',
      markIncomplete: '标记未完成', markComplete: '标记完成',
      deleteTask: '删除任务', taskCompleted: '任务已完成', taskRestored: '任务已恢复',
      setFocusTask: '点击设为当前专注任务', setAsFocus: '已设为专注任务',
      pomodorosCompleted: '{0} 个番茄钟已完成',
      shortBreakEnd: '短休息结束', longBreakEnd: '长休息结束',
      dataManagement: '数据管理', close: '关闭',
      exportTitle: '数据导出', exportDesc: '将数据下载为 JSON 文件。',
      exportBtn: '导出全部数据',
      importTitle: '数据导入', importDesc: '从备份文件恢复数据。',
      importBtn: '导入数据',
      clearTitle: '清除数据', clearDesc: '删除所有本地数据，不可撤销。',
      clearBtn: '清除全部数据',
      clearConfirm: '确定要清除所有数据吗？此操作不可撤销。',
      clearConfirmTitle: '清除数据',
      exportSuccess: '数据已导出',
      importSuccess: '数据导入成功',
      importFailFormat: '导入失败：文件格式不正确',
      importFailParse: '导入失败：无法解析文件',
      clearSuccess: '所有数据已清除',
      clearFail: '清除数据失败',
      storageWarning: '⚠️ 存储空间不足，数据可能无法保存。',
      cancel: '取消', confirm: '确认',
      installApp: '安装', installAppLabel: '安装应用到桌面',
      toggleTheme: '切换主题', dataManage: '数据管理',
    },
    en: {
      focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break',
      start: 'Start', pause: 'Pause', resume: 'Resume',
      reset: 'Reset timer', skip: 'Skip current session', remaining: 'Remaining time',
      modeGroup: 'Switch timer mode',
      tasks: 'Tasks', addTaskPlaceholder: 'Add a new task...', addTask: 'Add task',
      noTasks: 'No tasks yet', noTasksHint: 'Add a task to start focusing',
      taskList: 'Task list',
      stats: 'Stats', statsSection: 'Focus statistics',
      todayFocus: 'Today\'s Focus', last7Days: 'Last 7 Days',
      focusEveryMoment: 'Focus on every moment',
      sessionsMinutes: '{0} sessions · {1} min',
      noFocusToday: 'No focus sessions today',
      markIncomplete: 'Mark incomplete', markComplete: 'Mark complete',
      deleteTask: 'Delete task', taskCompleted: 'Task completed', taskRestored: 'Task restored',
      setFocusTask: 'Click to set as focus task', setAsFocus: 'Set as focus task',
      pomodorosCompleted: '{0} pomodoros completed',
      shortBreakEnd: 'Short break ended', longBreakEnd: 'Long break ended',
      dataManagement: 'Data Management', close: 'Close',
      exportTitle: 'Export Data', exportDesc: 'Download your data as a JSON file.',
      exportBtn: 'Export All Data',
      importTitle: 'Import Data', importDesc: 'Restore data from a backup file.',
      importBtn: 'Import Data',
      clearTitle: 'Clear Data', clearDesc: 'Delete all local data. This cannot be undone.',
      clearBtn: 'Clear All Data',
      clearConfirm: 'Are you sure you want to clear all data? This cannot be undone.',
      clearConfirmTitle: 'Clear Data',
      exportSuccess: 'Data exported',
      importSuccess: 'Data imported successfully',
      importFailFormat: 'Import failed: invalid file format',
      importFailParse: 'Import failed: cannot parse file',
      clearSuccess: 'All data cleared',
      clearFail: 'Failed to clear data',
      storageWarning: '⚠️ Storage full, data may not be saved.',
      cancel: 'Cancel', confirm: 'Confirm',
      installApp: 'Install', installAppLabel: 'Install app to desktop',
      toggleTheme: 'Toggle theme', dataManage: 'Data management',
    }
  };

  var weekdaysZh = ['周日','周一','周二','周三','周四','周五','周六'];
  var weekdaysEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function t(key) {
    var dict = translations[currentLang] || translations.zh;
    return dict[key] || translations.zh[key] || key;
  }

  function tf(key, args) {
    var str = t(key);
    if (args) { for (var i = 0; i < args.length; i++) str = str.replace('{' + i + '}', args[i]); }
    return str;
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', t(key));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    var langLabel = document.getElementById('langLabel');
    if (langLabel) langLabel.textContent = currentLang === 'zh' ? 'EN' : '中';
  }

  function toggleLang() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    saveLang();
    applyI18n();
    updateTimerUI();
    renderStats();
    renderTaskList();
    var settingsContainer = document.getElementById(SETTINGS_CONTAINER_ID);
    if (settingsContainer && !settingsContainer.classList.contains('hidden')) {
      settingsContainer.remove();
      settingsInitialised = false;
      initSettings();
      settingsContainer.classList.remove('hidden');
    }
  }

  // ========================================================================
  // Timer Module
  // ========================================================================

  var TIMER_MODES = {
    FOCUS:       { duration: 25 * 60 },
    SHORT_BREAK: { duration:  5 * 60 },
    LONG_BREAK:  { duration: 15 * 60 },
  };

  var TIMER_STATES = { IDLE: 'IDLE', RUNNING: 'RUNNING', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED' };
  var SESSION_COUNTER_KEY = 'pomodoro_pomo_counter';

  var timerInterval = null;
  var timerState = TIMER_STATES.IDLE;
  var timerMode = 'FOCUS';
  var timerRemaining = TIMER_MODES.FOCUS.duration;
  var timerElapsed = 0;
  var focusSessionsCompleted = loadSessionCounter();
  var autoStartBreaks = true;

  function loadSessionCounter() { try { var raw = localStorage.getItem(SESSION_COUNTER_KEY); if (raw !== null) { var val = parseInt(raw, 10); if (!isNaN(val) && val >= 0) return val; } } catch (e) {} return 0; }
  function saveSessionCounter() { try { localStorage.setItem(SESSION_COUNTER_KEY, String(focusSessionsCompleted)); } catch (e) {} }

  function initTimer() {
    updateTimerUI();
    document.addEventListener('timer:sessionComplete', function (e) {
      if (e.detail && e.detail.mode === 'FOCUS') fireTimerEvent('timer:incrementPomodoros', { taskId: null });
    });
  }

  function startTimer(duration) {
    if (timerState === TIMER_STATES.RUNNING) return;
    stopInterval();
    if (duration !== undefined) { timerRemaining = duration; timerElapsed = 0; }
    else if (timerState !== TIMER_STATES.PAUSED) { timerRemaining = TIMER_MODES[timerMode].duration; timerElapsed = 0; }
    timerState = TIMER_STATES.RUNNING;
    timerInterval = setInterval(function () {
      timerRemaining--; timerElapsed++;
      updateTimerUI();
      fireTimerEvent('timer:tick', { remaining: timerRemaining, elapsed: timerElapsed, mode: timerMode });
      if (timerRemaining <= 0) { stopInterval(); handleTimerComplete(); }
    }, 1000);
    updateTimerUI();
  }

  function pauseTimer() { if (timerState !== TIMER_STATES.RUNNING) return; stopInterval(); timerState = TIMER_STATES.PAUSED; updateTimerUI(); }
  function resetTimer() { stopInterval(); timerState = TIMER_STATES.IDLE; timerRemaining = TIMER_MODES[timerMode].duration; timerElapsed = 0; updateTimerUI(); fireTimerEvent('timer:reset', { mode: timerMode }); }

  function skip() {
    if (timerState === TIMER_STATES.IDLE) return;
    stopInterval();
    if (timerMode === 'FOCUS') { switchToMode((focusSessionsCompleted % 4 === 0 && focusSessionsCompleted > 0) ? 'LONG_BREAK' : 'SHORT_BREAK', false); }
    else { switchToMode('FOCUS', false); }
  }

  function setMode(newMode) { if (!TIMER_MODES[newMode]) return; if (newMode === timerMode && timerState !== TIMER_STATES.IDLE) return; stopInterval(); timerMode = newMode; timerState = TIMER_STATES.IDLE; timerRemaining = TIMER_MODES[timerMode].duration; timerElapsed = 0; updateTimerUI(); fireTimerEvent('timer:modeChange', { mode: timerMode }); }
  function resetSessionCounter() { focusSessionsCompleted = 0; saveSessionCounter(); }
  function getTimerState() { return { state: timerState, mode: timerMode, remaining: timerRemaining, elapsed: timerElapsed, duration: TIMER_MODES[timerMode].duration, sessionCount: focusSessionsCompleted, autoStart: autoStartBreaks }; }
  function stopInterval() { if (timerInterval !== null) { clearInterval(timerInterval); timerInterval = null; } }

  function handleTimerComplete() {
    var actualDuration = timerElapsed || TIMER_MODES[timerMode].duration;
    timerState = TIMER_STATES.COMPLETED;
    if (timerMode === 'FOCUS') { focusSessionsCompleted++; saveSessionCounter(); }
    updateTimerUI();
    fireTimerEvent('timer:complete', { mode: timerMode, completedSessions: focusSessionsCompleted, actualDuration: actualDuration });
    fireTimerEvent('timer:sessionComplete', { mode: timerMode, sessionCount: focusSessionsCompleted, actualDuration: actualDuration });
    announceTimerComplete(timerMode, focusSessionsCompleted);
    if (timerMode === 'FOCUS') { switchToMode((focusSessionsCompleted % 4 === 0) ? 'LONG_BREAK' : 'SHORT_BREAK', autoStartBreaks); }
  }

  function switchToMode(newMode, shouldStart) { stopInterval(); timerMode = newMode; timerState = TIMER_STATES.IDLE; timerRemaining = TIMER_MODES[timerMode].duration; timerElapsed = 0; updateTimerUI(); fireTimerEvent('timer:modeChange', { mode: timerMode }); if (shouldStart) startTimer(); }

  function updateTimerUI() {
    var section = document.querySelector('.timer-section');
    if (section) section.setAttribute('data-mode', timerMode);

    var display = document.getElementById('timerDisplay');
    if (display) {
      var mins = Math.floor(timerRemaining / 60); var secs = timerRemaining % 60;
      display.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      display.classList.toggle('warning', timerRemaining <= 60 && timerRemaining > 0 && timerState === TIMER_STATES.RUNNING);
      display.classList.toggle('paused', timerState === TIMER_STATES.PAUSED);
    }

    var indicator = document.getElementById('timerModeIndicator');
    if (indicator) {
      var modeKey = timerMode === 'FOCUS' ? 'focus' : timerMode === 'SHORT_BREAK' ? 'shortBreak' : 'longBreak';
      indicator.textContent = t(modeKey);
    }

    var toggleBtn = document.getElementById('timerToggleBtn');
    if (toggleBtn) {
      if (timerState === TIMER_STATES.RUNNING) { toggleBtn.textContent = t('pause'); toggleBtn.setAttribute('aria-label', t('pause')); }
      else if (timerState === TIMER_STATES.PAUSED) { toggleBtn.textContent = t('resume'); toggleBtn.setAttribute('aria-label', t('resume')); }
      else { toggleBtn.textContent = t('start'); toggleBtn.setAttribute('aria-label', t('start')); }
    }

    var ring = document.getElementById('timerRingProgress');
    if (ring) {
      var total = TIMER_MODES[timerMode].duration;
      var fraction = total > 0 ? timerRemaining / total : 0;
      var circumference = 2 * Math.PI * 108;
      ring.style.strokeDasharray = String(circumference);
      ring.style.strokeDashoffset = String(circumference * (1 - fraction));
      ring.classList.toggle('running', timerState === TIMER_STATES.RUNNING);
    }

    var modeButtons = document.querySelectorAll('[data-mode]');
    modeButtons.forEach(function (btn) {
      var btnMode = btn.getAttribute('data-mode');
      btn.classList.toggle('active', btnMode === timerMode);
      btn.setAttribute('aria-pressed', btnMode === timerMode ? 'true' : 'false');
    });
  }

  function fireTimerEvent(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail })); }

  function announceTimerComplete(mode, sessionCount) {
    var lr = document.getElementById('liveRegion'); if (!lr) return;
    var message = '';
    if (mode === 'FOCUS') message = tf('pomodorosCompleted', [sessionCount]);
    else if (mode === 'SHORT_BREAK') message = t('shortBreakEnd');
    else if (mode === 'LONG_BREAK') message = t('longBreakEnd');
    lr.textContent = message;
  }

  // ========================================================================
  // Tasks Module
  // ========================================================================

  var TASKS_STORAGE_KEY = 'pomodoro_tasks';
  var ACTIVE_TASK_KEY = 'pomodoro_active_task';

  function generateId() { if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID(); var hex = '0123456789abcdef'; var rand = new Uint8Array(16); if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(rand); else { for (var i = 0; i < 16; i++) rand[i] = Math.floor(Math.random() * 256); } rand[6] = (rand[6] & 0x0f) | 0x40; rand[8] = (rand[8] & 0x3f) | 0x80; var parts = []; for (var j = 0; j < 16; j++) { var byte = rand[j]; parts.push(hex[(byte >>> 4) & 0xf]); parts.push(hex[byte & 0xf]); if (j === 3 || j === 5 || j === 7 || j === 9) parts.push('-'); } return parts.join(''); }
  function sanitizeForAria(text) { return String(text).replace(/[\x00-\x1F\x7F]/g, '').trim(); }
  function loadTasksFromStorage() { try { var raw = localStorage.getItem(TASKS_STORAGE_KEY); if (!raw) return []; var p = JSON.parse(raw); if (!Array.isArray(p)) return []; return p.filter(function (x) { return x && typeof x.id === 'string' && typeof x.title === 'string'; }).map(function (x) { if (typeof x.completed !== 'boolean') x.completed = false; if (typeof x.pomodoros !== 'number') x.pomodoros = 0; return x; }); } catch (e) { return []; } }
  function saveTasksToStorage(tasks) { try { localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)); return true; } catch (e) { return false; } }
  function loadActiveTaskId() { try { return localStorage.getItem(ACTIVE_TASK_KEY) || null; } catch (e) { return null; } }
  function saveActiveTaskId() { try { if (activeTaskId) localStorage.setItem(ACTIVE_TASK_KEY, activeTaskId); else localStorage.removeItem(ACTIVE_TASK_KEY); } catch (e) {} }

  var tasks = loadTasksFromStorage();
  var activeTaskId = loadActiveTaskId();

  function addTask(title) { var trimmed = String(title).trim(); if (!trimmed) return null; var task = { id: generateId(), title: trimmed.slice(0, 200), completed: false, pomodoros: 0, createdAt: new Date().toISOString(), completedAt: null }; saveTasksToStorage(tasks.concat([task])); tasks.push(task); return task; }
  function deleteTask(id) { var idx = tasks.findIndex(function (x) { return x.id === id; }); if (idx === -1) return false; var removed = tasks.splice(idx, 1)[0]; if (!saveTasksToStorage(tasks)) { tasks.splice(idx, 0, removed); return false; } if (activeTaskId === id) { activeTaskId = null; saveActiveTaskId(); } return true; }
  function toggleTask(id) { var task = tasks.find(function (x) { return x.id === id; }); if (!task) return null; var old = task.completed; task.completed = !task.completed; task.completedAt = task.completed ? new Date().toISOString() : null; if (!saveTasksToStorage(tasks)) { task.completed = old; task.completedAt = null; return null; } if (task.completed && activeTaskId === id) { activeTaskId = null; saveActiveTaskId(); } return task; }
  function incrementPomodoros(id) { var task = tasks.find(function (x) { return x.id === id; }); if (!task) return null; task.pomodoros = (task.pomodoros || 0) + 1; if (!saveTasksToStorage(tasks)) { task.pomodoros--; return null; } return task; }
  function getTasks() { return tasks.slice().sort(function (a, b) { if (a.completed !== b.completed) return a.completed ? 1 : -1; return new Date(b.createdAt) - new Date(a.createdAt); }); }
  function getActiveTaskId() { if (activeTaskId) { var x = tasks.find(function (t) { return t.id === activeTaskId && !t.completed; }); if (x) return activeTaskId; } return null; }
  function setActiveTaskId(id) { if (id === null) { activeTaskId = null; } else { var x = tasks.find(function (t) { return t.id === id; }); activeTaskId = (x && !x.completed) ? id : null; } saveActiveTaskId(); }
  function reloadTasks() { tasks = loadTasksFromStorage(); activeTaskId = loadActiveTaskId(); }

  // ========================================================================
  // Stats Module
  // ========================================================================

  var STATS_STORAGE_KEY = 'pomodoro_stats';
  var statsCache = null; var statsCacheDirty = true;
  function invalidateStatsCache() { statsCacheDirty = true; statsCache = null; }
  function readRawStats() { try { var raw = localStorage.getItem(STATS_STORAGE_KEY); if (!raw) return []; var p = JSON.parse(raw); if (!Array.isArray(p)) return []; return p.filter(function (r) { return r && typeof r.date === 'string' && typeof r.duration === 'number'; }); } catch (e) { return []; } }
  function getStats() { if (!statsCacheDirty && statsCache !== null) return statsCache; var valid = readRawStats(); var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 365); var cs = cutoff.toISOString().split('T')[0]; var filtered = valid.filter(function (r) { return r.date >= cs; }); if (filtered.length !== valid.length) saveStats(filtered); statsCache = filtered; statsCacheDirty = false; return filtered; }
  function saveStats(records) { try { localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(records)); } catch (e) {} }
  function formatDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function shortDateLabel(d) { return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0'); }
  function getTodayStats() { var today = formatDate(new Date()); var s = getStats().filter(function (x) { return x.date === today; }); return { sessions: s.length, totalMinutes: Math.round(s.reduce(function (sum, x) { return sum + x.duration; }, 0) / 60) }; }
  function getWeeklyStats() { var stats = getStats(); var result = []; var now = new Date(); for (var i = 6; i >= 0; i--) { var d = new Date(now); d.setDate(d.getDate() - i); var ds = formatDate(d); var ds2 = stats.filter(function (x) { return x.date === ds; }); result.push({ date: ds, sessions: ds2.length, minutes: Math.round(ds2.reduce(function (s, x) { return s + x.duration; }, 0) / 60) }); } return result; }
  function getHeatmapLevel(m) { if (m <= 0) return 0; if (m <= 25) return 1; if (m <= 50) return 2; if (m <= 100) return 3; return 4; }
  function recordSession(duration) { var stats = getStats(); var now = new Date(); stats.push({ date: formatDate(now), duration: duration || TIMER_MODES.FOCUS.duration, taskId: null, timestamp: now.toISOString() }); saveStats(stats); invalidateStatsCache(); }

  function renderStats() { renderTodayCard(); renderHeatmap(); }
  function renderTodayCard() { var el = document.getElementById('todaySummary'); if (!el) return; var info = getTodayStats(); if (info.sessions === 0) { el.textContent = t('noFocusToday'); el.classList.add('stats-empty'); } else { el.textContent = tf('sessionsMinutes', [info.sessions, info.totalMinutes]); el.classList.remove('stats-empty'); } }
  function renderHeatmap() {
    var container = document.getElementById('heatmap'); if (!container) return;
    var weekly = getWeeklyStats(); container.innerHTML = '';
    var wd = currentLang === 'zh' ? weekdaysZh : weekdaysEn;
    weekly.forEach(function (day) {
      var level = getHeatmapLevel(day.minutes); var col = document.createElement('div'); col.className = 'heatmap-column';
      var block = document.createElement('div'); block.className = 'heatmap-block heatmap-level-' + level;
      var sessionsText = currentLang === 'zh' ? '次' : 'sessions';
      var minutesText = currentLang === 'zh' ? '分钟' : 'min';
      block.setAttribute('title', day.date + '\n' + day.sessions + ' ' + sessionsText + ' \u00B7 ' + day.minutes + ' ' + minutesText);
      block.setAttribute('aria-label', day.date + ': ' + day.sessions + ' ' + sessionsText + ', ' + day.minutes + ' ' + minutesText);
      var label = document.createElement('span'); label.className = 'heatmap-label'; var parts = day.date.split('-'); var d = new Date(+parts[0], +parts[1] - 1, +parts[2]); label.textContent = shortDateLabel(d);
      var weekdayEl = document.createElement('span'); weekdayEl.className = 'heatmap-weekday'; weekdayEl.textContent = wd[d.getDay()];
      col.appendChild(block); col.appendChild(label); col.appendChild(weekdayEl); container.appendChild(col);
    });
  }

  function initStats() { document.addEventListener('timer:sessionComplete', function (e) { if (e.detail.mode === 'FOCUS') { recordSession(e.detail.actualDuration); renderStats(); } }); document.addEventListener('settings:dataChanged', function () { invalidateStatsCache(); renderStats(); }); }

  // ========================================================================
  // Theme Module
  // ========================================================================

  function initTheme() {
    var saved = null; try { saved = localStorage.getItem('pomodoro_theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
    var btn = document.getElementById('themeToggleBtn');
    if (btn) btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('pomodoro_theme', next); } catch (e) {}
    });
  }

  // ========================================================================
  // Confetti Module
  // ========================================================================

  function initConfetti() { document.addEventListener('timer:sessionComplete', function (e) { if (e.detail.mode === 'FOCUS') launchConfetti(); }); }
  function launchConfetti() {
    var section = document.querySelector('.timer-ring-wrapper'); if (!section) return;
    var existing = section.querySelector('.confetti-container'); if (existing) existing.remove();
    var container = document.createElement('div'); container.className = 'confetti-container'; section.style.position = 'relative'; section.appendChild(container);
    var colors = ['#e8433e', '#2dd4a0', '#6c8cff', '#f39c12', '#9b59b6', '#1abc9c'];
    for (var i = 0; i < 30; i++) { var p = document.createElement('div'); p.className = 'confetti-particle'; var c = colors[Math.floor(Math.random() * colors.length)]; var sz = Math.random() * 8 + 4; var angle = Math.random() * 360; var vel = Math.random() * 120 + 60; p.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;background:' + c + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';--confetti-end-x:' + (Math.cos(angle * Math.PI / 180) * vel) + 'px;--confetti-end-y:' + (Math.sin(angle * Math.PI / 180) * vel) + 'px;--confetti-rotation:' + (Math.random() * 720 - 360) + 'deg;animation-duration:' + (Math.random() * 0.8 + 0.6) + 's;'; container.appendChild(p); }
    setTimeout(function () { if (container.parentNode) container.remove(); }, 2000);
  }

  // ========================================================================
  // PWA Module
  // ========================================================================

  var deferredPrompt = null;
  function initPWA() {
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; renderInstallButton(); });
    window.addEventListener('appinstalled', function () { deferredPrompt = null; var b = document.getElementById('pwaInstallBtn'); if (b) b.remove(); });
  }
  function renderInstallButton() { var existing = document.getElementById('pwaInstallBtn'); if (existing) return; var footer = document.querySelector('.app-footer'); if (!footer) return; var btn = document.createElement('button'); btn.id = 'pwaInstallBtn'; btn.className = 'pwa-install-btn'; btn.textContent = '\uD83D\uDCF1 ' + t('installApp'); btn.setAttribute('aria-label', t('installAppLabel')); btn.addEventListener('click', handleInstallClick); footer.insertBefore(btn, footer.firstChild); }
  async function handleInstallClick() { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; var b = document.getElementById('pwaInstallBtn'); if (b) b.remove(); }

  // ========================================================================
  // Audio Module
  // ========================================================================

  var audioCtx = null;
  function initAudio() { document.addEventListener('timer:sessionComplete', function (e) { playNotificationSound(e.detail.mode); }); }
  function getAudioContext() { if (!audioCtx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; audioCtx = new AC(); } if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }
  function playNotificationSound(mode) { var ctx = getAudioContext(); if (!ctx) return; var isFocus = mode === 'FOCUS'; var freqs = isFocus ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25]; var dur = isFocus ? 0.15 : 0.2; var gap = isFocus ? 0.12 : 0.18; freqs.forEach(function (freq, i) { var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime); var st = ctx.currentTime + i * (dur + gap); gain.gain.setValueAtTime(0.3, st); gain.gain.exponentialRampToValueAtTime(0.01, st + dur); osc.start(st); osc.stop(st + dur + 0.05); }); }

  // ========================================================================
  // Settings Module
  // ========================================================================

  var SETTINGS_CONTAINER_ID = 'settingsContainer';

  function buildSettingsHTML() {
    return '<div id="' + SETTINGS_CONTAINER_ID + '" class="settings-container hidden">' +
      '<div class="settings-header"><h2 class="settings-title">' + t('dataManagement') + '</h2><button class="settings-close-btn" id="settingsCloseBtn" aria-label="' + t('close') + '">&times;</button></div>' +
      '<div class="settings-content">' +
      '<div class="settings-section"><h3 class="settings-section-title">' + t('exportTitle') + '</h3><p class="settings-section-desc">' + t('exportDesc') + '</p><div class="settings-actions"><button class="btn btn-secondary" id="exportBtn">' + t('exportBtn') + '</button></div></div>' +
      '<div class="settings-section"><h3 class="settings-section-title">' + t('importTitle') + '</h3><p class="settings-section-desc">' + t('importDesc') + '</p><div class="settings-actions"><button class="btn btn-secondary" id="importBtn">' + t('importBtn') + '</button><input type="file" id="importFileInput" accept=".json" style="display:none"></div></div>' +
      '<div class="settings-section"><h3 class="settings-section-title">' + t('clearTitle') + '</h3><p class="settings-section-desc">' + t('clearDesc') + '</p><div class="settings-actions settings-actions-danger"><button class="btn btn-danger" id="clearAllBtn">' + t('clearBtn') + '</button></div></div>' +
      '<div class="settings-footer"><button class="btn btn-secondary btn-sm" id="settingsCloseBtn2">' + t('close') + '</button></div>' +
      '</div></div>';
  }

  function showModal(title, message, onConfirm) {
    var existing = document.getElementById('appModal'); if (existing) existing.remove();
    var overlay = document.createElement('div'); overlay.id = 'appModal'; overlay.className = 'modal-overlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
    var dialog = document.createElement('div'); dialog.className = 'modal-dialog';
    var titleEl = document.createElement('h3'); titleEl.className = 'modal-title'; titleEl.textContent = title;
    var msgEl = document.createElement('p'); msgEl.className = 'modal-message'; msgEl.textContent = message;
    var actions = document.createElement('div'); actions.className = 'modal-actions';
    var cancelBtn = document.createElement('button'); cancelBtn.className = 'btn btn-secondary btn-sm'; cancelBtn.textContent = t('cancel'); cancelBtn.addEventListener('click', function () { overlay.remove(); });
    var confirmBtn = document.createElement('button'); confirmBtn.className = 'btn btn-danger btn-sm'; confirmBtn.textContent = t('confirm'); confirmBtn.addEventListener('click', function () { overlay.remove(); if (onConfirm) onConfirm(); });
    actions.appendChild(cancelBtn); actions.appendChild(confirmBtn);
    dialog.appendChild(titleEl); dialog.appendChild(msgEl); dialog.appendChild(actions);
    overlay.appendChild(dialog); document.body.appendChild(overlay); confirmBtn.focus();
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function handler(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); } });
  }

  function showToast(message) { var existing = document.getElementById('appToast'); if (existing) existing.remove(); var toast = document.createElement('div'); toast.id = 'appToast'; toast.className = 'toast-notification'; toast.setAttribute('role', 'status'); toast.textContent = message; document.body.appendChild(toast); requestAnimationFrame(function () { toast.classList.add('visible'); }); setTimeout(function () { toast.classList.remove('visible'); setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300); }, 3000); }

  function exportData() { var data = { version: 1, exportedAt: new Date().toISOString(), tasks: getTasks(), stats: getStats() }; var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'pomodoro_backup_' + new Date().toISOString().slice(0, 10) + '.json'; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100); }
  function importData() { var fi = document.getElementById('importFileInput'); if (fi) fi.click(); }
  function handleImportFile(e) { var file = e.target.files[0]; if (!file) return; var reader = new FileReader(); reader.onload = function (ev) { try { var data = JSON.parse(ev.target.result); if (!data || typeof data !== 'object') { showToast(t('importFailFormat')); return; } if (data.tasks && Array.isArray(data.tasks)) localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(data.tasks)); if (data.stats && Array.isArray(data.stats)) localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data.stats)); showToast(t('importSuccess')); document.dispatchEvent(new CustomEvent('settings:dataChanged')); } catch (err) { showToast(t('importFailParse')); } }; reader.readAsText(file); e.target.value = ''; }
  function clearAllData() { showModal(t('clearConfirmTitle'), t('clearConfirm'), function () { try { localStorage.removeItem('pomodoro_tasks'); localStorage.removeItem('pomodoro_stats'); localStorage.removeItem('pomodoro_theme'); localStorage.removeItem('pomodoro_pomo_counter'); localStorage.removeItem('pomodoro_active_task'); localStorage.removeItem('pomodoro_lang'); showToast(t('clearSuccess')); document.dispatchEvent(new CustomEvent('settings:dataChanged')); } catch (e) { showToast(t('clearFail')); } }); }

  function renderSettingsContainer() { var existing = document.getElementById(SETTINGS_CONTAINER_ID); if (existing) existing.remove(); var footer = document.querySelector('.app-footer'); if (!footer) return; var div = document.createElement('div'); div.innerHTML = buildSettingsHTML(); footer.parentNode.insertBefore(div.firstElementChild, footer); }
  function wireSettingsUI() { var c = document.getElementById(SETTINGS_CONTAINER_ID); if (!c) return; var eb = document.getElementById('exportBtn'); if (eb) eb.addEventListener('click', exportData); var ib = document.getElementById('importBtn'); if (ib) ib.addEventListener('click', importData); var ifi = document.getElementById('importFileInput'); if (ifi) ifi.addEventListener('change', handleImportFile); var cb = document.getElementById('clearAllBtn'); if (cb) cb.addEventListener('click', clearAllData); c.querySelectorAll('[id$="CloseBtn"]').forEach(function (btn) { btn.addEventListener('click', function () { c.classList.add('hidden'); }); }); }

  var settingsInitialised = false;
  function initSettings() { if (settingsInitialised) return; settingsInitialised = true; renderSettingsContainer(); wireSettingsUI(); var triggerBtn = document.getElementById('settingsTriggerBtn'); if (triggerBtn) triggerBtn.addEventListener('click', function () { var sc = document.getElementById(SETTINGS_CONTAINER_ID); if (sc) sc.classList.toggle('hidden'); }); }

  // ========================================================================
  // App Entry Point
  // ========================================================================

  function renderTaskList() {
    var listEl = document.getElementById('taskList');
    var emptyEl = document.getElementById('taskEmptyState');
    var countEl = document.getElementById('taskCount');
    if (!listEl) return;
    var allTasks = getTasks();
    var currentActiveId = getActiveTaskId();

    listEl.innerHTML = '';
    allTasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item slide-in' + (task.completed ? ' completed' : '') + (task.id === currentActiveId && !task.completed ? ' task-active' : '');
      li.setAttribute('data-task-id', task.id);

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.className = 'task-checkbox'; checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', task.completed ? t('markIncomplete') : t('markComplete'));
      checkbox.addEventListener('change', function () { var ut = toggleTask(task.id); if (ut) { updateLiveRegion(ut.completed ? t('taskCompleted') : t('taskRestored')); renderTaskList(); } });

      var titleSpan = document.createElement('span');
      titleSpan.className = 'task-title'; titleSpan.textContent = task.title;
      titleSpan.setAttribute('title', t('setFocusTask'));
      titleSpan.addEventListener('click', function () { if (!task.completed) { setActiveTaskId(task.id); renderTaskList(); updateLiveRegion(t('setAsFocus')); } });

      var pomoBadge = document.createElement('span');
      pomoBadge.className = 'task-pomodoros';
      if (task.pomodoros > 0) { pomoBadge.textContent = '\uD83C\uDF45 ' + task.pomodoros; } else { pomoBadge.classList.add('hidden'); }

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete-btn'; deleteBtn.setAttribute('aria-label', t('deleteTask') + ': ' + sanitizeForAria(task.title)); deleteBtn.textContent = '\u00D7';
      deleteBtn.addEventListener('click', function (e) { e.stopPropagation(); deleteTask(task.id); renderTaskList(); });

      li.appendChild(checkbox); li.appendChild(titleSpan); li.appendChild(pomoBadge); li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });

    if (emptyEl) { if (allTasks.length === 0) emptyEl.classList.remove('hidden'); else emptyEl.classList.add('hidden'); }
    if (countEl) countEl.textContent = String(allTasks.filter(function (x) { return !x.completed; }).length);
  }

  function updateLiveRegion(message) { var lr = document.getElementById('liveRegion'); if (lr) lr.textContent = message; }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      var target = e.target; var isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      function isTyping() { return isInput && e.key !== 'n' && e.key !== 'N'; }
      switch (e.key) {
        case ' ': if (isTyping()) return; e.preventDefault(); if (getTimerState().state === 'RUNNING') pauseTimer(); else startTimer(); break;
        case 'n': case 'N': if (e.ctrlKey || e.metaKey || e.altKey) return; var ti = document.getElementById('taskInput'); if (ti) { e.preventDefault(); ti.focus(); ti.select(); } break;
        case '1': if (isTyping()) return; setMode('FOCUS'); break;
        case '2': if (isTyping()) return; setMode('SHORT_BREAK'); break;
        case '3': if (isTyping()) return; setMode('LONG_BREAK'); break;
        case 'r': case 'R': if (isTyping()) return; resetTimer(); break;
        case 's': case 'S': if (isTyping()) return; skip(); break;
      }
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').then(function () {}).catch(function () {});
  }

  function initApp() {
    console.log('[Pomodoro] App initializing...');
    window.addEventListener('error', function (e) { console.error('[Pomodoro] Error:', e.error || e.message); });
    window.addEventListener('unhandledrejection', function (e) { console.error('[Pomodoro] Rejection:', e.reason); });

    applyI18n();

    var langBtn = document.getElementById('langToggleBtn');
    if (langBtn) langBtn.addEventListener('click', toggleLang);

    initTimer();

    var toggleBtn = document.getElementById('timerToggleBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', function () { if (getTimerState().state === 'RUNNING') pauseTimer(); else startTimer(); });
    var resetBtn = document.getElementById('timerResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
    var skipBtn = document.getElementById('timerSkipBtn');
    if (skipBtn) skipBtn.addEventListener('click', skip);
    document.querySelectorAll('[data-mode]').forEach(function (btn) { btn.addEventListener('click', function () { var m = btn.getAttribute('data-mode'); if (m && TIMER_MODES[m]) setMode(m); }); });

    renderTaskList();

    var inputEl = document.getElementById('taskInput');
    var addBtn = document.getElementById('taskAddBtn');
    if (inputEl) {
      function handleAdd() { var raw = inputEl.value; if (!raw.trim()) return; addTask(raw); inputEl.value = ''; renderTaskList(); }
      inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } });
      if (addBtn) addBtn.addEventListener('click', handleAdd);
    }

    initStats(); renderStats(); initTheme(); initConfetti(); initPWA(); initAudio(); initSettings();

    document.addEventListener('timer:incrementPomodoros', function () {
      var activeId = getActiveTaskId();
      if (activeId) incrementPomodoros(activeId);
      else { var first = getTasks().find(function (x) { return !x.completed; }); if (first) incrementPomodoros(first.id); }
      renderTaskList();
    });

    document.addEventListener('settings:dataChanged', function () {
      reloadTasks(); renderTaskList(); resetTimer(); resetSessionCounter();
      currentLang = loadLang(); applyI18n();
    });

    setupKeyboardShortcuts();

    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); initSettings(); var sc = document.getElementById(SETTINGS_CONTAINER_ID); if (sc) sc.classList.remove('hidden'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var sc = document.getElementById(SETTINGS_CONTAINER_ID); if (sc && !sc.classList.contains('hidden')) sc.classList.add('hidden'); } });

    registerServiceWorker();
    console.log('[Pomodoro] App ready. Lang:', currentLang);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
})();
