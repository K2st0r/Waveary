# Project State

If a new Codex session starts in this repository, use `waveary-continuity-guard` first, then rebuild context from this file, `ACTIVE_TASKS.md`, `docs/decision-log.md`, and `docs/session-log.md`.

## Project

Waveary is an open source digital life companion framework.

Brand line:

What is remembered returns as an echo.

## Current Branch

- `main`

## Latest Verified Commit

- `f14cf82` - `Refresh favicon and portrait asset`

## Repository Surface

- GitHub repository: `https://github.com/K2st0r/Waveary`
- visibility: `public`
- default branch: `main`
- public code license: `Apache-2.0`
- official brand, logos, portrait cards, and other official visual assets are reserved separately through `TRADEMARKS.md`, `BRAND-ASSETS.md`, and `NOTICE`
- public onboarding now uses separate English and Simplified Chinese docs instead of mixed inline bilingual pages

## Modules

- `waveary-core`
  - runtime orchestration, provider abstraction, dialogue shaping, relationship state, time-aware helpers, and permission-aware action intent handling are implemented
  - chat turns now accept a user-facing reasoning-effort hint that OpenAI-compatible providers map into low / medium / high reasoning request fields when supported
  - current quality work focuses on more human reply cadence, stronger continuity-thread selection, concept-level identity summaries, and bounded local-time / local-action behavior
- `waveary-memory`
  - memory persistence and retrieval layer exists conceptually and is partially embodied through current session persistence, recall logic, and identity-summary storage
  - long-term direction remains system-first memory, not prompt-only stitched history
- `waveary-voice`
  - dedicated package boundary exists
  - provider-backed voice routing, separate voice config, Doubao variants, vendor presets, searchable speaker picking, STT upload path, and first interruption-safe browser live-chat loop are in place
  - deeper duplex transport and broader provider-specific STT support are still pending
- `waveary-web`
  - active official runtime surface
  - current shell uses one persistent left sidebar instead of the old top navigation
  - the left sidebar keeps its navigation hit areas usable across shorter desktop heights and narrow client windows, and the chat utility rail remains visible as a stable narrow right-side strip
  - control workspaces such as skills, channels, proactive care, and settings are no longer forced back to provider setup when chat runtime readiness is still settling
  - the skills workspace has been reshaped into a Hermes-inspired skill workbench with searchable built-in skills, status filters, a compact library list, and a right-side detail / SKILL.md preview pane
  - sessions persist companion-profile setup, export/import metadata, runtime understanding, and local history
  - server-side companion-profile archives now persist portrait, naming, relationship vibe, speaking style, traits, favorite topics, and preferred voice fields through create/update/export/import flows
  - the chat composer exposes a compact `fast / balanced / deep` reasoning-effort switch inside the input surface and persists the user's choice locally
  - provider/model setup, voice setup, grouped control workspaces, and server-side non-chat model capability config for speech / vision / image / video exist in the console shell foundation
  - favicon references now include a cache-busting query and the fourth portrait card has a smaller corrected question-face asset
- `waveary-desktop`
  - first Electron desktop shell now exists
  - desktop preparation can build and materialize a standalone local runtime bundle from the existing Waveary web/server packages
  - desktop dev launch can start the embedded runtime and open the app as a native window
  - desktop native notifications are now bridged through a preload IPC layer, and proactive-care delivery prefers Electron system notifications before falling back to browser notifications
  - Windows installer packaging now produces `waveary-desktop/dist/Waveary-Setup-0.1.0.exe`
  - the desktop build path can fall back to a prepackaged `win-unpacked` bundle when `electron-builder --dir` hits transient network download failures
  - the packaged `Waveary.exe` has been verified to start the embedded standalone runtime and emit a ready local port
  - packaged static serving for `/#chat` and bundled assets has been verified through the packaged `Waveary.exe`
- `waveary-dataset`
  - markdown-first companion soul, conversation rules, and healthy-boundary guidance exist here and should remain the source of truth for companion philosophy

## Current Product Shape

