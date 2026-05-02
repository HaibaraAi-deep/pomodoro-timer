# 架构说明 — 番茄钟 (Pomodoro Timer + Task Tracker)

## 概述

番茄钟是一款零依赖的纯前端 PWA 应用。整个项目由单个 HTML 页面、一个 CSS 文件、七个 JS 模块、一个 Service Worker 和一份 PWA Manifest 组成。无需任何构建工具，直接在浏览器中运行。

---

## 模块关系

### 依赖图

```
                    ┌──────────┐
                    │  app.js  │  ← 应用入口，负责初始化和 DOM 事件绑定
                    └───┬──────┘
                        │ import / init
        ┌───────┬───────┼───────┬───────┬───────┬───────┐
        ▼       ▼       ▼       ▼       ▼       ▼       ▼
   ┌─────────┐┌───────┐┌───────┐┌─────────┐┌──────────┐┌─────────┐┌─────────┐
   │timer.js ││tasks  ││stats  ││theme.js ││confetti  ││pwa.js  ││sw.js    │
   │         ││.js    ││.js    ││         ││.js       ││        ││         │
   └────┬────┘└───┬───┘└───┬───┘└─────────┘└──────────┘└─────────┘└─────────┘
        │         │        │
        ▼         ▼        ▼
   ┌─────────┐┌─────────┐┌──────────┐
   │timer-   ││Local    ││Local     │
   │worker.js││Storage  ││Storage   │
   │         ││(tasks)  ││(stats)   │
   └─────────┘└─────────┘└──────────┘
```

### 模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| `app.js` | 应用入口：DOM 事件绑定、模块初始化、Service Worker 注册 | 所有 JS 模块 |
| `timer.js` | 计时器状态机：启动/暂停/重置/跳过/模式切换、Worker 管理、事件发送 | `timer-worker.js` |
| `timer-worker.js` | 后台线程定时循环，通过 `postMessage` 发送 TICK/COMPLETE | 无 |
| `tasks.js` | 任务 CRUD + LocalStorage 持久化 | LocalStorage |
| `stats.js` | 专注统计记录 + 热力图数据查询 + DOM 渲染 | `timer.js`, LocalStorage |
| `theme.js` | 暗色/亮色主题切换 + 系统偏好检测 + 持久化 | LocalStorage |
| `confetti.js` | 完成庆祝粒子动画 (纯 CSS) | 无 |
| `pwa.js` | `beforeinstallprompt` 事件捕获 + 安装提示 UI | 无 |
| `sw.js` | Service Worker：离线缓存 (安装预缓存 + 网络优先) | Cache API |

---

## 数据流

### 用户操作流

```
用户点击 "开始"
       │
       ▼
  app.js (DOM 事件 → startTimer())
       │
       ▼
  timer.js (状态机更新 → postMessage START)
       │
       ▼
  timer-worker.js (后台 setInterval tick)
       │
       │ postMessage({ type: 'TICK', ... })
       ▼
  timer.js (更新 remaining, 触发 updateUI)
       │
       ├──► 更新 DOM (倒计时数字, 进度环, 模式标签)
       │
       └──► document.dispatchEvent('timer:tick')
                  │
                  └──► 其他模块监听 (可选)
```

### 专注完成流

```
timer-worker.js 发送 { type: 'COMPLETE' }
       │
       ▼
timer.js → handleComplete()
       │
       ├──► dispatchEvent('timer:complete')
       │       │
       │       ├──► app.js (UI 更新)
       │       └──► (其他监听者)
       │
       └──► dispatchEvent('timer:sessionComplete')
               │
               ├──► stats.js → recordSession() → LocalStorage
               │                     │
               │                     └──► renderStats() → DOM 更新
               │
               ├──► confetti.js → launchConfetti() → 粒子动画
               │
               └──► pwa.js → 首次完成？→ showInstallPrompt()
```

### LocalStorage 读写流

```
┌─────────────────────────────────────────────────────────┐
│                      LocalStorage                       │
├─────────────────┬─────────────────┬─────────────────────┤
│ pomodoro_tasks  │ pomodoro_stats  │ pomodoro_theme      │
│                 │                 │                     │
│ [{              │ [{              │ "dark" | "light"    │
│   id,           │   date,         │                     │
│   title,        │   duration,     │                     │
│   completed,    │   taskId,       │                     │
│   pomodoros,    │   timestamp     │                     │
│   createdAt,    │ }]              │                     │
│   completedAt   │                 │                     │
│ }]              │                 │                     │
├─────────────────┼─────────────────┼─────────────────────┤
│ tasks.js        │ stats.js        │ theme.js            │
│ loadTasks()     │ getStats()      │ resolveTheme()      │
│ saveTasks()     │ saveStats()     │ saveTheme()         │
│ addTask()       │ recordSession() │                     │
│ deleteTask()    │                 │                     │
│ toggleTask()    │                 │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

---

## 状态管理

### 计时器状态机

```
                    ┌──────────┐
                    │   IDLE   │ ◄──────────────────┐
                    └────┬─────┘                     │
                         │ startTimer()              │
                         ▼                           │
                    ┌──────────┐    pauseTimer()    │
                    │ RUNNING  │ ─────────────────► │
                    └────┬─────┘                     │
                         │ timer complete             │
                         ▼                           │
                    ┌──────────┐                     │
                    │COMPLETED │                     │
                    └────┬─────┘                     │
                         │ auto switch mode          │
                         │ + autoStart → startTimer  │
                         └────────────────────────────┘
                              (或手动开始)
