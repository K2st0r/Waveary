# Project State

If a new Codex session starts in this repository, use `waveary-continuity-guard` immediately and rebuild context from this file plus `docs/session-log.md` and `docs/decision-log.md`.

## Project

Waveary is an open source digital life companion framework.

Brand line:

念念不忘，终有回响。

## Current Branch

- `main`

## Latest Verified Commit

- `bcb13b5` - `Add browser file import export flow`

## Modules

- `waveary-core`
  - TypeScript runtime skeleton is implemented
  - in-memory relationship, timeline, emotion, and scripted chat adapters are implemented
  - runnable demo flow exists through root `examples/`
  - Node-based runtime tests are implemented
  - OpenAI-compatible multi-provider chat integration is implemented
  - provider model discovery interface is implemented
  - provider model discovery now normalizes multiple OpenAI-compatible `/models` payload shapes, deduplicates repeated IDs, and preserves optional label/context window metadata
  - provider request compatibility now includes provider-specific base URL normalization and responses-role fallback handling for DeepSeek-style OpenAI-compatible differences
  - persisted session state contract and repository-backed runtime state adapter are implemented
  - SQLite persisted session state repository is implemented
- `waveary-memory`
  - independent package exists
  - simple memory extractor exists
  - in-memory memory store exists
  - Node-based extractor and store tests are implemented
- `waveary-web`
  - standalone React and Vite workspace exists
  - official homepage is implemented
  - product positioning, engine stack, provider compatibility, roadmap, and repository structure are presented in the first page
  - browser-native provider setup flow is implemented through local `/api/provider/*` routes
  - provider model discovery routes now return normalized model descriptors even when upstream vendors use broader OpenAI-compatible payload variants
  - first in-browser runtime chat shell is implemented through local `/api/chat/turn`
  - local browser chat session persistence is implemented through `.waveary/chat-sessions.json`
  - local persistence backend switching between JSON file and SQLite is implemented through local `/api/chat/persistence`
  - Node-based regression tests now cover local persistence backend switching and cross-backend state synchronization
  - Node-based route tests now cover `/api/chat/persistence` response shape and runtime cache reset behavior
  - Node-based route tests now cover session listing, session loading, rename, delete, and default-session protection behavior
  - runtime-side SQLite session repositories are now closed during backend resets and snapshot-only loads so repeated Windows verification does not leak file handles
  - session persistence UI now surfaces backend-by-backend sync state, last migration metadata, differing session counts, and latest write timestamps
  - main-session default plus optional additional chat sessions are implemented in the web layer
  - active sessions can now be reset locally without deleting the session identity, including the default main companion session
  - persisted session snapshots now surface memory archive, relationship snapshot, and timeline history through the local API and browser UI
  - active sessions can now be exported as structured JSON packages from the local API and browser UI
  - exported session packages can now be imported as brand-new local sessions through the local API and browser UI
  - browser export now downloads a real `.json` file and browser import now supports selecting a local `.json` file in addition to paste input
  - malformed session imports now return structured validation diagnostics and the browser UI renders field-level import failure details
  - non-default sessions can now be renamed and deleted through the web session layer
  - Windows-safe local dev and preview entrypoints are implemented for the current workspace path setup
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
  - ships a formal project homepage and a working provider setup console
  - can list provider presets, fetch models through the selected provider key, and save local config
  - can run a first browser chat flow and render memory, relationship, emotion, and timeline signals
  - restores local chat history and latest runtime signals after dev server restart
  - can switch local chat persistence between `.waveary/chat-sessions.json` and `.waveary/chat-sessions.db`
  - supports a default main companion session plus user-created additional sessions with rename and delete management
  - now boots reliably through `npm run web:dev` on the current Windows + Chinese-path workspace

## Verified Commands

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run check`
- `npm run test`
- `npm run demo`
- `npm run web:dev`
- `npm run web:build`
- `npm run demo:provider` shows required provider configuration guidance
- `npm run setup:provider` is available for interactive provider selection and config saving
- `npm run test --workspace @waveary/core`
- `npm run test --workspace @waveary/memory`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions/rename`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions/delete`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence` live switch verified with `file -> sqlite`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence` live switch verified with `sqlite -> file`
- `Invoke-WebRequest http://127.0.0.1:4173/`
- `Invoke-WebRequest http://127.0.0.1:4173/api/provider/presets`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn`
- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`

## Decision Sources

- `docs/decision-log.md`

## Next Steps

- expand provider-specific chat request normalization where "OpenAI-compatible" vendors diverge beyond the current shared `/chat/completions` and `/responses` paths
- add route-level or live verification for more provider-specific chat payload divergences after the current DeepSeek compatibility baseline
- add focused route-level and browser-facing coverage for any remaining persistence edge cases beyond the current file/sqlite symmetry path
- consider adding finer-grained session controls such as export/import or per-session persistence diagnostics after the current reset capability
- consider surfacing richer archive filtering or grouped recall views now that persisted session intelligence is visible in the browser
- consider adding import or downloadable file export flows now that structured session export is available
- consider validating downloadable file-based import/export or partial merge tools now that session migration is possible in-browser
- consider adding stronger schema validation and user-facing import diagnostics for malformed session files
- consider downloadable schema docs or sample export files so third-party tooling can generate valid session packages
- consider hardening workspace build scripts further against transient Windows dist-lock races
- keep updating `PROJECT_STATE.md` and `docs/session-log.md` after each verified work block
- keep `START_HERE.md` and continuity files aligned with current workflow

## Open Issues

- `npm run web:build` should not be executed in parallel with another root build command because package `dist` cleanup can race on Windows
