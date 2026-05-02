# Development Plan — Pomodoro Timer + Task Tracker

## Project Overview

A zero-dependency, single-page Pomodoro timer web application with integrated task tracking, daily focus statistics, and PWA support. Built with vanilla JS, CSS, and LocalStorage -- installable on desktop and mobile, works offline, and maintains timer precision via Web Workers.

## Tech Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| **Language** | Vanilla JavaScript (ES2020+) | Zero dependencies, maximum portability, no build step |
| **Styling** | Plain CSS with CSS Custom Properties | Theme toggling without JS frameworks; small payload |
| **Timer precision** | Web Worker | Keeps timing accurate when tab is backgrounded |
| **Storage** | LocalStorage | Simple key-value store sufficient for tasks + settings + daily stats |
| **PWA** | Service Worker + Web App Manifest | Offline-first, installable, no library needed |
| **Modules** | ES Modules (`type="module"`) | Clean separation, native browser support |
| **No build step** | Plain `.html` / `.js` / `.css` files | Instant iteration, no tooling overhead |

## Architecture Overview

```
project-root/
  index.html              ← Single page shell
  sw.js                   ← Service Worker (offline cache)
  manifest.webmanifest    ← PWA manifest
  assets/
    icons/                ← PWA icons (192×192, 512×512)
  css/
    reset.css             ← Minimal CSS reset
    variables.css         ← CSS custom properties (theming)
    main.css              ← Layout, components, animations
  js/
    app.js                ← Entry point, wires modules together
    timer.worker.js       ← Web Worker: keeps time in background
    timer.js              ← Timer logic (start, pause, reset, tick)
    tasks.js              ← Task CRUD + LocalStorage persistence
    stats.js              ← Daily focus stats + heatmap data
    theme.js              ← Dark/light toggle + persistence
    pwa.js                ← Service Worker registration + install prompt
    confetti.js           ← Completion celebration animation
    audio.js              ← Notification sounds (optional)
    <!-- dom.js 已移除：DOM 工具函数已内联在 app.js 中 -->
```

### Data Flow

```
User Action → Module (timer/tasks/stats) → update DOM → persist to LocalStorage
                                                    ↘ notify other modules via custom events
```

### LocalStorage Schema

```
pomodoro_tasks       → [{ id, title, completed, createdAt, completedAt }]
pomodoro_sessions    → [{ date: "YYYY-MM-DD", duration, sessions }]
pomodoro_settings    → { theme, focusDuration, breakDuration, longBreakDuration, autoStart }
```

---

## Task List

### Phase 1 — Project Setup

---

#### Task 1.1 — Initialize project structure
- **Status:** ✅ done
- **Description:** Create the directory layout, bare HTML shell, CSS reset, and empty JS entry point. Verify the page loads without errors in the browser.
- **Files to create:**
  - `index.html`
  - `css/reset.css`
  - `css/variables.css`
  - `css/main.css`
  - `js/app.js`
  <!-- `js/dom.js` 已移除 — DOM 工具函数已内联在 `js/app.js` 中 -->
- **Acceptance criteria:**
  - `index.html` loads with `<meta charset>`, `<meta viewport>`, `<title>`, and links to all CSS/JS files
  - No console errors on page load
  - CSS reset normalizes browser defaults

---

#### Task 1.2 — Define CSS custom properties and theming system
- **Status:** ✅ done (已随Task 1.1一并实现)
- **Description:** Define the full set of CSS variables in `variables.css` for colors (dark theme default with tomato accent), spacing, typography, border-radius, transitions. Set up a `[data-theme="light"]` override block.
- **Files to create/modify:**
  - `css/variables.css` (full variable set)
- **Acceptance criteria:**
  - Dark theme: near-black background (`#1a1a2e` or similar), warm accent (`#e74c3c` tomato red)
  - Light theme: off-white background, same accent
  - All spacing uses `--space-*` variables
  - Font stack: system fonts (`-apple-system, BlinkMacSystemFont, ...`)
  - Smooth transitions on `background-color`, `color`

---

### Phase 2 — Core Timer

---

#### Task 2.1 — Build the Web Worker timer
- **Status:** ✅ done
- **Description:** Implement a dedicated Web Worker (`timer.worker.js`) that sends `tick` messages at 1-second intervals. It must handle start, pause, reset commands and remain accurate when the main thread is busy or the tab is backgrounded.
- **Files to create:**
  - `js/timer.worker.js`
