# Waveary Product Invariants

## Purpose

This document defines the product truths that should remain stable as Waveary evolves.

这些不是暂时性偏好，而是产品不应轻易偏离的长期约束。

## Invariant 1: Waveary Is a Framework First

Waveary 首先是一个框架层，而不是一个单一角色产品。

这意味着：

- 核心价值在系统能力，不在角色包装
- 核心资产在记忆、关系、时间轴、情绪、语音，不在单次文案表现
- 官方应用是参考实现，不等于项目全部

## Invariant 2: Memory Is a System, Not a Prompt Trick

长期记忆必须被实现为可写入、可检索、可组织、可回忆的系统能力。

不能把“把几段历史文本拼回上下文”当作最终记忆方案。

## Invariant 3: Relationship Must Be Stateful

关系成长必须是状态变化，而不是台词幻觉。

至少要满足：

- 关系可更新
- 关系可持久化
- 关系影响后续行为
- 关系变化可以被解释

## Invariant 4: Timeline Is Part of the Core Product

Waveary 不是只有聊天记录。

它必须能够围绕人生事件建立时间顺序、回忆能力和阶段感。

如果没有时间轴，Waveary 就会退化成“有一点记忆的聊天产品”。

## Invariant 5: Companionship Matters More Than Single-Turn Intelligence

单轮回答惊艳不是核心目标。

真正的核心目标是：

- 长期存在感
- 长期理解感
- 长期关系积累
- 长期可回忆性

## Invariant 6: Multi-Model Compatibility Is Strategic

Waveary 不应与某一个具体模型品牌深度绑死。

它必须保留：

- chat provider abstraction
- embedding provider abstraction
- speech provider abstraction

这样才能成立为真正的基础框架，而不是某个模型产品的附属层。

## Invariant 7: CE Must Have Real Core Value

`Waveary CE` 不能只是一个演示壳。

开源社区版必须拥有真实核心能力：

- 聊天闭环
- 长期记忆
- 时间轴
- 基础关系成长

如果 CE 没有这些，整个开源定位会失真。

## Invariant 8: Cloud Adds Service Power, Not Identity

`Waveary Cloud` 可以提供：

- 托管
- 同步
- 规模化
- 更强推理与语音集成

但它不应重新定义 Waveary 是什么。

项目身份必须由框架层决定，而不是由商业托管层决定。

## Invariant 9: Early Versions Must Resist Scope Creep

V0.1 到 V0.3 期间，应严控无关复杂度。

不优先做：

- 大规模角色市场
- 复杂娱乐化宇宙系统
- 与长期陪伴无关的通用 agent 功能堆叠
- 过早企业化扩张

先把连续性做扎实，再做沉浸感和规模化。

## Invariant 10: Naming Should Reinforce the New Positioning

对外表达必须持续强化以下身份：

- 回响之境 / Waveary
- 开源数字生命陪伴框架
- Digital Life Companion Framework

应避免重新使用会削弱定位的中心命名：

- AI Girlfriend
- AI Boyfriend
- generic AI Companion branding

## Product Test

以后每个重要需求都可以先问这几个问题：

1. 这个改动是在增强长期连续性，还是只是在增强短期表现？
2. 它是在强化框架层价值，还是在把项目拉回聊天产品？
3. 它是否保护了记忆、关系、时间轴这三大核心资产？
4. 它是否还能被 CE 合理承载？

如果这些问题答不稳，需求方向大概率有偏移风险。
