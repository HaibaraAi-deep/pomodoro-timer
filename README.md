<div align="center">

# 🍅 Pomodoro Timer

**极简番茄钟与任务追踪 PWA 应用**

暗色优先 · 现代产品风 · 零依赖 · 离线可用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

</div>

---

## ✨ 功能特性

### ⏱ 计时器
- **三种模式**：25 分钟专注 / 5 分钟短休息 / 15 分钟长休息
- **SVG 圆环进度**：模式对应颜色（番茄红 / 翡翠绿 / 靛蓝），发光阴影
- **精确计时**：setInterval 主线程计时，所有环境可靠运行
- **自动长休息**：每 4 次专注后自动进入长休息
- **最后一分钟警告**：数字变红
- **暂停状态区分**：暂停时数字闪烁

### 📋 任务管理
- **添加 / 完成 / 删除**：即时反馈，流畅动画
- **活动任务选择**：点击任务标题设为当前专注任务
- **番茄计数器** 🍅：每个任务追踪专注次数
- **智能排序**：未完成置顶，已完成置底

### 📊 专注统计
- **今日摘要**：完成次数和总专注分钟数
- **7 天热力图**：5 级强度着色，悬停显示详情
- **内存缓存**：避免重复解析 localStorage

### 🎨 主题系统
- **暗色 / 亮色**：一键切换，SVG 图标自适应
- **Space Grotesk + JetBrains Mono**：现代产品风字体组合
- **CSS Custom Properties**：完整设计令牌系统

### 📱 PWA
- **离线支持**：Service Worker 缓存优先
- **独立窗口**：像原生应用一样运行

### 🔒 安全
- **CSP 严格策略**：无 `unsafe-inline`
- **Electron 安全加固**：自定义协议、沙箱
- **自定义模态对话框**：替代原生 `confirm()`/`alert()`

### 💾 数据管理
- **数据导出 / 导入**：JSON 备份与恢复
- **清除数据**：自定义确认对话框

---

## 🚀 快速开始

### 方式一：直接打开

双击 `src/index.html` 即可在浏览器中使用。

### 方式二：本地服务器（推荐）

```bash
cd src && python -m http.server 8080
# 或 npx serve src
```

打开 `http://localhost:8080`。

### 方式三：Electron 桌面应用

```bash
npm install && npm start
```

---

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 开始 / 暂停 |
| `N` | 聚焦任务输入 |
| `1` / `2` / `3` | 专注 / 短休息 / 长休息 |
| `R` | 重置计时器 |
| `S` | 跳过当前计时 |
| `Ctrl+,` | 打开数据管理 |
| `Escape` | 关闭面板 |

---

## 🛠 技术栈

| 层级 | 选择 | 理由 |
|------|------|------|
| 语言 | Vanilla JavaScript (ES2020+) | 零依赖 |
| 字体 | Space Grotesk + JetBrains Mono | 现代产品风 |
| 样式 | CSS Custom Properties | 轻量主题系统 |
| 计时 | setInterval | 全环境可靠 |
| 存储 | LocalStorage | 简单持久化 |
| PWA | Service Worker + Manifest | 离线可安装 |
| 桌面 | Electron | 跨平台 |

---

## 📁 项目结构

```
├── main.js                   # Electron 主进程
├── package.json
├── docs/                     # 文档
└── src/
    ├── index.html            # SPA 入口
    ├── manifest.json         # PWA 清单
    ├── sw.js                 # Service Worker
    ├── icons/
    ├── css/
    │   └── base.css          # 完整样式（设计令牌 + 组件）
    └── js/
        ├── main.js           # IIFE 打包文件（直接打开用）
        ├── app.js            # ES Module 入口
        ├── timer.js          # 计时器控制器
        ├── timer-worker.js   # Web Worker
        ├── tasks.js          # 任务 CRUD
        ├── stats.js          # 专注统计
        ├── settings.js       # 数据管理
        ├── theme.js          # 主题切换
        ├── audio.js          # 音频通知
        ├── confetti.js       # 撒花动画
        └── pwa.js            # 安装提示
```

---

## 🎨 设计系统

### 色彩

| 用途 | 暗色 | 亮色 |
|------|------|------|
| 背景 | `#0f0f14` | `#f5f5f7` |
| 卡片 | `#1c1c28` | `#ffffff` |
| 强调 | `#e8433e` | `#d63031` |
| 成功 | `#2dd4a0` | `#00b894` |
| 长休息 | `#6c8cff` | `#4a6cf7` |

### 字体

- **UI 文字**：Space Grotesk（几何无衬线，现代产品感）
- **计时器数字**：JetBrains Mono（等宽，清晰可读）

---

## 💾 数据存储

| 键 | 内容 |
|----|------|
| `pomodoro_tasks` | 任务列表 |
| `pomodoro_stats` | 专注记录 |
| `pomodoro_theme` | 主题偏好 |
| `pomodoro_pomo_counter` | 专注计数 |
| `pomodoro_active_task` | 活动任务 ID |

---

## 📄 许可证

[MIT](LICENSE)
