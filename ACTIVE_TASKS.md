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
   Current state: the proactive message composer has been extracted into its own web utility module, promoted into `/api/chat/proactive/evaluate`, and now reaches the console, browser-notification path, and a bounded browser-local proactive check loop through one server-generated draft contract with `tone`, `deliveryKind`, and `suggestedMessage`.
   Next cut: keep the next delivery layer aligned with this explicit local-loop model, or decide whether any broader scheduler should remain web-local or move closer to runtime boundaries.

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
   Reason: the draft contract now exists on `/api/chat/proactive/evaluate`, but any next delivery path should keep consuming that contract rather than reintroducing per-surface recomputation.

2. Decide when to extract proactive presentation helpers into a dedicated web utility module.
   Reason: this extraction is complete; the next architectural question is whether those helpers should remain `waveary-web`-local or move closer to a shared runtime boundary before broader delivery orchestration.

3. Continue future presence-aware work only behind explicit permission boundaries.
   Reason: the product direction allows richer presence later, but current trust boundaries must stay narrow and legible.

4. Keep proactive scheduling explicit and legible.
   Reason: the new local loop is intentionally visible, tab-bound, and user-controlled; future scheduling work should not regress into hidden background behavior.
