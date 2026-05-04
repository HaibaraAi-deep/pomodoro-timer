# Changelog

本文件记录番茄钟项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] — 2026-05-01

### 新增

#### 核心计时器
- 实现三种计时模式：专注 (25 分钟)、短休息 (5 分钟)、长休息 (15 分钟)
- SVG 圆形进度环实时显示倒计时进度，不同模式切换配色
- Web Worker 后台线程精准计时，标签页隐藏时保持精度
- 自动模式切换：每 4 次专注后自动进入长休息
- 专注完成后自动切换至休息模式（可配置）
- 最后 1 分钟倒计时警告（数字变红）
- 计时器呼吸灯发光脉冲动画
- 模式标签实时显示（专注 / 短休息 / 长休息）

#### 任务管理
- 新增任务（输入框 + Enter 键 / 点击添加按钮）
- 完成 / 取消完成任务（自定义复选框动画）
- 删除任务（淡出动画后移除）
- 每项任务记录累计番茄数（🍅 徽章）
- 排序：未完成置顶，已完成置底 + 贯穿线半透明
- 空状态引导提示
- 入场滑入动画 + 退场淡出动画

#### 统计面板
- 今日专注摘要卡片（完成次数 + 总分钟数）
- 7 天 GitHub 风格热力图（5 级着色）
- 热力图悬停 tooltip 显示详细数据
- 每次专注完成自动记录并刷新统计

#### 主题系统
- 暗色主题（默认，`#1a1a2e` 深蓝色背景 + 番茄红强调色）
- 亮色主题（`#f8f9fa` 浅灰色背景）
- 首次访问自动跟随系统 `prefers-color-scheme` 偏好
- 用户手动选择持久化到 LocalStorage
- 主题切换带平滑过渡动画
- 切换按钮显示太阳/月亮图标

#### PWA (渐进式 Web 应用)
- Service Worker 缓存优先策略，离线可用
- Web App Manifest 支持 `standalone` 模式
- 自定义安装提示横幅（底部滑出）
- 完成首次专注后智能推荐安装
- Safe Area 适配（全面屏设备）
- PWA 图标 (192×192, 512×512)

#### 交互与动效
- 五彩纸屑庆祝动画（专注完成时触发，40 粒子 CSS 动画）
- 按钮 hover / active 反馈效果
- 复选框勾选弹跳动画 + 对勾绘制动画
- 所有交互元素 >= 44x44px 触摸目标
- 移动端优先响应式布局
  - < 768px：单列纵向布局
  - >= 768px：双列布局（左侧任务 + 右侧统计）
  - 横屏优化（缩小进度环避免超出屏幕）

#### 安全
- Content Security Policy (CSP) 头配置
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

#### 可访问性
- 语义化 HTML 标签
- ARIA 属性标注
- 键盘可聚焦 + focus-visible 样式
- 屏幕阅读器友好

### 技术架构
- 零外部依赖，纯 Vanilla JS + CSS
- ES Modules 模块化架构
- LocalStorage 持久化（tasks / stats / theme 三键分离）
- CustomEvent 模块间解耦通信
- 无构建步骤，直接编辑即运行

---

[1.0.0]: https://github.com/HaibaraAi-deep/pomodoro-timer/releases/tag/v1.0.0
