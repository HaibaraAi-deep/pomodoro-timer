[**English**](README.en.md) | 中文

---

<div align="center">

# 🍅 Pomodoro Timer

**极简番茄钟与任务追踪 PWA 应用**

暗色优先 · 中英双语 · 零依赖 · 离线可用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

</div>

---

## ✨ 功能特性

- ⏱ **三种计时模式**：25 分钟专注 / 5 分钟短休息 / 15 分钟长休息
- 📋 **任务管理**：添加、完成、删除，点击标题设为当前专注任务
- 📊 **专注统计**：今日摘要 + 7 天热力图
- 🌙 **暗色 / 亮色主题**：一键切换，自动保存
- 🌐 **中英双语**：点击顶栏 **EN/中** 切换，默认中文
- 📱 **PWA**：离线可用，可安装到桌面
- 🔒 **安全加固**：严格 CSP 策略、Electron 沙箱
- 💾 **数据管理**：导出 / 导入 / 清除，自定义对话框

---

## 🚀 快速开始

### 前置要求

| 工具 | 版本 | 是否必需 |
|------|------|----------|
| Git | 任意 | 克隆仓库 |
| Node.js | ≥ 16 | 仅 Electron 需要 |
| 现代浏览器 | Chrome/Firefox/Edge ≥ 80 | 网页使用 |

### 第一步：克隆仓库

```bash
git clone https://github.com/HaibaraAi-deep/pomodoro-timer.git
cd pomodoro-timer
```

### 第二步：选择使用方式

#### 🌐 方式 A：浏览器使用（推荐）

**方法 1：直接打开**

双击 `src/index.html` 即可在浏览器中使用。

> ⚠️ Service Worker 和 PWA 安装需要 HTTP/HTTPS 环境，完整功能请使用方法 2。

**方法 2：本地服务器**

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

打开 `http://localhost:8080`。

**方法 3：VS Code Live Server**

1. 安装 VS Code 的 "Live Server" 扩展
2. 右键 `src/index.html` → "Open with Live Server"

#### 🖥 方式 B：Electron 桌面应用（仅 Windows）

```bash
# 安装依赖
npm install

# 开发模式运行
npm start

# 打包 Windows 安装程序
npm run build
```

打包后的安装程序在 `dist/` 目录中。

---

## 💻 平台支持

| 平台 | 浏览器 | Electron 桌面 |
|------|--------|---------------|
| **Windows** | ✅ | ✅ |
| **macOS** | ✅ | ❌ 不支持 |
| **Linux** | ✅ | ❌ 不支持 |
| **Android** | ✅（PWA） | — |
| **iOS** | ✅（PWA） | — |

> **说明**：Electron 桌面应用仅配置了 Windows 打包（`package.json` → `win.target: nsis`）。macOS 和 Linux 不支持桌面版，请使用浏览器版本。

---

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 开始 / 暂停 |
| `N` | 聚焦任务输入框 |
| `1` / `2` / `3` | 专注 / 短休息 / 长休息 |
| `R` | 重置计时器 |
| `S` | 跳过当前计时 |
| `Ctrl+,` | 打开数据管理 |
| `Escape` | 关闭面板 |

---

## 🌐 语言切换

点击顶栏的 **EN/中** 按钮即可切换中英文，默认中文。选择会自动保存到浏览器，下次打开保持不变。

---

## 🛠 技术栈

| 层级 | 选择 |
|------|------|
| 语言 | Vanilla JavaScript (ES2020+) |
| 字体 | Space Grotesk + JetBrains Mono |
| 样式 | CSS Custom Properties |
| 计时 | setInterval |
| 存储 | LocalStorage |
| 国际化 | 内置字典 + `data-i18n` 属性 |
| PWA | Service Worker + Manifest |
| 桌面 | Electron（仅 Windows） |

---

## 📁 项目结构

```
├── main.js                   # Electron 主进程
├── package.json
├── docs/                     # 文档
│   ├── USAGE.md              # 使用说明（中文）
│   ├── USAGE.en.md           # 使用说明（英文）
│   ├── TECHNICAL.md          # 技术文档（中文）
│   ├── TECHNICAL.en.md       # 技术文档（英文）
│   └── FIX_REPORT.md         # 修复报告
└── src/
    ├── index.html            # 应用入口
    ├── manifest.json         # PWA 清单
    ├── sw.js                 # Service Worker
    ├── icons/
    ├── css/
    │   └── base.css          # 完整样式表
    └── js/
        ├── main.js           # IIFE 打包文件
        ├── app.js            # ES Module 入口
        ├── timer.js          # 计时器控制器
        ├── tasks.js          # 任务 CRUD
        ├── stats.js          # 专注统计
        ├── settings.js       # 数据管理
        ├── theme.js          # 主题切换
        ├── audio.js          # 音频通知
        ├── confetti.js       # 撒花动画
        └── pwa.js            # 安装提示
```

---

## 💾 数据存储

所有数据存储在浏览器 localStorage，完全离线，无需服务器。

| 键 | 内容 |
|----|------|
| `pomodoro_tasks` | 任务列表 |
| `pomodoro_stats` | 专注记录 |
| `pomodoro_theme` | 主题偏好 |
| `pomodoro_pomo_counter` | 专注计数 |
| `pomodoro_active_task` | 活动任务 ID |
| `pomodoro_lang` | 语言偏好 |

---

## 📄 许可证

[MIT](LICENSE)
