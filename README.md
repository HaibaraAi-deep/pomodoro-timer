<div align="center">

[English](README.md) | [中文](README.zh-CN.md)

</div>

# 🍅 Pomodoro Timer

> **Zero-dependency PWA** — Precision timer, task tracking, and focus statistics.  
> Installable on desktop & mobile. Works offline.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

---

## ✨ Features

### ⏱ Core Timer
- **Three timer modes**: 25min Focus, 5min Short Break, 15min Long Break
- **SVG circular progress ring** — real-time countdown with mode-specific colors (tomato red / green / blue)
- **Web Worker precision** — stays accurate even when the tab is backgrounded
- **Auto long break** — enters long break after every 4 focus sessions (configurable)
- **Last-minute warning** — countdown turns red in the final minute
- **Breathing glow animation** — pulsing light effect during active sessions

### 📋 Task Management
- **Add / complete / delete** tasks with instant feedback
- **Pomodoro counter** 🍅 — each task tracks completed focus sessions
- **Smart sorting** — incomplete tasks on top, completed tasks at bottom with strikethrough
- **Smooth animations** — slide-in on add, fade-out on delete
- **Empty state** — friendly guide text when no tasks exist

### 📊 Statistics
- **Today's summary card** — shows completed sessions and total focus minutes
- **7-day heatmap** — GitHub contribution wall style with 5-level intensity coloring
- **Hover tooltip** — detailed data on each day
- **Auto-persisted** — data saved to LocalStorage after every session, survives refresh

### 🎨 Theme System
- **Dark / Light** — one-click toggle via sun/moon icon
- **System preference** — auto-detects `prefers-color-scheme` on first visit
- **Persistent** — user choice saved to LocalStorage
- **Smooth transitions** — 250ms ease transitions on all themed elements

### 📱 PWA (Progressive Web App)
- **Offline support** — Service Worker with cache-first strategy
- **Standalone mode** — runs in its own window like a native app
- **Install prompt** — custom banner slides up from the bottom
- **Safe Area** — adapts to notched displays and status bars

### 🎊 Interactions & Effects
- **Confetti celebration** 🎉 — 40-particle CSS animation on session complete
- **Button feedback** — hover highlight, active scale, all targets ≥ 44×44px (WCAG)
- **Checkbox animation** — bouncy check with animated checkmark
- **Responsive layout** — single column on mobile, dual column at ≥768px

---

## 🚀 Usage

### How to Use the Pomodoro Timer

1. **Open the app** — either run it locally (see below) or use the live demo
2. **Select a timer mode** — Focus (25min), Short Break (5min), or Long Break (15min)
3. **Click Start** — the countdown begins with a visual progress ring
4. **Work until the bell** — the timer auto-switches to break mode when focus ends
5. **Track tasks** — add tasks before or during your session; each completed focus session adds 🍅 to the active task
6. **Review statistics** — check your daily and weekly focus stats on the heatmap panel

> **Pro tip**: Install the app for offline use — click the install prompt that slides up after your first completed focus session.

### Run Locally

This is a zero-dependency static web app — no build tools required.

**Method 1: Open directly (easiest)**

```bash
# Just open src/index.html in your browser
```

**Method 2: Local static server (recommended for Service Worker)**

```bash
# Python 3
cd src
python -m http.server 8080

# Or Node.js
npx serve src

# Or VS Code Live Server extension
```

Then open `http://localhost:8080` in your browser.

> Service Worker and PWA install require HTTPS or localhost.

### For Developers: Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Browser Support

| Chrome | Firefox | Edge | Safari |
|:------:|:-------:|:----:|:------:|
| ≥ 80   | ≥ 80    | ≥ 80 | ≥ 14   |

---

## 🛠 Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | Vanilla JavaScript (ES2020+) | Zero dependencies, no build step |
| Styling | CSS + Custom Properties | Lightweight theming, no framework |
| Timer | Web Worker | Accurate when tab is backgrounded |
| Storage | LocalStorage | Simple key-value, sufficient for small data |
| PWA | Service Worker + Manifest | Offline-first, installable |
| Modules | ES Modules | Native browser support, clean separation |

---

## 📁 Project Structure

```
.
├── README.md                 # Project overview (English)
├── README.zh-CN.md           # Project overview (Chinese)
├── CONTRIBUTING.md           # Contribution guide
├── CHANGELOG.md              # Version history
├── .gitignore                # Git ignore rules
├── docs/                     # Architecture, requirements, reports
└── src/                      # Application source
    ├── index.html            # SPA entry
    ├── manifest.json         # PWA manifest
    ├── sw.js                 # Service Worker (offline cache)
    ├── icons/                # App icons (192px, 512px)
    ├── css/
    │   └── base.css          # Full stylesheet (31 KB)
    └── js/                   # 9 ES modules
        ├── app.js            # Entry, wires all modules
        ├── timer.js          # Timer controller + state machine
        ├── timer-worker.js   # Web Worker background timer
        ├── tasks.js          # Task CRUD + persistence
        ├── stats.js          # Focus stats + heatmap
        ├── theme.js          # Dark/light theme toggle
        ├── audio.js          # Audio notifications
        ├── confetti.js       # Confetti animation
        └── pwa.js            # Install prompt
```

---

## 💾 Data Storage

All data is stored in browser LocalStorage — fully offline, no server.

| Key | Content | Schema |
|-----|---------|--------|
| `pomodoro_tasks` | Task list | `[{id, title, completed, pomodoros, createdAt, completedAt}]` |
| `pomodoro_stats` | Focus records | `[{date, duration, taskId, timestamp}]` |
| `pomodoro_theme` | Theme preference | `"dark" \| "light"` |

---

## 👥 Contributors

- [HaibaraAi-deep](https://github.com/HaibaraAi-deep) — Project Creator & Product Definition

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

[MIT](LICENSE)

Copyright (c) 2026 Pomodoro Timer Contributors
