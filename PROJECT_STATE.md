# Project State

If a new Codex session starts in this repository, use `waveary-continuity-guard` immediately and rebuild context from this file plus `docs/session-log.md` and `docs/decision-log.md`.

## Project

Waveary is an open source digital life companion framework.

Brand line:

念念不忘，终有回响。

## Current Branch

- `main`

## Latest Verified Commit

- `d102c80` - `Add provider verification CLI path`

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
  - provider compatibility now also tolerates model discovery without a preselected chat model, nested `/models` containers, alternate model metadata field names, and broader structured text payload shapes across chat-completions and responses-style providers
  - provider verification CLI scaffolding now exists so saved or environment-supplied provider credentials can be checked end-to-end for model discovery and one real chat turn without changing the web runtime path
  - runtime dialogue scaffolding now biases more strongly toward companion-style continuity by using relationship-stage-aware reply guidance, less mechanical memory phrasing, and more behavior-driven relationship growth signals
- persisted session state contract and repository-backed runtime state adapter are implemented
  - SQLite persisted session state repository is implemented
- `waveary-memory`
  - independent package exists
  - simple memory extractor exists
  - in-memory memory store exists
  - Node-based extractor and store tests are implemented
  - memory extraction now condenses longer user turns into shorter recall-friendly memory fragments instead of storing the entire sentence verbatim by default
- `waveary-web`
  - standalone React and Vite workspace exists
  - local product context is now documented in `waveary-web/PRODUCT.md` so future frontend redesign or polish passes can resume with stable product intent
  - official homepage is implemented
  - product positioning, engine stack, provider compatibility, roadmap, and repository structure are presented in the first page
  - homepage information architecture now separates brand vision, framework positioning, and the companion console so the product no longer reads like one long debug dashboard
  - homepage visual system now separates a high-confidence brand layer from a cinematic runtime shell so the site reads more like a formal AI framework homepage than a dark admin prototype
  - homepage top section now behaves as a single-page framework introduction with anchor navigation, a pure introduction-first first screen, and the interactive console deferred until later sections
  - browser-native provider setup flow is implemented through local `/api/provider/*` routes
  - provider model discovery routes now return normalized model descriptors even when upstream vendors use broader OpenAI-compatible payload variants
  - provider model selection UI now surfaces normalized model labels plus optional context-window hints returned by compatible providers
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
  - current browser session package shape is now documented for external tooling, with a sample export file under `docs/examples/`
  - browser import/export controls now surface session package rules, required top-level fields, required snapshot arrays, and a loadable sample package through a local `/api/chat/session/format` route
  - browser session export packages now emit explicit `schemaVersion` metadata, while import stays backward-compatible with legacy unversioned packages and rejects unsupported future versions clearly
  - browser session import validation now checks richer snapshot structures, including relationship payloads, latest insight payloads, memory metadata, and timeline metadata before restore
  - browser session import validation now also rejects cross-field semantic inconsistencies such as mismatched session IDs and timestamps that exceed `snapshot.updatedAt` or `exportedAt`
  - browser session import validation now also rejects out-of-order message timestamps and backward-moving timeline sequences inside snapshot and latest-insight arrays
  - browser session import validation now also rejects duplicate message IDs inside a single imported snapshot
  - browser session import validation now also rejects duplicate memory and timeline IDs inside a single imported snapshot
  - browser session import validation now also rejects `latestInsights.timeline` entries that do not correspond to the imported snapshot timeline
  - browser session import validation now also rejects `latestInsights.recalledMemories` and `latestInsights.storedMemories` entries that do not correspond to the imported memory archive
  - browser session import validation now also rejects `latestInsights.relationship` payloads that drift away from `snapshot.relationship`
  - current cross-structure import hardening pass is complete through relationship, memory, and timeline summary consistency; deeper content-level duplicate checks are deferred for later
  - non-default sessions can now be renamed and deleted through the web session layer
  - Windows-safe local dev and preview entrypoints are implemented for the current workspace path setup
  - package boundary is documented for future provider setup and runtime UI work
  - homepage now supports direct Chinese and English switching through a local UI toggle
  - homepage copy, console labels, provider setup flow labels, session management labels, runtime panels, and roadmap are now bilingual
  - language switching now stays local to presentation state and does not reset the user's in-progress provider form input or current runtime page state
  - the public web surface is now split into shorter hash-routed views for home, console, chat, and roadmap instead of one very long landing page
  - framework and positioning explanation is now fully absorbed into the homepage instead of living on a separate framework page
  - the management console now focuses on provider setup, session controls, persistence switching, import/export, and runtime diagnostics
  - the live conversation experience now has its own dedicated chat page with a stripped-down journal-style canvas and composer
  - the visible persisted-session archive panel has been removed from the runtime rail so the console reads less like a raw internal debug dump
  - the split home / console / chat shell now has a stronger page-by-page hierarchy: the homepage reads more like a formal project front page, the console reads more like a system desk, and the chat page is more tightly focused on the active conversation surface
  - homepage hero now includes a portrait-memory visual layer with drifting hand-drawn question-mark portraits and a burn-to-ash memory focal animation
  - homepage portrait assets now live under `waveary-web/public/images/portraits` so the public brand surface can be refined without touching provider, session, or chat logic
  - current portrait set now covers a broader youthful companion range instead of one repeated anonymous-boy style, though a stricter 1:1 gender-balanced and more deliberately framed next asset pass is still recommended
  - homepage burn vignette now rotates through multiple portrait cards instead of repeatedly burning one fixed image
  - homepage burn vignette now uses a hand-drawn lighter asset under `waveary-web/public/images/hero/lighter.png` instead of a pure CSS block lighter
  - burn timing, glow, scorch, and ash motion are now tuned together so the portrait burn cycle reads more like one repeated memory ritual than one static decorative loop
  - homepage lighter flame now uses a multi-layer animated flame stack with halo, outer flame, inner flame, and core so the burn focal point feels more like a real lighter flame than a flat icon
  - homepage lighter flame anchor is now nudged slightly further left and upward across desktop and mobile breakpoints so the burn contact point aligns more tightly with the lighter nozzle
  - homepage lighter flame anchor has received one additional micro-adjustment farther left/up so the visible ignition point sits closer to the lighter tip without shifting the burn animation itself

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
  - now presents the brand layer and the product-shell layer as separate sections, with a console summary band ahead of setup and runtime details
  - now uses a single-page anchor-navigation homepage where the first screen stays framework-introduction-first instead of leading with runtime controls
  - now uses shorter hash-based page views so the homepage stays brand-first while console tooling, dedicated chat, and roadmap live on separate screens
  - now keeps all explanatory framework material on the homepage while reserving the console page for system management and the chat page for the active dialogue only
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
- `npm run build:server --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `npm run verify:provider`
- `npm run models:provider`
- `node --test waveary-web/dist-server/server/provider-api.test.js`
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
- desktop and mobile browser layout verification for `http://127.0.0.1:4173/` via Playwright screenshot pass after the landing-page hierarchy refactor
- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish open http://127.0.0.1:4173/ --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish screenshot`
- `npm run check --workspace @waveary/web`
- `npm run web:build`
- `ssh -o StrictHostKeyChecking=accept-new -T git@github.com`
- `git push origin main` via SSH remote `git@github.com:K2st0r/-Waveary-.git`
- `curl.exe -I http://127.0.0.1:4173/`
- Playwright browser verification for `#home`, `#framework`, and `#console` on `http://127.0.0.1:4173/`
- Playwright browser verification for `#console` and `#chat` on `http://127.0.0.1:4173/`
- Playwright browser verification for refreshed `#home`, `#console`, and `#chat` first screens on `http://127.0.0.1:4173/`

