# Waveary Roadmap

## Goal

Waveary 的近期目标不是做一个功能堆叠型 companion app。

近期目标是先做出一个清晰、可扩展、可开源协作的数字陪伴框架内核。

## Phase 1: V0.1 / 30 Days

目标：

构建第一个可用的 Waveary 核心闭环。

范围：

- 文本聊天
- 长期记忆写入
- 长期记忆检索
- 基础关系成长
- 时间轴事件记录
- 基础回忆注入

交付物：

- `waveary-core` 初版运行时结构
- `waveary-memory` 的最小记忆 schema
- `Session -> Memory -> Relationship -> Timeline` 基础数据流
- 一个可跑通的 reference chat flow

完成标准：

- 用户可以开始对话
- 系统可以提取和保存关键记忆
- 系统可以在后续对话中召回相关记忆
- 系统可以记录关键人生事件
- 系统可以维护基础关系状态

## Phase 2: V0.2 / 60 Days

目标：

把陪伴从文本连续性推进到基础主动性与多模态能力。

范围：

- 语音输入输出
- 情绪分析
- 主动关心
- 事件触发式关怀

交付物：

- `waveary-voice` 初版接口
- 情绪状态识别和短期状态窗口
- Timeline trigger / Relationship trigger
- 基础 proactive care flow

完成标准：

- 用户可以用语音与系统交互
- 系统能够识别基础情绪信号
- 系统能基于事件或关系状态进行有限主动关心

## Phase 3: V0.3 / 90 Days

目标：

把体验从“可持续聊天”推进到“实时陪伴”。

范围：

- 实时语音
- 打断
- 全双工
- 流式会话编排

交付物：

- 实时 voice session runtime
- interruption handling
- duplex conversation state flow
- latency-aware orchestration

完成标准：

- 用户可以进行接近自然的实时语音对话
- 系统支持中途打断与重规划
- 语音状态、记忆状态和关系状态仍然保持一致

## Out of Scope for Early Versions

以下内容不应成为早期版本主目标：

- 大规模角色市场
- 重娱乐化恋爱设定消费
- 与长期陪伴无关的通用 agent 能力堆叠
- 过度复杂的多角色宇宙系统
- 过早企业化功能扩张

## Strategic Direction

Waveary 的发展顺序应当是：

1. 先把记忆做成系统
2. 再把关系做成状态机
3. 再把时间轴做成可回忆的结构
4. 再把情绪和主动性接进去
5. 最后把语音做到实时化和全双工

这条顺序的核心原则是：

**先做连续性，再做沉浸感。**
