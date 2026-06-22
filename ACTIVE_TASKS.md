# Active Tasks

This file tracks the current highest-value work so a new Codex session can continue Waveary without reconstructing the active queue from chat history.

Keep this file short.

Update it when:

- the active implementation target changes
- a task is completed
- the next recommended step becomes more specific

## Current Focus

1. Keep polishing the `waveary-web` home / console shell.
   Status: in progress
   Current state: the homepage first screen has been compressed further, the hero now fits more comfortably on common desktop heights, the homepage doodle layer now uses a broader generated black-and-white PNG set including study objects plus stamp / envelope / train-ticket / postcard paper keepsakes, the console now uses a tighter toolbar + workspace strip + compact status strip with denser viewport-based panel heights, and the chat page now exposes a compact permission tray plus three direct permission presets right beside the composer.
   Next cut: run another browser pass focused specifically on the new three-step chat permission control plus homepage doodle density / fade balance, and then check whether any remaining console workspace still forces awkward external scrolling.

2. Continue the `waveary-core` dialogue-quality pass.
   Status: in progress
   Current state: memory recall is now stricter and updates `lastRecalledAt`, user-emotion detection is broader than `joy/sadness/neutral`, companion emotion transitions carry more relationship-aware tone state, scripted/provider guidance separates `new`, `warming`, and `growing`, primary continuity-thread selection plus current-turn focus summarization now live in one shared runtime helper reused by both scripted and real-provider reply paths, the helper ranks recalled memories by latest-turn match instead of blindly taking the first recalled item, weak timeline threads are now handled more conservatively during emotional turns, near-tied memory candidates get a small recency bias toward fresher remembered threads, and same-age tied memories now also get a very light source-turn preference toward the more recent user-origin thread.
   Next cut: expand live-provider regression beyond prompt-body inspection into stronger emotional-stress cases and richer memory-vs-timeline competition now that current-turn match, recency, and source-turn weighting all exist in the shared continuity helper.

3. Keep permissioned local-time awareness and local execution boundaries bounded and trustworthy.
   Status: in progress
   Current state: chat turns, proactive notification lead copy, and proactive console summary all respond to local daypart only when `timeAwareness` is allowed; direct time/date/day questions now short-circuit deterministically in `waveary-core` before provider generation so real providers cannot ignore the supplied local clock context; that deterministic detector now also catches more indirect Chinese complaint-style phrasings about still not knowing the exact time; `localActions` now has its first real ask-first path through chat-side pending action cards plus permission-gated local execution for simple open-url / open-folder / launch-app requests; `full-access` now auto-executes those detected local actions directly from the chat page; same-turn `/api/chat/turn` replies are now kept consistent with that execution path instead of returning a contradictory "I cannot open apps" provider answer; browser open-url actions now run inside a Waveary-managed Playwright persistent browser context; action success and dismissal copy now stays warmer and more companion-like; and Chinese site-open detection now correctly catches phrasing like `打开哔哩哔哩`.
   Next cut: verify the live `#chat` page against the new Playwright-backed browser path end-to-end, then extend that same bounded browser layer beyond `open_url` into one or two stable follow-up actions such as page search or click-by-intent.

4. Preserve continuity discipline under high-frequency iteration.
   Status: ongoing
   Current state: each meaningful step is being verified, committed, pushed, and written back into continuity files.
   Next cut: keep repository-side state files aligned so session resets do not cause duplicate work or architectural drift, record any verification caveats like the current Windows `@waveary/core` test-script behavior, and preserve the doodle-generation constraints that avoid repeated `524` timeouts.

## Deferred But Important

1. Strengthen live-provider dialogue regression beyond scripted providers.
   Reason: the current quality pass now includes a shared runtime continuity-thread helper, but real OpenAI-compatible behavior still needs more direct coverage for continuity-thread choice and relationship-distance behavior across multiple turns.

2. Decide whether to harden `@waveary/core` test execution on Windows.
   Reason: the current package test script depends on compiled `dist` output and can be misleading unless build and test are run in the right order.

3. Continue future presence-aware work only behind explicit permission boundaries.
   Reason: the product direction allows richer presence later, but current trust boundaries must stay narrow and legible.

4. Keep proactive scheduling explicit and legible.
   Reason: the new local loop is intentionally visible, tab-bound, and user-controlled; future scheduling work should not regress into hidden background behavior.
