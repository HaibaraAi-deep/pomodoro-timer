[**English**](TECHNICAL.en.md) | 中文

---

# 🏗 技术文档

## 1. 架构

### 设计原则

- **零依赖**：纯 Vanilla JS，无需构建
- **模块化**：每个功能独立模块，职责单一
- **事件驱动**：模块间通过 CustomEvent 通信
- **国际化优先**：所有 UI 文本通过 `t()` 函数获取
- **暗色优先**：暗色主题为基础，亮色为覆盖层

### 双版本架构

| 版本 | 文件 | 加载方式 | 用途 |
|------|------|----------|------|
| ES Module | `src/js/app.js` + 各模块 | `<script type="module">` | HTTP 服务器 |
| IIFE 打包 | `src/js/main.js` | `<script src>` | file:// 协议 |

---

## 2. 国际化系统

### 实现

```javascript
var translations = {
  zh: { focus: '专注', start: '开始', ... },
  en: { focus: 'Focus', start: 'Start', ... }
};

function t(key) { return translations[currentLang][key] || key; }
function tf(key, args) { /* 模板翻译，支持 {0}, {1} */ }
```

### DOM 绑定

三个 `data-*` 属性用于自动翻译：

| 属性 | 更新目标 | 示例 |
|------|----------|------|
| `data-i18n="key"` | `textContent` | `<span data-i18n="focus">专注</span>` |
| `data-i18n-aria="key"` | `aria-label` | `<button data-i18n-aria="reset">` |
| `data-i18n-placeholder="key"` | `placeholder` | `<input data-i18n-placeholder="addTaskPlaceholder">` |

### 语言切换流程

```
用户点击 EN/中
  → toggleLang()
    → currentLang = zh ↔ en
    → saveLang() → localStorage
    → applyI18n() → 更新所有 [data-i18n] 元素
    → updateTimerUI() → 计时器按钮/标签
    → renderStats() → 今日摘要 + 热力图
    → renderTaskList() → 任务 aria-label
    → 重建设置面板（如果已打开）
```

### 持久化

- 键名：`pomodoro_lang`
- 值：`"zh"`（默认）或 `"en"`
- 每次切换保存到 localStorage

---

## 3. 模块 API

| 模块 | 主要导出 |
|------|----------|
| Timer | `initTimer`, `startTimer`, `pauseTimer`, `resetTimer`, `skip`, `setMode`, `getState` |
| Tasks | `addTask`, `deleteTask`, `toggleTask`, `getTasks`, `incrementPomodoros`, `getActiveTaskId`, `setActiveTaskId` |
| Stats | `initStats`, `renderStats`, `getStats`, `getTodayStats`, `getWeeklyStats`, `invalidateStatsCache` |
| Settings | `initSettings`, `exportData`, `clearAllData` |
| Theme | `initTheme` |
| Audio | `initAudio` |
| Confetti | `initConfetti` |
| PWA | `initPWA` |

---

## 4. 事件系统

| 事件 | 来源 | 数据 |
|------|------|------|
| `timer:tick` | timer | `{remaining, elapsed, mode}` |
| `timer:complete` | timer | `{mode, completedSessions, actualDuration}` |
| `timer:sessionComplete` | timer | `{mode, sessionCount, actualDuration}` |
| `timer:incrementPomodoros` | timer | `{taskId}` |
| `settings:dataChanged` | settings | — |

---

## 5. 计时器实现

使用 `setInterval` 实现跨环境可靠计时：

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

状态机：`IDLE → RUNNING → PAUSED → RUNNING → COMPLETED`

---

## 6. 存储

| 键 | 类型 | 写入时机 |
|----|------|----------|
| `pomodoro_tasks` | `Task[]` | 任务增删改 |
| `pomodoro_stats` | `StatRecord[]` | 专注完成 |
| `pomodoro_theme` | `"dark"\|"light"` | 切换主题 |
| `pomodoro_pomo_counter` | `string` | 专注完成 |
| `pomodoro_active_task` | `string` | 设置活动任务 |
| `pomodoro_lang` | `"zh"\|"en"` | 切换语言 |

写入安全：`saveTasks()` 返回布尔值，失败时回滚内存状态。

统计缓存：`statsCache` + `statsCacheDirty` 标志避免重复解析。

---

## 7. 安全

### CSP 策略

```
default-src 'self' blob: file:;
script-src 'self' blob: file:;
style-src 'self' file:;
img-src 'self' file: data: blob:;
worker-src 'self' blob: file:;
frame-ancestors 'none'; object-src 'none';
```

### Electron

自定义协议 `pomodoro://app/`，`sandbox: true`，`webSecurity: true`。

---

## 8. CSS 架构

- 设计令牌通过 CSS Custom Properties 定义
- `[data-theme="light"]` 覆盖暗色默认值
- 响应式：单列 < 768px，双列 ≥ 768px
- 字体：Space Grotesk（界面）+ JetBrains Mono（计时器）

---

## 9. 平台支持

| 平台 | 浏览器 | Electron 桌面 |
|------|--------|---------------|
| Windows | ✅ | ✅（NSIS 安装程序） |
| macOS | ✅ | ❌ 未配置 |
| Linux | ✅ | ❌ 未配置 |

Electron `package.json` 仅定义了 `win.target`，不支持 macOS/Linux 桌面构建。
