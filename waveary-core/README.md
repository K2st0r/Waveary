# waveary-core

`waveary-core` is the runtime center of Project Waveary.

它负责把一次次独立对话组织成长期、连续、可持久化的陪伴系统。

## Responsibilities

- 会话编排
- 核心领域对象
- Provider 抽象
- 事件流与状态流
- 记忆、关系、时间轴、情绪、语音模块协调

## Initial Scope

V0.1 阶段，`waveary-core` 应优先保证以下能力：

- 文本会话生命周期
- 上下文组装
- 记忆召回接入
- 关系状态更新接入
- 时间轴写入接入
- 持久化边界定义

## Proposed Layout

```text
waveary-core/
  README.md
  docs/
    domain-model.md
  src/
    domain/
    providers/
    runtime/
```

后续实现阶段可进一步扩展为：

```text
waveary-core/
  src/
    domain/
    runtime/
    providers/
    services/
    storage/
```

## Current Status

当前仓库已经提供第一版 TypeScript runtime skeleton，包括：

- 核心领域对象定义
- provider 接口定义
- 一个标准 `handleTurn` runtime flow

这版代码的目标不是直接产品化，而是先把长期陪伴框架的最小程序结构钉住。

## Design Rule

`waveary-core` 不应该把记忆、关系、时间轴理解成 prompt 拼接技巧。

它们应被视为可演进、可持久化、可解释的系统层能力。
