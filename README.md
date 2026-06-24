# Waveary

<div align="center">

## 回响之境

### An Open Source Digital Life Companion Framework
### 一个开源数字生命陪伴框架

**念念不忘，终有回响。**  
**What is remembered returns as an echo.**

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/network/members)
[![GitHub issues](https://img.shields.io/github/issues/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/commits/main)
[![Visitors](https://komarev.com/ghpvc/?username=K2st0r&repo=Waveary&color=111111&label=views)](https://github.com/K2st0r/Waveary)

**Quick Links**  
[`Quick Start`](#quick-start--快速开始) · [`Project Status`](#project-status--项目状态) · [`Architecture`](#architecture-glance--架构一览) · [`Roadmap`](#roadmap--路线图) · [`Contributing`](#contributing--参与贡献)

</div>

---

## Overview | 项目简介

**Waveary is not trying to build a smarter chatbot first.**  
It is building a continuity layer that lets any large model remember, understand, grow, and accompany a person over time.

**Waveary 不试图先造一个更聪明的聊天机器人。**  
它要构建的是一层“连续性框架”，让任何大模型都能拥有长期记忆、关系成长、人生时间轴与情感陪伴能力。

Waveary is best understood as:

- a **Digital Life Companion Framework**
- a **continuity layer for large models**
- an **operating layer for memory, relationship, timeline, emotion, and voice**

Waveary 更适合被理解为：

- 一个**数字生命陪伴框架**
- 一个面向所有大模型的**人格连续性与人生记忆层**
- 一个围绕**记忆、关系、时间轴、情绪、语音**构建的运行层

---

## Why Waveary | 我们为什么做它

Most AI products can answer. Few can continue.

大多数 AI 产品会回答问题，但很少有产品能真正“延续关系”。

What users actually miss over time is not only intelligence. It is:

- being remembered
- being understood in context
- being accompanied across life events
- being cared for with emotional continuity

用户长期真正会在意的，不只是模型聪不聪明，而是：

- 是否被记住
- 是否被持续理解
- 是否能围绕人生事件形成连续陪伴
- 是否能带着情绪温度长期存在

That is the gap Waveary is designed to fill.

这正是 Waveary 想补上的那一层能力。

---

## Positioning | 项目定位

### Waveary is not | Waveary 不是什么

- `AI Girlfriend`
- `AI Boyfriend`
- a generic chatbot wrapper
- a prompt-only roleplay shell

### Waveary is | Waveary 是什么

- an open source **Digital Life Companion Framework**
- a reusable companion runtime for multi-model products
- infrastructure for long-term memory, relationship growth, timeline recall, emotional continuity, and voice interaction

---

## Core Thesis | 核心主张

### 1. Memory comes before model.  
### 1. 记忆优先于模型。

Model capability will keep changing. Continuity should not.

模型能力会不断变化，但连续性不应该跟着漂移。

### 2. Relationship comes before features.  
### 2. 关系优先于功能。

A companion product is defined less by feature count than by whether the relationship can deepen over time.

一个陪伴产品真正的价值，不在于功能堆了多少，而在于关系能否持续变深。

### 3. Companionship comes before intelligence.  
### 3. 陪伴优先于智能。

The goal is not occasional surprise. The goal is long-term presence.

目标不是偶尔惊艳，而是长期存在。

---

## Highlights | 项目亮点

- Multi-provider model access  
  多供应商模型接入
- Provider model discovery  
  供应商模型检索
- Browser-based runtime chat shell  
  浏览器内运行时对话
- Long-term memory and relationship scaffolding  
  长期记忆与关系成长骨架
- Timeline-oriented session continuity  
  面向时间轴的会话连续性
- Permissioned local time awareness  
  有权限边界的本地时间感知
- Permissioned local actions  
  有权限边界的本地动作执行
- Dedicated voice routing and realtime voice foundation  
  独立语音路由与实时语音基础

---

## Who Is It For | 它适合谁

- builders creating companion-native AI products  
  正在做陪伴型 AI 产品的开发者
- teams that want to add memory and relationship continuity to existing LLM applications  
  想给现有 LLM 产品补上记忆与关系连续性的团队
- researchers exploring long-term interaction, emotional continuity, and memory-driven systems  
  研究长期交互、情绪连续性和记忆驱动系统的研究者
- open source contributors who want a practical companion-runtime foundation instead of a roleplay shell  
  想参与一个真正的陪伴运行时开源底座，而不是角色扮演壳子的贡献者

---

## Feature Matrix | 能力矩阵

| Capability | Current Direction | Notes |
| --- | --- | --- |
| Chat runtime | Available | Browser-first runtime shell is usable |
| Multi-provider access | Available | OpenAI-compatible provider abstraction exists |
| Model discovery | Available | Provider-side `/models` discovery exists |
| Long-term memory | Available baseline | Extraction, storage, retrieval scaffold exists |
| Relationship growth | Available baseline | Stateful continuity layer exists |
| Timeline continuity | Available baseline | Timeline-aware session structure exists |
| Emotional continuity | In progress | Runtime emotion layer is being expanded |
| Voice routing | Available baseline | Dedicated voice path and realtime base exist |
| Full duplex voice | In progress | Realtime voice is still under active development |
| Proactive care | In progress | Direction is defined and partially scaffolded |

| 能力 | 当前方向 | 说明 |
| --- | --- | --- |
| 对话运行时 | 已可用 | 浏览器优先的运行时外壳已可使用 |
| 多供应商接入 | 已可用 | OpenAI-compatible 抽象已存在 |
| 模型检索 | 已可用 | 已支持供应商 `/models` 检索 |
| 长期记忆 | 基线已具备 | 提取、存储、检索骨架已存在 |
| 关系成长 | 基线已具备 | 有状态连续性层已存在 |
| 时间轴连续性 | 基线已具备 | 时间轴会话结构已存在 |
| 情绪连续性 | 进行中 | 运行时情绪层正在继续扩展 |
| 语音路由 | 基线已具备 | 独立语音链路与实时基础已存在 |
| 全双工语音 | 进行中 | 实时语音仍在持续推进 |
| 主动关怀 | 进行中 | 方向已明确并已有部分骨架 |

---

## Core Engines | 核心引擎

| Engine | Name | Responsibility |
| --- | --- | --- |
| `WME` | Waveary Memory Engine | Long-term memory |
| `WRE` | Waveary Relationship Engine | Relationship growth |
| `WTE` | Waveary Timeline Engine | Timeline and recall |
| `WEE` | Waveary Emotion Engine | Emotional continuity |
| `WVE` | Waveary Voice Engine | Voice interaction |

| 引擎 | 名称 | 职责 |
| --- | --- | --- |
| `WME` | Waveary Memory Engine | 长期记忆 |
| `WRE` | Waveary Relationship Engine | 关系成长 |
| `WTE` | Waveary Timeline Engine | 时间轴与回忆 |
| `WEE` | Waveary Emotion Engine | 情绪连续性 |
| `WVE` | Waveary Voice Engine | 语音交互 |

---

## Architecture Glance | 架构一览

```mermaid
flowchart TD
    UI["Web / Mobile UI<br/>Web / 移动端界面"] --> Runtime["Waveary Runtime<br/>运行时编排层"]
    Runtime --> Memory["WME<br/>Memory Engine"]
    Runtime --> Relationship["WRE<br/>Relationship Engine"]
    Runtime --> Timeline["WTE<br/>Timeline Engine"]
    Runtime --> Emotion["WEE<br/>Emotion Engine"]
    Runtime --> Voice["WVE<br/>Voice Engine"]
    Runtime --> Providers["Model / Voice Providers<br/>模型与语音供应商"]
```

Waveary sits between product interfaces and model vendors.

Waveary 位于产品界面和模型供应商之间。

It is the layer that turns short-term model interaction into long-term companion continuity.

它负责把短期模型交互提升为长期陪伴连续性。

---

## Repository Structure | 仓库结构

```text
waveary/
  waveary-core
  waveary-web
  waveary-mobile
  waveary-memory
  waveary-voice
  waveary-docs
```

Current repository modules:

- `waveary-core` - runtime orchestration and provider abstraction
- `waveary-memory` - memory extraction, storage, and retrieval
- `waveary-voice` - voice interaction layer
- `waveary-web` - official web surface

当前仓库已落地模块：

- `waveary-core` - 运行时编排与多供应商抽象
- `waveary-memory` - 记忆提取、存储与检索
- `waveary-voice` - 语音交互层
- `waveary-web` - 官方 Web 产品界面

---

## Project Status | 项目状态

| Area | Status | Notes |
| --- | --- | --- |
| Core runtime | In progress | Multi-provider runtime skeleton is in place |
| Memory | In progress | Extraction, storage, retrieval baseline exists |
| Relationship | In progress | Stateful continuity scaffolding exists |
| Timeline | In progress | Timeline-aware session continuity exists |
| Voice | In progress | Dedicated routing and realtime foundation exist |
| Web surface | In progress | Official product shell is already usable |

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Core runtime | 进行中 | 多供应商运行时骨架已建立 |
| Memory | 进行中 | 提取、存储、检索基线已落地 |
| Relationship | 进行中 | 有状态关系连续性骨架已存在 |
| Timeline | 进行中 | 面向时间轴的会话连续性已存在 |
| Voice | 进行中 | 独立语音路由与实时基础已存在 |
| Web surface | 进行中 | 官方产品外壳已可使用 |

---

## Quick Start | 快速开始

### Requirements | 环境要求

- `Node.js 20+`
- `npm 10+`

### Install | 安装

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
npm install
```

### Run the web app | 启动 Web 界面

```bash
npm run web:dev
```

### Build the web app | 构建 Web 界面

```bash
npm run web:build
```

### Run tests | 运行测试

```bash
npm run test
```

### Verify provider integration | 验证供应商接入

```bash
npm run verify:provider
```

---

## Usage Flow | 使用流程

1. Choose a provider.  
   选择模型供应商。
2. Fill in base URL and API key.  
   填写 Base URL 和 API Key。
3. Discover available models.  
   检索可用模型。
4. Select the model you want to use.  
   选择要使用的模型。
5. Start chatting with memory, relationship, timeline, and voice capabilities layered on top.  
   在记忆、关系、时间轴与语音能力的加持下开始对话。

---

## Design Principles | 设计原则

- framework first, product shell second  
  先做框架，再做产品壳
- continuity over novelty  
  连续性优先于新奇感
- stateful systems over prompt tricks  
  系统状态优先于 prompt 技巧
- explicit permissions over silent power  
  显式权限优先于隐式能力
- extensibility over vendor lock-in  
  可扩展性优先于供应商绑定

---

## Roadmap | 路线图

### V0.1 | 30 Days

- Chat
- Long-term memory
- Timeline
- Relationship growth

### V0.2 | 60 Days

- Voice
- Emotion analysis
- Proactive care

### V0.3 | 90 Days

- Real-time voice
- Interruption handling
- Full duplex conversation

---

## Vision | 愿景

Waveary is not trying to create a talking character.

It is building the infrastructure for persistent digital companionship.

Waveary 不是在做一个会说话的角色壳子。

它真正要做的是：  
为所有大模型补上一层可以长期记住、持续理解、关系成长、带有情绪温度的人生陪伴基础设施。

In the long run, Waveary aims to become the continuity and life-memory layer for large models.

从更长远的视角看，Waveary 想成为所有大模型的“人格连续性”与“人生记忆”层。

---

## Open Source Direction | 开源方向

Waveary CE is intended to have real core value, not just a demo shell.

Waveary CE 的目标不是做一个展示壳，而是提供真正有价值的开源核心能力。

That means the open source version should genuinely include:

- chat loop
- long-term memory
- relationship growth
- timeline awareness
- foundational voice capability

这意味着开源版应该真实承载：

- 聊天闭环
- 长期记忆
- 关系成长
- 时间轴能力
- 基础语音能力

---

## Documentation | 文档

- `docs/vision.md`
- `docs/architecture.md`
- `docs/product-invariants.md`
- `docs/product-preferences.md`
- `waveary-web/README.md`

---

## Contributing | 参与贡献

Issues, ideas, architecture discussion, and feature proposals are welcome.

欢迎提交 issue、想法、架构讨论与功能提案。

If you want to contribute:

1. fork the repository
2. create a branch
3. make a focused change
4. open a pull request

如果你想参与贡献：

1. fork 仓库
2. 新建分支
3. 做一个聚焦的小改动
4. 发起 pull request

---

## License | 许可

This repository is released under the [MIT License](./LICENSE).

本仓库基于 [MIT License](./LICENSE) 开源。
