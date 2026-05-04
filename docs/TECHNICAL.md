# 🏗 番茄钟技术文档

---

## 1. 架构概览

### 设计原则

- **零依赖**：纯 Vanilla JS，无需构建
- **模块化**：每个功能独立模块，职责单一
- **事件驱动**：模块间通过 CustomEvent 通信
- **安全优先**：严格 CSP、Electron 加固、输入验证
- **暗色优先设计**：以暗色主题为基础，亮色为覆盖层

### 双版本架构

| 版本 | 文件 | 加载方式 | 用途 |
|------|------|----------|------|
| ES Module | `src/js/app.js` + 各模块 | `<script type="module">` | HTTP 服务器 |
| IIFE 打包 | `src/js/main.js` | `<script src>` | file:// 协议 |

---

## 2. 模块详解

### 依赖图

```
app.js (入口)
  ├── timer.js
  ├── tasks.js
  ├── stats.js
  ├── theme.js
  ├── confetti.js
  ├── pwa.js
  ├── audio.js
  └── settings.js
```

### 模块 API

| 模块 | 导出 |
|------|------|
| Timer | `initTimer`, `startTimer`, `pauseTimer`, `resetTimer`, `skip`, `setMode`, `getState`, `resetSessionCounter` |
| Tasks | `addTask`, `deleteTask`, `toggleTask`, `getTasks`, `incrementPomodoros`, `getActiveTaskId`, `setActiveTaskId`, `reloadTasks` |
| Stats | `initStats`, `renderStats`, `getStats`, `getTodayStats`, `getWeeklyStats`, `invalidateStatsCache` |
| Settings | `initSettings`, `exportData`, `clearAllData` |
| Theme | `initTheme` |
| Audio | `initAudio` |
| Confetti | `initConfetti` |
| PWA | `initPWA` |

---

## 3. 事件系统

| 事件名 | 触发模块 | 数据 | 监听模块 |
|--------|----------|------|----------|
| `timer:tick` | timer | `{remaining, elapsed, mode}` | — |
| `timer:complete` | timer | `{mode, completedSessions, actualDuration}` | — |
| `timer:sessionComplete` | timer | `{mode, sessionCount, actualDuration}` | stats, audio, confetti, timer |
| `timer:reset` | timer | `{mode}` | — |
| `timer:modeChange` | timer | `{mode}` | — |
| `timer:incrementPomodoros` | timer | `{taskId}` | app → tasks |
| `settings:dataChanged` | settings | — | app, stats |

---

## 4. 计时器实现

### 计时方式

IIFE 打包版（`main.js`）使用 `setInterval` 主线程计时：

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

ES Module 版（`timer.js`）使用 Web Worker + setInterval 降级方案。

### 状态机

```
         start()           pause()
  IDLE ──────────→ RUNNING ──────────→ PAUSED
   ↑                  │                   │
   │                  │ complete()        │ start()
   │                  ↓                   │
   │              COMPLETED              │
   │                  │                   │
   └──────────────────┴──────────────────┘
```

---

## 5. 存储层

### LocalStorage 键值

| 键 | 类型 | 写入时机 |
|----|------|----------|
| `pomodoro_tasks` | `Task[]` | 增删改任务 |
| `pomodoro_stats` | `StatRecord[]` | 专注完成 |
| `pomodoro_theme` | `"dark"\|"light"` | 切换主题 |
| `pomodoro_pomo_counter` | `string` | 专注完成 |
| `pomodoro_active_task` | `string` | 设置活动任务 |

### 写入安全

- `saveTasks()` 返回 `boolean`，失败时回滚内存状态
- 写入失败显示存储空间不足警告

### 统计缓存

```javascript
var statsCache = null;
var statsCacheDirty = true;

function getStats() {
  if (!statsCacheDirty && statsCache !== null) return statsCache;
  // ... 读取、验证、过滤 ...
  statsCache = filtered;
  statsCacheDirty = false;
  return filtered;
}
```

---

## 6. 安全设计

### CSP 策略

```
default-src 'self' blob: file:;
script-src 'self' blob: file:;
style-src 'self' file:;
img-src 'self' file: data: blob:;
worker-src 'self' blob: file:;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
```

### Electron 安全

```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  allowRunningInsecureContent: false,
  webSecurity: true
}
```

自定义协议 `pomodoro://app/` 替代 `file://`。

---

## 7. CSS 架构

### 设计令牌

```css
:root {
  --font-sans: 'Space Grotesk', ...;
  --font-mono: 'JetBrains Mono', ...;
  --radius-sm: 8px;  --radius-lg: 16px;  --radius-full: 9999px;
  --space-xxs: 4px;  --space-md: 16px;   --space-3xl: 64px;
  --transition-fast: 150ms;  --transition-base: 250ms;
  --shadow-glow: 0 0 20px rgba(232,67,62,0.3);
}
```

### 主题切换

通过 `[data-theme]` 属性覆盖 CSS 变量，暗色为基础，亮色为覆盖。

### 响应式

| 断点 | 布局 |
|------|------|
| < 480px | 单列紧凑 |
| 480-767px | 单列标准 |
| ≥ 768px | 双列（任务 + 统计） |

---

## 8. 无障碍

| 特性 | 实现 |
|------|------|
| ARIA 标签 | 所有交互元素 |
| Live Region | 状态变化播报 |
| 键盘导航 | 全功能可操作 |
| 焦点样式 | `:focus-visible` 2px 轮廓 |
| 触控目标 | 最小 44×44px |
| SVG 图标 | 内联，支持 `currentColor` |
