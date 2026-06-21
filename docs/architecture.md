# Waveary Architecture

## Purpose

This document defines the first architecture boundary for Waveary.

目标不是一次性设计完整终局，而是先明确 V0.1 到 V0.3 的核心抽象、模块职责和数据流。

## System Role

Waveary 位于模型与产品之间。

它不是基础模型本身，也不是单纯的前端应用。

它是一层运行时与能力框架，负责把短期对话能力提升为长期陪伴能力。

High-level placement:

```text
Application UI
    |
Waveary Runtime
    |
Model Provider Layer
    |
Underlying LLM / Voice Models
```

## Design Goals

- 支持任意大模型接入
- 让记忆成为持久资产，而不是临时上下文
- 让关系状态可以演进、可计算、可解释
- 让时间轴成为回忆和主动关心的基础
- 让语音与情绪能力成为可插拔模块

## Core Layers

### 1. Session Layer

负责单次会话生命周期：

- 接收用户输入
- 维护会话上下文
- 记录交互事件
- 协调记忆、关系、时间轴与模型调用

建议核心对象：

- `Session`
- `Turn`
- `Message`
- `ContextWindow`

### 2. Memory Layer

负责长期记忆的写入、提取、组织与回忆。

建议核心职责：

- 从对话中提取候选记忆
- 对记忆进行分类、去重和重要度评分
- 为不同场景检索相关记忆
- 支持主动回忆与时间性回忆

建议核心对象：

- `MemoryItem`
- `MemoryType`
- `MemoryScore`
- `MemoryRecall`

### 3. Relationship Layer

负责关系状态的持续演进。

关系不是简单分数，而是一组可解释状态。

建议核心职责：

- 维护关系阶段
- 记录长期偏好与信任变化
- 识别关键关系事件
- 为回复策略和主动关心提供关系上下文

建议核心对象：

- `RelationshipProfile`
- `BondState`
- `AffinitySignal`
- `RelationshipEvent`

### 4. Timeline Layer

负责把零散互动组织为人生时间轴。

建议核心职责：

- 记录用户重要事件
- 支持按时间检索与回忆
- 建立“过去发生了什么”的顺序感
- 为纪念日、主动关心和阶段性总结提供基础

建议核心对象：

- `TimelineEvent`
- `LifeEvent`
- `Milestone`
- `TimelineQuery`

### 5. Emotion Layer

负责识别、表示和利用情绪状态。

建议核心职责：

- 识别用户当下情绪信号
- 维护短期与中期情绪状态
- 为回复风格和主动行为提供调节参数

建议核心对象：

- `EmotionState`
- `EmotionSignal`
- `MoodWindow`

This layer should not be limited to user emotion classification.
Waveary Emotion Engine (`WEE`) should primarily own companion emotional continuity:

- companion-side current emotion
- medium-term mood drift
- emotion transition causes
- emotional carry-over between turns
- emotional influence on reply style and proactive care decisions

The first formal design draft for this layer now lives in `docs/emotion-proactive-care.md`.

### 6. Voice Layer

负责语音交互抽象。

建议核心职责：

- STT 接入
- TTS 接入
- 语音会话编排
- 实时语音阶段的打断与全双工支持

建议核心对象：

- `VoiceSession`
- `SpeechInput`
- `SpeechOutput`

## Canonical Domain Objects

Waveary 建议尽快稳定以下顶层抽象：

- `UserProfile`
- `PersonaProfile`
- `Session`
- `Message`
- `MemoryItem`
- `RelationshipProfile`
- `TimelineEvent`
- `EmotionState`
- `VoiceSession`

这些对象会决定后续的数据模型、API 设计和模块边界。

## Runtime Flow

### Standard Chat Flow

```text
User Input
  -> Session Layer
  -> Emotion Analysis
  -> Memory Retrieval
  -> Relationship Context Build
  -> Timeline Recall
  -> Model Request Assembly
  -> Model Response
  -> Memory Extraction
  -> Relationship Update
  -> Timeline Update
  -> Persist State
```

### Proactive Care Flow

```text
Timeline Trigger / Relationship Trigger / Scheduled Trigger
  -> Context Assembly
  -> Safety / Policy Check
  -> Response Generation
  -> Delivery
  -> State Update
```

In Waveary, proactive care should be treated as a decision layer, not a notification script.
It should evaluate memory, relationship, timeline, emotion, quiet-hour policy, and recent user absence before deciding whether outreach is appropriate.
This responsibility is defined as `Waveary Proactive Care Engine (WPCE)` in `docs/emotion-proactive-care.md`.

Desktop awareness, local action hooks, and automation should remain a separate future layer with explicit permission, audit, and revocation boundaries rather than being folded directly into `WEE` or `WPCE`.

## Module Boundaries

### waveary-core

负责：

- 会话编排
- Runtime 接口
- Provider 抽象
- 核心领域对象
- 事件流与状态流

### waveary-memory

负责：

- 记忆抽取
- 记忆存储
- 记忆检索
- 记忆评分与回忆策略

### waveary-voice

负责：

- 语音输入输出抽象
- 实时音频会话
- 打断与流式控制

### waveary-web / waveary-mobile

负责：

- 用户体验层
- 会话展示
- 时间轴展示
- 设置、资料与交互入口

## Provider Abstraction

Waveary 不应绑定单一模型提供商。

建议定义稳定的 provider interface：

- `ChatProvider`
- `EmbeddingProvider`
- `SpeechToTextProvider`
- `TextToSpeechProvider`
- `EmotionClassifier`

这样可以让不同模型能力在同一框架下替换，而不会破坏上层产品逻辑。

## Persistence Strategy

V0.1 阶段建议先保证模型清晰，再追求复杂基础设施。

建议最小持久化单元：

- User profile
- Conversation history
- Memory items
- Relationship profile
- Timeline events

初期允许使用简单存储方案，只要数据结构稳定、可迁移即可。

## V0.1 Scope

V0.1 建议只做以下闭环：

- 文本聊天
- 长期记忆写入与检索
- 基础关系状态更新
- 人生事件时间轴记录
- 简单回忆注入

V0.1 不必完成：

- 实时语音
- 全双工
- 复杂情绪代理
- 过度自动化主动触达

## Key Architectural Principle

Waveary 的关键原则是：

**Memory is a system, not a prompt trick.**

The same rule applies to emotion and care:

**Emotion is state, not decoration.**
**Care is relationship-aware behavior, not engagement spam.**

也就是说，记忆、关系、时间轴和情绪都应该被设计成有状态、可演进、可持久化的系统层，而不是临时拼进上下文的文本片段。

## Open Questions

以下问题应在后续文档中继续收敛：

- 关系状态是规则驱动、评分驱动，还是混合驱动
- 记忆提取由模型负责多少，由规则负责多少
- 时间轴事件的最小 schema 如何定义
- 情绪系统在 V0.1 是否只做识别，不做复杂调节
- CE 与 Cloud 的能力边界如何进一步产品化