```

状态变量（在 `timer.js` 内部闭包中）：
- `state`: `IDLE` | `RUNNING` | `PAUSED` | `COMPLETED`
- `mode`: `FOCUS` | `SHORT_BREAK` | `LONG_BREAK`
- `remaining`: 当前剩余秒数
- `elapsed`: 已走过秒数
- `focusSessionsCompleted`: 累计完成专注数 (用于决定长休息)
- `autoStartBreaks`: 是否自动开始休息

### 模块间通信方式

| 方式 | 使用场景 | 示例 |
|------|---------|------|
| 导出函数调用 | 直接查询或操作模块状态 | `getState()`, `addTask()`, `getTodayStats()` |
| 自定义事件 | 跨模块广播状态变化 | `timer:tick`, `timer:complete`, `timer:sessionComplete` |

模块之间**不形成循环依赖**。`app.js` 作为唯一的协调器，导入所有模块并连接它们。

---

## 渲染流程

### 初始加载

```
DOMContentLoaded
  │
  ├──► initTimer()       → 创建 Web Worker
  ├──► wireTimerButtons()→ 绑定开始/暂停/重置按钮
  ├──► wireModeButtons() → 绑定模式切换按钮
  ├──► wireSkipButton()  → 绑定跳过按钮
  ├──► initTasks()       → 从 LocalStorage 加载任务 → renderTaskList()
  ├──► initStats()       → 绑定 sessionComplete 事件
  ├──► renderStats()     → 渲染今日统计 + 热力图
  ├──► initTheme()       → 解析主题 → 应用到 DOM
  ├──► initConfetti()    → 绑定 sessionComplete 事件
  ├──► initPWA()         → 监听 beforeinstallprompt
  └──► registerServiceWorker() → 注册 sw.js
```

### 增量渲染

各模块的 `render*()` 函数采用**全量重绘**策略，每次数据变更时清空容器并重建 DOM：

- `updateUI()` (timer.js)：更新倒计时显示、进度环、模式标签、按钮文字
- `renderTaskList()` (app.js)：从 `getTasks()` 获取排序后列表，重建整个 `<ul>`
- `renderStats()` (stats.js)：更新今日摘要文字 + 重建热力图网格

---

## 目录结构

```
project-root/
└── src/                        # 应用源码 (部署目录)
    ├── index.html              # 单页应用入口，CSS/JS 在此汇聚
    ├── manifest.json           # PWA 清单文件
    ├── sw.js                   # Service Worker（离线缓存）
    ├── icons/                  # PWA 应用图标
    │   ├── icon-192.png
    │   └── icon-512.png
    ├── css/
    │   └── base.css            # 完整样式文件 (31 KB)
    │                            #   包含: CSS Reset, 主题变量,
    │                            #   布局, 组件, 响应式, 动画
    └── js/
        ├── app.js              # 入口 + DOM 绑定
        ├── timer.js            # 计时器控制器 + 状态机
        ├── timer-worker.js     # Web Worker 后台计时
        ├── tasks.js            # 任务 CRUD
        ├── stats.js            # 统计查询 + 渲染
        ├── theme.js            # 主题切换
        ├── confetti.js         # 庆祝动画
        └── pwa.js              # PWA 安装提示
```

---

## 设计原则

1. **零依赖**：不引入任何第三方库或框架，减少体积和维护负担
2. **渐进增强**：核心计时器不依赖 Web Worker 也可工作 (降级到 setInterval)，Service Worker 不可用时页面照常加载
3. **关注点分离**：每个 JS 模块只负责一个领域（计时/任务/统计/主题/PWA），通过事件松耦合通信
4. **移动端优先**：CSS 以移动端为基线，通过 `min-width` 媒体查询逐级增强
5. **数据持久化优先**：所有用户数据在操作瞬间写入 LocalStorage，刷新不丢失
6. **可访问性**：语义化 HTML、ARIA 标签、足够的触摸区域、键盘导航支持
