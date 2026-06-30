# Waveary

<div align="center">

<img src="./docs/assets/readme-hero-fan.png" alt="Waveary hero banner" width="100%" />

## Waveary

### What is remembered returns as an echo.

**Open Source Digital Life Companion Framework**

[简体中文](./README.zh-CN.md) · **English**

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-black.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/network/members)
[![GitHub issues](https://img.shields.io/github/issues/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/commits/main)

[Quick Start](#quick-start) ·
[ZIP Users](#for-zip-download-users) ·
[Deploy](#deploy-on-a-server) ·
[Commands](#common-commands) ·
[Docs](#documentation)

</div>

---

## What Is Waveary?

Waveary is an open source framework for long-term digital companionship.

It gives any compatible model a continuity layer for:

- long-term memory
- relationship growth
- life timeline awareness
- emotional continuity
- voice interaction

Waveary is not trying to be just another chatbot skin.

It is trying to be the system layer that helps an AI remember, understand, grow, and stay with a user over time.

## What You Can Use Today

Current usable surface:

- browser-based chat UI
- provider setup and model discovery
- persistent local chat sessions
- memory / relationship / timeline runtime signals
- dedicated voice routing foundation

Current project status:

- suitable for developers, builders, and early testers
- not yet a one-click packaged consumer app
- easiest working path today is local run or self-hosted Node deployment

## Quick Start

If you just want to run Waveary locally, do this:

### 1. Install prerequisites

- [Node.js 20+](https://nodejs.org/)
- `npm 10+` (usually comes with Node.js)

Check your versions:

```bash
node -v
npm -v
```

### 2. Get the project

Use Git:

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

Or download the ZIP from GitHub, then extract it and open the extracted folder in your terminal.

### 3. Install dependencies

```bash
npm install
```

### 4. Start Waveary

```bash
npm run web:dev
```

When startup succeeds, open:

```text
http://127.0.0.1:4173
```

### 5. Configure your model provider

After the page opens:

1. Go to the console page.
2. Choose a provider.
3. Fill in `Base URL` and `API Key`.
4. Click to fetch models.
5. Choose a model.
6. Start chatting.

You can also use the CLI helper:

```bash
npm run setup:provider
```

That command will:

- list known providers
- ask for your API key
- fetch available models
- save the selected config locally

## For ZIP Download Users

If you downloaded the project as a ZIP and do not use Git, follow these steps exactly:

### Windows

1. Download the project ZIP from GitHub.
2. Right-click the ZIP and choose `Extract All`.
3. Open the extracted `Waveary` folder.
4. Click the folder path bar, type `powershell`, and press Enter.
5. Run:

```powershell
npm install
npm run web:dev
```

6. Open `http://127.0.0.1:4173` in your browser.

### macOS / Linux

1. Download and extract the ZIP.
2. Open Terminal.
3. `cd` into the extracted folder.
4. Run:

```bash
npm install
npm run web:dev
```

5. Open `http://127.0.0.1:4173`.

## Deploy On A Server

The simplest supported deployment path today is:

- Linux server
- Node.js 20+
- `npm run web:preview`
- reverse proxy through Nginx or Caddy

### Recommended deployment flow

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
npm install
npm run web:preview
```

By default, Waveary preview runs on:

```text
http://127.0.0.1:4173
```

For public access, put Nginx or Caddy in front of it and reverse proxy to `127.0.0.1:4173`.

Detailed step-by-step deployment instructions are here:

- [docs/deployment-guide.md](./docs/deployment-guide.md)
- [中文部署指南](./docs/deployment-guide.zh-CN.md)

## Common Commands

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

## Where Waveary Saves Local Data

Waveary stores local runtime data in the repository root under:

```text
.waveary/
```

Common files include:

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`

If you move the project to another machine and want to keep your local state, back up the `.waveary/` folder too.

## Troubleshooting

### `node` or `npm` is not recognized

Install Node.js first, then reopen your terminal.

### `npm install` fails

Try:

```bash
npm cache verify
npm install
```

### The page does not open

Check whether the dev server is running and whether port `4173` is already in use.

### Provider setup succeeds but chat still fails

Run:

```bash
npm run verify:provider
```

This checks whether your saved provider config can actually:

- list models
- select a usable model
- finish one real chat turn

### I want to clear old local chat memory

Run:

```bash
npm run reset:test-memory
```

## Repository Structure

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

- `waveary-core`: runtime orchestration and provider abstraction
- `waveary-memory`: memory extraction, storage, retrieval
- `waveary-voice`: voice routing and voice runtime layer
- `waveary-web`: official web surface
- `waveary-dataset`: markdown-first companion soul and conversation rules

## Documentation

- [Chinese README](./README.zh-CN.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [中文部署指南](./docs/deployment-guide.zh-CN.md)
- [Project State](./PROJECT_STATE.md)
- [Vision](./docs/vision.md)
- [Architecture](./docs/architecture.md)
- [Product Invariants](./docs/product-invariants.md)
- [Product Preferences](./docs/product-preferences.md)
- [Web Surface](./waveary-web/README.md)

## Contributing

Issues, architecture discussion, feature proposals, and focused pull requests are welcome.

Basic flow:

1. Fork the repository.
2. Create a branch.
3. Make one focused change.
4. Open a pull request.

## Brand, Trademarks, And Official Assets

- The source code in this repository is licensed under [Apache License 2.0](./LICENSE).
- The names `Waveary` and `回响之境`, official logos, portrait cards, illustrations, screenshots, and other official brand assets are not licensed under Apache 2.0.
- Personal, educational, and evaluation use of the open-source code follows the Apache 2.0 license.
- Commercial use of the official marks or official brand assets requires prior written permission.
- Forks may use the code under Apache 2.0, but must not imply official affiliation or ship under the official Waveary branding without permission.
- See [TRADEMARKS.md](./TRADEMARKS.md) and [BRAND-ASSETS.md](./BRAND-ASSETS.md).

## License

This project is released under the [Apache License 2.0](./LICENSE).
