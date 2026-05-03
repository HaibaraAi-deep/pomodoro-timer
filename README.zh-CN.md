<div align="center">

[English](../README.md) | [中文](README.zh-CN.md)

</div>

# 🍅 番茄钟 (Pomodoro Timer)

> **零依赖 PWA 应用** — 精准计时、任务管理、专注统计  
> 可安装到桌面和手机，离线可用。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

---

## ✨ 功能特性

### ⏱ 核心计时器
- **三种计时模式**：25 分钟专注、5 分钟短休息、15 分钟长休息
- **SVG 圆形进度环**：实时倒计时，不同模式切换配色（番茄红 / 翠绿 / 天蓝）
- **Web Worker 精准计时**：标签页隐藏在后台也能保持秒级精度
- **自动长休息**：每完成 4 次专注自动进入长休息（可配置）
- **最后一分钟警告**：倒计时数字变红，提醒抓紧时间
- **呼吸灯动画**：运行时发光脉冲效果

### 📋 任务管理
- **添加 / 完成 / 删除** 任务，即时反馈
- **番茄计数** 🍅：每项任务自动累计完成的专注次数
- **智能排序**：未完成任务置顶，已完成任务置底并加贯穿线
- **流畅动画**：新增时左侧滑入，删除时淡出
- **空状态引导**：无任务时显示友好的引导文字

### 📊 统计面板
- **今日摘要卡片**：显示已完成次数和累计专注分钟数
- **7 天热力图**：GitHub 贡献墙风格，5 级着色区分强度
- **悬停提示**：鼠标悬停显示具体日期、次数和时长
- **自动持久化**：每次专注完成自动写入 LocalStorage，刷新不丢失

### 🎨 主题系统
- **暗色 / 亮色**：一键切换（太阳/月亮图标）
- **跟随系统**：首次访问自动匹配 `prefers-color-scheme`
- **持久化**：用户选择保存到 LocalStorage，下次访问生效
- **平滑过渡**：所有主题元素带 250ms 过渡动画

### 📱 PWA （渐进式 Web 应用）
- **离线支持**：Service Worker 缓存优先策略
- **独立窗口**：像原生应用一样运行
- **安装提示**：底部滑出自定义安装横幅
- **全面屏适配**：适配刘海屏和状态栏

### 🎊 交互与动效
- **五彩纸屑庆祝** 🎉：每次专注完成触发 40 粒子 CSS 动画
- **按钮反馈**：悬停高亮、点击缩放，所有触摸区域 ≥ 44×44px
- **复选框动画**：弹性勾选 + 对勾绘制动画
- **响应式布局**：移动端单列，≥768px 双列

---

## 🚀 使用方法

### 如何使用番茄钟

1. **打开应用** — 本地运行或使用在线演示
2. **选择计时模式** — 专注（25分钟）、短休息（5分钟）或长休息（15分钟）
3. **点击开始** — 倒计时开始，进度环实时显示剩余时间
4. **专注直到提示** — 专注结束后自动进入休息模式
5. **管理任务** — 在开始前或进行中添加任务，每次完成的专注自动为当前任务添加 🍅
6. **查看统计** — 在热力图面板查看每日和每周的专注数据

> **小技巧**：完成首次专注后，安装提示会自动弹出，点击即可安装到桌面离线使用。

### 本地运行

本项目为零依赖纯静态页面，无需安装任何工具链。

**方式一：直接打开（最简单）**

```bash
# 用浏览器直接打开 src/index.html 即可
```

**方式二：本地静态服务器（推荐，支持 Service Worker）**

```bash
# Python 3
cd src
python -m http.server 8080

# 或使用 Node.js
npx serve src

# 或 VS Code Live Server 插件
```

然后在浏览器中打开 `http://localhost:8080`。

> 注意：Service Worker 和 PWA 安装需要 HTTPS 或 localhost 环境。

### 给开发者的贡献指南

欢迎贡献代码！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献规范。

### 浏览器支持

| Chrome | Firefox | Edge | Safari |
|:------:|:-------:|:----:|:------:|
| ≥ 80   | ≥ 80    | ≥ 80 | ≥ 14   |

---

## 🛠 技术栈

| 层级 | 技术选型 | 原因 |
|------|---------|------|
| 语言 | Vanilla JavaScript (ES2020+) | 零依赖，无需构建 |
| 样式 | CSS + 自定义属性 | 主题切换轻量，无需框架 |
| 计时精度 | Web Worker | 标签页隐藏时保持准确 |
| 存储 | LocalStorage | 简单键值对，满足需求 |
| PWA | Service Worker + Manifest | 离线优先，可安装 |
| 模块化 | ES Modules | 浏览器原生支持，清晰拆分 |

---

## 📁 项目结构

```
.
├── README.md                 # 项目概述（英文）
├── README.zh-CN.md           # 项目概述（中文）
├── CONTRIBUTING.md           # 贡献指南
├── CHANGELOG.md              # 版本日志
├── .gitignore                # Git 忽略规则
├── docs/                     # 架构说明、需求文档、报告
└── src/                      # 应用源码
    ├── index.html            # 单页应用入口
    ├── manifest.json         # PWA 清单
    ├── sw.js                 # Service Worker（离线缓存）
    ├── icons/                # 应用图标（192px, 512px）
    ├── css/
    │   └── base.css          # 完整样式表（31 KB）
    └── js/                   # 9 个 ES 模块
        ├── app.js            # 入口，连接所有模块
        ├── timer.js          # 计时器控制器 + 状态机
        ├── timer-worker.js   # Web Worker 后台计时
        ├── tasks.js          # 任务 CRUD + 持久化
        ├── stats.js          # 专注统计 + 热力图
        ├── theme.js          # 暗色/亮色主题切换
        ├── audio.js          # 音频通知
        ├── confetti.js       # 庆祝纸屑动画
        └── pwa.js            # 安装提示
```

---

## 💾 数据存储

所有数据存储在浏览器 LocalStorage 中，完全离线、无服务端。

| 存储键 | 内容 | 数据结构 |
|--------|------|---------|
| `pomodoro_tasks` | 任务列表 | `[{id, title, completed, pomodoros, createdAt, completedAt}]` |
| `pomodoro_stats` | 专注记录 | `[{date, duration, taskId, timestamp}]` |
| `pomodoro_theme` | 主题偏好 | `"dark" \| "light"` |

---

## 👥 贡献者

- [HaibaraAi-deep](https://github.com/HaibaraAi-deep) — 项目发起人 & 产品定义

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 📄 许可证

[MIT](LICENSE)

Copyright (c) 2026 Pomodoro Timer Contributors
