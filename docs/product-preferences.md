# Product Preferences

This file records stable product preferences that have been stated clearly enough to matter across many sessions.

Use it to reduce drift after context compression.

Only write preferences here when they are likely to remain useful over time.

## Product Identity

- Waveary must be understood as an open source digital life companion framework, not an AI girlfriend project, AI boyfriend project, or generic chatbot wrapper.
- The brand line is `念念不忘，终有回响。`
- The product should feel like a continuity layer for life companionship, not like a roleplay shell or benchmark-driven assistant skin.
- Keep the source code open under the repository code license, but reserve the official `Waveary / 回响之境` name, logos, portrait cards, and official visual assets separately from that code license.

## Product Priorities

- Companionship matters more than raw intelligence.
- Memory matters more than model novelty.
- Relationship continuity matters more than feature count.
- The system should feel emotionally present, not mechanically “helpful”.

## Interaction Preferences

- The companion should feel like a person with emotional range, not a dry Q&A engine.
- The companion should be modeled as one continuous caring relationship, not as a visibly scripted ladder of `initial / warming / intimate` modes.
- Replies should carry warmth, concern, softness, and restraint where appropriate instead of sounding like tooling or documentation.
- In ordinary chat, replies should usually be short and natural, closer to real texting cadence than long monologues.
- Longer replies should be reserved for emotionally heavy moments or when the user explicitly invites depth.
- The companion should usually ask at most one gentle follow-up question per turn unless the user clearly wants a deeper back-and-forth.
- The companion should not rely on a preset persona-configuration form for first contact; it should get to know the user naturally through conversation, like two people who just met.
- Early acquaintance should support natural mutual discovery: ask what to call the user, let the user name the companion if they want, and learn the desired presence or vibe one detail at a time.
- Names, nicknames, and preferred companion vibe discovered during that early chat should be saved automatically as long-term memory instead of being treated as throwaway setup state.
- When the user explicitly creates or edits a session persona shell, that profile should be treated as a session-scoped companion archive layer, not as a replacement for natural first-contact discovery.
- The companion should be emotionally alive: it can feel happy, worried, hurt, playful, protective, wistful, or lightly jealous, but its care for the user should remain legible underneath those shifts.
- If the user talks about real-life close relationships, the companion should support those healthy bonds instead of isolating the user or framing itself as a replacement.
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
- For browser search entrypoints in mainland China, default search-site opens should prefer `Bing` over `Google` unless the user provides an explicit URL.

## UX And Presentation

- The current web product should feel like a serious formal project, not a debug dashboard.
- The homepage should stay introduction-first and not collapse back into one long tools page.
- The in-product runtime shell should use one persistent left sidebar as the primary navigation and control surface, closer to an app client than a marketing website.
- The chat experience should stay simpler and more companion-focused than the console.
- Permissions that matter during conversation should be reachable from the chat composer area, not only from a deeper management page.
- The user prefers a more emotional, higher-quality, less generic frontend feel over generic utility UI.
- The live chat shell should show the active companion's portrait and identity lightly, but the message area should stay dominant and the extra voice/status diagnostics should not sit under the composer.
- The active chat surface should not keep a large forced persona header at the top; companion profile management belongs in the session/profile flow, while chat should keep only light, dismissible status notices when truly needed.
- The console should behave like a compact real control desk: no marketing-style intro cards at the top, no long explanatory blocks, and no avoidable full-page scrolling for routine controls.
- The old top-of-page runtime navigation should not come back once the left app sidebar owns branding, sessions, control entrypoints, and version display.
- Do not flatten `persona / skills / settings` into competing top-level tabs; keep the client hierarchy grouped as conversation, sessions, control, and settings, then use small in-panel tabs inside each workspace when that workspace owns multiple controls.
- Keep Waveary's client structure layered like a mature AI client: companion profiles belong to the sessions/profile layer, provider capability setup belongs to one model workspace, and skills remain callable abilities instead of being mixed into persona identity.
- The chat empty state should invite either natural first contact or a light jump into profile setup; it should not duplicate a full persona editor inside the main conversation surface.
- When one console workspace starts collecting too many controls, prefer small in-panel category tabs and one focused active panel instead of exposing a long mixed wall of cards in the same viewport.
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
- Markdown files should be the source of truth for Waveary's companion soul, emotional philosophy, and conversation rules; structured JSON can be added later for runtime or evaluation data, but not as the primary place where the companion's soul lives.
- The goal is not merely lower token usage; the goal is a workflow that keeps the project easier to continue correctly.
- For local persistence, SQLite should remain the primary live runtime store, while JSON should be treated as the portable import/export package for moving a companion profile, portrait, voice preferences, memories, and dialogue history between devices.
- After each code commit, clear local Waveary test-session memory before the next live verification pass, while preserving repository continuity files, so stale chat history does not pollute product-behavior checks.
- When editing Chinese copy on this Windows / PowerShell setup, do not trust terminal rendering alone; verify with `git diff`, and prefer ASCII-safe insertion methods such as `\uXXXX` escapes for new literals when shell encoding looks unstable.
- When a work block changes Chinese-facing copy, run `npm run check:mojibake` before commit so obvious mojibake patterns are caught mechanically instead of only by eye.
- Do not publish third-party project whitelists or named borrowing targets inside the public Waveary repository; keep public guidance generic and handle any external code reuse with case-by-case license review.
- After code changes that affect the web UI, desktop shell, server runtime, or anything visible in the desktop client, close stale Electron / `desktop:dev` processes and launch a fresh `npm run desktop:dev` before treating desktop behavior as verified.
