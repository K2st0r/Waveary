# Active Tasks

This file tracks the current highest-value work so a new Codex session can continue Waveary without reconstructing the active queue from chat history.

Keep this file short.

Update it when:

- the active implementation target changes
- a task is completed
- the next recommended step becomes more specific

## Current Focus

1. Start the first `waveary-voice` delivery path.
   Status: in progress
   Current state: a dedicated `waveary-voice` workspace now exists, the first browser-native TTS planner is implemented, `waveary-web` exposes `/api/voice/speak`, the chat page can already auto-speak or manually speak the latest reply, that route now prefers a real OpenAI-compatible `/audio/speech` TTS call before falling back to browser speech planning, provider-backed TTS now has explicit saved voice config plus quality-oriented voice presets exposed through `/api/voice/config` and the compact chat voice strip, the chat page has a browser-native microphone input path that drafts live speech into the composer and auto-sends the final recognized turn through the existing chat flow, and that path now also supports a persistent live voice conversation loop that auto-resumes listening after each spoken reply.
   Next cut: run a focused browser pass on the unified voice surface, then choose between provider-backed STT and a truer realtime duplex / interruption pass for the next voice milestone.

2. Keep polishing the `waveary-web` home / console shell.
   Status: in progress
   Current state: the homepage first screen has been compressed further, the hero now fits more comfortably on common desktop heights, the homepage doodle layer now uses a broader generated black-and-white PNG set including study objects plus stamp / envelope / train-ticket / postcard paper keepsakes, the console now uses a tighter toolbar + workspace strip + compact status strip with denser viewport-based panel heights, the provider/model setup workspace is now pinned back into clear view through a dedicated toolbar shortcut plus a visible provider/model status strip so it does not feel like the model selector disappeared, and the chat page now exposes a compact permission tray plus three direct permission presets right beside the composer plus a stronger voice strip with preset / model / voice controls.
   Next cut: run another browser pass focused specifically on the chat-page voice strip, three-step chat permission control, and homepage doodle density / fade balance, and then check whether any remaining console workspace still forces awkward external scrolling.

3. Continue the `waveary-core` dialogue-quality pass.
   Status: in progress
   Current state: memory recall is now stricter and updates `lastRecalledAt`, user-emotion detection is broader than `joy/sadness/neutral`, companion emotion transitions carry more relationship-aware tone state, scripted/provider guidance separates `new`, `warming`, and `growing`, primary continuity-thread selection plus current-turn focus summarization now live in one shared runtime helper reused by both scripted and real-provider reply paths, the helper ranks recalled memories by latest-turn match instead of blindly taking the first recalled item, weak timeline threads are now handled more conservatively during emotional turns, near-tied memory candidates get a small recency bias toward fresher remembered threads, and same-age tied memories now also get a very light source-turn preference toward the more recent user-origin thread.
   Next cut: expand live-provider regression beyond prompt-body inspection into stronger emotional-stress cases and richer memory-vs-timeline competition now that current-turn match, recency, and source-turn weighting all exist in the shared continuity helper.

4. Keep permissioned local-time awareness and local execution boundaries bounded and trustworthy.
   Status: in progress
   Current state: chat turns, proactive notification lead copy, and proactive console summary all respond to local daypart only when `timeAwareness` is allowed; direct time/date/day questions now short-circuit deterministically in `waveary-core` before provider generation so real providers cannot ignore the supplied local clock context; that deterministic detector now also catches more indirect Chinese complaint-style phrasings about still not knowing the exact time; `localActions` now has its first real ask-first path through chat-side pending action cards plus permission-gated local execution for simple open-url / open-folder / launch-app requests; `full-access` now auto-executes those detected local actions directly from the chat page; same-turn `/api/chat/turn` replies are now kept consistent with that execution path instead of returning a contradictory "I cannot open apps" provider answer; browser open-url actions now run inside a Waveary-managed Playwright persistent browser context; the managed browser layer already exposes bounded current-page info, visible-text extraction, page-text search, clickable-element listing, and click-by-text routes; those browser read/click capabilities now also flow through the same chat-side pending-action card plus `full-access` auto-run path instead of living only as standalone API routes; and page-search intent detection now resolves before the narrower Bilibili follow-up branch so current-page search requests do not accidentally reach for managed browser page state.
   Next cut: verify the live `#chat` page against the managed browser action path end-to-end, then extend that same bounded browser layer into one next interaction such as explicit link selection or form-field targeting instead of jumping to a broad free-form web agent.

5. Preserve continuity discipline under high-frequency iteration.
   Status: ongoing
   Current state: each meaningful step is being verified, committed, pushed, and written back into continuity files.
   Next cut: keep repository-side state files aligned so session resets do not cause duplicate work or architectural drift, record any verification caveats like the current Windows `@waveary/core` dist-lock behavior, and preserve the doodle-generation constraints that avoid repeated `524` timeouts.

## Deferred But Important

1. Strengthen live-provider dialogue regression beyond scripted providers.
   Reason: the current quality pass now includes a shared runtime continuity-thread helper, but real OpenAI-compatible behavior still needs more direct coverage for continuity-thread choice and relationship-distance behavior across multiple turns.

2. Decide whether to harden `@waveary/core` test execution on Windows.
   Reason: the current package test script depends on compiled `dist` output and can be misleading unless build and test are run in the right order.

3. Continue future presence-aware work only behind explicit permission boundaries.
   Reason: the product direction allows richer presence later, but current trust boundaries must stay narrow and legible.

4. Keep proactive scheduling explicit and legible.
   Reason: the new local loop is intentionally visible, tab-bound, and user-controlled; future scheduling work should not regress into hidden background behavior.
