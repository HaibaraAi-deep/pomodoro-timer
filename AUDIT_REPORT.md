# 🍅 番茄钟项目多维度审计报告

> **项目**: Pomodoro Timer — 极简番茄钟与任务追踪 PWA 应用
> **版本**: v1.2.0 (package.json v1.0.0)
> **代码规模**: 4,794 行 (src/) | 14 个源文件
> **审计日期**: 2026-05-06
> **综合评分**: ⭐ 72 / 100

---

## 一、静态审计 — 代码质量、结构、规范

**评分: 68 / 100**

### 1.1 代码重复 — 严重 🔴

项目中存在 **两套完全独立的代码实现**，功能高度重叠：

| 文件 | 类型 | 行数 | 说明 |
|------|------|------|------|
| [src/js/main.js](src/js/main.js) | IIFE 单文件打包 | 558 行 | 将所有模块内联在一个 IIFE 中 |
| [src/js/app.js](src/js/app.js) + 各模块 | ES Module 拆分 | ~2,100 行 | 模块化版本 (timer.js, tasks.js, stats.js 等) |

两套代码实现了完全相同的业务逻辑（计时器、任务管理、统计、主题、设置等），但存在以下差异：
- `main.js` 使用 `var` 和 IIFE，`app.js` + 模块使用 `import/export`
- `main.js` 的 timer 使用 `setInterval`，模块版的 [timer.js](src/js/timer.js) 使用 Web Worker
- `main.js` 的 i18n 使用 `t()` 函数，模块版部分硬编码中文字符串
- `main.js` 的任务渲染使用 `innerHTML = ''` 全量重绘，模块版使用 diff-based 增量更新

**影响**: 维护成本翻倍，bug 修复需要同步两处，且 HTML 只加载了 `main.js`，模块版代码实际**未被使用**。

### 1.2 代码风格不一致 🟡