- **Acceptance criteria:**
  - Worker receives `{ action: "start", duration: N }` and posts `{ type: "tick", remaining: N }` every second
  - Worker receives `{ action: "pause" }` → stops ticking, preserves state
  - Worker receives `{ action: "reset" }` → stops, resets to 0
  - Timer does not drift >1s when tab is backgrounded for 30s

---

#### Task 2.2 — Implement timer module (main thread)
- **Status:** ✅ done
- **Description:** The `timer.js` module manages pomodoro state (focus / short break / long break), instantiates the worker, and exposes `start()`, `pause()`, `reset()`, `skip()`, `getState()`. It tracks completed sessions and emits custom events on state changes (`timer:tick`, `timer:complete`, `timer:modeChange`).
- **Files to create:**
  - `js/timer.js`
- **Files to modify:**
  - `js/app.js` (import and init timer)
- **Acceptance criteria:**
  - Default focus duration: 25 min (1500s), short break: 5 min (300s), long break: 15 min (900s)
  - After focus completes → auto-switch to break mode (with user configurable auto-start)
  - After 4 focus sessions → long break instead of short break
  - Custom events fire correctly on `document`

---

#### Task 2.3 — Build the timer UI (countdown + progress ring)
- **Status:** ✅ done
- **Description:** Build the central visual element: a large centered countdown display (MM:SS format) with an SVG circular progress ring that depletes clockwise. Below it: mode label ("Focus" / "Short Break" / "Long Break") and Pause/Start button.
- **Files to modify:**
  - `index.html` (timer section markup)
  - `css/main.css` (timer styles)
  - `js/app.js` (wire DOM to timer module)
- **Acceptance criteria:**
  - Countdown rendered in large (4-6rem) monospaced type, centered
  - SVG circle stroke-dasharray animated to show progress (0%→100% depleted)
  - Mode label visible, changes color per mode
  - Single button toggles between "Start" and "Pause"
  - Drop-shadow / glow effect on the timer ring during active sessions

---

### Phase 3 — Task Management

---

#### Task 3.1 — Implement task data model and LocalStorage persistence
- **Status:** ✅ done
- **Description:** The `tasks.js` module manages an in-memory task array with CRUD operations and automatic persistence to LocalStorage (`pomodoro_tasks`). Each task has: `id` (UUID-like), `title`, `completed` (bool), `createdAt`, `completedAt`.
- **Files to create:**
  - `js/tasks.js`
- **Acceptance criteria:**
  - `addTask(title)` returns new task object, persists
  - `deleteTask(id)` removes and persists
  - `toggleTask(id)` flips completed, sets/clears `completedAt`, persists
  - `getTasks()` returns sorted (incomplete first, then by createdAt)
  - Data survives page reload

---

#### Task 3.2 — Build task list UI
- **Status:** ✅ done
- **Description:** Render the task list panel: an input field with "Add" button, a scrollable list of task items. Each item shows a checkbox, title text, and delete button. Completed tasks show strikethrough styling and move to the bottom. The currently active task (selected for the timer) is highlighted.
- **Files to modify:**
  - `index.html` (task section markup)
  - `css/main.css` (task list styles)
  - `js/app.js` (wire task DOM to tasks module)
- **Acceptance criteria:**
  - "Add task" input: Enter key or button click adds task
  - Tasks render as a list with checkbox + title + delete (X) icon
  - Completed tasks are struck through, dimmed, sorted to bottom
  - Clicking a task row selects it as the "active" task (visual highlight)
  - Empty state message when no tasks exist
  - Smooth slide-in animation on add, fade-out on delete

---

### Phase 4 — Statistics

---

#### Task 4.1 — Implement session recording and stats module
- **Status:** ✅ done
- **Description:** When a focus session completes, record it to LocalStorage (`pomodoro_sessions`) with the date and duration. The `stats.js` module provides `getTodayStats()`, `getWeekStats()`, `getHeatmapData()` helpers.
- **Files to create:**
  - `js/stats.js`
- **Acceptance criteria:**
  - Each completed focus session recorded as `{ date: "YYYY-MM-DD", duration: 1500, sessions: 1 }`
  - Multiple sessions on same day aggregate into one record (increment sessions, sum duration)
  - `getTodayStats()` returns `{ totalMinutes, totalSessions }` for today
  - `getHeatmapData(days)` returns array of `{ date, count }` for the heatmap

