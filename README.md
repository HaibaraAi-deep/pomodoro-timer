# 🍅 番茄钟 (Pomodoro Timer + Task Tracker)

> 极简番茄钟与任务追踪工具 -- 专注工作，高效管理时间。

一款零依赖的纯前端 PWA 应用。内置精准番茄钟计时器、轻量任务管理、每日专注统计热力图，支持暗色/亮色主题切换，可安装到桌面或手机离线使用。

---

## 功能特性

### 核心计时器
- **三种计时模式**：25 分钟专注、5 分钟短休息、15 分钟长休息
- **SVG 圆形进度环**：实时倒计时，不同模式切换不同配色（番茄红 / 翠绿 / 天蓝）
- **Web Worker 精准计时**：后台线程保持秒级精度，标签页隐藏时不会掉帧或漂移
- **自动模式切换**：每 4 次专注自动进入长休息，专注结束后自动进入休息（可配置）
- **最后一分钟警告**：倒计时数字变红，提醒你抓紧时间
- **计时器发光脉冲动画**：运行时呼吸光效，视觉上感知"正在倒计时"

### 任务管理
- **添加 / 完成 / 删除任务**：输入框 + Enter 键快速添加，复选框一键完成
- **番茄计数**：每项任务记录累计完成的番茄数（🍅 徽章）
- **排序规则**：未完成任务置顶，已完成任务置底并贯穿线 + 半透明
- **入场 / 退场动画**：新任务从左侧滑入，删除任务淡出
- **空状态提示**：无任务时显示引导文案

### 统计面板
- **今日摘要卡片**：今日已完成次数和累计专注分钟数
- **7 天热力图**：GitHub 贡献墙风格，按分钟数分 5 级着色
- **悬停提示**：鼠标悬停显示具体日期、次数和分钟
- **数据持久化**：每次专注完成自动写入 LocalStorage，刷新不丢失

### 主题系统
- **暗色 / 亮色双主题**：CSS 自定义属性驱动，一键切换
- **系统偏好跟随**：首次访问自动匹配 `prefers-color-scheme`
- **手动覆盖持久化**：用户选择保存到 LocalStorage，下次访问生效
- **平滑过渡动画**：背景色、文字色切换带 250ms ease 过渡

### PWA (可安装应用)
- **Service Worker 离线支持**：缓存优先策略，首次访问后离线可用
- **Web App Manifest**：`standalone` 模式，有独立应用图标和启动画面
- **原生安装提示**：底部滑出安装横幅，可在完成首次专注后触发
- **Safe Area 适配**：全面屏刘海、底部指示条安全区域预留

### 交互与动效
- **五彩纸屑庆祝动画**：每次专注完成触发 40 粒子 canvas-free CSS 动画
- **按钮反馈**：hover 高亮、active 缩放，所有可点击区域 >= 44x44px (WCAG)
- **复选框弹性动画**：勾选时弹跳 + 对勾绘制动画
- **响应式布局**：移动端单列，>= 768px 双列布局，横屏优化

---

## 快速开始

本项目为零依赖的纯静态页面，无需安装任何工具链。

### 本地运行

**方式一：直接打开（最简单）**

用浏览器直接打开 `src/index.html` 即可。

**方式二：本地静态服务器（推荐，支持 Service Worker）**

```bash
# 使用 Python 3
cd src
python -m http.server 8080

# 或使用 Node.js (需全局安装 serve)
npx serve src

# 或使用 VS Code Live Server 插件
```

然后访问 `http://localhost:8080`。

> 注意：Service Worker 和 PWA 安装功能需要 HTTPS 或 localhost 环境。

### 浏览器支持

| Chrome | Firefox | Edge | Safari |
|:------:|:-------:|:----:|:------:|
| >= 80  | >= 80   | >= 80| >= 14  |

---

## 技术栈

| 层级 | 技术选型 | 原因 |
|------|---------|------|
| **语言** | Vanilla JavaScript (ES2020+) | 零依赖，最大可移植性，无需构建 |
| **样式** | 纯 CSS + CSS 自定义属性 | 主题切换无需 JS 框架，体积极小 |
| **计时精度** | Web Worker | 标签页后台时保持准确 |
| **存储** | LocalStorage | 简单键值对，满足任务 + 设置 + 统计需求 |
| **PWA** | Service Worker + Web Manifest | 离线优先，可安装，零额外依赖 |
| **模块化** | ES Modules (`type="module"`) | 原生浏览器支持，清晰拆分 |
| **构建** | 无 | 纯 .html / .js / .css 文件，即时迭代 |

---

## 项目结构

```
.
├── README.md                   # 项目说明
├── CONTRIBUTING.md             # 贡献指南
├── CHANGELOG.md                # 版本日志
├── docs/
│   ├── requirements.md         # 项目需求
│   ├── dev-plan.md             # 开发计划
│   ├── research.md             # 竞品研究
│   └── architecture.md         # 架构说明
└── src/
    ├── index.html              # 单页应用入口
    ├── manifest.json           # PWA 清单
    ├── sw.js                   # Service Worker (离线缓存)
    ├── icons/                  # PWA 图标 (192×192, 512×512)
    ├── css/
    │   └── base.css            # CSS Reset + 主题变量 + 组件样式 + 动画
    └── js/
        ├── app.js              # 入口模块，连接所有模块、绑定 DOM 事件
        ├── timer.js            # 计时器控制器 (模式切换、状态机、事件发送)
        ├── timer-worker.js     # Web Worker (后台精准计时)
        ├── tasks.js            # 任务 CRUD + LocalStorage 持久化
        ├── stats.js            # 专注统计 + 热力图数据 + DOM 渲染
        ├── theme.js            # 暗色/亮色主题切换 + 系统偏好检测
        ├── confetti.js         # 完成庆祝纸屑动画
        └── pwa.js              # PWA 安装提示 + beforeinstallprompt 处理
```

---

## PWA 安装说明

### 桌面端 (Chrome / Edge)
1. 使用支持的浏览器打开应用
2. 等待底部出现 **"安装番茄钟应用"** 提示横幅，点击 **安装**
3. 或点击浏览器地址栏右侧的安装图标 ⊕

### 移动端 (Android / iOS)
- **Android Chrome**：打开应用后，底部横幅点击"安装"，或从菜单选择"添加到主屏幕"
- **iOS Safari**：点击分享按钮 → "添加到主屏幕"

安装后，应用将以独立窗口运行（无浏览器地址栏），并支持离线使用。

---

## 截图

<!-- 截图占位区域，建议替换为实际截图 -->

<p align="center"><strong>📸 截图即将添加</strong></p>

---

## 本地存储

所有数据存储在浏览器 LocalStorage 中，完全离线、无服务端。

| 存储 Key | 内容 | 结构 |
|---------|------|------|
| `pomodoro_tasks` | 任务列表 | `[{id, title, completed, pomodoros, createdAt, completedAt}]` |
| `pomodoro_stats` | 专注记录 | `[{date, duration, taskId, timestamp}]` |
| `pomodoro_theme` | 主题偏好 | `"dark"` 或 `"light"` |

---

## 许可证

[MIT](LICENSE)

## 贡献者

<!-- 贡献者列表，按加入时间排序 -->

- [HaibaraAi-deep](https://github.com/HaibaraAi-deep) — 项目发起人 & 产品定义

---

Copyright (c) 2025 Pomodoro Timer + Task Tracker Contributors
