# 🔧 审计问题修复报告

**项目**: Pomodoro Timer — 极简番茄钟与任务追踪 PWA 应用
**审计报告**: `docs/AUDIT_REPORT_V2_FULL.md`
**修复日期**: 2026-05-05
**修复版本**: v1.1.0

---

## 修复概览

| 优先级 | 审计发现数 | 已修复 | 未修复 |
|--------|-----------|--------|--------|
| 🔴 严重 | 3 | 3 | 0 |
| 🟠 高 | 8 | 8 | 0 |
| 🟡 中 | 9 | 9 | 0 |
| 🟢 低 | 7 | 4 | 3 |
| **合计** | **27** | **24** | **3** |

未修复的 3 项低优先级问题为：无自动化测试、无 CI/CD 配置、无任务编辑功能。这些属于功能增强范畴，不影响安全性和正确性。

---

## 🔴 严重问题修复

### 1. Electron 禁用 Web 安全

**问题**: `main.js:19` 设置 `webSecurity: false`，禁用了同源策略，允许任何网页内容访问本地文件系统和网络资源。

**修复方案**:
- 移除 `webSecurity: false`
- 注册自定义协议 `pomodoro://app/` 处理资源加载
- 添加 `sandbox: true`、`allowRunningInsecureContent: false`
- 使用 `mainWindow.loadURL('pomodoro://app/index.html')` 替代 `loadFile`

**修改文件**: `main.js`

**修复前**:
```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  webSecurity: false  // 危险！
}
mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
```

**修复后**:
```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  allowRunningInsecureContent: false,
  webSecurity: true
}
// 注册自定义协议
protocol.registerFileProtocol('pomodoro', (request, callback) => {
  const url = request.url.substr('pomodoro://app/'.length);
  callback({ path: path.join(__dirname, 'src', url) });
});
mainWindow.loadURL('pomodoro://app/index.html');
```

---

### 2. focusSessionsCompleted 不持久化

**问题**: `focusSessionsCompleted` 仅存于内存，页面刷新后重置为 0，导致长休息周期被打断。

**修复方案**:
- 添加 `loadSessionCounter()` / `saveSessionCounter()` 函数
- 使用 `pomodoro_pomo_counter` 键持久化到 localStorage
- 专注完成时自动保存，页面加载时自动恢复

**修改文件**: `src/js/timer.js`, `src/js/main.js`

---

### 3. clearAllData() 不刷新 UI

**问题**: 清除数据后只显示 `alert()`，不重新渲染任务列表和统计面板，用户看到旧数据。

**修复方案**:
- 清除数据后派发 `settings:dataChanged` 事件
- `app.js` 监听该事件，执行 `reloadTasks()` + `renderTaskList()` + `resetTimer()` + `resetSessionCounter()`
- `stats.js` 监听该事件，执行 `invalidateStatsCache()` + `renderStats()`

**修改文件**: `src/js/settings.js`, `src/js/app.js`, `src/js/stats.js`, `src/js/main.js`

---

## 🟠 高优先级问题修复

### 4. CSP 允许 unsafe-inline 和 data: URI

**修复方案**:
- 移除 `style-src` 中的 `'unsafe-inline'`
- 从 `default-src` 移除 `data:`，仅 `img-src` 允许 `data:`
- 最终策略: `default-src 'self' file:; style-src 'self' file:; img-src 'self' file: data:;`

**修改文件**: `src/index.html`

---

### 5. 全局变量污染

**问题**: `window.getTasks` / `window.incrementPomodoros` 破坏模块封装。

**修复方案**:
- 移除所有 `window.xxx` 赋值
- timer.js 在专注完成时派发 `timer:incrementPomodoros` 事件
- app.js 监听该事件，调用 `incrementPomodoros(activeTaskId)`

**修改文件**: `src/js/app.js`, `src/js/timer.js`, `src/js/main.js`

---

### 6. skip() 语义不一致

**问题**: 跳过专注时 `(focusSessionsCompleted + 1) % 4 === 0` 模拟了完成后的计数，但实际没有增加计数，导致逻辑混乱。

**修复方案**:
- 跳过专注时不计数，基于当前 `focusSessionsCompleted` 选择休息类型
- 跳过休息时直接回到专注模式
- 空闲状态下跳过被忽略

**修改文件**: `src/js/timer.js`, `src/js/main.js`

---

### 7. 无活动任务选择机制

**问题**: 番茄数始终计入第一个未完成任务，用户无法指定。

