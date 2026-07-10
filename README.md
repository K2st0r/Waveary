# Waveary

<div align="center">

<img src="./docs/assets/readme-hero-fan.png" alt="Waveary hero banner" width="100%" />

## Waveary

### What is remembered returns as an echo.

**Open Source Digital Life Companion Agent Framework**

[简体中文](./README.zh-CN.md) · **English**

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-black.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/K2st0r/Waveary?style=social)](https://github.com/K2st0r/Waveary/network/members)
[![GitHub issues](https://img.shields.io/github/issues/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/K2st0r/Waveary)](https://github.com/K2st0r/Waveary/commits/main)

[Quick Start](#quick-start) ·
[Architecture](#companion-agent-architecture) ·
[Desktop](#desktop-app) ·
[Data](#local-data-and-migration) ·
[Deploy](#deploy-on-a-server) ·
[Docs](#documentation) ·
[Commercial Use](./docs/commercial-use.md)

</div>

---

## What Is Waveary?

Waveary is an open source framework for building long-term digital life companions.

It is not just a chatbot skin and not just a tool-calling agent. Waveary is a continuity runtime that gives compatible models a stable layer for:

- long-term memory
- relationship continuity
- life timeline awareness
- emotional state and reply-shaping
- voice interaction
- permissioned local and browser actions
- portable companion archives

The core idea is simple: models will change, providers will change, but a companion should still remember, understand, speak, and grow with the user over time.

## Why Waveary Is Different

Most agent frameworks are built around tasks: call tools, follow workflows, hand off to other agents, and finish jobs.

Waveary is built around continuity:

- It treats memory as system state, not prompt decoration.
- It treats relationship as stateful behavior, not a visible roleplay level.
- It treats emotion as runtime context, not just warmer copywriting.
- It treats voice as part of the same companion identity, not text-to-speech afterthought.
- It treats local action as permissioned power, not hidden automation.
- It treats migration as a first-class feature: SQLite for live state, JSON for portable companion archives.

## Companion Agent Architecture

Waveary is organized as a companion runtime above model providers.

```text
Waveary Desktop / Web Client
        |
Companion Runtime Shell
        |
Waveary Agent Core
        |
Memory / Relationship / Emotion / Timeline / Voice / Tools
        |
Provider Router
        |
LLM / STT / TTS / Vision / Image / Browser / Local Actions
        |
SQLite Local Store + JSON Archive + Optional Cloud Sync
```

### Runtime Layers

| Layer | Name | Responsibility |
| --- | --- | --- |
| L0 | Client Shell | Desktop, web, and future mobile surfaces |
| L1 | Conversation Runtime | One turn of chat, voice, action, and reply shaping |
| L2 | Identity Layer | Companion profile, user identity, and relationship identity |
| L3 | Memory Layer | Working memory, semantic memory, summaries, and archives |
| L4 | Emotion Layer | User emotion, companion emotion, and tone strategy |
| L5 | Relationship Layer | Trust, familiarity, boundaries, and long-term bond state |
| L6 | Timeline Layer | Life events, milestones, dates, and temporal recall |
| L7 | Action Layer | Browser actions, desktop actions, reminders, and channels |
| L8 | Voice Layer | STT, TTS, live voice sessions, interruption handling |
| L9 | Provider Layer | Multi-provider LLM, voice, vision, image, and video routing |
| L10 | Safety / Permission | Access modes, confirmation, revocation, and audit logs |
| L11 | Observability | Debug traces, runtime signals, tests, and behavior evaluation |

### Turn Flow

Every meaningful turn should move through a structured pipeline:

```text
user input
  -> input parsing
  -> emotion reading
  -> intent reading
  -> relationship lookup
  -> memory recall
  -> time / environment context
  -> permission check
  -> tool decision
  -> reply strategy
  -> natural response generation
  -> voice expression planning
  -> memory / emotion / relationship / timeline update
  -> persistence
```

The goal is to avoid raw model replies. Waveary should decide what kind of moment this is before asking a model to speak.

## Memory Model

Waveary's long-term direction uses five memory layers:

| Layer | Name | Purpose |
| --- | --- | --- |
| M1 | Working Memory | Recent messages and active context |
| M2 | Episodic Memory | What happened in a specific conversation |
| M3 | Semantic Memory | Facts, preferences, habits, and recurring patterns |
| M4 | Concept Memory | "Who is this user?" and "What is this relationship?" |
| M5 | Companion Archive | Name, profile, portrait, voice, relationship style, and migration data |

The live local store should use SQLite. Portable migration uses JSON.

An exported companion archive should carry:

- companion profile
- portrait reference
- voice preferences
- model preferences
- conversation history
- memories
- identity summaries
- relationship state
- emotion state
- timeline events
- archive schema version

## What You Can Use Today

Current usable surface:

- browser-based chat UI
- Electron desktop shell
- provider setup and model discovery
- persistent local chat sessions
- companion profile persistence
- memory / relationship / timeline runtime signals
- dedicated voice routing foundation
- browser and local action permission foundation
- SQLite / JSON archive direction

Current project status:

- suitable for developers, builders, and early testers
- desktop packaging exists, but the consumer release path is still being polished
- easiest working path today is local development or self-hosted Node deployment

## Quick Start

### 1. Install prerequisites

- [Node.js 20+](https://nodejs.org/)
- `npm 10+`

Check your versions:

```bash
node -v
npm -v
```

### 2. Get the project

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

Or download the ZIP from GitHub, extract it, and open the extracted folder in your terminal.

### 3. Install dependencies

```bash
npm install
```

### 4. Start the web app

```bash
npm run web:dev
```

Open:

```text
http://127.0.0.1:4173
```

### 5. Configure a model provider

Inside Waveary:

1. Open the model / provider control surface.
2. Choose a provider.
3. Fill in `Base URL` and `API Key`.
4. Fetch available models.
5. Choose a model.
6. Start chatting.

You can also use the CLI helper:

```bash
npm run setup:provider
```

## Desktop App

Waveary includes an Electron desktop shell.

For non-developers, the intended delivery path is a GitHub Release asset:

1. Download `Waveary-Setup-<version>.exe` from GitHub Releases.
2. Double-click the installer and complete the setup wizard.
3. Launch Waveary from the desktop shortcut or Start Menu entry created by the installer.
4. Open the app, connect a model provider once, and start chatting.

For desktop development:

```bash
npm run desktop:dev
```

To prepare the desktop runtime without launching Electron:

```bash
npm run desktop:prepare
```

To build a Windows installer:

```bash
npm run desktop:dist
```

The installer output is written under:

```text
waveary-desktop/dist/
```

The file to upload to GitHub Releases is:

```text
waveary-desktop/dist/Waveary-Setup-0.1.0.exe
```

## Local Data And Migration

Waveary stores local runtime data under:

```text
.waveary/
```

Common files include:

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`

The intended storage direction is:

- `SQLite` for live local runtime state
- `JSON` for import, export, backup, and migration packages

This lets a companion become portable without forcing all live data into fragile flat files.

## Deploy On A Server

The simplest supported deployment path today is:

- Linux server
- Node.js 20+
- `npm run web:preview`
- reverse proxy through Nginx or Caddy

Recommended deployment flow:

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

Detailed deployment instructions:

- [Deployment Guide](./docs/deployment-guide.md)
- [中文部署指南](./docs/deployment-guide.zh-CN.md)

## Common Commands

```bash
# Start local web development
npm run web:dev

# Start desktop development
npm run desktop:dev

# Build the web app
npm run web:build

# Run local production preview
npm run web:preview

# Build Windows desktop installer
npm run desktop:dist

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

## Repository Structure

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

Module roles:

- `waveary-core`: runtime orchestration, provider abstraction, dialogue shaping, relationship logic, and permission-aware actions
- `waveary-memory`: memory extraction, storage, retrieval, and scoring direction
- `waveary-voice`: voice routing, TTS / STT provider boundaries, and live voice coordination
- `waveary-web`: official interactive client surface
- `waveary-desktop`: Electron desktop shell and installer packaging
- `waveary-dataset`: markdown-first companion soul, conversation rules, and healthy-boundary guidance

## Documentation

- [Chinese README](./README.zh-CN.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [中文部署指南](./docs/deployment-guide.zh-CN.md)
- [Commercial Use And Brand Licensing](./docs/commercial-use.md)
- [商业使用与品牌授权说明](./docs/commercial-use.zh-CN.md)
- [Waveary Editions](./docs/editions.md)
- [Waveary 版本规划](./docs/editions.zh-CN.md)
- [Web Surface](./waveary-web/README.md)

Internal development-route, continuity, and implementation-planning documents are intentionally kept out of the public repository.

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
- See [TRADEMARKS.md](./TRADEMARKS.md), [BRAND-ASSETS.md](./BRAND-ASSETS.md), and [Commercial Use And Brand Licensing](./docs/commercial-use.md).

## License

This project is released under the [Apache License 2.0](./LICENSE).
