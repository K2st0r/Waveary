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

## 2026-06-23 - Chinese Copy Changes Need A Repo-Side Mojibake Check

Status:

- accepted

Decision:

When a Waveary work block changes Chinese-facing copy, verify the diff with `git diff` and run `npm run check:mojibake` before commit instead of trusting Windows / PowerShell terminal rendering alone.

Reason:

- this machine has already shown that console rendering is not byte-faithful enough to validate Chinese edits safely
- the repository already contains historical mojibake, so future sessions need one repeatable mechanical guard instead of relying only on memory or manual caution
- a changed-files check keeps the workflow narrow and cheap while still catching the most obvious corruption patterns before they are committed

Impact:

- the repository now includes `tools/check-mojibake.mjs` plus the root script `npm run check:mojibake`
- workflow and continuity instructions should call that script whenever a diff adds or changes Chinese-facing copy
- future broad Chinese cleanup can stay a separate deliberate task instead of being mixed into unrelated feature work

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

## 2026-06-23 - Provider-Backed STT Should Reuse The Existing Voice Route First

Status:

- accepted

Decision:

Add the first provider-backed speech-to-text slice by extending the existing saved voice route and exposing `/api/voice/transcribe`, while keeping browser `SpeechRecognition` as the fallback path instead of inventing a second standalone speech-provider setup flow.

Reason:

- the user wants Waveary to move closer to real spoken conversation now, but the current product still needs a small honest step before full duplex and interruption handling
- the voice console and routing diagnostics already define which provider family is active, so STT can reuse that route instead of adding another parallel settings system
- an OpenAI-compatible transcription adapter gives immediate coverage for providers that already fit the current shared or dedicated compatible voice path, while Doubao/local STT can remain explicit later work instead of being faked now

Impact:

- `@waveary/voice` now exports `OpenAICompatibleSpeechToTextProvider` alongside the earlier TTS adapters
- `waveary-web/server/provider-api.ts` now exposes `/api/voice/transcribe` and stores `sttModel` in the saved voice config
- the chat page now prefers provider-backed microphone capture plus upload/transcription when the active voice route is shared-compatible or dedicated-compatible, and falls back honestly to browser `SpeechRecognition` otherwise
- the current realtime voice loop is now closer to真人对话, but it is still a bounded short-window turn loop rather than true interruption-capable full duplex

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
## 2026-06-22 - Voice Config Loading Must Not Block Provider Console Initialization

Status:

- accepted

Decision:

Treat `/api/voice/config` as an optional initialization dependency in the web console instead of loading it in one all-or-nothing `Promise.all(...)` bundle with provider presets, saved provider config, session format, and session list.

Reason:

- the current local runtime can expose healthy `/api/provider/*` routes while still returning `404` for `/api/voice/config`
- binding voice config into the same hard-fail init chain caused a false top-level console failure: provider presets vanished, the supplier dropdown rendered empty, and the UI incorrectly implied that provider routes were missing
- provider/model setup is a foundational path and must stay available even when an adjacent optional subsystem such as saved voice config is temporarily unavailable or running on a stale server build

Impact:

- `waveary-web/src/App.tsx` now logs voice-config init failure as an optional warning and continues loading provider presets, saved provider config, session metadata, and chat state
- the provider dropdown, saved provider selection, and model setup surface can recover independently from voice-route startup drift
- a later server/runtime pass can still fix the underlying `/api/voice/config` `404`, but that mismatch no longer breaks core console use

## 2026-06-23 - Console Workspaces Must Share One Stage Shell

Status:

- accepted

Decision:

Keep `provider`, `voice`, `sessions`, `care`, and `runtime` inside one shared console-stage layout system with matched panel heights and internal scrolling, instead of letting each workspace drift into a different page structure.

Reason:

- the compact-control-desk direction breaks down if switching tabs changes the whole page species
- the user explicitly wants no more “one page long, one page short” workspace mismatch
- single-panel workspaces still need to occupy the same visual stage as two-panel workspaces so the console reads like one product

Impact:

