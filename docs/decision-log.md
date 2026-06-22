# Decision Log

This file records important product, architecture, and workflow decisions for Project Waveary.

Use it to preserve the reason behind major choices so future Codex sessions do not repeat or undo settled work.

## 2026-06-20 - Product Repositioning

Status:

- accepted

Decision:

Waveary is positioned as an open source digital life companion framework, not an AI girlfriend, AI boyfriend, or generic chatbot product.

Reason:

- the framework direction is broader and more defensible
- it aligns with memory, relationship, timeline, and companionship as first-class systems
- it avoids collapsing the project into a narrow roleplay or entertainment label

Impact:

- product language should reinforce `Digital Life Companion Framework`
- architecture should optimize for continuity, not short-term chat novelty
- future modules should preserve framework-first boundaries

## 2026-06-20 - Brand Line

Status:

- accepted

Decision:

Use `念念不忘，终有回响。` as the primary brand line.

Reason:

- it matches the product name `回响之境`
- it captures memory, time, and response in one phrase
- it works as brand philosophy, not just marketing copy

Impact:

- README and vision docs should use this line consistently
- future outward-facing materials should prefer this line over earlier slogan variants

## 2026-06-20 - Core Runtime Direction

Status:

- accepted

Decision:

`waveary-core` should provide runtime orchestration and domain abstractions, while memory implementation can evolve as a separate package.

Reason:

- keeps `core` focused on long-term system coordination
- allows memory behavior to evolve independently
- reduces the chance of mixing storage logic into UI or runtime glue

Impact:

- `waveary-core` owns session flow and interfaces
- `waveary-memory` owns extractor/store primitives

## 2026-06-20 - Continuity Workflow

Status:

- accepted

Decision:

Use repository-side continuity files plus a local Codex skill to recover context across sessions.

Reason:

- chat history is not a reliable source of project truth
- state files are versioned and reviewable
- a skill can enforce read order, commit discipline, and anti-regression behavior

Impact:

- update `PROJECT_STATE.md` after each verified work block
- append to `docs/session-log.md`
- read `docs/decision-log.md` before major structural changes

## 2026-06-20 - Early Testing Strategy

Status:

- accepted

Decision:

Use Node built-in tests for the early `waveary-core` and `waveary-memory` packages before introducing a larger test framework.

Reason:

- keeps the first testing layer simple
- avoids adding unnecessary tooling before the runtime contracts stabilize
- still gives fast regression coverage for memory recall and runtime turn flow

Impact:

- `npm run test` becomes part of the default verification set
- future persistence and provider changes should extend this test layer before larger framework adoption

## 2026-06-20 - Provider Integration Strategy

Status:

- accepted

Decision:

Prefer an OpenAI-compatible multi-provider layer over a single-vendor SDK integration for early AI connectivity.

Reason:

- many domestic providers expose OpenAI-style APIs
- a common `baseURL + apiKey + model` path gives broader compatibility
- model listing can often be implemented through a shared `/models` endpoint

Impact:

- `waveary-core` should expose a provider abstraction that supports model discovery
- provider demos should guide users to list models before choosing one
- future vendor-specific adapters should be added only when a provider cannot fit the compatible path

## 2026-06-20 - Provider Setup UX

Status:

- accepted

Decision:

The first usable provider flow should be interactive setup in the terminal: choose provider, enter key, fetch models, choose model, save config.

Reason:

- it matches the intended user flow more closely than raw environment variables
- it creates one reusable saved config for later runtime calls
- it is enough to unblock real usage before a web UI exists

Impact:

- `npm run setup:provider` becomes the first recommended setup path
- `demo:provider` should load saved config automatically

## 2026-06-20 - Web Package Boundary

Status:

- accepted

Decision:

Create `waveary-web` as a separate workspace package and make its first deliverable a formal project homepage before building the browser runtime shell.

Reason:

- the project needs an official web surface that matches the new framework positioning
- a homepage establishes product identity without pushing UI concerns into `waveary-core`
- provider settings and chat UI can be layered in later without reworking package boundaries

Impact:

