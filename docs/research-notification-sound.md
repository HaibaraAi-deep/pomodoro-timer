# 提示音研究总结

## 推荐方案
- **Web Audio API + OscillatorNode**：零外部依赖，程序化生成音效，PWA友好
- 单一共享 AudioContext，避免浏览器节流

## 音效设计
| 事件 | 音效 | 频率 | 波形 |
|------|------|------|------|
| 专注完成 | 上升双音 | 660Hz + 880Hz | sine |
| 休息完成 | 三连音 | 523Hz x3 | triangle |

## 浏览器限制处理
- AudioContext 必须在用户手势中解锁（首次点击开始按钮时调用 getCtx()）
- exponentialRampToValueAtTime 防止破音
- try/catch 兜底

## 竞品参考
- ZenTime-Pomodoro, tomodoro, customodoro 均使用 OscillatorNode
- 外部 MP3 仅用于背景白噪音