- `waveary-web/src/App.tsx` now applies a shared stage shell and panel wrapper across all console workspaces
- `waveary-web/src/styles.css` now centralizes console workspace height, full-width single-panel behavior, and inner-panel scrolling rules
- future console polish should refine density or mobile behavior without reintroducing workspace-specific outer-page layouts

## 2026-06-22 - 真人语音 Must Not Be Forced To Reuse The Chat Provider

Status:

- accepted

Decision:

Add a `shared / dedicated` provider mode to saved voice configuration so Waveary can keep normal chat on one model vendor while routing provider-backed TTS through a different OpenAI-compatible voice endpoint.

Reason:

- many chat-compatible providers do not expose a usable `/audio/speech` route, so forcing TTS to reuse the chat provider causes silent fallback to browser speech and breaks the user's expectation of 真人声音
- the product already treats voice as a first-class system, so voice transport should be able to diverge from chat transport without rewriting the rest of the runtime
- this is a bounded architecture extension: it preserves the existing chat provider flow while making the voice layer materially more usable

Impact:

- `.waveary/voice-config.json` now stores `providerMode`, `provider`, `baseURL`, and `apiKey` in addition to voice model, voice name, format, and quality profile
- `waveary-web/server/voice-runtime.ts` now chooses between the shared chat provider and a dedicated voice provider before attempting `/audio/speech`
- the chat voice strip now exposes `Source`, plus dedicated provider fields when the user switches into independent真人语音 mode

## 2026-06-22 - Domestic Voice Support Should Graduate Through Provider-Specific Adapters

Status:

- accepted

Decision:

Add Doubao as the first dedicated domestic voice adapter instead of forcing every Chinese voice provider through the current OpenAI-compatible `/audio/speech` path.

Reason:

- domestic真人语音 quality is strategically important for Waveary, but vendors like Doubao do not fit the existing OpenAI-compatible transport shape cleanly
- keeping Doubao behind its own adapter preserves the earlier `shared / dedicated` voice-provider split without weakening the already-working OpenAI-compatible path
- this is the safest incremental step before adding local/self-hosted voice engines, because it proves the voice layer can branch by provider family without dragging those differences into the rest of the chat runtime

Impact:

- `@waveary/voice` now exports a `DoubaoTextToSpeechProvider`
- saved voice config now also carries Doubao-specific `appId` and `cluster` fields
- the dedicated voice UI path can now switch to `provider = doubao` and send speech through ByteDance-style TTS while keeping the chat model provider untouched

## 2026-06-22 - Local Self-Hosted Voice Should Start As A Generic HTTP Bridge

Status:

- accepted

Decision:

Add the first self-hosted voice-provider path as a generic local HTTP bridge instead of binding Waveary directly to one engine protocol such as GPT-SoVITS only.

Reason:

- the user wants local/self-hosted voice support, but the project should not hardcode one engine family as the only future-safe path
- a thin normalized HTTP bridge keeps the new self-hosted cut small, auditable, and compatible with several local engines that can return either raw audio or JSON-wrapped base64 audio
- this preserves the earlier shared / dedicated voice-provider split and the newer provider-family branching without dragging engine-specific transport details into the main chat runtime

Impact:

- @waveary/voice now exports LocalHttpTextToSpeechProvider
- saved voice config now also carries local-bridge-specific endpointPath, engine, speaker, and 
eferenceVoiceId fields
- the chat voice strip can now switch to provider = local and send dedicated真人语音 requests through a self-hosted HTTP endpoint while leaving the chat model provider untouched
## 2026-06-22 - Chat Should Emit An Explicit Companion Delivery Hint For Voice

Status:

- accepted

Decision:

Normal chat turns should return a structured companion delivery hint and the voice layer should consume it directly, instead of making every TTS path infer delivery only from plain reply text plus a loose emotion hint.

Reason:

- the product goal is not just "text gets read aloud" but "the companion sounds emotionally present and relationally appropriate"
- chat/runtime already knows more than the TTS adapter alone: relationship stage, companion emotion, and whether the turn should sound careful, close, steady, or playful
- one explicit delivery contract keeps browser speech, OpenAI-compatible TTS, Doubao, and local self-hosted voice paths aligned instead of letting each provider family drift into separate heuristics

