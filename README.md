<div align="center">

# 🍅 Pomodoro Timer

**Minimalist Pomodoro Timer & Task Tracker PWA**

暗色优先 · 中英双语 · 零依赖 · 离线可用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Languages](https://img.shields.io/badge/lang-中文%20%7C%20English-blue)

</div>

---

## ✨ Features / 功能

| | 中文 | English |
|---|------|---------|
| ⏱ | 25/5/15 分钟计时器 | 25/5/15 min timer |
| 📋 | 任务管理 + 活动任务选择 | Task management + active task |
| 📊 | 今日统计 + 7 天热力图 | Today's stats + 7-day heatmap |
| 🌙 | 暗色 / 亮色主题 | Dark / Light theme |
| 🌐 | 中英双语切换 | Chinese / English toggle |
| 📱 | PWA 离线可安装 | PWA offline installable |
| 🔒 | CSP 严格策略 | Strict CSP |
| 💾 | 数据导出 / 导入 / 清除 | Data export / import / clear |

---

## 🚀 Getting Started / 快速开始

### Prerequisites / 前置要求

| Tool | Version | Required |
|------|---------|----------|
| Git | Any | For cloning |
| Node.js | ≥ 16 | For Electron only |
| A modern browser | Chrome/Firefox/Edge ≥ 80 | For web usage |

### Step 1: Clone the Repository / 克隆仓库

```bash
git clone https://github.com/HaibaraAi-deep/pomodoro-timer.git
cd pomodoro-timer
```

### Step 2: Choose Your Platform / 选择使用方式

#### 🌐 Option A: Browser (Recommended) / 浏览器使用（推荐）

**Method 1: Direct open / 直接打开**

Simply double-click `src/index.html` to open in your default browser.

> ⚠️ Service Worker and PWA install require HTTP/HTTPS. For full functionality, use Method 2.

**Method 2: Local server / 本地服务器**

```bash
# Python 3
cd src
python -m http.server 8080

# Node.js
npx serve src

# PHP
cd src
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

**Method 3: VS Code Live Server / VS Code 实时服务器**

1. Install the "Live Server" extension in VS Code
2. Right-click `src/index.html` → "Open with Live Server"

#### 🖥 Option B: Electron Desktop App (Windows Only) / Electron 桌面应用（仅 Windows）

```bash
# Install dependencies / 安装依赖
npm install

# Run in development mode / 开发模式运行
npm start

# Build Windows installer / 打包 Windows 安装程序
npm run build
```

The built installer will be in `dist/` directory.

---

## 💻 Platform Support / 平台支持

| Platform | Web (Browser) | Electron Desktop |
|----------|:-------------:|:----------------:|
| **Windows** | ✅ | ✅ |
| **macOS** | ✅ | ❌ Not supported |
| **Linux** | ✅ | ❌ Not supported |
| **Android** | ✅ (PWA) | N/A |
| **iOS** | ✅ (PWA) | N/A |

> **Note**: The Electron desktop app is configured for Windows only (`package.json` → `win.target: nsis`). macOS and Linux are not supported for the desktop build. Use the browser version instead.

---

## ⌨️ Keyboard Shortcuts / 键盘快捷键

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `N` | Focus task input |
| `1` / `2` / `3` | Focus / Short Break / Long Break |
| `R` | Reset timer |
| `S` | Skip session |
| `Ctrl+,` | Open data management |
| `Escape` | Close panel |

---

## 🌐 Language / 语言

Click the **EN/中** button in the header to switch between Chinese and English. Your choice is saved and persists across sessions.

点击顶栏的 **EN/中** 按钮即可切换中英文，选择会自动保存。

---

## 🛠 Tech Stack / 技术栈

| Layer | Choice |
|-------|--------|
| Language | Vanilla JavaScript (ES2020+) |
| Fonts | Space Grotesk + JetBrains Mono |
| Styling | CSS Custom Properties |
| Timer | setInterval |
| Storage | LocalStorage |
| i18n | Built-in dictionary + `data-i18n` attributes |
| PWA | Service Worker + Manifest |
| Desktop | Electron (Windows) |

---

## 📁 Project Structure / 项目结构

```
├── main.js                   # Electron main process
├── package.json
├── docs/                     # Documentation
└── src/
    ├── index.html            # SPA entry
    ├── manifest.json         # PWA manifest
    ├── sw.js                 # Service Worker
    ├── icons/
    ├── css/
    │   └── base.css          # Full stylesheet
    └── js/
        ├── main.js           # IIFE bundle (file:// compatible)
        ├── app.js            # ES Module entry
        ├── timer.js          # Timer controller
        ├── tasks.js          # Task CRUD
        ├── stats.js          # Focus statistics
        ├── settings.js       # Data management
        ├── theme.js          # Theme toggle
        ├── audio.js          # Audio notification
        ├── confetti.js       # Confetti animation
        └── pwa.js            # Install prompt
```

---

## 💾 Data Storage / 数据存储

All data is stored in browser localStorage, fully offline.

| Key | Content |
|-----|---------|
| `pomodoro_tasks` | Task list |
| `pomodoro_stats` | Focus records |
| `pomodoro_theme` | Theme preference |
| `pomodoro_pomo_counter` | Focus session count |
| `pomodoro_active_task` | Active task ID |
| `pomodoro_lang` | Language preference (`zh` / `en`) |

---

## 📄 License / 许可证

[MIT](LICENSE)
