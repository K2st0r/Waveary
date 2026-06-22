# Active Tasks

This file tracks the current highest-value work so a new Codex session can continue Waveary without reconstructing the active queue from chat history.

Keep this file short.

Update it when:

- the active implementation target changes
- a task is completed
- the next recommended step becomes more specific

## Current Focus

1. Continue the `waveary-core` dialogue-quality pass.
   Status: in progress
   Current state: memory recall is now stricter and updates `lastRecalledAt`, user-emotion detection is broader than `joy/sadness/neutral`, companion emotion transitions carry more relationship-aware tone state, scripted/provider guidance separates `new`, `warming`, and `growing`, primary continuity-thread selection plus current-turn focus summarization now live in one shared runtime helper reused by both scripted and real-provider reply paths, the helper ranks recalled memories by latest-turn match instead of blindly taking the first recalled item, weak timeline threads are now handled more conservatively during emotional turns, and near-tied memory candidates now get a small recency bias toward fresher remembered threads.
   Next cut: expand live-provider regression beyond prompt-body inspection into stronger emotional-stress cases and richer memory-vs-timeline competition, then decide whether continuity scoring now needs source-turn weighting in addition to the new lightweight recency bias.

2. Keep permissioned local-time awareness bounded and trustworthy.
   Status: in progress
   Current state: chat turns, proactive notification lead copy, and proactive console summary all respond to local daypart only when `timeAwareness` is allowed.
   Next cut: reuse the same bounded daypart logic if proactive message drafting expands, without silently broadening into desktop presence.

3. Preserve continuity discipline under high-frequency iteration.
   Status: ongoing
   Current state: each meaningful step is being verified, committed, pushed, and written back into continuity files.
   Next cut: keep repository-side state files aligned so session resets do not cause duplicate work or architectural drift, and record any verification caveats like the current Windows `@waveary/core` test-script behavior.

## Deferred But Important

1. Strengthen live-provider dialogue regression beyond scripted providers.
   Reason: the current quality pass now includes a shared runtime continuity-thread helper, but real OpenAI-compatible behavior still needs more direct coverage for continuity-thread choice and relationship-distance behavior across multiple turns.

2. Decide whether to harden `@waveary/core` test execution on Windows.
   Reason: the current package test script depends on compiled `dist` output and can be misleading unless build and test are run in the right order.

3. Continue future presence-aware work only behind explicit permission boundaries.
   Reason: the product direction allows richer presence later, but current trust boundaries must stay narrow and legible.

4. Keep proactive scheduling explicit and legible.
   Reason: the new local loop is intentionally visible, tab-bound, and user-controlled; future scheduling work should not regress into hidden background behavior.