- the product should be understood as a framework-first companion runtime, not an AI girlfriend / boyfriend app and not a generic chatbot skin
- the default in-product route is the active runtime surface, not an internal homepage
- the web shell direction is a compact client-style layout:
  - left sidebar for navigation and session/control entrypoints
  - chat as the primary companion surface
  - console as a denser control desk rather than a marketing page
- local persistence direction remains:
  - `SQLite` for live runtime state
  - `JSON` for import/export and migration packages

## Active Priorities

1. Extend the bounded browser-action path without breaking permission clarity.
2. Continue the first `waveary-voice` delivery path, especially the next cut after the current interruption-safe browser loop.
3. Keep polishing the `waveary-web` shell density and proportion without reintroducing long scrolling control walls.
4. Continue the `waveary-core` dialogue-quality pass toward shorter, more human, emotionally believable companion replies.
5. Keep public onboarding and brand-rights documentation clean, accurate, and easy for non-developers to follow.
6. Continue desktop productization now that the first Windows installer path exists.

## Verified Baseline Commands

These are the latest trustworthy verification paths recorded in the repo before this continuity-doc cleanup block:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled test pass for `waveary-core/dist/*.test.js`
- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run build --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `npm run desktop:prepare`
- `npm run dev --workspace @waveary/desktop` with runtime reachability confirmed at `http://127.0.0.1:4173`
- `npm run desktop:dist`
- packaged `Waveary.exe` launched with `ELECTRON_RUN_AS_NODE=1` against the bundled `standalone-server.mjs` and emitted `__WAVEARY_SERVER_READY__:<port>`
- packaged `Waveary.exe` standalone runtime served `/#chat` with HTTP 200 and served the bundled JS asset with HTTP 200

## Current Worktree Notes

The worktree is currently dirty outside the latest verified visual-asset cleanup. Do not revert these unrelated changes unless explicitly asked:

- untracked: `docs/assets/waveary-logo-lockup.svg`
- untracked: `docs/assets/waveary-logo-mark.svg`
- untracked: `docs/assets/waveary-logo-preview.html`
- untracked: `waveary-web/public/brand/waveary-logo-final-draft-11.png`

## Next Recommended Step

- next web-shell follow-up should wire the server-side companion-profile archive and model capability config into the visible sessions/profile and provider/model control UI without reintroducing long mixed control walls
- next repo maintenance follow-up should run a dedicated dependency-security block for Electron and esbuild instead of mixing semver-major desktop runtime upgrades with UI work
- next web-shell follow-up should visually inspect the new skills workbench in the fresh desktop dev window and decide whether to add real custom-skill import/export after the layout is approved
- next web-shell follow-up should visually inspect the remaining chat / console density at installed desktop-window sizes after the sidebar breakpoint fix, especially widths near `640px` to `900px`
- next desktop follow-up should manually click through the desktop notification channel in the fresh Electron window, then add a small in-app test-notification button if the UX needs a direct smoke-test control
- next desktop follow-up should add proper Windows app icon / installer metadata and verify a real installed launch from the refreshed `Waveary-Setup-0.1.0.exe`
- after that, add auto-update / version channel planning before treating the desktop app as public-release ready
- keep future Chinese-text cleanup separate from feature work unless the change is strictly local and verified with `git diff` plus `npm run check:mojibake`

## Open Issues

- Windows builds can still race or fail around shared `dist` cleanup, especially when build and test flows overlap
- standalone `npx tsc --noEmit -p waveary-web/tsconfig.server.json` is still not the most trustworthy server-side verification path; prefer package-level build/test commands
- stale local `web:dev` processes can mislead browser verification by serving older server code
- provider and voice setup still have different save ergonomics, which can confuse runtime expectations
- the browser live-chat voice path is not yet a true full-duplex transport
- live Fish Audio verification is currently blocked by upstream reachability from this machine
- `electron-builder --dir` can still hit transient network timeouts while downloading Electron resources; the installer script now falls back to a prepackaged `win-unpacked` bundle when one exists
- some historical repository files still contain mojibake outside this cleanup scope; treat broad encoding repair as deliberate documentation work, not incidental feature cleanup