Impact:

- chat reply payloads now include a `delivery` hint with style, pace, closeness, expressiveness, and a provider-usable instruction summary
- `/api/voice/speak` now accepts and forwards that delivery hint through the voice runtime
- browser speech planning and provider-backed instruction construction now both use the same delivery contract rather than re-deriving tone independently from text

## 2026-06-23 - Fish Audio Stays A Dedicated Voice Family, Not An OpenAI-Compatible Shortcut

Status:

- accepted

Decision:

Integrate Fish Audio as its own dedicated voice-provider family for Waveary voice routing, instead of forcing it through the existing OpenAI-compatible speech path.

Reason:

- the user explicitly wants Fish Audio tested at the voice layer first, not mixed into the chat-model provider layer
- Fish Audio uses different route shapes from the current OpenAI-compatible `/audio/speech` and `/audio/transcriptions` flow, including `POST /v1/tts`, `POST /v1/asr`, a required TTS `model` header, and `/model` for voice-model discovery
- keeping Fish separate preserves honest provider behavior and avoids pretending that all voice vendors share one universal speech contract

Impact:

- `@waveary/voice` now exports `FishAudioTextToSpeechProvider` and `FishAudioSpeechToTextProvider`
- `waveary-web/server/voice-routing-diagnostics.ts` now recognizes `fish-audio` as a dedicated-ready provider family
- `waveary-web/server/provider-api.ts` now supports Fish Audio voice-model catalog fetches through `/model` plus dedicated Fish STT routing through `/api/voice/transcribe`
- the existing browser-side provider STT gate now also treats `fish-audio` as a real provider-backed speech path instead of falling back unnecessarily

## 2026-06-23 - Fish Network Failures Must Surface As Explicit Diagnostics

Status:

- accepted

Decision:

When Fish Audio upstream requests fail before any HTTP response is received, Waveary should surface the concrete connectivity cause instead of returning a generic `fetch failed` error.

Reason:

- live testing on this machine showed that `api.fish.audio:443` can time out even when the Waveary routes and Fish adapters are wired correctly
- a generic fetch failure hides the difference between network reachability problems and local integration bugs
- the voice console and local route layer need actionable failure text before further Fish UI polishing is meaningful

Impact:

- Fish Audio catalog, TTS, and STT fetch failures now preserve upstream details such as `UND_ERR_CONNECT_TIMEOUT`
- live verification can now distinguish "Fish is unreachable from this machine" from "Waveary routed the request incorrectly"
- the next Fish browser pass should be retried only after network reachability is restored

## 2026-06-23 - Gemini Should Enter As Its Own Dedicated Voice Family

Status:

- accepted

Decision:

Integrate Gemini TTS as its own dedicated voice-provider family instead of forcing it into the current OpenAI-compatible speech path or pretending it already fits the existing provider-backed STT contract.

Reason:

- Gemini speech generation uses its own `models/{model}:generateContent` audio route and official prebuilt voice names rather than the OpenAI-style `/audio/speech` contract
- keeping Gemini dedicated preserves honest routing, provider-specific model and voice selection, and future evolution toward richer Google audio features without polluting the compatible-vendor layer
- the current user request is specifically to add Gemini as another voice vendor, and the smallest truthful cut is dedicated TTS first

Impact:

- `@waveary/voice` now exports `GeminiTextToSpeechProvider`
- the voice console now includes a `Gemini TTS` preset with supported Gemini TTS models and official prebuilt voice names
- routing diagnostics now distinguish Gemini from OpenAI-compatible, Fish, Doubao, and local voice families
- microphone transcription remains explicitly outside Gemini for now until a separate audio-understanding / STT design is chosen deliberately

## 2026-06-23 - Micu Relay Needs Its Own Gemini TTS Preset

Status:

- accepted

Decision:

Treat `Micu relay Gemini TTS` as a separate voice-provider preset under the Gemini family, with its own default model names and catalog behavior, instead of reusing the official Gemini preset unchanged.

Reason:

