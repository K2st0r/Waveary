# Product Preferences

This file records stable product preferences that have been stated clearly enough to matter across many sessions.

Use it to reduce drift after context compression.

Only write preferences here when they are likely to remain useful over time.

## Product Identity

- Waveary must be understood as an open source digital life companion framework, not an AI girlfriend project, AI boyfriend project, or generic chatbot wrapper.
- The brand line is `念念不忘，终有回响。`
- The product should feel like a continuity layer for life companionship, not like a roleplay shell or benchmark-driven assistant skin.

## Product Priorities

- Companionship matters more than raw intelligence.
- Memory matters more than model novelty.
- Relationship continuity matters more than feature count.
- The system should feel emotionally present, not mechanically “helpful”.

## Interaction Preferences

- The companion should feel like a person with emotional range, not a dry Q&A engine.
- Replies should carry warmth, concern, softness, and restraint where appropriate instead of sounding like tooling or documentation.
- Proactive care should feel细致入微 and human, but never spammy or manipulative.
- Time-of-day and emotional context should shape tone when permission allows it.

## Trust And Permission Boundaries

- The user should be able to choose the companion's permissions explicitly.
- Higher-trust abilities must be visible, revocable, and permissioned before they exist.
- Local time awareness is acceptable as a bounded input.
- Time awareness must not silently expand into broader desktop presence or local action authority.
- Future desktop reading, local control, or automation should stay clearly separated from ordinary chat behavior.
- The companion should not feel inert by default; proactive care can start from an enabled baseline as long as quiet hours, unanswered-reachout suppression, and revocable permissions still constrain it.
- For higher-trust powers, the preferred default is `ask` before action rather than a silent hidden enablement or an architecture that can never graduate beyond `deny`.

## UX And Presentation

- The current web product should feel like a serious formal project, not a debug dashboard.
- The homepage should stay introduction-first and not collapse back into one long tools page.
- The chat experience should stay simpler and more companion-focused than the console.
- Permissions that matter during conversation should be reachable from the chat composer area, not only from a deeper management page.
- The user prefers a more emotional, higher-quality, less generic frontend feel over generic utility UI.
- The console should behave like a compact real control desk: no marketing-style intro cards at the top, no long explanatory blocks, and no avoidable full-page scrolling for routine controls.
- All console workspaces should share one consistent stage footprint and panel rhythm; single-panel views should visually occupy the same control-desk stage as dual-panel views instead of shrinking into a different layout species.
- When the user asks to make the console modules “longer,” interpret that as the lower operational workspace panels unless they explicitly say the top workspace-tab strip.
- The homepage background objects should ultimately come from transparent PNG doodle assets generated through `C:\Users\13571\Desktop\micu-image-20260608.html`, not from long-term CSS-only fake doodle shapes.
- Those doodle assets should be black-and-white, hand-drawn, memory-laden everyday objects with slightly denser distribution across the milk-white homepage background.
- The doodle mix should not stay limited to stationery basics; it should also include memory-carrier paper objects such as stamps, envelopes, tickets, postcards, and similar keepsakes.
- When refreshing those doodle assets through the local image tool or compatible API, prefer `gpt-image-2`, `1024x1024`, transparent background, one-image serial requests, and short low-complexity prompts because heavier requests have repeatedly timed out on the current network path with `524`.
- If multiple image keys are available, use them only to distribute throughput across separate requests; they do not materially reduce single-request timeout risk.

## Development Workflow Preferences

- Frequent commit and push is preferred.
- Continuity and resumability matter more than minimal process overhead.
- Important decisions should be written into repository files rather than left only in chat.
- The goal is not merely lower token usage; the goal is a workflow that keeps the project easier to continue correctly.
- When editing Chinese copy on this Windows / PowerShell setup, do not trust terminal rendering alone; verify with `git diff`, and prefer ASCII-safe insertion methods such as `\uXXXX` escapes for new literals when shell encoding looks unstable.
- When a work block changes Chinese-facing copy, run `npm run check:mojibake` before commit so obvious mojibake patterns are caught mechanically instead of only by eye.
