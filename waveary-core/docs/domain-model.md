# Waveary Core Domain Model

## Purpose

This document defines the first domain model for `waveary-core`.

目标是先统一语言，再进入代码实现。

## Primary Entities

### UserProfile

表示用户的长期资料和基础偏好。

建议字段：

- `id`
- `displayName`
- `profileTraits`
- `preferences`
- `lifeContext`

### PersonaProfile

表示陪伴体本身的人格设定与行为边界。

建议字段：

- `id`
- `name`
- `tone`
- `personaTraits`
- `relationshipStyle`
- `voiceStyle`

### Session

表示一次会话。

建议字段：

- `id`
- `userId`
- `personaId`
- `startedAt`
- `endedAt`
- `channel`
- `state`

### Message

表示单条消息或单个发言单元。

建议字段：

- `id`
- `sessionId`
- `role`
- `content`
- `timestamp`
- `metadata`

### MemoryItem

表示被沉淀下来的长期记忆。

建议字段：

- `id`
- `userId`
- `type`
- `content`
- `importance`
- `confidence`
- `sourceMessageIds`
- `createdAt`
- `lastRecalledAt`

### RelationshipProfile

表示长期关系状态。

建议字段：

- `userId`
- `stage`
- `affinityScore`
- `trustScore`
- `stabilityScore`
- `lastUpdatedAt`

说明：

关系状态不应只有单一总分，至少要保留几个可以解释的维度。

### TimelineEvent

表示进入人生时间轴的重要事件。

建议字段：

- `id`
- `userId`
- `title`
- `description`
- `eventType`
- `eventTime`
- `importance`
- `linkedMemoryIds`

### EmotionState

表示短期或中期情绪状态。

建议字段：

- `userId`
- `primaryEmotion`
- `intensity`
- `confidence`
- `windowStart`
- `windowEnd`

## Relationships Between Entities

```text
UserProfile
  -> has many Sessions
  -> has many MemoryItems
  -> has one RelationshipProfile
  -> has many TimelineEvents
  -> has many EmotionStates

Session
  -> has many Messages

Message
  -> may create MemoryItems
  -> may update RelationshipProfile
  -> may create TimelineEvents
  -> may affect EmotionState
```

## First Runtime Cycle

```text
Message In
  -> classify emotion
  -> retrieve memories
  -> load relationship state
  -> load timeline context
  -> assemble model context
  -> generate response
  -> extract memory candidates
  -> update relationship
  -> write timeline events
  -> persist state
```

## Modeling Principles

- 每个对象都要服务长期连续性
- 每个状态都要可以持久化
- 每个分数都应尽量可解释
- 每个抽象都应为多模型兼容留接口

## V0.1 Minimal Stable Schema

V0.1 只需要先稳定这些对象：

- `UserProfile`
- `Session`
- `Message`
- `MemoryItem`
- `RelationshipProfile`
- `TimelineEvent`

`EmotionState` 和 `PersonaProfile` 可以先保持轻量。
