# Project State

If a new Codex session starts in this repository, use `waveary-continuity-guard` immediately and rebuild context from this file plus `docs/session-log.md` and `docs/decision-log.md`.

## Project

Waveary is an open source digital life companion framework.

Brand line:

念念不忘，终有回响。

## Current Branch

- `main`

## Latest Verified Commit

- `a2bdd96` - `Replace homepage doodle placeholders with generated assets`

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
  - dialogue quality has now been pushed further through context-sensitive memory recall thresholds, persisted `lastRecalledAt` updates, richer user-emotion detection, more stateful companion-emotion transitions, and clearer reply-distance differences across `new`, `warming`, and `growing` relationship stages
  - real-provider dialogue guidance now also names a current-turn focus plus one primary continuity thread, keeps extra recalled memories in a secondary block, and becomes more conservative about forcing weak memory links into emotionally heavy turns
  - shared continuity-thread selection now lives in `waveary-core` runtime code and is reused by both the OpenAI-compatible provider path and the scripted provider path, so primary-thread choice, emotional-turn conservatism, and current-turn focus summarization no longer drift apart across those reply surfaces
  - shared continuity-thread selection now also ranks recalled memory candidates by match to the latest user turn instead of always trusting array order, so real-provider prompt guidance can keep the primary thread aligned with the user's most recent concern in multi-turn conversations
  - shared continuity-thread selection now also keeps weak timeline threads restrained during emotionally heavy turns instead of automatically treating a low-signal life event as strong anchoring material, closing the earlier asymmetry between weak-memory and weak-timeline handling
  - when a timeline event becomes the primary continuity thread, the secondary recalled-memory list now reflects current-turn relevance order rather than raw retrieval order, so supporting memories stay aligned with the user's immediate concern
  - shared continuity-thread selection now also gives a small recency bonus to newer memory candidates, so near-tied relevance cases favor fresher remembered threads instead of being decided by retrieval order alone
  - shared continuity-thread selection now also gives a very light source-turn bonus to memories tied to more recent user turns, so semantically tied same-age memories follow the live conversation arc instead of falling back to array order
  - permissioned local time context can now be injected into normal chat turns so the companion can answer time/date-style questions from the user's device-local clock without claiming it lacks real-time awareness
  - local time context now also resolves a bounded daypart hint so late-night and evening turns can bias toward softer companion tone without expanding into broader desktop-awareness inputs
  - first formal product and architecture draft for companion emotional continuity and proactive care now exists in `docs/emotion-proactive-care.md`, defining `Waveary Emotion Engine (WEE)` and `Waveary Proactive Care Engine (WPCE)` as the next major runtime-facing design targets
  - first companion-side emotion runtime layer is now implemented through a persisted `EmotionStore`, a `SimpleCompanionEmotionEngine`, and runtime wiring that updates and returns companion emotion state on each turn
  - first `WPCE` decision-only runtime layer is now implemented through proactive care domain types, a `SimpleProactiveCareEngine`, and a dedicated `evaluateProactiveCare()` runtime path that combines policy, relationship stage, interaction gap, and companion emotion without generating outbound messages yet