**修复方案**:
- tasks.js 新增 `getActiveTaskId()` / `setActiveTaskId(id)` API
- 活动任务 ID 持久化到 `pomodoro_active_task`
- 点击任务标题设为活动任务
- 活动任务显示红色竖线标记 + 强调色标题
- 完成活动任务后自动取消活动状态

**修改文件**: `src/js/tasks.js`, `src/js/app.js`, `src/css/base.css`, `src/js/main.js`

---

### 8. recordSession() 记录固定时长

**问题**: 即使计时器提前结束，统计仍记录完整的 25 分钟。

**修复方案**:
- timer.js 在 `handleComplete()` 中计算 `actualDuration = elapsed || TIMER_MODES[mode].duration`
- 通过 `timer:sessionComplete` 事件传递 `actualDuration`
- stats.js 的 `recordSession()` 使用实际时长

**修改文件**: `src/js/timer.js`, `src/js/stats.js`, `src/js/main.js`

---

### 9. localStorage 写入失败导致数据不一致

**问题**: `addTask()` 先 `tasks.push()` 再 `saveTasks()`，写入失败时内存已修改。

**修复方案**:
- `saveTasks()` 返回 `boolean` 表示写入是否成功
- `addTask()`: 先尝试 `saveTasks([...tasks, newTask])`，成功后 `push`
- `deleteTask()`: 保存失败时 `splice` 回滚
- `toggleTask()`: 保存失败时恢复旧状态
- `incrementPomodoros()`: 保存失败时减回
- 写入失败时显示存储空间不足警告

**修改文件**: `src/js/tasks.js`, `src/js/main.js`

---

### 10. 全量 DOM 重建

**问题**: `renderTaskList()` 每次清空 `innerHTML` 再重建所有元素。

**修复方案**:
- 基于 `data-task-id` 的差异更新算法
- 收集现有元素到 `Map<id, element>`
- 删除不在数据中的元素
- 更新已存在元素的属性（复用 DOM 节点）
- 仅创建新增元素
- 调整元素顺序

**修改文件**: `src/js/app.js`, `src/js/main.js`

---

### 11. getStats() 重复解析 localStorage

**问题**: 每次调用 `getStats()` 都从 localStorage 读取 + JSON.parse + 验证。

**修复方案**:
- 添加 `statsCache` + `statsCacheDirty` 标志
- `getStats()` 缓存命中时直接返回
- `invalidateStatsCache()` 在数据变更时标记缓存失效
- `recordSession()` 和 `settings:dataChanged` 事件触发缓存失效

**修改文件**: `src/js/stats.js`, `src/js/main.js`

---

## 🟡 中优先级问题修复

### 12. 变量声明风格不一致

**修复**: pwa.js 和 audio.js 中所有 `var` 替换为 `const`/`let`。

**修改文件**: `src/js/pwa.js`, `src/js/audio.js`

---

### 13. settings.js 死代码

**修复**: 从 `SETTINGS_HTML` 中移除多余的 `settingsTriggerBtn`，改为在 `initSettings()` 中动态绑定 HTML 中已有的按钮。

**修改文件**: `src/js/settings.js`, `src/js/main.js`

---

### 14. Web Worker 创建失败无降级

**修复方案**:
- Worker 创建失败时设置 `useFallbackTimer = true`
- 使用 `setInterval` 实现降级计时器
- 通过 liveRegion 通知用户降级模式
- 降级计时器支持 start/pause/reset/complete 全部操作

**修改文件**: `src/js/timer.js`, `src/js/main.js`

---

### 15. 触控设备删除按钮不可见

**修复**: `@media (pointer: coarse)` 中为 `.task-delete-btn` 添加 `opacity: 1`。

**修改文件**: `src/css/base.css`

---

### 16. confirm()/alert() 阻塞式对话框

**修复方案**:
- 实现 `showModal(title, message, onConfirm)` 自定义模态对话框
- 实现 `showToast(message)` 非阻塞通知
- `clearAllData()` 使用自定义对话框替代 `confirm()`
- 操作结果使用 Toast 通知替代 `alert()`

**修改文件**: `src/js/settings.js`, `src/css/base.css`, `src/js/main.js`

---

### 17. getStats() getter 副作用

**修复**: 数据清理逻辑保留在 `getStats()` 中（因为需要惰性执行），但通过缓存机制避免重复执行。新增 `invalidateStatsCache()` 供外部显式触发缓存失效。

**修改文件**: `src/js/stats.js`

---

