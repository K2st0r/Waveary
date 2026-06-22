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

## 2026-06-22 - Near-Tied Continuity Memories Should Favor Fresher Threads

Status:

- accepted

Decision:

When multiple memory candidates are otherwise similarly relevant to the current turn, apply a small recency bonus so newer remembered threads win the primary continuity slot more often than older ones.

Reason:

- new runtime regression showed that tie-like memory candidates were still decided by retrieval order even after match-based ranking landed
- companionship continuity should lean slightly toward fresher remembered threads when semantic relevance is effectively equal, because they are usually closer to the user's live conversational arc
- the bias should stay light so recency does not overpower clearly stronger semantic matches

Impact:

- `selectContinuityThread()` now adds a small age-based ranking bonus for recent memories before selecting the primary thread
- near-tied memory candidates no longer depend as heavily on recall ordering alone
- future scoring work can add source-turn or session-local weighting on top of this without replacing the shared helper boundary

## 2026-06-22 - Near-Tied Continuity Memories Should Also Respect More Recent Source Turns

Status:

- accepted

Decision:

When continuity memories are semantically tied and similarly recent, apply a very light source-turn bonus so memories tied to a more recent user turn win over otherwise equal memories from older turns.

Reason:

- the new recency-aware helper still had one tie class left: same-content memories created in the same age band could still fall back to array order
- companionship continuity should follow the live conversational arc, not only abstract memory freshness
- the bias should stay weaker than semantic match and weaker than broad age bands so it only resolves near ties instead of dominating normal selection

Impact:

- `selectContinuityThread()` now accepts optional message history and derives a tiny source-turn preference from memory `sourceMessageIds`
- both `OpenAICompatibleChatProvider` and `ScriptedChatProvider` now pass request message history into the shared helper
- future continuity-scoring work can layer richer repeated-reference or session-local signals on top of current-turn match, recency, and source-turn weighting without moving the logic back into provider-local code

## 2026-06-22 - Local Time Answers Should Be Guaranteed In Runtime, Not Left To Prompt Compliance

Status:

- accepted

Decision:

When a turn is a direct time/date/day question and permissioned local time context is available, answer it deterministically inside `WavearyRuntime` before provider generation instead of relying only on provider prompt instructions.

Reason:

- real model providers can still ignore the existing local-time prompt block and fall back to generic "I do not know the time" disclaimers
- the product promise here is narrow, bounded, and trustworthy: if the user granted local time awareness, the companion should actually know the local time
- this behavior belongs in shared runtime logic so scripted and real-provider paths do not drift apart on a basic companionship expectation

Impact:

- `waveary-core` now owns a shared local-time reply helper used by both runtime short-circuiting and the scripted provider path
- direct local time/date/day questions no longer depend on model obedience to prompt wording
- future bounded time-awareness refinements should extend this shared runtime helper instead of adding more provider-specific prompt hacks

## 2026-06-22 - Local Action Outcomes Should Stay In Conversation History

Status:

- accepted

Decision:

When a pending local action is executed or dismissed, record a small assistant-side audit note in persisted chat history instead of showing the outcome only as transient UI state.

Reason:

- trust-sensitive local actions should remain legible after reload, session restore, export, and import
- a conversation-visible trace fits Waveary's companion surface better than a purely technical activity log
- keeping this note in the persisted session avoids runtime-cache drift and makes the action boundary easier to review later

Impact:

- `waveary-web` now appends a compact assistant note for executed and dismissed local actions
- pending local-action state is cleared in both persisted session storage and runtime cache as part of the same resolution flow
- future local-action work can build richer summaries or approval history on top of this persisted conversational trace instead of reintroducing purely ephemeral status handling

## 2026-06-22 - Full-Access Local Actions Must Return Same-Turn Reply Consistency

Status:

- accepted

Decision:

When chat-side local action permission is `allow` (`full-access`), `/api/chat/turn` must know that permission during the same request, execute the supported local action inside the server turn path, and return an execution-consistent assistant reply instead of leaving the provider's contradictory "I cannot open apps" text in the conversation.

Reason:

- auto-running a local action on the frontend after a normal model reply created a trust-breaking contradiction: the browser really opened the target while the assistant text still claimed it could not
- this inconsistency was architectural, not cosmetic, because local-action detection previously happened only after `WavearyRuntime.handleTurn()` finished
- the trust boundary should stay narrow and explicit, but once `full-access` is chosen the result shown to the user still has to match what the system actually did

Impact:

- `waveary-web` now sends `localActionPermission` and locale with `/api/chat/turn`
- `sendChatTurn()` now detects supported local actions before persisting the turn and, when permission is `allow`, executes them server-side in the same request, replacing the visible reply with an audited execution note
- ask-first and deny behavior remain unchanged, while `full-access` no longer depends on a later frontend-only auto-execution step to reconcile the turn

## 2026-06-22 - Browser Automation Should Start Under The Existing Local-Action Boundary

Status:

- accepted

Decision:

Start Waveary browser automation by routing `open_url` local actions through a Waveary-managed Playwright persistent browser context, instead of trying to import OpenClaw whole or jumping straight to a broad free-form browser agent layer.