---

#### Task 4.2 — Build daily stats panel and heatmap UI
- **Status:** ✅ done
- **Description:** Display a stats panel showing today's focus minutes and session count. Below it, a GitHub-style contribution heatmap grid (7 rows for days of week, N columns for weeks) color-coded by session count (0 sessions = empty, 1-2 = light, 3-4 = medium, 5+ = dark).
- **Files to modify:**
  - `index.html` (stats section)
  - `css/main.css` (heatmap grid styles)
  - `js/app.js` (wire stats DOM)
- **Acceptance criteria:**
  - "Today: X minutes across Y sessions" displayed prominently
  - Heatmap shows last 12 weeks (84 cells)
  - Color scale uses the accent color at varying opacities
  - Hover tooltip on each cell shows date + session count
  - Panel is collapsible / hidden when not focused

---

### Phase 5 — Polish & UX

---

#### Task 5.1 — Implement dark/light theme toggle
- **Status:** ✅ done
- **Description:** The `theme.js` module reads/writes `data-theme` on `<html>`, persists the choice, and respects `prefers-color-scheme` on first visit. A toggle button (sun/moon icon) in the UI triggers the switch.
- **Files to create:**
  - `js/theme.js`
- **Acceptance criteria:**
  - First visit: respects OS-level `prefers-color-scheme`
  - Toggle button switches between dark and light, persisted to LocalStorage
  - Transition is smooth (CSS transition on background/color)
  - Default: dark theme

---

#### Task 5.2 — Add completion celebration (confetti)
- **Status:** ✅ done
- **Description:** When a focus session completes, trigger a lightweight confetti animation using a `<canvas>` overlay. The `confetti.js` module spawns colored particles that fall and fade over ~2 seconds, then cleans up.
- **Files to create:**
  - `js/confetti.js`
- **Acceptance criteria:**
  - Confetti triggers on `timer:complete` (focus sessions only, not breaks)
  - 50-100 particles: random colors (tomato, gold, warm tones), random velocities
  - Canvas overlay appears above all content, removed after animation
  - Does not block interaction during animation
  - Gracefully skipped if canvas is unsupported (rare)

---

#### Task 5.3 — Polish UI interactions and animations
- **Status:** ✅ done
- **Description:** Add CSS transitions and keyframe animations throughout: button hover/active states, progress ring smooth transition, mode switch fade, task add/remove animations. Ensure consistent 60fps feel.
- **Files to modify:**
  - `css/main.css`
- **Acceptance criteria:**
  - All buttons have `:hover` and `:active` (scale/filter) feedback
  - Progress ring transition uses `transition: stroke-dashoffset 1s linear` 
  - Mode label fades between states
  - Task items animate in (`@keyframes slideIn`) and out (`@keyframes fadeOut`)
  - No layout shifts during animations (use `transform` and `opacity` only)

---

### Phase 6 — Responsive & Mobile

---

#### Task 6.1 — Implement responsive layout (mobile-first)
- **Status:** ✅ done
- **Description:** The layout stacks vertically on narrow screens (timer on top, tasks below, stats last). On wider screens (>=768px), use a two-column layout: timer left, tasks right, stats full-width below. All touch targets are >= 44x44px per WCAG.
- **Files to modify:**
  - `css/main.css` (media queries, flex/grid layout)
- **Acceptance criteria:**
  - < 768px: single column, all content visible without horizontal scroll
  - >= 768px: two-column (timer | tasks), stats full-width below
  - Buttons and interactive elements >= 44px touch target
  - Text scales legibly (16px minimum body text)
  - Tested at 320px, 375px, 768px, 1024px widths

---

### Phase 7 — PWA

---

#### Task 7.1 — Create PWA icons and Web App Manifest
- **Status:** ✅ done
- **Description:** Generate or create SVG/PNG icons at 192x192 and 512x512. Write `manifest.webmanifest` with app name, short name, icons, theme color, background color, display mode (`standalone`), and orientation.
- **Files to create:**
  - `assets/icons/icon-192.png`
  - `assets/icons/icon-512.png`
  - `manifest.webmanifest`
- **Files to modify:**
  - `index.html` (`<link rel="manifest">` and `<meta name="theme-color">`)
- **Acceptance criteria:**
  - Manifest links correctly in `<head>`
  - Icons exist at both sizes (can be simple SVG-exported PNGs for now)
  - `theme_color` matches dark theme background
  - `display: standalone` set
  - Lighthouse PWA audit passes "Web App Manifest" check