## Decision Sources

- `docs/decision-log.md`

## Next Steps

- expand provider-specific chat request normalization where "OpenAI-compatible" vendors diverge beyond the current shared `/chat/completions` and `/responses` paths
- add route-level or live verification for more provider-specific chat payload divergences after the current DeepSeek and broader structured-payload compatibility baseline
- re-run `npm run verify:provider` and `npm run models:provider` with refreshed real credentials, starting with DeepSeek because the currently saved local key now returns `401 invalid api key`
- continue the dialogue-quality pass by making recalled memory selection more context-sensitive and by surfacing relationship-stage differences more clearly in real provider conversations, not just scripted runtime tests
- add focused route-level and browser-facing coverage for any remaining persistence edge cases beyond the current file/sqlite symmetry path
- continue polishing the split web shell by tightening session-management density below the console fold and improving message rhythm plus mixed-language balance in the dedicated chat page
- continue the homepage portrait system with a more deliberate `4 male / 4 female` hand-drawn polaroid-style set so the visual range feels broader and less clustered around one youth archetype
- consider replacing the current chroma-keyed lighter cutout with a cleaner native-alpha illustration once a final asset pass is approved
- consider a follow-up homepage motion pass that adds a slightly stronger heat shimmer or ember flicker only if it stays subtle and does not overcomplicate the hero
- verify the latest lighter flame anchor visually in the browser and stop adjusting once the burn point feels locked, then keep homepage polish focused on asset quality instead of more positional churn
- consider replacing current raw portrait PNGs with lighter optimized delivery assets once the final portrait set is approved
- validate the bilingual home / console / chat shell in a broader browser pass and tune any remaining spacing, wrapping, or readability issues caused by mixed Chinese and English line lengths
- consider a follow-up web pass focused specifically on richer chat-page signal affordances that do not drag diagnostics clutter back into the conversation view
- keep session import semantic hardening paused here unless a real malformed package reveals another high-value cross-structure gap
- consider adding finer-grained session controls such as export/import or per-session persistence diagnostics after the current reset capability
- consider surfacing richer archive filtering or grouped recall views now that persisted session intelligence is visible in the browser
- consider adding import or downloadable file export flows now that structured session export is available
- consider validating downloadable file-based import/export or partial merge tools now that session migration is possible in-browser
- consider adding stronger schema validation and user-facing import diagnostics for malformed session files
- consider extending the versioned session package contract with deeper semantic checks beyond ordering and duplicate IDs, such as archive de-duplication across related structures
- consider planning the next schema migration rule before any non-backward-compatible session package change lands
- consider hardening workspace build scripts further against transient Windows dist-lock races
- keep updating `PROJECT_STATE.md` and `docs/session-log.md` after each verified work block
- keep `START_HERE.md` and continuity files aligned with current workflow

## Open Issues

- `npm run web:build` should not be executed in parallel with another root build command because package `dist` cleanup can race on Windows
