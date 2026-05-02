# 贡献指南

感谢你对番茄钟项目的关注！这份文档将帮助你了解如何参与贡献。

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境](#开发环境)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

---

## 行为准则

本项目遵循贡献者公约。我们希望每位参与者都能在友好、尊重的氛围中协作。

---

## 如何贡献

### 报告 Bug

在提交 Bug 报告前，请：
1. 搜索已有 Issue，确认该问题未被报告
2. 使用 Bug 报告模板（如有）

Bug 报告应包含：
- 浏览器名称和版本
- 操作系统
- 复现步骤
- 预期行为 vs 实际行为
- 截图（如适用）

### 提出新功能

在提出新功能前，请：
1. 搜索已有 Issue，确认该功能未被提议
2. 在 Issue 中描述使用场景和预期行为
3. 等待维护者确认后再开始实现

### 贡献代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature-name`
3. 提交你的修改
4. 推送到你的 Fork：`git push origin feature/your-feature-name`
5. 创建 Pull Request

---

## 开发环境

本项目是零依赖的纯前端项目，无需安装任何构建工具。

### 启动开发服务器

```bash
# 进入 src 目录，用任意静态服务器启动
cd src

# Python 3
python -m http.server 8080

# 或 Node.js
npx serve .

# 或直接双击打开 index.html（注意：Service Worker 仅在 localhost/HTTPS 下激活）
```

### 项目不依赖构建工具

- 无需 `npm install`
- 无需 `webpack` / `vite` / `rollup`
- 修改代码后刷新浏览器即可看到效果
- ES Modules 由浏览器原生加载

---

## 代码规范

### JavaScript

- **模块系统**：使用 ES Modules (`import` / `export`)
- **命名约定**：
  - 函数：驼峰式 `camelCase` (如 `startTimer`, `addTask`)
  - 常量：大写蛇形式 `UPPER_SNAKE_CASE` (如 `TIMER_MODES`, `STORAGE_KEY`)
  - 文件名：短横线式 `kebab-case` (如 `timer-worker.js`, `timer.js`)
- **JSDoc 注释**：所有导出函数必须包含 JSDoc 注释，注明 `@param` 和 `@returns`
- **错误处理**：使用 try/catch 包裹所有 LocalStorage 操作；Worker 创建需捕获异常
- **日志**：统一使用 `[模块名]` 前缀格式输出日志，如 `[Timer]`, `[Tasks]`, `[Stats]`

```js
// 好的示例
/**
 * Start (or resume) the countdown.
 * @param {number} [duration] - Optional override for mode duration
 */
export function startTimer(duration) {
  // ...
}

// 避免
function do() { ... }
```

### 模块通信

模块之间**不直接相互引用**。通信通过两种方式：

1. **导出的公开函数** (如 `timer.js` 的 `getState()`, `tasks.js` 的 `getTasks()`)
2. **CustomEvent 自定义事件** (如 `timer:tick`, `timer:complete`, `timer:sessionComplete`)

所有自定义事件在 `document` 上触发，由 `app.js` 中的入口函数统一订阅。

```js
// 发送事件
document.dispatchEvent(new CustomEvent('timer:tick', { detail: { remaining, elapsed } }));

// 订阅事件
document.addEventListener('timer:sessionComplete', handleSessionComplete);
```

### CSS

- **命名约定**：BEM 风格以短横线分隔 (如 `.timer-ring-wrapper`, `.task-item`, `.heatmap-block`)
- **主题变量**：所有颜色必须通过 CSS 自定义属性 (`var(--color-*)`) 引用
- **暗色/亮色主题**：通过 `[data-theme="light"]` 选择器覆盖
- **响应式**：移动端优先，在 `>= 768px` 启用双列布局
- **动画**：仅使用 `transform` 和 `opacity` 属性，避免触发重排
- **可访问性**：所有可交互元素 >= 44x44px 触摸目标，提供 `aria-label`

### HTML

- 语义化标签 (`<section>`, `<header>`, `<main>`, `<footer>`)
- 表单元素配备 `<label>` 或 `aria-label`
- 交互元素配备 `role` 属性

---

## 提交规范

本项目采用 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 格式。

### 格式

```
<type>(<scope>): <subject>

[可选的正文]

[可选的脚注]
```

### Type 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链变更 |

### Scope 范围

| 范围 | 说明 |
|------|------|
| `timer` | 计时器相关 |
| `tasks` | 任务管理 |
| `stats` | 统计面板 |
| `theme` | 主题切换 |
| `pwa` | PWA 功能 |
| `confetti` | 庆祝动画 |
| `css` | 样式修改 |
| `a11y` | 可访问性 |
| `docs` | 文档 |

### 示例

```
feat(timer): 添加长休息模式自动切换逻辑
fix(pwa): 修复 Service Worker 缓存版本不更新问题
docs(readme): 补充离线使用说明
refactor(tasks): 提取 UUID 生成器为独立工具函数
```

---

## Pull Request 流程

1. **先开 Issue**：较大的改动请先通过 Issue 讨论，确认方向一致
2. **保持聚焦**：一个 PR 解决一个问题，避免混合多种变更
3. **通过检查**：
   - 在 Chrome、Firefox、Edge 中手动测试通过
   - 控制台无报错
   - 所有 LocalStorage 操作有错误处理
   - 所有导出函数有 JSDoc 注释
4. **描述清晰**：PR 标题遵循提交规范，描述中说明改动原因和影响范围
5. **等待 Review**：维护者会在 3 个工作日内反馈
6. **合并**：Review 通过后由维护者合并到主分支

---

## 问题反馈

- **GitHub Issues**：报告 Bug、提出功能建议
- **讨论区**：技术方案讨论、最佳实践分享

感谢你的参与！
