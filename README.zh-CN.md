# 回响之境 | Waveary

<div align="center">

<img src="./docs/assets/readme-hero-fan.png" alt="Waveary hero banner" width="100%" />

## 回响之境 | Waveary

### 念念不忘，终有回响。

**开源数字生命陪伴框架**

**简体中文** · [English](./README.md)

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-black.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/network/members)
[![GitHub issues](https://img.shields.io/github/issues/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/commits/main)

[快速开始](#快速开始) ·
[ZIP 用户](#zip-用户使用说明) ·
[部署](#服务器部署) ·
[常用命令](#常用命令) ·
[文档](#文档)

</div>

---

## Waveary 是什么？

Waveary 是一个面向长期陪伴体验的开源数字生命框架。

它为兼容的大模型提供连续性能力层，包括：

- 长期记忆
- 关系成长
- 人生时间轴
- 情绪连续性
- 语音交互

Waveary 不是另一个聊天壳子。

它想做的是一层系统能力，让 AI 能够记住、理解、成长，并在更长的时间里陪伴用户。

## 现在已经可以用什么？

当前可用能力：

- 基于浏览器的聊天界面
- 供应商配置与模型发现
- 本地持久化聊天会话
- 记忆 / 关系 / 时间轴运行时信号
- 独立语音路由基础层

当前项目状态：

- 适合开发者、构建者、早期测试者
- 目前还不是一键安装的消费级成品
- 现在最稳妥的使用方式仍然是本地运行或自行部署 Node 服务

## 快速开始

如果你想最快把 Waveary 在本地跑起来，直接按下面做。

### 1. 安装前置环境

- [Node.js 20+](https://nodejs.org/)
- `npm 10+`（通常会随 Node.js 一起安装）

检查版本：

```bash
node -v
npm -v
```

### 2. 获取项目

使用 Git：

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

或者直接从 GitHub 下载 ZIP，解压后在终端中打开解压出的项目目录。

### 3. 安装依赖

```bash
npm install
```

### 4. 启动 Waveary

```bash
npm run web:dev
```

启动成功后打开：

```text
http://127.0.0.1:4173
```

### 5. 配置模型供应商

页面打开后：

1. 进入控制台页面。
2. 选择一个供应商。
3. 填写 `Base URL` 和 `API Key`。
4. 点击获取可用模型。
5. 选择模型。
6. 开始聊天。

你也可以直接用命令行配置助手：

```bash
npm run setup:provider
```

这个命令会：

- 列出已知供应商
- 询问你的 API Key
- 拉取可用模型
- 将选定配置保存到本地

## ZIP 用户使用说明

如果你是直接下载 ZIP，而不是用 Git，请按下面步骤操作。

### Windows

1. 从 GitHub 下载项目 ZIP。
2. 右键 ZIP，选择 `全部解压缩`。
3. 打开解压后的 `Waveary` 文件夹。
4. 点击文件夹路径栏，输入 `powershell` 并回车。
5. 运行：

```powershell
npm install
npm run web:dev
```

6. 在浏览器中打开 `http://127.0.0.1:4173`。

### macOS / Linux

1. 下载并解压 ZIP。
2. 打开终端。
3. `cd` 到解压后的项目目录。
4. 运行：

```bash
npm install
npm run web:dev
```

5. 打开 `http://127.0.0.1:4173`。

## 服务器部署

当前最简单、最稳妥的部署方式是：

- Linux 服务器
- Node.js 20+
- 使用 `npm run web:preview`
- 通过 Nginx 或 Caddy 做反向代理

### 推荐部署流程

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
npm install
npm run web:preview
```

默认情况下，Waveary 预览服务运行在：

```text
http://127.0.0.1:4173
```

如果要公网访问，请在前面加 Nginx 或 Caddy，并反向代理到 `127.0.0.1:4173`。

更详细的逐步部署说明在这里：

- [中文部署指南](./docs/deployment-guide.zh-CN.md)
- [English Deployment Guide](./docs/deployment-guide.md)

## 常用命令

```bash
# 本地开发启动
npm run web:dev

# 构建 Web 应用
npm run web:build

# 本地生产预览
npm run web:preview

# 完整测试
npm run test

# 交互式供应商配置
npm run setup:provider

# 验证当前保存的供应商配置
npm run verify:provider

# 查看当前配置可用模型
npm run models:provider

# 仅清空本地测试聊天记忆
npm run reset:test-memory
```

## 本地数据保存在哪里？

Waveary 会把本地运行数据保存在项目根目录下的：

```text
.waveary/
```

常见文件包括：

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`

如果你把项目迁移到另一台机器，并且希望保留本地配置和聊天状态，也要一起备份 `.waveary/` 文件夹。

## 常见问题

### 提示找不到 `node` 或 `npm`

先安装 Node.js，然后重新打开终端。

### `npm install` 失败

可以尝试：

```bash
npm cache verify
npm install
```

### 页面打不开

检查开发服务器是否已经启动，以及 `4173` 端口是否被其他程序占用。

### 供应商配置成功，但聊天仍然失败

运行：

```bash
npm run verify:provider
```

这个命令会检查你保存的供应商配置是否真的能够：

- 拉取模型列表
- 选择可用模型
- 完成一次真实聊天请求

### 我想清空旧的本地聊天记忆

运行：

```bash
npm run reset:test-memory
```

## 仓库结构

```text
waveary/
  waveary-core
  waveary-memory
  waveary-voice
  waveary-web
  waveary-dataset
  docs
```

模块职责：

- `waveary-core`：运行时编排与供应商抽象
- `waveary-memory`：记忆提取、存储、检索
- `waveary-voice`：语音路由与语音运行时层
- `waveary-web`：官方 Web 界面
- `waveary-dataset`：以 Markdown 为主的陪伴灵魂与对话规则

## 文档

- [English README](./README.md)
- [中文部署指南](./docs/deployment-guide.zh-CN.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [项目状态](./PROJECT_STATE.md)
- [项目愿景](./docs/vision.md)
- [架构设计](./docs/architecture.md)
- [产品不变量](./docs/product-invariants.md)
- [产品偏好](./docs/product-preferences.md)
- [Web 界面说明](./waveary-web/README.md)

## 参与贡献

欢迎提交 Issue、参与架构讨论、提出功能建议，或者发起聚焦明确的 PR。

基本流程：

1. Fork 本仓库。
2. 创建分支。
3. 做一项聚焦明确的修改。
4. 发起 Pull Request。

## 许可证

本项目基于 [MIT License](./LICENSE) 开源。