- `waveary-web` owns web presentation and future browser interaction flows
- the first page should explain positioning, engines, provider compatibility, and roadmap clearly
- provider setup UI should be added in `waveary-web`, not inside demo scripts or core runtime packages

## 2026-06-20 - Clean Dist Before Build

Status:

- accepted

Decision:

Each package build should remove its `dist` directory before compiling.

Reason:

- stale compiled files can survive refactors and cause false test failures
- package tests should reflect current source, not leftover output from old adapters

Impact:

- `waveary-core`, `waveary-memory`, and `waveary-web` build scripts clean `dist` first
- repository verification becomes more reliable across sessions and incremental changes

## 2026-06-20 - Web Provider API Shape

Status:

- accepted

Decision:

Expose the first `waveary-web` provider flow through local same-origin `/api/provider/*` routes instead of calling providers directly from browser code.

Reason:

- keeps provider logic and file persistence outside the UI layer
- allows the web app to reuse the same configuration flow as terminal setup without leaking structure into the frontend
- gives the future browser chat surface a stable local API contract to build on

Impact:

- `waveary-web` owns a thin local API layer for presets, model discovery, and config persistence
- provider keys and model listing remain behind server middleware instead of direct browser-only logic
- future chat runtime endpoints should follow the same pattern

## 2026-06-20 - First Browser Chat Path

Status:

- accepted

Decision:

Build the first browser chat surface on top of the saved provider configuration and expose it through a local `/api/chat/turn` endpoint that returns runtime signals alongside the reply.

Reason:

- the setup flow only becomes useful once it can drive a real conversation path
- returning memory, relationship, emotion, and timeline output keeps Waveary framed as a framework, not a plain chat shell
- the endpoint gives future UI work a stable contract while keeping runtime orchestration inside server-side code

Impact:

- `waveary-web` now includes a local chat endpoint backed by `WavearyRuntime`
- the browser UI can show companion signals, not just assistant text
- future persistence work can swap internal storage without rewriting the frontend contract

## 2026-06-20 - Persistence Contract Boundary

Status:

- accepted

Decision:

Define the core runtime persistence contract in `waveary-core`, and let `waveary-web` extend that state only for web-specific metadata such as session title and latest rendered insights.

Reason:

- persistence is part of the framework boundary, not just a web implementation detail
- `Session -> Memory -> Relationship -> Timeline` state needs one reusable contract before adding SQLite, Postgres, or cloud-backed stores
- web-specific UI metadata should not leak back into core runtime abstractions

Impact:

- `waveary-core` now owns a minimal persisted session state contract and a repository-backed session state adapter
- future storage implementations can plug into the same repository interface without rewriting runtime-adjacent store logic
- `waveary-web` keeps only UI/session-management metadata on top of the shared persisted runtime state

## 2026-06-20 - First Non-File Persistence Backend

Status:

- accepted

Decision:

Use SQLite as the first concrete non-file implementation of the core persisted session state repository.

Reason:

- it gives Waveary a real structured persistence backend without introducing server infrastructure yet
- it fits the current CE stage better than jumping straight to Postgres or cloud-managed storage
- Node now provides `node:sqlite`, which keeps the dependency footprint smaller and avoids extra native packages

Impact:

- `waveary-core` now includes a SQLite session state repository on top of the shared persistence contract
- future web or CLI integration can switch from JSON files to SQLite without changing runtime state semantics
- follow-up persistence work can focus on wiring and migration rather than redefining the storage boundary

## 2026-06-21 - Mandatory Verified Closeout Workflow

Status:

- accepted

Decision:

Treat each non-trivial Waveary work block as unfinished until verification, continuity-file updates, commit, push attempt, and next-step recording are all complete.

Reason:

- local code changes alone are not enough to resume safely after context loss
- the real push result and real commit hash must be written back into repository records
- explicitly recording the next step reduces duplicate work and wrong refactors in later sessions

Impact:

- every completed feature step must end with verification plus updated `PROJECT_STATE.md` and `docs/session-log.md`
- `PROJECT_STATE.md` must include the next recommended step, not just current status
- if a functional push succeeds after continuity files still show `pending`, a second small continuity-sync commit should be made immediately

## 2026-06-21 - Emotion And Care Are Stateful Core Systems

