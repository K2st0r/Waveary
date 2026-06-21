# Active Tasks

This file tracks the current highest-value work so a new Codex session can continue Waveary without reconstructing the active queue from chat history.

Keep this file short.

Update it when:

- the active implementation target changes
- a task is completed
- the next recommended step becomes more specific

## Current Focus

1. Turn proactive-care presentation into a reusable message-draft interface.
   Status: in progress
   Current state: browser notification copy and `WPCE` console summary now share one web-side proactive message composer.
   Next cut: extend that composer output from presentation text into a structured suggested-message draft with fields such as `tone`, `deliveryKind`, and `suggestedMessage`.

2. Keep permissioned local-time awareness bounded and trustworthy.
   Status: in progress
   Current state: chat turns, proactive notification lead copy, and proactive console summary all respond to local daypart only when `timeAwareness` is allowed.
   Next cut: reuse the same bounded daypart logic if proactive message drafting expands, without silently broadening into desktop presence.

3. Preserve continuity discipline under high-frequency iteration.
   Status: ongoing
   Current state: each meaningful step is being verified, committed, pushed, and written back into continuity files.
   Next cut: keep repository-side state files aligned so session resets do not cause duplicate work or architectural drift.

## Deferred But Important

1. Introduce a formal proactive message draft contract that future delivery channels can consume.
   Reason: current shared composer still lives inside `waveary-web/src/App.tsx` and returns presentation-first fields.

2. Decide when to extract proactive presentation helpers into a dedicated web utility module.
   Reason: do not split it out until at least one more surface besides the current console and browser notification path needs it.

3. Continue future presence-aware work only behind explicit permission boundaries.
   Reason: the product direction allows richer presence later, but current trust boundaries must stay narrow and legible.
