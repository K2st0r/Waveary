# Active Tasks

This file tracks the current highest-value work so a new Codex session can continue Waveary without reconstructing the active queue from chat history.

Keep this file short.

Update it when:

- the active implementation target changes
- a task is completed
- the next recommended step becomes more specific

## Current Focus

1. Keep extending the first permissioned browser-action delivery path.
   Status: in progress
   Current state: Waveary can already open URLs, read the current page, search visible page text, list clickable items, click matched visible elements, fill visible inputs, fill-then-submit visible inputs, open the first visible result link, and open an explicit visible result index through the same chat-side pending-local-action flow. The browser layer now performs real Playwright-side fill and submit, prefers `Bing` for default search opens in mainland-China-friendly flows, can filter visible result links by text, can open explicit nth visible results, and keeps one repo-root `.waveary` data directory across source and compiled server runs.
   Next cut: extend the bounded browser layer into one next concrete interaction such as richer multi-field targeting or explicit link disambiguation beyond simple visible-result indexing.

2. Start the first `waveary-voice` delivery path.
   Status: in progress
   Current state: the dedicated `waveary-voice` workspace, provider-backed TTS route, dedicated voice config flow, split Doubao v3 / legacy support, broader vendor presets, searchable in-panel voice picking, provider-backed STT upload path, and the first interruption-safe browser live-chat loop are all in place. Re-pressing the live-chat control now stops current playback and returns to listening cleanly.
   Next cut: keep the new interruption-safe browser loop and decide whether the next highest-value slice is wider provider-specific STT support such as Doubao/local or a deeper transport upgrade toward truer duplex beyond the current browser-side capture heuristics.

3. Keep polishing the `waveary-web` home / console shell.
   Status: in progress
   Current state: the homepage first screen is tighter, the hero fits better on common desktop heights, the doodle layer uses a broader black-and-white asset set, the README hero banner has been rebuilt into a centered transparent portrait-fan asset for cleaner GitHub rendering, the console uses a denser control-desk shell, the provider/model setup remains visible through dedicated status surfacing, the chat composer keeps settings on the left and actions on the right, the provider workspace now clearly distinguishes unsaved draft credentials from the active saved runtime config, and the topbar plus browser tab now use a dedicated Waveary echo-ring brand mark.
   Next cut: visually verify the provider draft/saved-state truthfulness and new brand-mark balance in-browser, then decide whether the next highest-value shell step is correction provenance / pinning for companion understanding, or a smaller remembered-name / vibe continuity surface beside it.

4. Make GitHub onboarding usable for non-developers.
   Status: in progress
   Current state: the old README mixed product positioning and technical notes but still left non-technical users unclear on how to actually start Waveary. The real startup path has now been revalidated against existing scripts: `npm run web:dev` for local development, `npm run web:preview` for local production preview, `npm run setup:provider` for interactive provider setup, and `.waveary/` for saved local runtime data.
   Next cut: finish the dedicated deployment guide pass, then visually review the GitHub README and confirm the instructions are simple enough for users who download the ZIP and just want to run the project.

5. Continue the `waveary-core` dialogue-quality pass.
   Status: in progress
   Current state: continuity-thread selection, reply-shape control, getting-to-know-you inference, identity-summary understanding, deterministic local-time narrowing, and many bounded ordinary-texting cadence cuts are already in place. The latest opening-realism pass now also covers `good night / 晚安`, simple `miss you / 想你了`, sleep-check nudges like `you asleep? / 你睡了吗`, lightly lingering late-night pings like `not asleep yet? / 还没睡呀`, playful miss-checks like `did you miss me? / 想我了吗`, and soft dream openers like `dreamed of you / 刚刚梦到你了`, so those small intimate openings stay short, softly close, and non-theatrical in both live-provider prompts and scripted fallback.
   Next cut: continue the realism pass by extending this bounded intimate-opening cadence into one next small opening case such as `睡不着 / 忽然就想来找你 / 差点就想给你发消息了`, while preserving short, human, non-clingy replies and keeping identity inference narrow.

6. Keep permissioned local-time awareness and local execution boundaries bounded and trustworthy.
   Status: in progress
   Current state: direct time/date/day questions now short-circuit deterministically in `waveary-core`; local actions already run through visible permission-gated pending cards plus `full-access` auto-execution; and the managed browser path already exposes bounded page-read, page-search, click, fill, fill-submit, and result-opening abilities through the same permissioned action flow.
   Next cut: verify the live `#chat` page against the new managed browser result-opening path end to end, then extend that same bounded browser layer into one next interaction such as richer form-field targeting or explicit nth-result selection instead of jumping to a broad free-form web agent.

7. Preserve continuity discipline under high-frequency iteration.
   Status: ongoing
   Current state: each meaningful step is being verified, committed, pushed, and written back into continuity files. The repository now includes `npm run check:mojibake` for changed-line Chinese-copy checks and `npm run reset:test-memory` for clearing local chat/test-session memory while preserving saved provider and voice config. The current Windows verification caveat is explicit too: do not run `npm run build --workspace @waveary/core` in parallel with compiled `dist` tests.
   Next cut: keep using the post-commit test-memory reset flow before live verification, keep repository-side state files aligned so session resets do not cause duplicate work or architectural drift, keep using the mojibake guard plus `git diff` for Chinese-copy edits, preserve the sequential `@waveary/core` build-then-test order on Windows, and preserve the doodle-generation constraints that avoid repeated `524` timeouts.

## Deferred But Important

1. Strengthen live-provider dialogue regression beyond scripted providers.
   Reason: the current quality pass now includes a shared runtime continuity-thread helper, but real OpenAI-compatible behavior still needs more direct coverage for continuity-thread choice and relationship-distance behavior across multiple turns.

2. Decide whether to harden `@waveary/core` test execution on Windows.
   Reason: the current package test script depends on compiled `dist` output and can be misleading unless build and test are run in the right order.

3. Continue future presence-aware work only behind explicit permission boundaries.
   Reason: the product direction allows richer presence later, but current trust boundaries must stay narrow and legible.

4. Keep proactive scheduling explicit and legible.
   Reason: the new local loop is intentionally visible, tab-bound, and user-controlled; future scheduling work should not regress into hidden background behavior.