Status:

- accepted

Decision:

Treat companion emotion and proactive care as first-class stateful systems in Waveary, not as prompt-only style tricks or scripted engagement behavior.

Reason:

- the product goal is long-term companionship, not only better single-turn chat tone
- memory without emotional continuity still feels like a tool
- proactive care only becomes trustworthy when it is grounded in relationship, timeline, memory, and user-controlled policy
- future desktop awareness and local action capabilities need a separate permissioned layer instead of being mixed casually into chat replies

Impact:

- `Waveary Emotion Engine (WEE)` should own companion-side emotional continuity, not just user emotion detection
- `Waveary Proactive Care Engine (WPCE)` should evaluate whether outreach is appropriate before any message is generated
- V0.2 should begin with emotional state, relationship-aware tone variation, and bounded proactive care rather than jumping straight to unrestricted automation
- future presence or action abilities should be designed as a separate permissioned layer with audit and revocation controls

## 2026-06-21 - WPCE Starts As A Separate Decision Path

Status:

- accepted

Decision:

Implement the first `WPCE` slice as a separate runtime evaluation entrypoint instead of folding proactive-care checks into `handleTurn`.

Reason:

- proactive care is triggered without a new incoming user turn, so its lifecycle does not match reply generation
- keeping `WPCE` separate preserves a clean boundary between chat orchestration and outbound-care policy evaluation
- it allows Waveary to verify policy, relationship, and emotion-aware decision logic now while deferring delivery and notification transport safely

Impact:

- `WavearyRuntime` now owns `evaluateProactiveCare()` alongside `handleTurn()`
- `WPCE` can evolve independently into policy persistence and delivery later without distorting the chat-turn contract
- future web or local-notification work should consume the decision output rather than re-implement trigger logic in the UI

## 2026-06-21 - Proactive Draft Becomes A Route-Visible Web Contract

Status:

- accepted

Decision:

Expose a server-generated proactive message draft on `/api/chat/proactive/evaluate` instead of continuing to recompute user-facing `WPCE` copy separately inside each frontend surface.

Reason:

- the console summary and browser notification path were already converging on one shared draft shape
- keeping the draft on the server side makes later delivery surfaces consume one evaluated contract instead of each re-deriving tone and suggested copy
- the change preserves the existing `WPCE decision -> draft -> delivery surface` layering without pushing message-expression concerns down into `waveary-core` too early

Impact:

- `/api/chat/proactive/evaluate` now returns `{ decision, draft, session }`
- `waveary-web` console and browser notification delivery can read the same draft payload
- bounded local-time context can shape proactive daypart tone on the server only when the caller explicitly sends permissioned time context
- future scheduled or reminder-style delivery work should start from this route-visible draft contract rather than adding new browser-local generators

## 2026-06-21 - First Proactive Loop Stays Browser-Local And Visible

Status:

- accepted

Decision:

Implement the first repeated proactive-care evaluation loop as an explicit browser-local check that runs only while the current tab is open and visible, with a user-controlled interval and no hidden background execution.

Reason:

- the product wants to move beyond one-off manual `WPCE` evaluation, but current trust boundaries do not justify silent background automation
- a visible, tab-bound loop is enough to validate repeated proactive evaluation behavior without implying desktop-agent authority
- this keeps proactive scheduling aligned with the existing permission-center model and the new route-visible draft contract

Impact:

- `waveary-web` now owns the first repeated proactive evaluation loop as a UI-local behavior
- the loop consumes `/api/chat/proactive/evaluate` and its shared draft output instead of generating parallel browser-only copy
- future scheduler or automation work should preserve the same explicit consent and visibility expectations unless a higher-trust design is approved deliberately

## 2026-06-21 - Dialogue Quality Should Tighten Recall Before Expanding Tone

Status:

- accepted

Decision:

In the current `waveary-core` dialogue-quality pass, prioritize stricter memory relevance and relationship-aware emotional continuity before adding broader stylistic flourish.

Reason:

- companionship breaks quickly when irrelevant memories surface, even if wording sounds warm
- the project identity favors continuity and relationship realism over decorative personality
- better provider instructions are only useful if the recalled thread itself is believable

