English | [**中文**](README.md)

---

<div align="center">

# 🍅 Pomodoro Timer

**Minimalist Pomodoro Timer & Task Tracker PWA**

Dark-first · Bilingual · Zero Dependencies · Offline-ready

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

</div>

---

## ✨ Features

- ⏱ **Three timer modes**: 25 min focus / 5 min short break / 15 min long break
- 📋 **Task management**: Add, complete, delete; click title to set as active focus task
- 📊 **Focus stats**: Today's summary + 7-day heatmap
- 🌙 **Dark / Light theme**: One-click toggle, auto-saved
- 🌐 **Bilingual**: Click **EN/中** in header to switch, defaults to Chinese
- 📱 **PWA**: Offline-ready, installable to desktop
- 🔒 **Security hardened**: Strict CSP, Electron sandbox
- 💾 **Data management**: Export / Import / Clear with custom dialogs

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Git | Any | For cloning |
| Node.js | ≥ 16 | Electron only |
| Modern browser | Chrome/Firefox/Edge ≥ 80 | Web usage |

### Step 1: Clone the Repository

```bash
git clone https://github.com/HaibaraAi-deep/pomodoro-timer.git
cd pomodoro-timer
```

### Step 2: Choose Your Platform

#### 🌐 Option A: Browser (Recommended)

**Method 1: Direct open**

Simply double-click `src/index.html` to open in your default browser.

> ⚠️ Service Worker and PWA install require HTTP/HTTPS. For full functionality, use Method 2.

**Method 2: Local server**

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

Open `http://localhost:8080`.

**Method 3: VS Code Live Server**

1. Install the "Live Server" extension in VS Code
2. Right-click `src/index.html` → "Open with Live Server"

#### 🖥 Option B: Electron Desktop App (Windows Only)

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build Windows installer
npm run build
```

The built installer will be in the `dist/` directory.

---

## 💻 Platform Support

| Platform | Browser | Electron Desktop |
|----------|---------|------------------|
| **Windows** | ✅ | ✅ |
| **macOS** | ✅ | ❌ Not supported |
| **Linux** | ✅ | ❌ Not supported |
| **Android** | ✅ (PWA) | — |
| **iOS** | ✅ (PWA) | — |

> **Note**: The Electron desktop app is configured for Windows only (`package.json` → `win.target: nsis`). macOS and Linux are not supported for the desktop build. Use the browser version instead.

---

## ⌨️ Keyboard Shortcuts

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

## 🌐 Language

Click the **EN/中** button in the header to switch between Chinese and English. Defaults to Chinese. Your choice is saved and persists across sessions.

---

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Language | Vanilla JavaScript (ES2020+) |
| Fonts | Space Grotesk + JetBrains Mono |
| Styling | CSS Custom Properties |
| Timer | setInterval |
| Storage | LocalStorage |
| i18n | Built-in dictionary + `data-i18n` attributes |
| PWA | Service Worker + Manifest |
| Desktop | Electron (Windows only) |

---

## 📁 Project Structure

```
├── main.js                   # Electron main process
├── package.json
├── docs/                     # Documentation
│   ├── USAGE.en.md           # Usage guide (English)
│   ├── USAGE.md              # Usage guide (Chinese)
│   ├── TECHNICAL.en.md       # Technical docs (English)
│   ├── TECHNICAL.md          # Technical docs (Chinese)
│   └── FIX_REPORT.md         # Fix report
└── src/
    ├── index.html            # App entry
    ├── manifest.json         # PWA manifest
    ├── sw.js                 # Service Worker
    ├── icons/
    ├── css/
    │   └── base.css          # Full stylesheet
    └── js/
        ├── main.js           # IIFE bundle
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

## 💾 Data Storage

All data is stored in browser localStorage, fully offline, no server required.

| Key | Content |
|-----|---------|
| `pomodoro_tasks` | Task list |
| `pomodoro_stats` | Focus records |
| `pomodoro_theme` | Theme preference |
| `pomodoro_pomo_counter` | Focus session count |
| `pomodoro_active_task` | Active task ID |
| `pomodoro_lang` | Language preference |

---

## 📄 License

[MIT](LICENSE)
