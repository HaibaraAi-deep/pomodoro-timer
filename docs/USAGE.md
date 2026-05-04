# 📖 Usage Guide / 使用说明

---

## 1. Installation / 安装

### Clone / 克隆

```bash
git clone https://github.com/HaibaraAi-deep/pomodoro-timer.git
cd pomodoro-timer
```

### Browser / 浏览器

**Direct open / 直接打开**: Double-click `src/index.html`

**Local server / 本地服务器**:
```bash
cd src && python -m http.server 8080
# or: npx serve src
```
Open `http://localhost:8080`

### Electron Desktop (Windows Only) / 桌面应用（仅 Windows）

```bash
npm install && npm start
```

> ⚠️ macOS and Linux are **not supported** for the Electron build. Use the browser version on those platforms.

---

## 2. Language / 语言

Click **EN/中** in the header to switch between Chinese (default) and English. Your choice persists across sessions.

点击顶栏 **EN/中** 切换语言，默认中文，选择自动保存。

---

## 3. Timer / 计时器

| Mode / 模式 | Duration / 时长 | Color / 颜色 |
|---|---|---|
| Focus / 专注 | 25 min | Red / 红 |
| Short Break / 短休息 | 5 min | Green / 绿 |
| Long Break / 长休息 | 15 min | Blue / 蓝 |

- **Start/Pause**: Click button or `Space`
- **Reset**: Click icon or `R`
- **Skip**: Click icon or `S`
- Auto long break every 4 focus sessions
- Warning: last 60 seconds → red text
- Paused: blinking display

---

## 4. Tasks / 任务

- **Add**: Type + `Enter` or click `+`
- **Set active**: Click task title → red border, pomodoros count here
- **Complete**: Click checkbox
- **Delete**: Hover → `×` (always visible on touch devices)

---

## 5. Stats / 统计

- Today's focus: sessions + minutes
- 7-day heatmap: 5 intensity levels
- Auto-persisted, survives refresh

---

## 6. Data Management / 数据管理

Click ⚙ in header:

- **Export**: Download JSON backup
- **Import**: Restore from backup file
- **Clear**: Custom confirm dialog, auto-refreshes UI

---

## 7. Theme / 主题

Click 🌙/☀️ to toggle dark/light. Persists across sessions.

---

## 8. Keyboard Shortcuts / 快捷键

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `N` | Focus task input |
| `1`/`2`/`3` | Focus / Short / Long |
| `R` | Reset |
| `S` | Skip |
| `Ctrl+,` | Data management |
| `Escape` | Close panel |

---

## 9. PWA Install / PWA 安装

Chrome/Edge on HTTP → click "Install" in footer.

---

## 10. Platform Support / 平台支持

| Platform | Browser | Electron |
|----------|---------|----------|
| Windows | ✅ | ✅ |
| macOS | ✅ | ❌ |
| Linux | ✅ | ❌ |
| Android | ✅ PWA | N/A |
| iOS | ✅ PWA | N/A |