- persisted session state contract and repository-backed runtime state adapter are implemented
  - SQLite persisted session state repository is implemented
  - persisted session state now also carries per-session proactive-care policy plus care-state counters so `WPCE` evaluation can survive restarts and respect saved user settings
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
  - the management console now also exposes persisted `WPCE` policy/state controls and read-only evaluation output for the active session
  - the current web surface now provides the first permissioned proactive-care delivery path through browser-local notifications triggered from manual `WPCE` evaluation results
  - the console now also includes a first explicit permission center so users can set local consent preferences for notifications, proactive delivery, time awareness, desktop presence, and future local actions
  - normal browser chat turns now send explicit local time context only when `timeAwareness` permission is allowed, reusing the existing permission center instead of adding a separate hidden time toggle
  - proactive browser notifications now also soften their lead sentence by morning / evening / late-night daypart when `timeAwareness` is allowed, without changing `WPCE` policy or outreach frequency
  - the `WPCE` console decision card now mirrors that same daypart-aware tone in its top-level summary copy, so the local console and browser notification surfaces describe the same recommendation style
  - proactive browser notifications and the `WPCE` console summary now both read from one shared presentation-layer proactive message composer instead of duplicating separate tone logic
  - that shared proactive message composer now returns structured draft fields including `tone`, `deliveryKind`, and `suggestedMessage`, so the current UI is no longer limited to raw prose-only summary composition
  - the proactive message composer now also lives in a dedicated `waveary-web` utility module instead of remaining embedded inside `App.tsx`, reducing UI-surface coupling before any future API exposure
  - `/api/chat/proactive/evaluate` now also returns a server-generated proactive message draft, so the `WPCE` console card and browser notification path can consume one route-visible draft contract instead of recomputing message copy independently in the browser
  - the web console now also exposes an explicit browser-local proactive check loop that periodically re-evaluates `WPCE` only while the current tab is open and visible, with a user-controlled interval and no hidden background automation
  - proactive browser-notification delivery now also records per-session reachout counters and last-delivery time so subsequent `WPCE` evaluations can suppress repeated outreach until the user replies
  - successful new user turns now automatically clear persisted `WPCE` unanswered-reachout state so proactive care can reopen naturally after the user responds without erasing daily send counts or the last reachout timestamp
  - proactive-care evaluation output and browser notification copy now translate raw `WPCE` intent, urgency, and reason codes into user-facing Chinese and English labels instead of exposing internal engine enums directly
  - the `WPCE` console decision card now visually separates affirmative reachout recommendations from policy-blocked evaluations through distinct summary copy, badge states, and surface treatment, so users can scan the outcome without parsing every field
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
  - homepage first screen is now compressed so slogan, framework copy, and portrait burn stage fit more fully on open without forcing an immediate downward scroll on desktop
  - homepage hero definition copy now uses shorter two-note summary cards instead of a taller stacked list, reducing first-screen height while preserving positioning clarity
  - homepage now includes drifting black doodle background objects outside the portrait stage so the milk-white surface feels more like a lived memory board than a blank landing page
  - homepage doodle layer now resolves through image asset paths under `waveary-web/public/images/doodles` instead of binding the long-term design to CSS-drawn fake object shapes
  - homepage doodle placeholder PNGs have now been replaced with real black-and-white generated object assets under `waveary-web/public/images/doodles`
  - the current doodle asset pass was generated successfully only after constraining requests to `gpt-image-2`, `1024x1024`, transparent background, one image per request, and short low-complexity prompts because longer prompts or heavier requests frequently timed out through the current network path with `524`
  - console intro now includes an explicit workspace switcher so provider setup, session controls, proactive care, and runtime observation no longer read like one long vertically stacked tools page
  - console runtime body is now split by active workspace, keeping the top-level system summary stable while swapping only the focused operational surface below it
  - the console page now also exposes a tighter top toolbar and suppresses the earlier intro / summary / flow marketing block so the page reads more like a control desk than a second landing section
  - homepage hero and top doodle layer are now compressed further so the opening screen fits more comfortably on common desktop heights without immediately feeling below-the-fold
  - the console shell is now tighter again through denser workspace tabs, a compact status strip, reduced shell padding, and shorter viewport-based panel heights so the operational surface stays closer to one-screen use

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
  - now expects homepage doodle assets under `waveary-web/public/images/doodles/`, with final asset generation intended to come from the local tool `C:\Users\13571\Desktop\micu-image-20260608.html`
  - current doodle assets under that path are now real generated PNGs rather than transparent placeholders, and future refreshes should preserve the same low-complexity `gpt-image-2` generation strategy that avoided repeated `524` gateway timeouts
  - can list provider presets, fetch models through the selected provider key, and save local config
  - can run a first browser chat flow and render memory, relationship, emotion, and timeline signals
  - now exposes a read-only `/api/chat/proactive/evaluate` route so the current `WPCE` decision path can be inspected from the local web runtime without generating outbound messages
  - now exposes `/api/chat/proactive/settings` so per-session proactive-care policy and care-state counters can be saved, reloaded, exported, imported, and reused by later `WPCE` evaluations
  - restores local chat history and latest runtime signals after dev server restart
  - can switch local chat persistence between `.waveary/chat-sessions.json` and `.waveary/chat-sessions.db`
  - supports a default main companion session plus user-created additional sessions with rename and delete management
  - now boots reliably through `npm run web:dev` on the current Windows + Chinese-path workspace

## Continuity Layer