---

#### Task 7.2 — Implement Service Worker for offline support
- **Status:** ✅ done
- **Description:** Write `sw.js` with a cache-first strategy. On install, pre-cache the shell (HTML, CSS, JS, icons). On fetch, serve from cache if available, otherwise network → cache → respond. Register the SW in `js/pwa.js`.
- **Files to create:**
  - `sw.js`
  - `js/pwa.js`
- **Files to modify:**
  - `js/app.js` (call PWA init)
- **Acceptance criteria:**
  - SW installs and caches all app shell files
  - App loads offline after first visit
  - Cache versioning (cache name includes version string) for future updates
  - SW registration handles errors gracefully (logs, no crash)

---

#### Task 7.3 — Add install prompt UI
- **Status:** ✅ done
- **Description:** Listen for the `beforeinstallprompt` event and show a custom "Install App" button. On click, trigger the native prompt. After installation, hide the button. Track dismissed state in session.
- **Files to modify:**
  - `js/pwa.js` (beforeinstallprompt handling)
  - `index.html` (install button in header/footer)
  - `css/main.css` (install button styles)
- **Acceptance criteria:**
  - "Install" or "Add to Home Screen" button appears when `beforeinstallprompt` fires
  - Clicking it triggers the native install dialog
  - Button hides after install or dismiss
  - Button does not appear if already in standalone mode

---

### Phase 8 — Testing & Documentation

---

#### Task 8.1 — Manual testing checklist and cross-browser verification
- **Status:** ✅ done
- **Description:** Run through a manual test pass covering all core flows: timer start/pause/reset/complete, task CRUD, theme toggle, stats accuracy, PWA install, offline behavior. Test in Chrome, Firefox, and Edge.
- **Files to modify:**
  - None (testing only)
- **Acceptance criteria:**
  - Focus timer counts down correctly and completes
  - Break auto-starts after focus
  - Task add/edit/delete/complete all work and persist across reload
  - Theme toggle works, persists, respects system preference
  - Stats update correctly after session completion
  - PWA installs and works offline
  - No console errors in any browser

---

#### Task 8.2 — Write inline code documentation
- **Status:** ✅ done
- **Description:** Add JSDoc comments to all public module functions. Document the LocalStorage schema at the top of each storage module. Add a brief module-purpose comment at the top of every JS file.
- **Files to modify:**
  - All `.js` files
- **Acceptance criteria:**
  - Every exported function has a `@param` / `@returns` JSDoc block
  - Storage schema documented as a comment block in `tasks.js` and `stats.js`
  - Each file begins with a one-line purpose comment
  - Comments are in English, concise, and accurate

---

### Phase 9 — Optional Enhancements (stretch goals)

---

#### Task 9.1 — Audio notification on session end
- **Status:** ✅ done
- **Description:** Play a short chime or browser-generated tone when a session ends. Provide a mute toggle. Use the Web Audio API for a simple beep (no external audio file needed).
- **Files to create:**
  - `js/audio.js`
- **Acceptance criteria:**
  - Sound plays on focus session completion and break completion
  - Mute button toggles audio, state persisted

---

#### Task 9.2 — Keyboard shortcuts
- **Status:** ✅ done
- **Description:** Add global keyboard shortcuts: `Space` to start/pause timer, `N` to focus the new-task input, `1-3` to switch timer modes.
- **Files to modify:**
  - `js/app.js`
- **Acceptance criteria:**
  - Space toggles timer (when not typing in an input)
  - `N` focuses the task input
  - Shortcut hint visible in UI (tooltip or footer)

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 — Setup | 2 | Project structure, CSS variables/theming |
| 2 — Core Timer | 3 | Web Worker, timer logic, countdown UI |
| 3 — Tasks | 2 | Data model + persistence, task list UI |
| 4 — Statistics | 2 | Session recording, heatmap panel |
| 5 — Polish | 3 | Theme toggle, confetti, animations |
| 6 — Responsive | 1 | Mobile-first responsive layout |
| 7 — PWA | 3 | Manifest, Service Worker, install prompt |
| 8 — Testing & Docs | 2 | Manual QA, JSDoc |
| 9 — Optional | 2 | Audio, keyboard shortcuts |

**Total tasks: 21** (19 core + 2 stretch)
