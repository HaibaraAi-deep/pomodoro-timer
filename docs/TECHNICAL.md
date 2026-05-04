# 🏗 Technical Documentation / 技术文档

---

## 1. Architecture / 架构

### Design Principles / 设计原则

- **Zero dependencies**: Pure Vanilla JS
- **Modular**: Single-responsibility modules
- **Event-driven**: CustomEvent inter-module communication
- **i18n-first**: All UI strings via `t()` function
- **Dark-first**: Dark theme as base, light as override

### Dual Build / 双版本

| Version | File | Loading | Use Case |
|---------|------|---------|----------|
| ES Module | `src/js/app.js` + modules | `<script type="module">` | HTTP server |
| IIFE bundle | `src/js/main.js` | `<script src>` | file:// protocol |

---

## 2. i18n System / 国际化系统

### Implementation / 实现

```javascript
var translations = {
  zh: { focus: '专注', start: '开始', ... },
  en: { focus: 'Focus', start: 'Start', ... }
};

function t(key) { return translations[currentLang][key] || key; }
function tf(key, args) { /* template with {0}, {1} */ }
```

### DOM Binding / DOM 绑定

Three `data-*` attributes for automatic translation:

| Attribute | Updates | Example |
|-----------|---------|---------|
| `data-i18n="key"` | `textContent` | `<span data-i18n="focus">专注</span>` |
| `data-i18n-aria="key"` | `aria-label` | `<button data-i18n-aria="reset">` |
| `data-i18n-placeholder="key"` | `placeholder` | `<input data-i18n-placeholder="addTaskPlaceholder">` |

### Language Switch Flow / 语言切换流程

```
User clicks EN/中
  → toggleLang()
    → currentLang = zh ↔ en
    → saveLang() → localStorage
    → applyI18n() → update all [data-i18n] elements
    → updateTimerUI() → timer button/label text
    → renderStats() → today summary + heatmap
    → renderTaskList() → task aria-labels
    → Rebuild settings panel if open
```

### Persistence / 持久化

- Key: `pomodoro_lang`
- Values: `"zh"` (default) or `"en"`
- Saved to localStorage on every switch

---

## 3. Module API / 模块 API

| Module | Key Exports |
|--------|-------------|
| Timer | `initTimer`, `startTimer`, `pauseTimer`, `resetTimer`, `skip`, `setMode`, `getState` |
| Tasks | `addTask`, `deleteTask`, `toggleTask`, `getTasks`, `incrementPomodoros`, `getActiveTaskId`, `setActiveTaskId` |
| Stats | `initStats`, `renderStats`, `getStats`, `getTodayStats`, `getWeeklyStats`, `invalidateStatsCache` |
| Settings | `initSettings`, `exportData`, `clearAllData` |
| Theme | `initTheme` |
| Audio | `initAudio` |
| Confetti | `initConfetti` |
| PWA | `initPWA` |

---

## 4. Event System / 事件系统

| Event | Source | Data |
|-------|--------|------|
| `timer:tick` | timer | `{remaining, elapsed, mode}` |
| `timer:complete` | timer | `{mode, completedSessions, actualDuration}` |
| `timer:sessionComplete` | timer | `{mode, sessionCount, actualDuration}` |
| `timer:incrementPomodoros` | timer | `{taskId}` |
| `settings:dataChanged` | settings | — |

---

## 5. Timer Implementation / 计时器实现

Uses `setInterval` for reliable cross-environment timing:

```javascript
timerInterval = setInterval(function () {
  timerRemaining--;
  timerElapsed++;
  updateTimerUI();
  if (timerRemaining <= 0) {
    stopInterval();
    handleTimerComplete();
  }
}, 1000);
```

State machine: `IDLE → RUNNING → PAUSED → RUNNING → COMPLETED`

---

## 6. Storage / 存储

| Key | Type | Write Trigger |
|-----|------|---------------|
| `pomodoro_tasks` | `Task[]` | Task CRUD |
| `pomodoro_stats` | `StatRecord[]` | Focus complete |
| `pomodoro_theme` | `"dark"\|"light"` | Theme toggle |
| `pomodoro_pomo_counter` | `string` | Focus complete |
| `pomodoro_active_task` | `string` | Set active task |
| `pomodoro_lang` | `"zh"\|"en"` | Language switch |

Write safety: `saveTasks()` returns boolean, failed writes roll back memory state.

Stats cache: `statsCache` + `statsCacheDirty` flag avoids repeated parsing.

---

## 7. Security / 安全

### CSP

```
default-src 'self' blob: file:;
script-src 'self' blob: file:;
style-src 'self' file:;
img-src 'self' file: data: blob:;
worker-src 'self' blob: file:;
frame-ancestors 'none'; object-src 'none';
```

### Electron

Custom protocol `pomodoro://app/`, `sandbox: true`, `webSecurity: true`.

---

## 8. CSS Architecture / CSS 架构

- Design tokens via CSS Custom Properties
- `[data-theme="light"]` overrides dark defaults
- Responsive: single column < 768px, two columns ≥ 768px
- Fonts: Space Grotesk (UI) + JetBrains Mono (timer)

---

## 9. Platform Support / 平台支持

| Platform | Browser | Electron Desktop |
|----------|---------|------------------|
| Windows | ✅ | ✅ (NSIS installer) |
| macOS | ✅ | ❌ Not configured |
| Linux | ✅ | ❌ Not configured |

Electron `package.json` only defines `win.target`. macOS/Linux desktop builds are not supported.