- `PROJECT_STATE.md` remains the source of truth for current architecture, verified commit state, and next recommended step
- `ACTIVE_TASKS.md` now tracks the live implementation queue so a resumed session can continue the current cut without reconstructing it from chat history
- `docs/product-preferences.md` now records durable product, tone, trust-boundary, and workflow preferences that should survive heavy context compression
- `docs/session-log.md` and `docs/decision-log.md` continue to serve as chronological execution and architecture records

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
- `npm run check --workspace @waveary/core`
- PowerShell compiled-test verification for `waveary-core/dist/**/*.test.js` via `node --test`
- `npm run test --workspace @waveary/core`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npx tsc --noEmit -p waveary-web/tsconfig.server.json`
- `npm run test --workspace @waveary/web`
- `npm run web:build`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

## Decision Sources

- `docs/decision-log.md`

## Next Steps

- define the first delivery path for proactive care in the web surface, likely browser or local notifications before any broader desktop action layer
- extend the browser notification path from manual console evaluation into a bounded scheduled or reminder-style delivery loop without introducing hidden background behavior
- route future high-trust capabilities such as desktop presence and local actions through the new permission center instead of scattering separate ad hoc toggles through the UI
- consider showing a user-facing indicator in the console or chat flow when a proactive care wait-state has been cleared by a real reply, so the permissioned care loop is more legible
- consider distinguishing affirmative proactive recommendations from blocked evaluations more visually in the console card now that their text is user-facing
- consider exposing a smaller single-line status echo near the evaluate button so the latest `WPCE` conclusion remains visible even when the full decision card scrolls out of view
- keep future desktop awareness or action work behind a separate permissioned presence layer instead of mixing it directly into chat reply generation
- extend the new permissioned local-time path into richer presence-aware context only after the user can review and grant each source separately, instead of letting time awareness silently expand into broader desktop awareness
- consider surfacing the current permissioned local daypart in the console or chat shell only if it improves legibility without making the conversation surface feel diagnostic
- consider moving the new daypart-aware notification tone into a shared proactive-message formatter once browser notifications stop being the only delivery channel
- consider extracting the new console-summary and notification-copy helpers into one shared proactive presentation module if a second non-browser delivery surface is added
- use the new route-visible proactive draft contract as the source for any next delivery surface, instead of recomputing outbound copy per-surface in the browser
- consider whether the draft contract should stay a `waveary-web` server concern for now or move into a more shared runtime-facing layer before scheduled delivery work begins
- consider whether the new browser-local proactive loop should surface a small in-chat or console-side “watching” indicator so the user can tell when bounded local care checks are active
- expand provider-specific chat request normalization where "OpenAI-compatible" vendors diverge beyond the current shared `/chat/completions` and `/responses` paths
- add route-level or live verification for more provider-specific chat payload divergences after the current DeepSeek and broader structured-payload compatibility baseline
- re-run `npm run verify:provider` and `npm run models:provider` with refreshed real credentials, starting with DeepSeek because the currently saved local key now returns `401 invalid api key`
- continue the dialogue-quality pass by extending live-provider regression beyond prompt-body inspection into stronger emotional-stress cases and richer memory-vs-timeline competition now that recency and source-turn weighting are both present in the shared helper
- consider whether the next continuity-scoring refinement should incorporate bounded source-session or repeated-reference signals beyond the current current-turn match, recency, and source-turn layers
- consider reusing the shared continuity-thread helper in future runtime-facing care or summary surfaces instead of reintroducing prompt-local continuity heuristics elsewhere
- consider whether continuity-thread scoring now needs source-turn weighting in addition to the new lightweight recency bias, especially for memories created within the same short time band
- decide whether to harden `@waveary/core`'s Windows test script so it rebuilds or expands compiled test-file arguments more robustly, since the current `npm run test --workspace @waveary/core` path can misbehave if relied on alone after source edits
- add focused route-level and browser-facing coverage for any remaining persistence edge cases beyond the current file/sqlite symmetry path
- continue polishing the split web shell by tightening session-management density below the console fold and improving message rhythm plus mixed-language balance in the dedicated chat page
- visually verify and tune the new compact console toolbar plus non-session workspace flow in-browser, especially the internal scrolling behavior now that the marketing-style console intro has been suppressed
- continue refining the homepage hero so the first screen feels complete across more desktop and laptop heights, with no further scroll-first regression after future copy or asset additions
- keep iterating on the compact console shell only after visual verification shows a remaining real usability gap, instead of re-expanding it into explanatory blocks
- run a focused browser pass for homepage doodle density, fade rhythm, and overall visual balance now that the placeholder doodles have been replaced with real assets
- visually verify and, only if needed, tighten any remaining console workspace that still forces awkward external page scrolling after the latest compact-shell pass
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
- keep `ACTIVE_TASKS.md` and `docs/product-preferences.md` short, current, and high-signal so they stay useful under heavy long-term use
- keep `START_HERE.md` and continuity files aligned with current workflow

## Open Issues

- `npm run web:build` should not be executed in parallel with another root build command because package `dist` cleanup can race on Windows
