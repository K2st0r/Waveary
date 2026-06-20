# Project State

If a new Codex session starts in this repository, use `waveary-continuity-guard` immediately and rebuild context from this file plus `docs/session-log.md` and `docs/decision-log.md`.

## Project

Waveary is an open source digital life companion framework.

Brand line:

念念不忘，终有回响。

## Current Branch

- `main`

## Latest Verified Commit

- `7f76d2e` - `Add interactive provider setup flow`

## Modules

- `waveary-core`
  - TypeScript runtime skeleton is implemented
  - in-memory relationship, timeline, emotion, and scripted chat adapters are implemented
  - runnable demo flow exists through root `examples/`
  - Node-based runtime tests are implemented
  - OpenAI-compatible multi-provider chat integration is implemented
  - provider model discovery interface is implemented
- `waveary-memory`
  - independent package exists
  - simple memory extractor exists
  - in-memory memory store exists
  - Node-based extractor and store tests are implemented
- `waveary-web`
  - standalone React and Vite workspace exists
  - official homepage is implemented
  - product positioning, engine stack, provider compatibility, roadmap, and repository structure are presented in the first page
  - package boundary is documented for future provider setup and runtime UI work

## Provider Flow

- `npm run setup:provider`
  - choose provider
  - enter API key
  - fetch available models
  - choose one model
  - save config to `.waveary/provider-config.json`
- `npm run demo:provider`
  - loads saved provider config and runs the runtime with a real model provider

## Web Surface

- `waveary-web`
  - owns the official web interface layer
  - currently ships a formal project homepage instead of a temporary placeholder
  - is the future entry point for provider setup UI and runtime access

## Verified Commands

- `npm run check`
- `npm run test`
- `npm run demo`
- `npm run build --workspace @waveary/web`
- `npm run demo:provider` shows required provider configuration guidance
- `npm run setup:provider` is available for interactive provider selection and config saving
- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`

## Decision Sources

- `docs/decision-log.md`

## Next Steps

- connect provider setup flow to a real web settings UI
- add a first in-browser runtime/chat surface on top of `waveary-web`
- add persistence interfaces beyond in-memory storage
- add persistence tests once non-memory stores exist
- keep updating `PROJECT_STATE.md` and `docs/session-log.md` after each verified work block
- keep `START_HERE.md` and continuity files aligned with current workflow

## Open Issues

- no active repository-side blocker
