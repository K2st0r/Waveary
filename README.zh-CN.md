# 回响之境 | Waveary

<div align="center">

<img src="./docs/assets/readme-hero-fan.png" alt="Waveary hero banner" width="100%" />

## 回响之境 | Waveary

### 念念不忘，终有回响。

**开源数字生命陪伴智能体框架**

**简体中文** · [English](./README.md)

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-black.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/network/members)
[![GitHub issues](https://img.shields.io/github/issues/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/commits/main)
[![GitHub release](https://img.shields.io/github/v/release/K2st0r/Waveary?display_name=tag)](https://github.com/K2st0r/Waveary/releases/latest)

[下载安装](#windows-下载安装) ·
[快速开始](#快速开始) ·
[智能体结构](#陪伴智能体结构) ·
[桌面端](#桌面端) ·
[数据迁移](#本地数据与迁移) ·
[部署](#服务器部署) ·
[文档](#文档) ·
[商业使用](./docs/commercial-use.zh-CN.md)

</div>

---

## Waveary 是什么？

Waveary 是一个用于构建长期数字生命陪伴体验的开源框架。

它不是普通聊天壳，也不是只会调用工具的任务型智能体。Waveary 更像是一层连续性运行时，为兼容模型提供：

- 长期记忆
- 关系连续性
- 人生时间轴感知
- 情绪状态与回复策略
- 语音交互
- 经过授权的本地与浏览器动作
- 可迁移的人物档案

核心想法很简单：模型会变化，供应商会变化，但真正的陪伴应该能长期记住、理解、说话、行动，并随着用户一起成长。

## Waveary 为什么不同？

多数智能体框架围绕任务设计：调用工具、执行流程、转交给其他 agent、完成工作。

Waveary 围绕连续性设计：

- 记忆是系统状态，不是 prompt 装饰。
- 关系是会变化的运行时状态，不是表演出来的阶段标签。
- 情绪会影响回复方式，不只是把话说得更温柔。
- 语音属于同一个人格，不是把文字读一遍。
- 本地动作必须经过权限控制，不是隐藏的自动化。
- 迁移是核心能力：SQLite 保存活体状态，JSON 承载跨设备档案包。

## 陪伴智能体结构

Waveary 位于产品界面和模型供应商之间。

```text
Waveary 桌面端 / Web 客户端
        |
陪伴运行时壳层
        |
Waveary Agent Core
        |
记忆 / 关系 / 情绪 / 时间轴 / 语音 / 工具
        |
供应商路由
        |
LLM / STT / TTS / 视觉 / 生图 / 浏览器 / 本地动作
        |
SQLite 本地存储 + JSON 档案包 + 后续云同步
```

### 运行时分层

| 层级 | 名称 | 职责 |
| --- | --- | --- |
| L0 | 客户端壳层 | 桌面端、Web、后续移动端 |
| L1 | 对话运行时 | 单轮聊天、语音、动作与回复策略 |
| L2 | 身份层 | 人物档案、用户身份、关系身份 |
| L3 | 记忆层 | 工作记忆、语义记忆、摘要、档案 |
| L4 | 情绪层 | 用户情绪、陪伴者情绪、语气策略 |
| L5 | 关系层 | 信任、熟悉感、边界、长期关系状态 |
| L6 | 时间轴层 | 人生事件、纪念日、时间顺序与回忆 |
| L7 | 动作层 | 浏览器、桌面、提醒、外部通道 |
| L8 | 语音层 | STT、TTS、实时语音、中断处理 |
| L9 | 供应商层 | 多供应商语言、语音、视觉、生图、视频路由 |
| L10 | 安全与权限 | 权限模式、确认、撤销、审计日志 |
| L11 | 可观测层 | 调试轨迹、运行信号、测试与行为评估 |

### 单轮对话流程

Waveary 不应该让模型直接裸回，而是先判断这一轮到底是什么场景。

```text
用户输入
  -> 输入解析
  -> 情绪识别
  -> 意图识别
  -> 关系状态读取
  -> 记忆召回
  -> 时间 / 环境上下文
  -> 权限判断
  -> 工具决策
  -> 回复策略
  -> 自然语言生成
  -> 语音表达规划
  -> 记忆 / 情绪 / 关系 / 时间轴更新
  -> 持久化
```

这能避免“用户说难过，系统却突然报时间”这类问题。陪伴感来自上下文判断，而不是只靠模型即兴发挥。

## 记忆模型

Waveary 的长期方向是五层记忆。

| 层级 | 名称 | 作用 |
| --- | --- | --- |
| M1 | 工作记忆 | 最近消息与当前上下文 |
| M2 | 情景记忆 | 某次对话发生了什么 |
| M3 | 语义记忆 | 事实、偏好、习惯、长期模式 |
| M4 | 概念记忆 | “这个人是谁”“我们是什么关系” |
| M5 | 人物档案 | 名字、头像、声音、关系风格、迁移数据 |

本地活体状态使用 SQLite。跨设备迁移使用 JSON。

一个完整导出的 companion archive 应该包含：

- 人物档案
- 头像引用
- 语音偏好
- 模型偏好
- 对话历史
- 长期记忆
- 身份摘要
- 关系状态
- 情绪状态
- 时间轴事件
- 档案 schema 版本

## 现在可以用什么？

当前可用能力：

- 浏览器聊天界面
- Electron 桌面端壳层
- 供应商配置与模型发现
- 本地持久化聊天会话
- 人物档案持久化
- 记忆 / 关系 / 时间轴运行时信号
- 独立语音路由基础
- 浏览器与本地动作权限基础
- SQLite / JSON 档案迁移方向

当前项目状态：

- 适合开发者、构建者和早期测试者
- 桌面端打包路径已经存在，但正式消费级发布仍在打磨
- 目前最稳的使用方式仍然是本地开发或自行部署 Node 服务

## Windows 下载安装

如果你只是想直接使用 Waveary，请从这里开始，不要先看部署文档。

- [下载最新版 Windows 安装包](https://github.com/K2st0r/Waveary/releases/latest/download/Waveary-Setup-Windows-x64.exe)
- [查看全部 Releases](https://github.com/K2st0r/Waveary/releases)

推荐流程：

1. 下载 `Waveary-Setup-Windows-x64.exe`
2. 双击运行安装包
3. 从桌面快捷方式或开始菜单启动 Waveary
4. 在应用里接入一个模型供应商
5. 直接开始使用

如果你是开发者，想从源码运行，再继续看下面的快速开始。

## 快速开始

### 1. 安装前置环境

- [Node.js 20+](https://nodejs.org/)
- `npm 10+`

检查版本：

```bash
node -v
npm -v
```

### 2. 获取项目

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

也可以从 GitHub 下载 ZIP，解压后在终端中打开项目目录。

### 3. 安装依赖

```bash
npm install
```

### 4. 启动 Web 版

```bash
npm run web:dev
```

打开：

```text
http://127.0.0.1:4173
```

### 5. 配置模型供应商

进入 Waveary 后：

1. 打开模型 / 供应商控制面板。
2. 选择供应商。
3. 填写 `Base URL` 与 `API Key`。
4. 获取可用模型。
5. 选择模型。
6. 开始对话。

也可以使用命令行配置助手：

```bash
npm run setup:provider
```

## 桌面端

Waveary 已包含 Electron 桌面端壳层。

对普通用户来说，推荐的交付方式就是 GitHub Releases 安装包：

1. 从 [GitHub Releases](https://github.com/K2st0r/Waveary/releases/latest) 下载 `Waveary-Setup-Windows-x64.exe`
2. 双击安装包，按安装向导完成安装。
3. 安装器会创建桌面快捷方式和开始菜单入口，安装后可直接启动。
4. 打开 Waveary，接入一次模型供应商后即可开始使用。

桌面端开发：

```bash
npm run desktop:dev
```

只准备桌面端运行时：

```bash
npm run desktop:prepare
```

构建 Windows 安装包：

```bash
npm run desktop:dist
```

安装包输出目录：

```text
waveary-desktop/dist/
```

发布到 GitHub Releases 的核心文件是：

```text
waveary-desktop/dist/Waveary-Setup-Windows-x64.exe
```

维护者发布流程：

1. 推送一个像 `v0.1.0` 这样的 tag，或者手动运行 GitHub Actions 里的 `Release Desktop Installer`
2. GitHub Actions 会在 `windows-latest` 上自动构建安装包
3. 工作流会把安装包自动上传到对应的 GitHub Release

## 本地数据与迁移

Waveary 会把本地运行数据保存在：

```text
.waveary/
```

常见文件包括：

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`

推荐存储路线：

- `SQLite` 保存本地实时运行状态
- `JSON` 用于导入、导出、备份与跨设备迁移

这样可以让人物档案、对话历史、关系状态、记忆摘要和语音偏好一起迁移，而不是只迁移零散聊天记录。

## 服务器部署

当前最简单的部署方式：

- Linux 服务器
- Node.js 20+
- `npm run web:preview`
- 使用 Nginx 或 Caddy 做反向代理

推荐流程：

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
npm install
npm run web:preview
```

默认预览地址：

```text
http://127.0.0.1:4173
```

如需公网访问，请使用 Nginx 或 Caddy 反向代理到 `127.0.0.1:4173`。

详细部署说明：

- [中文部署指南](./docs/deployment-guide.zh-CN.md)
- [English Deployment Guide](./docs/deployment-guide.md)

如果你只是要直接下载使用，不要从这里开始，直接用上面的 Windows 安装包入口。

## 常用命令

```bash
# 启动本地 Web 开发
npm run web:dev

# 启动桌面端开发
npm run desktop:dev

# 构建 Web 应用
npm run web:build

# 本地生产预览
npm run web:preview

# 构建 Windows 桌面端安装包
npm run desktop:dist

# 完整测试
npm run test

# 交互式供应商配置
npm run setup:provider

# 验证当前保存的供应商配置
npm run verify:provider

# 查看当前配置可用模型
npm run models:provider

# 只清空本地测试聊天记忆
npm run reset:test-memory
```

## 仓库结构

```text
waveary/
  waveary-core
  waveary-memory
  waveary-voice
  waveary-web
  waveary-desktop
  waveary-dataset
  docs
```

模块职责：

- `waveary-core`：运行时编排、供应商抽象、对话策略、关系逻辑、权限动作
- `waveary-memory`：记忆提取、存储、检索与评分方向
- `waveary-voice`：语音路由、TTS / STT 供应商边界、实时语音协调
- `waveary-web`：官方交互客户端
- `waveary-desktop`：Electron 桌面端壳层与安装包
- `waveary-dataset`：以 Markdown 为主的陪伴灵魂、对话规则与健康边界

## 文档

- [English README](./README.md)
- [中文部署指南](./docs/deployment-guide.zh-CN.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [商业使用与品牌授权说明](./docs/commercial-use.zh-CN.md)
- [Commercial Use And Brand Licensing](./docs/commercial-use.md)
- [Waveary 版本规划](./docs/editions.zh-CN.md)
- [Waveary Editions](./docs/editions.md)
- [Web 界面说明](./waveary-web/README.md)

内部开发路线、continuity、实现规划类文档不再放在公开仓库中。

## 参与贡献

欢迎提交 Issue、参与架构讨论、提出功能建议，或发起聚焦明确的 Pull Request。

基本流程：

1. Fork 本仓库。
2. 创建分支。
3. 做一项聚焦明确的修改。
4. 发起 Pull Request。

## 品牌与官方素材说明

- 本仓库源代码遵循 [Apache License 2.0](./LICENSE)。
- `Waveary`、`回响之境`、官方 Logo、人物卡、插画、截图和其他官方品牌素材不随 Apache 2.0 一并授权。
- 个人学习、研究、评估和代码层面的二次开发遵循 Apache 2.0。
- 如需在商业分发、商业托管或商业包装产品中使用官方名称、Logo 或官方视觉资产，需要事先取得书面许可。
- Fork 可以依法使用代码，但不得冒充官方项目，也不得未经许可沿用官方品牌对外发布。
- 详见 [TRADEMARKS.md](./TRADEMARKS.md)、[BRAND-ASSETS.md](./BRAND-ASSETS.md) 和 [商业使用与品牌授权说明](./docs/commercial-use.zh-CN.md)。

## 许可证

本项目源代码基于 [Apache License 2.0](./LICENSE) 开源。
