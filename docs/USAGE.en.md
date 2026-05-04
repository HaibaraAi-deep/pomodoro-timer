English | [**中文**](USAGE.md)

---

# 📖 Usage Guide

## 1. Installation

### Clone the Repository

```bash
git clone https://github.com/HaibaraAi-deep/pomodoro-timer.git
cd pomodoro-timer
```

### Browser

**Direct open**: Double-click `src/index.html`

**Local server**:
```bash
cd src && python -m http.server 8080
# or: npx serve src
```
Open `http://localhost:8080`

### Electron Desktop (Windows Only)

```bash
npm install && npm start
```

> ⚠️ macOS and Linux are **not supported** for the Electron build. Use the browser version on those platforms.

---

## 2. Language

Click **EN/中** in the header to switch between Chinese and English. Defaults to Chinese. Your choice persists across sessions.

---

## 3. Timer

| Mode | Duration | Color |
|------|----------|-------|
| Focus | 25 min | Red |
| Short Break | 5 min | Green |
| Long Break | 15 min | Blue |

- **Start/Pause**: Click button or `Space`
- **Reset**: Click icon or `R`
- **Skip**: Click icon or `S`
- Auto long break every 4 focus sessions
- Warning: last 60 seconds → red text
- Paused: blinking display

---

## 4. Tasks

- **Add**: Type + `Enter` or click `+`
- **Set active**: Click task title → red border, pomodoros count here
- **Complete**: Click checkbox
- **Delete**: Hover → `×` (always visible on touch devices)

---

## 5. Stats

- Today's focus: sessions + minutes
- 7-day heatmap: 5 intensity levels
- Auto-persisted, survives refresh

---

## 6. Data Management

Click ⚙ in header:

- **Export**: Download JSON backup
- **Import**: Restore from backup file
- **Clear**: Custom confirm dialog, auto-refreshes UI

---

## 7. Theme

Click 🌙/☀️ to toggle dark/light. Persists across sessions.

---

## 8. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `N` | Focus task input |
| `1` / `2` / `3` | Focus / Short / Long |
| `R` | Reset |
| `S` | Skip |
| `Ctrl+,` | Data management |
| `Escape` | Close panel |

---

## 9. PWA Install

Chrome/Edge on HTTP → click "Install" in footer.

---

## 10. Platform Support

| Platform | Browser | Electron |
|----------|---------|----------|
| Windows | ✅ | ✅ |
| macOS | ✅ | ❌ |
| Linux | ✅ | ❌ |
| Android | ✅ PWA | — |
| iOS | ✅ PWA | — |