Reason:

- the user wants stronger browser control that feels closer to OpenClaw, but the current product still needs explicit permission, audit, and bounded action categories
- Playwright provides a stable browser execution base we can reuse without rewriting browser primitives from scratch
- keeping browser automation inside the current local-action boundary lets Waveary graduate from “shell open” to “managed browser context” without collapsing trust boundaries or overcommitting to a brittle universal web-agent path

Impact:

- `waveary-web` now depends on `playwright` for server-side browser execution
- `open_url` actions can evolve into later bounded browser actions such as search, click, and extract text within one managed browser profile
- future browser automation work should extend this explicit permissioned layer before considering higher-level natural-language web-agent tooling

## 2026-06-22 - First Browser Read Layer Should Stay Separate From Chat Generation

Status:

- accepted

Decision:

Expose the first post-open browser capabilities as thin `/api/browser/*` routes for current-page inspection, visible-text extraction, and page-text search, instead of hiding them inside normal chat replies or jumping to a free-form browser agent.

Reason:

- the project now needs browser state that Waveary can inspect deterministically, not just open
- keeping these capabilities as explicit routes preserves auditability and makes later UI or permission wiring easier
- this keeps the browser layer bounded and composable while avoiding premature natural-language browser autonomy

Impact:

- `waveary-web/server/browser-automation.ts` now owns current-page, extract-text, and search-text primitives on top of the managed Playwright context
- `waveary-web/server/provider-api.ts` now exposes `/api/browser/page`, `/api/browser/extract-text`, and `/api/browser/search-text`
- future browser work should grow through similarly explicit bounded actions such as click-by-text or link selection before any broader agent abstraction is considered

## 2026-06-22 - Browser Interaction Should Graduate Through Explicit Click Primitives

Status:

- accepted

Decision:

Advance the managed browser layer from read-only inspection into one explicit interaction step by supporting visible clickable-element listing and click-by-text, while still refusing a free-form browser-agent abstraction.

Reason:

- once Waveary can read the current page, the next stable capability is a narrow click primitive rather than unrestricted automation
- listing visible click targets keeps the interaction legible and debuggable before later UI or permission wiring
- click-by-text is enough to validate a real browser control loop without introducing arbitrary DOM scripting or natural-language overreach

Impact:

- `waveary-web/server/browser-automation.ts` now owns `listManagedBrowserClickableElements()` and `clickManagedBrowserElementByText()`
- `waveary-web/server/provider-api.ts` now exposes `/api/browser/clickable-elements` and `/api/browser/click-text`
- future browser work should continue through bounded actions like explicit link selection or form-field targeting, not by collapsing straight into a broad autonomous browser agent

## 2026-06-22 - Browser Read And Click Intents Now Reuse The Existing Chat Action Boundary

Status:

- accepted

Decision:

Integrate bounded browser read and click intents into the existing chat-side `pendingLocalAction` flow instead of inventing a second permission and confirmation path just for browser control.

Reason:

- the project already has one explicit, revocable, auditable trust boundary for local actions
- browser reads, page searches, clickable-target listing, and click-by-text are still higher-trust operations that should stay visible in conversation
- reusing the same action card and `allow / ask / deny` path keeps the permission model legible while still letting `full-access` feel meaningfully stronger

Impact:

- `detectPendingLocalAction()` now recognizes bounded browser intents such as reading the current page, searching page text, listing clickable items, and clicking by visible text
- `sendChatTurn()` and the execute route now prefer action-returned grounded companion notes for browser actions, so chat replies match what actually happened on the page
- future browser control should keep graduating through this same permissioned action path unless a deliberately separate higher-trust layer is designed

## 2026-06-22 - Voice Starts With Emotion-Aware TTS, Not Full Duplex

Status:

- accepted

Decision:

Start the first dedicated voice implementation by creating `waveary-voice` as its own workspace package, defining stable TTS-facing contracts, and shipping an emotion-aware browser speech planning path before attempting microphone capture, streaming STT, interruption handling, or full duplex conversation.

Reason:

- the product roadmap already treats voice as a first-class system, but jumping straight to realtime duplex would create too much surface area at once
- the fastest meaningful user-visible cut is letting the current chat page actually speak replies in a way that follows companion emotion and relationship stage
- a dedicated voice package preserves architecture boundaries so future provider-backed TTS/STT work does not get trapped inside `waveary-web`

Impact:

- `waveary-voice` now exists as a workspace package with `TextToSpeechRequest` / `TextToSpeechResult` contracts and a first `BrowserSpeechPlanner`
- `waveary-core` now includes first voice-domain contracts (`VoiceSession`, `SpeechInput`, `SpeechOutput`) so voice is no longer only a documentation placeholder
- `waveary-web` now exposes `/api/voice/speak` and the chat page can auto-speak or manually speak the latest reply using emotion-aware browser speech settings
- future real provider-backed voice work should extend this new package boundary instead of wiring vendor speech behavior directly into frontend components

## 2026-06-22 - Real TTS Should Reuse The Existing Provider Path Before Adding A Separate Voice Console

Status:

- accepted

Decision:

For the first real TTS slice, reuse the currently saved OpenAI-compatible provider config and attempt `/audio/speech` behind `waveary-web/server/voice-runtime.ts`, while keeping browser speech planning as an automatic fallback instead of blocking voice on a new settings surface.

Reason:

- the project already has a saved provider identity, API key, and base URL, so a second parallel voice-only credential flow would add setup friction before proving the real-audio path
- this gives Waveary a concrete provider-backed voice improvement immediately while preserving the current chat-page experience if the upstream provider lacks TTS support
- keeping the fallback explicit means the user-visible voice feature stays resilient instead of becoming all-or-nothing

Impact:

- `waveary-voice` now includes `OpenAICompatibleTextToSpeechProvider`
- `/api/voice/speak` can now return either real audio or a browser speech plan through one shared contract
- `waveary-web/src/App.tsx` now plays provider audio when available and falls back to browser `speechSynthesis` otherwise
- a later pass should expose explicit voice-model and voice-style configuration rather than relying forever on the saved chat-provider defaults

## 2026-06-22 - Provider-Backed TTS Now Gets Its Own Saved Voice Profile

Status:

- accepted

Decision:

Expose provider-backed TTS configuration through a dedicated saved voice config plus quality-oriented presets, instead of continuing to hide voice selection behind one hardcoded default or folding it into the chat-provider config.

Reason:

- the user goal is not just “voice output exists”, but “voice output feels more human”
- chat-provider model selection and voice-expression selection are different concerns and should not be forced into one config slot
- a compact chat-page control strip is enough to make this configurable now without inflating the console or creating a second heavy setup flow

Impact:

- `waveary-web` now exposes `/api/voice/config` and stores `.waveary/voice-config.json`
- `waveary-voice` now owns reusable voice presets, quality-profile-aware instruction seeds, and per-profile speed bias
- the chat page can now switch saved provider-backed TTS profile / model / voice directly while preserving browser fallback speech when provider audio is unavailable

## 2026-06-22 - First Speech Input Stays Browser-Native And Chat-Bounded

Status:

- accepted

Decision:

Implement the first speech-to-text slice through browser-native microphone capture on the chat page, using the Web Speech API to draft live transcript text into the existing composer and send the final recognized turn through the normal `/api/chat/turn` path.

Reason:

- the user's immediate need is to speak with Waveary now, not to wait for a full realtime duplex stack
- a browser-native STT cut is the smallest practical way to prove voice input without introducing a second provider setup path or new server media infrastructure
- keeping this first slice inside the chat page preserves the `waveary-voice` package boundary for later provider-backed STT, realtime transport, interruption handling, and full-duplex work

Impact:

- `waveary-web/src/App.tsx` now owns a bounded first speech-input controller with start/stop, live draft updates, final-turn auto-send, and localized fallback/error states
- the first STT milestone does not yet require a saved speech provider config or server-side audio upload route
- future voice work should extend from this bounded browser input path into provider-backed STT or realtime voice, rather than replacing it with another ad hoc UI flow

## 2026-06-22 - Realtime Voice Advances First As A Continuous Turn Loop

Status:

- accepted

Decision:

Advance the next voice milestone by turning the existing browser STT plus reply playback path into a continuous live conversation loop, instead of jumping straight to true full-duplex streaming or adding a second one-off microphone mode.

Reason:

- the user wants something that already feels like real spoken conversation now, not another isolated speech-input button
- the current architecture already has the minimum pieces needed: browser STT, provider-or-browser reply playback, and a dedicated chat page
- a continuous `listen -> send -> reply -> resume listening` loop moves the product materially closer to真人对话 without prematurely collapsing the `waveary-voice` boundary into ad hoc realtime transport work

Impact:

- `waveary-web/src/App.tsx` now tracks a dedicated live voice conversation mode instead of treating browser speech input as only one-shot capture
- spoken replies now automatically resume microphone listening when live mode is still active, for both browser speech synthesis and provider-returned audio playback
- no-speech and playback-failure edges now stay inside the live loop more gracefully instead of always forcing the user to restart from scratch
- the next voice cut should choose deliberately between provider-backed STT and a truer duplex / interruption model rather than rediscovering the live-loop step again

## 2026-06-22 - Provider And Model Setup Must Stay Explicitly Reachable In The Console

Status:

- accepted

Decision:

Do not let provider selection, model discovery, or model selection become effectively hidden behind a compressed console workspace flow. The console may stay compact, but model setup must remain obviously reachable and legible at all times.

Reason:

- hiding the provider workspace behind denser shell controls made it feel like the model selector had disappeared, even though the underlying state and routes still existed
- provider and model setup are foundational prerequisites, not optional diagnostics, so regressions in their visibility are product-breaking
- future shell polish should add new control surfaces without making already-working setup paths ambiguous or easy to lose

Impact:

- the console toolbar now includes a fixed shortcut back to `模型接入 / Model setup`
- the console status strip now exposes provider and model as separate visible state pills instead of collapsing all runtime readiness into one opaque label
- when no runnable provider/model configuration exists yet, the console automatically returns to the provider workspace instead of leaving the user stranded in a different workspace