Impact:

- memory recall now requires an actual lexical or phrase match instead of letting importance alone surface unrelated memories
- recalled memories now persist `lastRecalledAt` so future continuity logic can distinguish active remembered threads from stale archive items
- companion emotion and scripted reply distance should continue to vary by relationship stage and felt context, not only by one generic "warm" tone

## 2026-06-21 - Real Providers Need One Primary Continuity Thread

Status:

- accepted

Decision:

When building prompt guidance for OpenAI-compatible providers, expose one primary continuity thread for the current turn instead of presenting all recalled memories as equally actionable context.

Reason:

- real providers are more likely than the scripted adapter to flatten every recalled item into one reply unless the continuity hierarchy is made explicit
- companionship quality improves when the model follows one believable thread instead of proving memory breadth
- emotional turns especially need stronger permission to ignore weakly related remembered details

Impact:

- provider instructions now include current-turn focus, one named primary continuity thread, and a secondary recalled-memory block
- the prompt now explicitly tells the model not to force weak continuity into emotionally heavy turns
- follow-up work can decide whether this selection logic should stay provider-local or move toward a shared runtime helper

## 2026-06-22 - Continuity Thread Selection Should Move Into Shared Runtime Logic

Status:

- accepted

Decision:

Move continuity-thread selection and current-turn focus summarization out of `OpenAICompatibleChatProvider` prompt-local helpers into shared `waveary-core` runtime utilities that other reply surfaces can reuse.

Reason:

- continuity selection had become meaningful runtime behavior, not just prompt formatting
- keeping the logic inside one provider risked drift between scripted and real-provider companionship behavior
- emotional-turn conservatism and primary-thread choice should stay consistent across reply paths before more live-provider regression is added

Impact:

- `selectContinuityThread()` and `summarizeCurrentTurnFocus()` now live under `waveary-core/src/runtime/`
- `OpenAICompatibleChatProvider` now consumes the shared helper instead of maintaining its own private scoring and emotional-turn heuristics
- `ScriptedChatProvider` now also follows the same continuity-thread choice and weak-memory fallback guidance
- future care, summary, or additional provider surfaces should reuse this shared helper instead of reintroducing parallel continuity-selection logic

## 2026-06-22 - Primary Continuity Thread Should Follow Best Match, Not Recall Order

Status:

- accepted

Decision:

When multiple recalled memories are available, choose the primary continuity thread by strongest match to the latest user turn instead of always taking the first recalled memory entry.

Reason:

- newly added multi-turn provider regression showed that the first recalled memory could still reflect an older topic even when a later recalled item matched the user's newest concern more directly
- companionship continuity should privilege what the user is most presently reaching for, not whichever memory arrived first from the retrieval layer
- keeping this behavior in the shared runtime helper prevents prompt-side and scripted reply paths from drifting on the same edge case

Impact:

- `selectContinuityThread()` now ranks recalled memories and timeline candidates by current-turn match before choosing a primary thread
- real-provider prompt guidance and scripted replies now stay better aligned with the user's latest focus in multi-turn conversations
- future scoring work can extend this shared ranking with recency or source-turn weighting without reverting to provider-local heuristics

## 2026-06-22 - Weak Timeline Threads Need The Same Emotional-Turn Restraint As Weak Memories

Status:

- accepted

Decision:

When the current turn is emotionally heavy, weakly matching timeline threads should receive the same "do not force it" treatment that weak recalled memories already receive.

Reason:

- new provider regression around emotional and timeline-led continuity exposed an asymmetry: weak memories were handled conservatively, but weak timeline events could still be framed as confident anchoring material
- companionship realism breaks when an emotionally vulnerable turn gets steered into a barely related past life event just because timeline context exists
- this restraint belongs in the shared continuity helper so provider prompts and scripted reply behavior stay aligned on the same edge case

Impact:

- `selectContinuityThread()` now downgrades weak timeline guidance during emotional turns instead of always using the stronger timeline-anchoring wording
- provider prompt guidance now stays more emotionally present when only a low-signal life-event thread is available
- timeline-led secondary recalled memories continue to be preserved, but their ordering now reflects current-turn relevance rather than raw retrieval order