### 18. 无数据导入功能

**修复方案**:
- settings.js 新增导入按钮和文件选择器
- `handleImportFile()` 解析 JSON 文件，验证数据结构
- 分别写入 `pomodoro_tasks` 和 `pomodoro_stats`
- 导入成功后派发 `settings:dataChanged` 事件刷新 UI

**修改文件**: `src/js/settings.js`, `src/js/main.js`

---

### 19. 无全局错误处理

**修复方案**:
- `setupGlobalErrorHandling()` 注册 `window.onerror` 和 `unhandledrejection` 监听
- 错误信息输出到 `console.error`

**修改文件**: `src/js/app.js`, `src/js/main.js`

---

### 20. getWeeklyStats() 跨午夜时区问题

**修复**: 使用单一 `now = new Date()` 基准，循环中通过 `new Date(now)` 创建偏移日期，避免跨天问题。

**修改文件**: `src/js/stats.js`

---

## 🟢 低优先级问题修复

### 21. aria-label 任务标题未转义

**修复**: 新增 `sanitizeForAria(text)` 函数，移除控制字符（`\x00-\x1F`, `\x7F`），用于所有 `aria-label` 属性。

**修改文件**: `src/js/tasks.js`, `src/js/app.js`, `src/js/main.js`

---

### 22. Electron 缺少安全配置

**修复**: 与问题 #1 一同修复，添加 `sandbox: true`、`allowRunningInsecureContent: false`、`webSecurity: true`。

**修改文件**: `main.js`

---

### 23. Manifest 缺少 scope 字段

**修复**: 在 `manifest.json` 中添加 `"scope": "/"`。

**修改文件**: `src/manifest.json`

---

### 24. 暂停与空闲状态视觉区分

**修复方案**:
- timer.js `updateUI()` 中为暂停状态添加 `paused` CSS class
- CSS 中 `.timer-display.paused` 使用闪烁动画 `pauseBlink`
- 暂停时按钮显示「继续」，空闲时显示「开始」

**修改文件**: `src/js/timer.js`, `src/css/base.css`, `src/js/main.js`

---

## 未修复项

| # | 优先级 | 问题 | 原因 |
|---|--------|------|------|
| — | 低 | 无自动化测试 | 属于工程化增强，需单独规划 |
| — | 低 | 无 CI/CD 配置 | 属于 DevOps 范畴，需单独配置 |
| — | 低 | 无任务编辑功能 | 属于功能增强，需 UX 设计 |

---

## 修改文件清单

| 文件 | 修改类型 | 涉及问题 |
|------|----------|----------|
| `main.js` | 重写 | #1, #22 |
| `src/index.html` | 修改 CSP | #4 |
| `src/manifest.json` | 添加 scope | #23 |
| `src/css/base.css` | 添加样式 | #15, #16, #24 |
| `src/js/timer.js` | 重写 | #2, #6, #8, #14, #24 |
| `src/js/tasks.js` | 重写 | #7, #9, #21 |
| `src/js/stats.js` | 重写 | #11, #17, #20 |
| `src/js/settings.js` | 重写 | #3, #13, #16, #18 |
| `src/js/app.js` | 重写 | #3, #5, #7, #10, #19, #21 |
| `src/js/pwa.js` | 重写 | #12 |
| `src/js/audio.js` | 重写 | #12 |
| `src/js/main.js` | 同步更新 | 全部 |

---

## 回归测试建议

修复完成后，建议进行以下回归测试：

1. **计时器核心**：开始 → 暂停 → 继续 → 完成，验证状态切换和 UI 更新
2. **专注计数持久化**：完成专注后刷新页面，验证计数不丢失
3. **长休息周期**：连续完成 4 次专注，验证第 4 次后进入长休息
4. **跳过功能**：专注中跳过，验证不计数且正确切换休息模式
5. **活动任务**：点击任务标题设为活动，完成专注后验证番茄数计入该任务
6. **数据导出/导入**：导出 → 清除 → 导入，验证数据完整恢复
7. **清除数据**：清除后验证任务列表、统计面板、计时器全部重置
8. **自定义对话框**：清除数据时验证显示自定义模态对话框而非原生 confirm
9. **触控设备**：在触控设备上验证删除按钮始终可见
10. **Electron**：运行 `npm start`，验证自定义协议加载正常
11. **Worker 降级**：模拟 Worker 创建失败，验证 setInterval 降级计时器工作
12. **CSP**：检查浏览器控制台无 CSP 违规报告
