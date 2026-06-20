# waveary-memory

`waveary-memory` provides the first dedicated memory module for Project Waveary.

它负责把“记忆”从 `waveary-core` 的接口层进一步落成独立能力层。

## Responsibilities

- 记忆候选提取
- 记忆去重与评分
- 记忆存储
- 记忆检索
- 记忆召回策略

## Current Scope

当前版本提供：

- 一个规则优先的基础 `MemoryExtractor`
- 一个内存级 `MemoryStore`
- 面向 `waveary-core` 的直接接口适配

这版实现的目标不是复杂算法，而是先把模块边界和可运行闭环建立起来。
