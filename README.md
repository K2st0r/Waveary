# Waveary

<div align="center">

<img src="./docs/assets/readme-hero-fan.png" alt="Waveary hero banner" width="100%" />

## 回响之境 | Waveary

### 念念不忘，终有回响。 | What is remembered returns as an echo.

**Open Source Digital Life Companion Framework**  
**开源数字生命陪伴框架**

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/network/members)
[![GitHub issues](https://img.shields.io/github/issues/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/commits/main)

[Quick Start | 快速开始](#quick-start--快速开始) ·
[ZIP Users | ZIP 用户](#for-zip-download-users--zip-用户) ·
[Deploy | 部署](#deploy-on-a-server--服务器部署) ·
[Commands | 常用命令](#common-commands--常用命令) ·
[Docs | 文档](#documentation--文档)

</div>

---

## What Is Waveary? | Waveary 是什么？

Waveary is an open source framework for long-term digital companionship.  
Waveary 是一个面向长期陪伴体验的开源数字生命框架。

It gives any compatible model a continuity layer for memory, relationship growth, timeline awareness, emotional continuity, and voice interaction.  
它为兼容的大模型提供连续性能力层，包括长期记忆、关系成长、人生时间轴、情绪连续性与语音交互。

Waveary is not trying to be just another chatbot skin. It is trying to be the system layer that helps an AI remember, understand, grow, and stay with a user over time.  
Waveary 不是另一个聊天壳子。它想做的是一层系统能力，让 AI 能够记住、理解、成长，并在更长的时间里陪伴用户。

## What You Can Use Today | 现在已经可以用什么？

Current usable surface:  
当前可用能力：

- browser-based chat UI
- provider setup and model discovery
- persistent local chat sessions
- memory / relationship / timeline runtime signals
- dedicated voice routing foundation

- 基于浏览器的聊天界面
- 供应商配置与模型发现
- 本地持久化聊天会话
- 记忆 / 关系 / 时间轴运行时信号
- 独立语音路由基础层

Current project status:  
当前项目状态：

- suitable for developers, builders, and early testers
- not yet a one-click packaged consumer app
- easiest working path today is local run or self-hosted Node deployment

- 适合开发者、构建者、早期测试者
- 目前还不是一键安装的消费级成品
- 现在最稳妥的使用方式仍然是本地运行或自行部署 Node 服务

## Quick Start | 快速开始

If you want to run Waveary locally as fast as possible, do this.  
如果你想最快把 Waveary 在本地跑起来，直接按下面做。

### 1. Install prerequisites | 安装前置环境

- [Node.js 20+](https://nodejs.org/)
- `npm 10+` (usually comes with Node.js)
- `npm 10+`（通常会随 Node.js 一起安装）

Check your versions:  
检查版本：

```bash
node -v
npm -v
```

### 2. Get the project | 获取项目

Use Git:  
使用 Git：

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

Or download the ZIP from GitHub, extract it, and open the extracted folder in your terminal.  
或者直接从 GitHub 下载 ZIP，解压后在终端中打开解压出的项目目录。

### 3. Install dependencies | 安装依赖

```bash
npm install
```

### 4. Start Waveary | 启动 Waveary

```bash
npm run web:dev
```

When startup succeeds, open:  
启动成功后打开：

```text
http://127.0.0.1:4173
```

### 5. Configure your model provider | 配置模型供应商

After the page opens:  
页面打开后：

1. Go to the console page.
2. Choose a provider.
3. Fill in `Base URL` and `API Key`.
4. Click to fetch models.
5. Choose a model.
6. Start chatting.

1. 进入控制台页面。
2. 选择一个供应商。
3. 填写 `Base URL` 和 `API Key`。
4. 点击获取可用模型。
5. 选择模型。
6. 开始聊天。

You can also use the CLI helper:  
你也可以直接用命令行配置助手：

```bash
npm run setup:provider
```

That command will:  
这个命令会：

- list known providers
- ask for your API key
- fetch available models
- save the selected config locally

- 列出已知供应商
- 询问你的 API Key
- 拉取可用模型
- 将选定配置保存到本地

## For ZIP Download Users | ZIP 用户使用说明

If you downloaded the project as a ZIP and do not use Git, follow these steps exactly.  
如果你是直接下载 ZIP，而不是用 Git，请按下面步骤操作。

### Windows

1. Download the project ZIP from GitHub.
2. Right-click the ZIP and choose `Extract All`.
3. Open the extracted `Waveary` folder.
4. Click the folder path bar, type `powershell`, and press Enter.
5. Run:

1. 从 GitHub 下载项目 ZIP。
2. 右键 ZIP，选择 `全部解压缩`。
3. 打开解压后的 `Waveary` 文件夹。
4. 点击文件夹路径栏，输入 `powershell` 并回车。
5. 运行：

```powershell
npm install
npm run web:dev
```

6. Open `http://127.0.0.1:4173` in your browser.
6. 在浏览器中打开 `http://127.0.0.1:4173`。

### macOS / Linux

1. Download and extract the ZIP.
2. Open Terminal.
3. `cd` into the extracted folder.
4. Run:

1. 下载并解压 ZIP。
2. 打开终端。
3. `cd` 到解压后的项目目录。
4. 运行：

```bash
npm install
npm run web:dev
```

5. Open `http://127.0.0.1:4173`.
5. 打开 `http://127.0.0.1:4173`。

## Deploy On A Server | 服务器部署

The simplest supported deployment path today is:  
当前最简单、最稳妥的部署方式是：

- Linux server
- Node.js 20+
- `npm run web:preview`
- reverse proxy through Nginx or Caddy

- Linux 服务器
- Node.js 20+
- 使用 `npm run web:preview`
- 通过 Nginx 或 Caddy 做反向代理

### Recommended deployment flow | 推荐部署流程

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
npm install
npm run web:preview
```

By default, Waveary preview runs on:  
默认情况下，Waveary 预览服务运行在：

```text
http://127.0.0.1:4173
```

For public access, put Nginx or Caddy in front of it and reverse proxy to `127.0.0.1:4173`.  
如果要公网访问，请在前面加 Nginx 或 Caddy，并反向代理到 `127.0.0.1:4173`。

Detailed step-by-step deployment instructions are here:  
更详细的逐步部署说明在这里：

- [docs/deployment-guide.md](./docs/deployment-guide.md)

## Common Commands | 常用命令

```bash
# Start local development
npm run web:dev

# Build the web app
npm run web:build

# Run local production preview
npm run web:preview

# Full test run
npm run test

# Interactive provider setup
npm run setup:provider

# Verify saved provider config
npm run verify:provider

# List models from current provider config
npm run models:provider

# Reset local test chat memory only
npm run reset:test-memory
```

```text
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

## Where Waveary Saves Local Data | 本地数据保存在哪里？

Waveary stores local runtime data in the repository root under:  
Waveary 会把本地运行数据保存在项目根目录下的：

```text
.waveary/
```

Common files include:  
常见文件包括：

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`

If you move the project to another machine and want to keep your local state, back up the `.waveary/` folder too.  
如果你把项目迁移到另一台机器，并且希望保留本地配置和聊天状态，也要一起备份 `.waveary/` 文件夹。

## Troubleshooting | 常见问题

### `node` or `npm` is not recognized | 提示找不到 `node` 或 `npm`

Install Node.js first, then reopen your terminal.  
先安装 Node.js，然后重新打开终端。

### `npm install` fails | `npm install` 失败

Try:  
可以尝试：

```bash
npm cache verify
npm install
```

### The page does not open | 页面打不开

Check whether the dev server is running and whether port `4173` is already in use.  
检查开发服务器是否已经启动，以及 `4173` 端口是否被其他程序占用。

### Provider setup succeeds but chat still fails | 供应商配置成功，但聊天仍然失败

Run:  
运行：

```bash
npm run verify:provider
```

This checks whether your saved provider config can actually:  
这个命令会检查你保存的供应商配置是否真的能够：

- list models
- select a usable model
- finish one real chat turn

- 拉取模型列表
- 选择可用模型
- 完成一次真实聊天请求

### I want to clear old local chat memory | 我想清空旧的本地聊天记忆

Run:  
运行：

```bash
npm run reset:test-memory
```

## Repository Structure | 仓库结构

```text
waveary/
  waveary-core
  waveary-memory
  waveary-voice
  waveary-web
  waveary-dataset
  docs
```

Module roles:  
模块职责：

- `waveary-core`: runtime orchestration and provider abstraction
- `waveary-memory`: memory extraction, storage, retrieval
- `waveary-voice`: voice routing and voice runtime layer
- `waveary-web`: official web surface
- `waveary-dataset`: markdown-first companion soul and conversation rules

- `waveary-core`：运行时编排与供应商抽象
- `waveary-memory`：记忆提取、存储、检索
- `waveary-voice`：语音路由与语音运行时层
- `waveary-web`：官方 Web 界面
- `waveary-dataset`：以 Markdown 为主的陪伴灵魂与对话规则

## Documentation | 文档

- [Deployment Guide | 部署指南](./docs/deployment-guide.md)
- [Project State | 项目状态](./PROJECT_STATE.md)
- [Vision | 项目愿景](./docs/vision.md)
- [Architecture | 架构设计](./docs/architecture.md)
- [Product Invariants | 产品不变量](./docs/product-invariants.md)
- [Product Preferences | 产品偏好](./docs/product-preferences.md)
- [Web Surface | Web 界面说明](./waveary-web/README.md)

## Contributing | 参与贡献

Issues, architecture discussion, feature proposals, and focused pull requests are welcome.  
欢迎提交 Issue、参与架构讨论、提出功能建议，或者发起聚焦明确的 PR。

Basic flow:  
基本流程：

1. Fork the repository.
2. Create a branch.
3. Make one focused change.
4. Open a pull request.

1. Fork 本仓库。
2. 创建分支。
3. 做一项聚焦明确的修改。
4. 发起 Pull Request。

## License | 许可证

This project is released under the [MIT License](./LICENSE).  
本项目基于 [MIT License](./LICENSE) 开源。