| 问题 | 位置 | 说明 |
|------|------|------|
| `var` vs `let/const` | main.js 全文使用 `var`；模块文件使用 `let/const` | 风格割裂 |
| 硬编码中文 | [timer.js:444](src/js/timer.js#L444) `indicator.textContent = TIMER_MODES[mode].label` | label 为硬编码中文，不受 i18n 控制 |
| 硬编码中文 | [timer.js:449-457](src/js/timer.js#L449) `toggleBtn.textContent = '暂停'/'继续'/'开始'` | 不走 i18n |
| 硬编码中文 | [settings.js](src/js/settings.js) 全文 UI 文案 | 不走 i18n |
| 硬编码中文 | [stats.js:277](src/js/stats.js#L277) `'今天还没有专注记录'` | 不走 i18n |
| 硬编码中文 | [app.js:328](src/js/app.js#L328) `checkbox.setAttribute('aria-label', '标记未完成')` | 不走 i18n |
| 魔法数字 | [timer.js:464](src/js/timer.js#L464) `2 * Math.PI * 90` | SVG 圆半径硬编码，与 HTML 中的 `r="108"` 不一致 |

### 1.3 代码质量亮点 🟢

- 所有 localStorage 操作均包裹在 `try/catch` 中，防止隐私模式下崩溃
- UUID 生成有 `crypto.randomUUID` 优先 + 降级方案
- 数据验证较完善（[tasks.js](src/js/tasks.js) 的 `loadTasks()` 和 [stats.js](src/js/stats.js) 的 `readRawStats()` 均做字段校验）
- 模块版代码有完整的 JSDoc 注释和导出说明

### 1.4 代码质量问题 🟡

| 问题 | 位置 | 说明 |
|------|------|------|
| `innerHTML` 使用 | [settings.js:296](src/js/settings.js#L296), [theme.js:104](src/js/theme.js#L104) | 虽然 SETTINGS_HTML 是常量字符串无 XSS 风险，但不符合 CSP 最佳实践 |
| 空 catch 块 | [timer.js:94-96](src/js/timer.js#L94), [theme.js:35](src/js/theme.js#L35) 等 | 多处 `catch (e) {}` 或 `catch (e) { // ignore }` 静默吞掉错误 |
| `addTask` 逻辑缺陷 | [tasks.js:230-238](src/js/tasks.js#L230) | `saveTasks` 失败时仍然 `tasks.push(task)`，内存与存储不一致 |
| SVG 圆半径不一致 | HTML `r="108"` vs JS `2 * Math.PI * 90` | 进度环计算基于 r=90，但 SVG 实际 r=108，导致进度环视觉偏差 |

---

## 二、动态审计 — 运行时行为、性能、内存

**评分: 70 / 100**

### 2.1 计时器精度 🔴

| 实现方式 | 文件 | 精度 | 后台标签页 |
|----------|------|------|------------|
| `setInterval` | [main.js:184](src/js/main.js#L184) | 低 — 受事件循环影响 | 严重漂移 |
| Web Worker + 墙钟 | [timer-worker.js](src/js/timer-worker.js) | 高 — 使用 `Date.now()` 校正 | 基本准确 |

**问题**: HTML 加载的是 `main.js`（setInterval 版本），Web Worker 版本**未被实际使用**。后台标签页时计时器将严重不准确。

### 2.2 DOM 操作性能 🟡

| 问题 | 位置 | 说明 |
|------|------|------|
| 全量重绘任务列表 | [main.js:448](src/js/main.js#L448) `listEl.innerHTML = ''` | 每次变更清空重建所有 DOM 节点 |
| 热力图全量重建 | [stats.js:290](src/js/stats.js#L290) `container.innerHTML = ''` | 每次渲染清空重建 |
| `updateUI()` 每秒调用 | [timer.js:411-486](src/js/timer.js#L411) | 每秒查询 DOM 元素，虽有 `domCache` 但仍查询 `querySelectorAll('[data-mode]')` |
| Confetti 粒子 | [confetti.js](src/js/confetti.js) | 40 个 DOM 粒子 + CSS 动画，低性能设备可能卡顿 |

### 2.3 内存管理 🟡

| 问题 | 说明 |
|------|------|
| AudioContext 单例 | [audio.js:16](src/js/audio.js#L16) `audioCtx` 永不释放，浏览器标签页生命周期内持续占用 |
| 事件监听器未清理 | `timer:sessionComplete` 等事件监听器在模块初始化时注册，从不移除 |
| Confetti cleanup timer | [confetti.js:170](src/js/confetti.js#L170) 使用 `setTimeout` 清理，若用户快速完成多个番茄钟可能叠加 |
| 统计缓存 | [stats.js:36](src/js/stats.js#L36) 缓存机制合理，但无上限控制 |

### 2.4 Service Worker 缓存策略 🟢

- 静态资源 Cache First + 导航请求 Network First，策略合理
- 有离线降级页面
- 缓存版本管理 (`pomodoro-v1`)，激活时清理旧缓存

### 2.5 缺少性能监控 🟡

- 无 `performance.mark` / `performance.measure` 埋点
- 无首屏加载时间 (FCP/LCP) 监控
- 无长任务 (Long Task) 检测

---

## 三、深度审计 — 架构设计、依赖分析、可维护性

**评分: 65 / 100**

### 3.1 架构问题 — 双轨代码 🔴

这是本项目最严重的架构问题。项目同时维护两套代码：

```
src/js/main.js          ← 实际被 index.html 加载（IIFE 单文件）
src/js/app.js           ← 未被加载（ES Module 入口）
src/js/timer.js         ← 未被加载
src/js/tasks.js         ← 未被加载
src/js/stats.js         ← 未被加载
src/js/theme.js         ← 未被加载
src/js/confetti.js      ← 未被加载
src/js/pwa.js           ← 未被加载
src/js/audio.js         ← 未被加载
src/js/settings.js      ← 未被加载
src/js/timer-worker.js  ← 未被加载
```

`index.html` 第 119 行仅加载 `<script src="js/main.js"></script>`，所有 ES Module 文件均为**死代码**。

**建议**: 选择一套代码保留，删除另一套。推荐保留模块化版本（代码质量更高、有 Web Worker），删除 `main.js`。

### 3.2 模块间通信 🟡

模块间通过 `document.dispatchEvent(new CustomEvent(...))` 通信：

| 事件名 | 发射方 | 监听方 |
|--------|--------|--------|
| `timer:tick` | timer | (无监听) |
| `timer:complete` | timer | (无监听) |
| `timer:sessionComplete` | timer | stats, confetti, audio, app |
| `timer:incrementPomodoros` | timer | app |
| `timer:reset` | timer | (无监听) |
| `timer:modeChange` | timer | (无监听) |
| `settings:dataChanged` | settings | stats, app |

**问题**: 
- 事件名以字符串硬编码，无集中常量管理，易拼写错误
- `timer:complete` 和 `timer:reset` 无监听方，可能是遗留事件
- 事件流缺乏类型约束，`detail` 对象结构全靠约定

### 3.3 依赖分析 🔴

```
npm audit 结果: 12 个漏洞 (2 low, 10 high)
```

| 漏洞包 | 严重性 | 说明 |
|--------|--------|------|
| `tar` <=7.5.10 | **High** | 6 个路径遍历/符号链接攻击漏洞 |
| `@electron/rebuild` | **High** | 依赖有漏洞的 node-gyp 和 tar |
| `electron` ^33.0.0 | **High** | 4 个 Electron 安全漏洞（Use-after-free、命令行注入等） |
| `cacache` | **High** | 依赖有漏洞的 tar |
| `@tootallnate/once` | Low | 控制流作用域问题 |

**修复方案**: `npm audit fix --force`（需升级 electron-builder 到 v26，electron 到 v42，均为破坏性变更）

### 3.4 可维护性 🟡

| 维度 | 评分 | 说明 |
|------|------|------|
| 文档 | ⭐⭐⭐⭐ | README、技术文档、使用文档齐全，中英双语 |
| 代码注释 | ⭐⭐⭐⭐ | 模块版有完整 JSDoc，main.js 较少 |
| 测试覆盖 | ⭐ | **零测试** — 无任何单元测试、集成测试或 E2E 测试 |
| 构建工具 | ⭐ | 无构建工具、无打包器、无代码压缩、无 Tree-shaking |
| CI/CD | ⭐ | 无持续集成/持续部署配置 |
| 类型安全 | ⭐ | 纯 JavaScript，无 TypeScript、无 PropTypes |

### 3.5 版本号不一致 🟡

- `package.json`: `"version": "1.0.0"`
- `index.html` footer: `v1.2.0`
- 两者不同步

---

## 四、安全审计 — 漏洞、敏感信息、安全实践

**评分: 75 / 100**

### 4.1 CSP 策略 🟡

[index.html:14](src/index.html#L14) 的 CSP 策略：

```
default-src 'self' blob: file:; 
script-src 'self' blob: file:; 
style-src 'self' file:; 
img-src 'self' file: data: blob:; 
worker-src 'self' blob: file:; 
frame-ancestors 'none'; 
object-src 'none'; 
base-uri 'self'; 
form-action 'self';
```

**问题**:
| 问题 | 严重性 | 说明 |
|------|--------|------|
| `file:` 协议在 script-src/style-src/img-src 中 | 🟡 中 | 为 Electron 兼容而添加，但降低了 CSP 防护力度 |
| `blob:` 在 script-src 中 | 🟡 中 | Web Worker 需要但可能被利用 |
| 缺少 `font-src` 指令 | 🟡 中 | Google Fonts 通过 `<link>` 加载但 CSP 未显式允许，依赖 `default-src 'self'` 会**阻止字体加载** |
| 外部字体加载绕过 CSP | 🔴 高 | [index.html:15-17](src/index.html#L15) 使用 `preconnect` + `<link>` 加载 Google Fonts，但 CSP 的 `default-src` 为 `'self'`，字体实际可能被阻止或通过 `file:` 绕过 |

### 4.2 Electron 安全 🟢

[main.js](main.js) 的安全配置较好：

| 配置 | 值 | 评价 |
|------|------|------|
| `nodeIntegration` | `false` | ✅ 正确 |
| `contextIsolation` | `true` | ✅ 正确 |
| `sandbox` | `true` | ✅ 正确 |
| `webSecurity` | `true` | ✅ 正确 |
| `allowRunningInsecureContent` | `false` | ✅ 正确 |
| 自定义协议 | `pomodoro://` | ✅ 避免了 `file://` 协议 |

**问题**: 
- [main.js:34](main.js#L34) `request.url.substr(...)` 使用已废弃的 `substr`，应改用 `substring` 或 `slice`
- 自定义协议处理未做路径遍历检查，理论上可构造 `pomodoro://app/../../etc/passwd` 类请求

### 4.3 数据导入安全 🟡

[settings.js:228-261](src/js/settings.js#L228) 的导入功能：

| 问题 | 说明 |
|------|------|
| 无文件大小限制 | 用户可导入任意大小的 JSON 文件 |
| 无数据量限制 | 导入的 tasks/stats 数组无长度上限 |
| 导入数据未校验 | 仅检查 `Array.isArray()`，不验证单个记录的字段类型和值范围 |
| 导入直接覆盖 | 无合并策略，直接 `localStorage.setItem` 覆盖现有数据 |

### 4.4 XSS 防护 🟢

- 用户输入的任务标题通过 `textContent` 赋值（非 `innerHTML`），XSS 风险低
- `sanitizeForAria()` 函数过滤控制字符
- 设置面板 HTML 为硬编码常量字符串，无用户输入注入点

### 4.5 敏感信息 🟢

- 未发现硬编码的密码、API Key、Token
- `.gitignore` 包含 `.env`、`*.key`、`*.pem` 排除规则
- 项目不收集任何用户隐私数据，所有数据存储在本地 localStorage

### 4.6 Service Worker 安全 🟡

- [sw.js:96](src/sw.js#L96) 正确过滤了跨域请求
- [sw.js:101](src/sw.js#L101) 正确跳过了非 HTTP(S) 协议
- 但缓存策略为 Cache First，若缓存被污染（如中间人攻击），用户将持续获取恶意资源

---

## 五、体验审计 — UI/UX、可用性、无障碍

**评分: 82 / 100**

### 5.1 无障碍 (Accessibility) 🟢⭐

项目在无障碍方面投入了较多精力：

| 特性 | 状态 | 说明 |
|------|------|------|
| `aria-label` | ✅ | 所有按钮和交互元素均有 aria-label |
| `aria-pressed` | ✅ | 模式切换按钮使用 `aria-pressed` |
| `aria-live` 区域 | ✅ | [index.html:117](src/index.html#L117) 有 `aria-live="polite"` 的实时区域 |
| `role` 属性 | ✅ | 任务列表 `role="list"`，模态框 `role="dialog"` |
| `aria-modal` | ✅ | 模态对话框正确标记 |
| `aria-hidden` | ✅ | 装饰性元素正确隐藏 |
| `focus-visible` | ✅ | CSS 中所有交互元素有 `:focus-visible` 样式 |
| `sr-only` | ✅ | 屏幕阅读器专用类 |
| 键盘快捷键 | ✅ | Space/N/1/2/3/R/S/Ctrl+,/Escape |

**问题**:
| 问题 | 说明 |
|------|------|
| 模态框焦点陷阱缺失 | [settings.js:92-154](src/js/settings.js#L92) 模态框打开后 Tab 键可跳到背景元素 |
| `aria-label` 语言不一致 | HTML 中混合中英文 aria-label（"Switch language" vs "切换主题"） |
| 模块版 aria-label 硬编码中文 | [app.js:328](src/js/app.js#L328) 不随语言切换变化 |
| 计时器 `aria-live="off"` | [index.html:55](src/index.html#L55) 计时器显示设为 `off`，屏幕阅读器不会播报倒计时 |

### 5.2 响应式设计 🟢

| 断点 | 适配 |
|------|------|
| <=480px | 缩小计时器环、设置面板全宽、增大触控目标 |
| 481-767px | 单列布局 |
| >=768px | 双列布局（任务 + 统计）、放大计时器环 |
| 触控设备 | 增大复选框和删除按钮尺寸 (`@media (pointer: coarse)`) |

### 5.3 主题切换 🟡

| 问题 | 说明 |
|------|------|
| 闪烁 (FOUC) | [theme.js:122-124](src/js/theme.js#L122) 主题在 JS 执行后才应用，首次加载可能出现白色闪烁 |
| 建议方案 | 在 `<head>` 中内联主题检测脚本，或在 `<html>` 上设置默认 `data-theme="dark"` 并在 CSS 中优先匹配 |

### 5.4 国际化 (i18n) 🟡

| 问题 | 说明 |
|------|------|
| 双语支持 | ✅ 中英双语切换 |
| 持久化 | ✅ 语言偏好保存到 localStorage |
| 模块版未接入 i18n | ❌ 模块版 JS 文件中大量硬编码中文，无法切换语言 |
| `document.lang` 更新 | ✅ main.js 中 `applyI18n()` 正确更新 `document.documentElement.lang` |
| 翻译模板 | ✅ 使用 `{0}`、`{1}` 占位符的 `tf()` 函数 |

### 5.5 PWA 体验 🟢

| 特性 | 状态 |
|------|------|
| manifest.json | ✅ 完整 |
| Service Worker | ✅ 缓存 + 离线降级 |
| 安装提示 | ✅ `beforeinstallprompt` 处理 |
| 离线可用 | ✅ |
| 图标 | ✅ 192x192 + 512x512 |

**问题**: `manifest.json` 的 `start_url` 和 `scope` 为 `"/"`，在子目录部署时需修改。

### 5.6 交互体验 🟢

| 特性 | 评价 |
|------|------|
| 计时完成音效 | ✅ Web Audio API 合成音，专注/休息不同旋律 |
| 完成撒花动画 | ✅ CSS 动画，40 粒子 |
| 任务删除动画 | ✅ fade-out 过渡 |
| 暂停闪烁 | ✅ 计时器暂停时呼吸灯效果 |
| 最后 60 秒警告 | ✅ 数字变红 |
| Toast 通知 | ✅ 替代原生 alert |
| 自定义模态框 | ✅ 替代原生 confirm |

---

## 六、综合评分与优先修复建议

### 评分汇总

| 审计维度 | 评分 | 权重 | 加权分 |
|----------|------|------|--------|
| 静态审计 | 68 | 20% | 13.6 |
| 动态审计 | 70 | 20% | 14.0 |
| 深度审计 | 65 | 20% | 13.0 |
| 安全审计 | 75 | 20% | 15.0 |
| 体验审计 | 82 | 20% | 16.4 |
| **综合** | | | **72.0** |

### 🔴 P0 — 必须修复

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | **双轨代码** — main.js 与模块版并存 | 维护成本翻倍、模块版死代码 | 删除 `main.js`，改用 ES Module + 构建工具加载 `app.js` |
| 2 | **SVG 圆半径不一致** — HTML r=108 vs JS 计算 r=90 | 进度环显示错误 | 统一为 r=108，JS 中 `2 * Math.PI * 108` |
| 3 | **npm 依赖漏洞** — 12 个漏洞 (10 high) | 安全风险 | 升级 electron 到 v42+、electron-builder 到 v26+ |
| 4 | **计时器使用 setInterval** — main.js 版本 | 后台标签页严重漂移 | 切换到 Web Worker 版本 |

### 🟡 P1 — 应当修复

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 5 | 模块版 i18n 未接入 | 语言切换对模块版无效 | 将硬编码中文替换为 `t()` 调用 |
| 6 | CSP `font-src` 缺失 | Google Fonts 可能被阻止 | 添加 `font-src https://fonts.googleapis.com https://fonts.gstatic.com` |
| 7 | Electron 自定义协议路径遍历 | 潜在文件读取风险 | 添加路径规范化 + 白名单校验 |
| 8 | 数据导入无校验/限制 | 恶意大文件可导致性能问题 | 添加文件大小限制 + 数据校验 |
| 9 | 模态框焦点陷阱缺失 | 键盘用户可跳到背景 | 添加焦点陷阱逻辑 |
| 10 | 版本号不一致 | 用户困惑 | 统一 package.json 和 footer 版本号 |
| 11 | `addTask` 存储失败仍入内存 | 数据不一致 | 存储失败时抛出异常或回滚 |

### 🟢 P2 — 建议改进

| # | 问题 | 建议 |
|---|------|------|
| 12 | 零测试覆盖 | 添加 Jest 单元测试 + Playwright E2E 测试 |
| 13 | 无构建工具 | 引入 Vite/esbuild 进行打包、压缩、Tree-shaking |
| 14 | 主题 FOUC | 在 `<head>` 内联主题检测脚本 |
| 15 | 空 catch 块 | 至少添加 `console.warn` 日志 |
| 16 | 事件名硬编码 | 集中管理事件名常量 |
| 17 | 无性能监控 | 添加 Web Vitals 埋点 |
| 18 | `font-display` 缺失 | Google Fonts URL 添加 `&display=swap` |
| 19 | `substr` 已废弃 | [main.js:34](main.js#L34) 改用 `slice` 或 `substring` |

---

## 七、架构改进路线图

```
Phase 1 (紧急)                    Phase 2 (重要)                   Phase 3 (优化)
─────────────────                ─────────────────                ─────────────────
├─ 删除 main.js                   ├─ 接入 i18n 到模块版              ├─ 添加测试覆盖
├─ 修复 SVG 半径                   ├─ 修复 CSP font-src              ├─ 引入构建工具
├─ 升级依赖修复漏洞                ├─ 添加数据导入校验                ├─ 添加性能监控
├─ 统一版本号                      ├─ 添加焦点陷阱                    ├─ 优化 DOM 更新策略
└─ 修复 addTask 逻辑              ├─ 修复 Electron 路径遍历          ├─ 主题 FOUC 修复
                                  └─ 清理空 catch 块                └─ 事件名集中管理
```

---

*本报告由自动化审计工具生成，基于静态代码分析和依赖扫描结果。部分动态问题（如运行时性能、内存泄漏）需进一步实际运行验证。*