- live Micu probes with the provided key showed that `gemini-3.1-flash-tts-preview` currently returns `503 model_not_found` on the Micu relay path
- the same Micu relay path does recognize `gemini-2.5-flash-tts-preview` and `gemini-2.5-pro-tts-preview`, even though the tested key currently lacks access and therefore returns `403`
- keeping one shared Gemini preset would keep defaulting Micu users back onto a model alias that the upstream relay does not currently expose

Impact:

- the voice console now includes a `Gemini TTS (Micu Relay)` preset with base URL `https://www.micuapi.ai/v1beta`
- static Gemini model catalogs now branch by preset so Micu uses Micu-recognized `2.5` TTS preview names while the official Gemini preset keeps the earlier official-family list
- future Gemini browser verification should explicitly test both the official route and the Micu relay route instead of assuming one static Gemini model list fits both

## 2026-06-23 - Doubao Voice Must Move To OpenSpeech v3 Resource-ID Routing

Status:

- accepted

Decision:

Replace Waveary's earlier Doubao voice contract based on `/api/v1/tts` plus `appId / cluster` with OpenSpeech v3 `POST /api/v3/tts/unidirectional` using `x-api-key` and `X-Api-Resource-Id`.

Reason:

- the user provided a newer official Doubao sample that no longer uses the old `appId` request shape
- direct probes with the provided real key showed the old Waveary route was failing at auth/grant level, while the v3 route advanced to a newer semantic validation error instead
- keeping the old `App ID / Cluster` UX would keep future sessions debugging an obsolete contract

Impact:

- `@waveary/voice` now posts Doubao requests to `/api/v3/tts/unidirectional` with `x-api-key`, `X-Api-Resource-Id`, `X-Api-Request-Id`, `user.uid`, and `req_params`
- saved voice config now carries `resourceId`, while compatibility normalization still reads legacy local `appId` values from older configs
- the voice console, routing diagnostics, and dedicated Doubao guidance now surface `Resource ID` instead of `App ID / Cluster`
- the remaining blocker on the provided real key is now upstream code `45002001` / `No readable text!`, which should be treated as request-semantics or account-side expectation work rather than a reason to revert Waveary back to the obsolete transport

## 2026-06-23 - Legacy Local Doubao Voice Config Should Auto-Normalize On Load

Status:

- accepted

Decision:

When Waveary loads a saved dedicated Doubao voice profile from `.waveary/voice-config.json`, it should automatically normalize obvious pre-v3 leftovers such as `/api/v1` base URLs, `resourceId` accidentally copied from the old `appId = apiKey` value, and the legacy `BV001_streaming` default voice.

Reason:

- live browser verification showed that the repository code could be correct while the local saved config still kept enough stale Doubao fields to make the running console appear misconfigured
- that stale config drift is likely to recur across sessions because the user is iterating on one long-lived local CE workspace, not creating fresh profiles every time
- auto-normalizing the known bad legacy combinations is safer than asking future sessions to manually rediscover and edit every stale local value before browser verification

Impact:

- `waveary-web/server/voice-config.ts` now upgrades older saved dedicated Doubao base URLs to `https://openspeech.bytedance.com`
- if a saved dedicated Doubao `resourceId` matches the API key exactly, Waveary now treats that as an obsolete migration carryover and restores the current default route
- the legacy `BV001_streaming` default now normalizes to the current documented manual 2.0 speaker before the browser voice console or voice runtime reuses it

## 2026-06-23 - Doubao 2.0 Should Follow The Current `seed-tts-2.0` Route And Chunked Success Stream

Status:

- accepted

Decision:

For the current Waveary CE Doubao TTS path, use `X-Api-Resource-Id: seed-tts-2.0`, default the manual speaker to `zh_female_gaolengyujie_uranus_bigtts`, and parse the HTTP unidirectional success response as a newline-delimited chunked event stream instead of assuming one JSON object.

Reason:

- the current official Volcengine / Ark docs now describe Doubao voice synthesis 2.0 with `seed-tts-2.0` as the resource ID, not the older `volc.service_type.10029` default that had remained in Waveary
- live upstream verification with the provided real key succeeded once the request used UTF-8-safe text and the current route values, which proved the remaining local failure was response parsing rather than upstream semantics
- the real success response arrives as multiple JSON events separated by newlines, with audio chunks in repeated `data` fields and a final `code: 20000000` completion event, so single-JSON parsing necessarily falls back even after the upstream call succeeds

Impact:

- `waveary-web/server/voice-config.ts` now defaults and normalizes dedicated Doubao config toward `seed-tts-2.0` plus `zh_female_gaolengyujie_uranus_bigtts`
- `waveary-voice/src/doubao-tts-provider.ts` now concatenates chunked `data` payloads across multiple JSON events and tolerates the final `20000000 OK` completion marker
- live local `/api/voice/speak` verification for dedicated Doubao now returns provider audio instead of browser fallback when the saved voice route uses the provided real key

## 2026-06-23 - Doubao Speaker Selection Should Be Curated, Not Fake Discovery

Status:

- accepted

Decision:

For dedicated Doubao TTS in Waveary CE, expose a curated built-in speaker list in the console instead of pretending that the provider supports one generic OpenAI-style discoverable voice directory.

Reason:

- direct route checks already proved that Doubao voice does not expose a shared `/models`-style speaker discovery path that fits the existing compatible-vendor flow
- the user still needs a usable way to switch among multiple real Doubao speakers rather than being trapped on one default
- a curated list keeps the UI honest while still making the product materially easier to use

Impact:

- `waveary-web/server/voice-config.ts` now returns a curated Doubao speaker catalog with `voiceFieldMode = select`
- the dedicated Doubao console path can switch among multiple current 2.0 speakers without changing the underlying `resourceId + speaker` route contract
- future Doubao browser verification should treat this as curated local product data, not as provider-side discovery

## 2026-06-23 - Doubao Live Speaker Discovery Must Use Separate Volcengine Access Keys

Status:

- accepted

Decision:

Keep Doubao TTS synthesis on the current OpenSpeech v3 `x-api-key + X-Api-Resource-Id` route, but treat live speaker-catalog discovery as a separate Volcengine OpenAPI flow that requires `AccessKey ID + SecretAccessKey` signing for `ListSpeakers`.

Reason:

- public code and current docs point to `Action=ListSpeakers&Version=2025-05-20` on `open.volcengineapi.com` under service `speech_saas_prod`, not to an OpenSpeech `/models`-style endpoint
- this means the user's working Doubao TTS `API Key` is not the same credential shape as the catalog-discovery path
- trying to force full voice discovery through the TTS API-key route would keep Waveary stuck between fake local lists and broken fetches

Impact:

- `waveary-web/server/provider-api.ts` now supports a Doubao-specific live catalog branch using signed Volcengine `ListSpeakers` requests when `AccessKey ID` and `Secret Access Key` are present
- `waveary-web/server/voice-config.ts` now persists optional Doubao `accessKeyId` and `secretAccessKey` fields separately from the existing TTS `apiKey`
- the voice console keeps the current curated Doubao fallback when those signing keys are absent, but can now show provider-fetched voices when they are supplied

## 2026-06-23 - Legacy Doubao App TTS Must Stay A Separate Voice Route

Status:

- accepted

Decision:

Keep the current OpenSpeech v3 Doubao route for `seed-tts-2.0` voices, but add a separate `doubao-legacy` dedicated voice family for older app-style grants that still require `App ID + Access Token` on `/api/v1/tts`.

Reason:

- live verification proved that `multi_female_shuangkuaisisi_moon_bigtts` does not belong to the current `seed-tts-2.0` resource family and correctly fails there with `resource ID is mismatched with speaker related resource`
- the user also supplied a separate older Doubao credential set, and direct upstream probes confirmed that this older app-style route can still synthesize successfully when called with `Authorization: Bearer;{AccessToken}` plus `app.appid` and `app.token`
- forcing both credential families into one route keeps causing false conclusions such as "save failed" or "still using browser voice" when the real issue is simply that the selected voice belongs to the legacy app contract instead of the v3 resource-ID contract

Impact:

