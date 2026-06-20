# Waveary Agent Rules

## Purpose

This document defines how AI coding agents should work inside the Waveary repository.

目标不是提供抽象建议，而是降低后续上下文不足时把项目改偏、改乱、改错的风险。

## Required Reading Before Changes

在开始任何中等以上改动前，代理必须先阅读以下文件：

- `README.md`
- `docs/vision.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- 当前目标模块下的 README 和 domain/model 文档

如果这些文件与代码现状冲突，代理不能自行假设文档过时，必须先指出冲突并说明影响。

## Project Identity

Waveary 的项目身份是：

- 开源数字生命陪伴框架
- Digital Life Companion Framework

Waveary 不是：

- AI girlfriend 项目
- AI boyfriend 项目
- 通用聊天机器人壳
- 以短期角色消费为核心的娱乐项目

任何新增功能、命名、文案、架构改动，都不得把项目重新拉回这些旧定位。

## Product Priorities

所有实现与设计取舍，都应服从以下优先级：

1. 记忆优先于模型
2. 关系优先于功能
3. 陪伴优先于智能
4. 连续性优先于短期惊艳
5. 系统能力优先于 prompt 技巧

如果一个改动能提升单次回答效果，但会破坏长期连续性，应优先保护连续性。

## Architecture Boundaries

代理在改动时，必须遵守模块边界。

### waveary-core

负责：

- runtime orchestration
- session lifecycle
- domain objects
- provider abstraction
- cross-module coordination

不负责：

- UI 细节
- 具体模型品牌耦合
- 与长期陪伴无关的独立业务逻辑

### waveary-memory

负责：

- memory extraction
- memory storage
- memory retrieval
- memory scoring

### waveary-web / waveary-mobile

负责：

- user interface
- interaction flow
- visualization of memory, relationship, and timeline

代理不能把跨层逻辑随意塞进错误模块。

## Domain Stability Rules

以下核心抽象在没有明确架构决策前，不应随意重命名或拆散：

- `UserProfile`
- `PersonaProfile`
- `Session`
- `Message`
- `MemoryItem`
- `RelationshipProfile`
- `TimelineEvent`
- `EmotionState`
- `VoiceSession`

若需要替换命名，必须同时更新：

- 领域模型文档
- 架构文档
- 相关模块 README
- 代码类型定义

## Change Discipline

代理在改动代码时，应遵守以下规则：

- 先读再改，不得靠猜
- 先确认边界，再写实现
- 优先做小步、可验证改动
- 不因“看起来更方便”而破坏既定命名和层次
- 不引入与当前阶段无关的复杂度

## When to Stop and Ask

遇到以下情况，代理应暂停并明确说明，而不是继续猜测实现：

- 文档与代码表达出互相冲突的目标
- 新需求会破坏既有产品定位
- 需要在多个核心抽象中做不可逆改名
- 需要在 CE / Cloud / Enterprise 之间重新划分能力边界

## Definition of a Good Change

一个合格的改动，至少应满足：

- 更接近长期陪伴框架目标
- 不破坏核心领域抽象
- 能被当前文档体系解释
- 能被后续代理快速理解和延续

## Operational Rule

如果上下文有限，代理必须优先相信仓库中的稳定文档，而不是依赖对历史对话的模糊记忆。