- `@waveary/voice` now exports `DoubaoLegacyTextToSpeechProvider`
- `waveary-web/server/voice-config.ts` now includes a dedicated `doubao-legacy` preset plus persisted `appId`
- `waveary-web/server/voice-routing-diagnostics.ts` now distinguishes `doubao` from `doubao-legacy`
- the voice console can now save and route older Doubao app credentials without regressing the current v3 Doubao path
- future sessions should not try to "fix" `multi_female_shuangkuaisisi_moon_bigtts` inside `seed-tts-2.0`; it belongs on the legacy route unless the upstream resource family changes

## 2026-06-23 - Split Doubao Verification Should Trust Live Route Probes Before Browser Copy

Status:

- accepted

Decision:

When verifying the split Doubao voice path, treat live `/api/voice/speak` route probes as the primary truth for provider-audio success, and use browser-console checks mainly to confirm that the visible preset, field set, and routing summary match that backend truth.

Reason:

- both `doubao` v3 and `doubao-legacy` now succeed through the running local server with real provider audio, so route-level verification can already prove whether the provider path works
- the browser shell can still drift because of navigation state, stale sessions, or local dev-server mismatch, which makes UI-only conclusions weaker than direct live route probes
- this keeps future sessions from re-opening already solved backend questions just because the console was left on another workspace or the wrong preset at the moment of inspection

Impact:

- future Doubao verification should start with the live `POST /api/voice/speak` route and only then inspect the browser console for preset and field correctness
- browser verification for the split Doubao path now focuses on whether `Doubao TTS` exposes the v3 `Resource ID` route and whether `Doubao TTS (Legacy App)` exposes the legacy `App ID` route cleanly

## 2026-06-23 - Doubao Curated Speakers Should Auto-Load Into A Searchable Picker

Status:

- accepted

Decision:

When the dedicated `Doubao TTS` preset is selected in the Waveary CE voice console, the curated supported speaker list should auto-load into the frontend state and render through a searchable picker immediately, instead of waiting for the user to press the catalog-fetch button or falling back to the older generic shared voice list first.

Reason:

- the previous frontend state shape left `voiceFieldMode = select` vendors on an awkward hybrid `select + datalist` control that did not scale to the growing Doubao speaker list
- Doubao already has a truthful curated speaker directory in `waveary-web/server/voice-config.ts`, so showing the generic fallback list first is a frontend-state bug, not a missing backend capability
- the user explicitly wants "连上了豆包就有下拉栏可以选所有支持的，然后里面带一个搜索框", which means the preset itself must feel complete without an extra hidden discovery step

Impact:

- `waveary-web/src/App.tsx` now upgrades select-mode voice vendors to a searchable picker surface instead of the older native dropdown-plus-datalist mix
- the dedicated Doubao preset now auto-fetches its current curated voice catalog into frontend state as soon as the preset is active and no catalog is loaded yet
- future voice-console work should preserve this invariant: a provider with a known curated select catalog should open directly into searchable supported options, not regress to the old generic fallback list

## 2026-06-23 - Searchable Voice Pickers Must Expand Inside The Console Panel

Status:

- accepted

Decision:

When a voice vendor uses a searchable picker in the Waveary console, the picker must expand as a full-width vertical control inside the current panel instead of opening as a narrow floating popover that pressures the layout sideways.

Reason:

- the first searchable Doubao picker technically loaded the correct 13 curated speakers, but the UI still felt broken because the trigger stayed too narrow and the floating panel made the control look empty or hidden
- the user explicitly rejected rightward card pressure and horizontal-feeling control flows inside the console workspaces
- the current console direction is a compact control desk with consistent panel rhythm, so voice selection should grow downward within that stage instead of acting like an external overlay

Impact:

- `waveary-web/src/App.tsx` now renders the searchable voice control as a block-level `voice-picker-field` and keeps the active panel inline
- `waveary-web/src/styles.css` now forces the voice output-selection area into a single-column layout for the searchable picker path, removes the earlier width pressure, and keeps the loaded voice list visible inside the panel
- future console voice refinements should preserve the invariant that searchable supported voice lists remain visibly in-panel and do not reintroduce awkward sideways overflow
