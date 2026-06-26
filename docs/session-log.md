
## 2026-06-24

Objective:

Study current mature companion products and turn that market learning into a reusable Waveary product benchmark instead of leaving it as throwaway chat context.

Summary:

- added `docs/market-benchmark-2026-06.md` as a focused benchmark note covering current mature companion-product patterns across Replika, Nomi, Kindroid, Character.AI, selected China products, and companion-relevant voice references
- distilled the repeated market lessons into concrete Waveary system priorities: layered memory, identity continuity, unified voice/text continuity, visible memory controls, and explicit safety posture
- recorded the corresponding product decision that Waveary should learn the market's systems without inheriting shallow `AI girlfriend` framing or visible relationship-ladder scripting
- updated continuity files so the next Waveary product-quality pass can pick a concrete benchmark-driven cut instead of redoing surface-level competitor research

Files changed:

- `docs/market-benchmark-2026-06.md`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- manual review of the new benchmark document against the current repo direction

Commit:

- `59ce742` - `Add companion market benchmark`

Push:

- succeeded: `git push origin main` pushed functional commit `59ce742` to `origin/main`

## 2026-06-24

Objective:

Lock the companion soul into repository markdown and tighten first-contact identity guidance so Waveary feels more like one emotionally real caring person and less like a staged product shell.

Summary:

- added `waveary-dataset/README.md` plus `waveary-dataset/vision/companion-soul.md`, `conversation-rules.md`, and `healthy-boundaries.md` as markdown-first source files for Waveary's emotional philosophy, conversation feel, and real-world relationship boundaries
- updated `waveary-core/src/adapters/openai-compatible-provider.ts` so live-provider prompt assembly now treats relationship stage as quiet internal calibration, reinforces one continuous caring bond, discourages flat branded self-introductions, and explicitly supports healthy real-world bonds
- updated `waveary-core/src/runtime/getting-to-know-you.ts` so early mutual-discovery guidance now leans harder away from setup-form behavior and brand-flat identity lines while preserving the existing bounded parser shape
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so the scripted fallback sounds warmer and more human when the user asks the companion's name or opens with a simple hello
- added and updated focused regressions in `waveary-core/src/runtime/getting-to-know-you.test.ts` and `waveary-core/src/adapters/openai-compatible-provider.test.ts`, then re-verified the full compiled `@waveary/core` test suite

Files changed:

- `waveary-dataset/README.md`
- `waveary-dataset/vision/companion-soul.md`
- `waveary-dataset/vision/conversation-rules.md`
- `waveary-dataset/vision/healthy-boundaries.md`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- `npm run check:mojibake`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `0451652` - `Add markdown companion soul spec`

Push:

- succeeded: `git push origin main` pushed functional commit `0451652` to `origin/main`

## 2026-06-24

Objective:

Tighten first-contact companionship quality by fixing the local-time misfire on emotional turns, warming new-stage greeting cadence, and making the chat composer behave more like a real messaging surface.

Summary:

- rebuilt `waveary-core/src/runtime/local-time-reply.ts` into an ASCII-safe version so deterministic local-time replies now trigger only on explicit clock/date/weekday questions or direct complaint-style time-awareness prompts, not on ordinary emotional lines that merely mention `today` or `tonight`
- added targeted regression in `waveary-core/src/runtime/local-time-reply.test.ts` plus runtime coverage in `waveary-core/src/runtime/waveary-runtime.test.ts` proving `我今天有些不开心` no longer collapses into a clock reply
- extended `waveary-core/src/runtime/getting-to-know-you.ts` with explicit greeting-turn detection and updated `waveary-core/src/adapters/scripted-chat-provider.ts` so first-contact turns now sound more like a warm human hello than a product-intro form
- added matching live-provider and parser regressions in `waveary-core/src/adapters/openai-compatible-provider.test.ts` and `waveary-core/src/runtime/getting-to-know-you.test.ts` so this early-acquaintance tone shift stays locked
- updated `waveary-web/src/App.tsx` and `waveary-web/src/styles.css` so the chat composer now sends on `Enter`, keeps multiline on `Shift+Enter`, and places settings on the left with live-chat/send actions on the right to match more natural conversation ergonomics

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/local-time-reply.test.ts`
- `waveary-core/src/runtime/local-time-reply.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run build --workspace @waveary/core`
- `npm run check:mojibake`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `f8c7bae` - `Polish first-contact chat cadence`

Push:

- succeeded: `git push origin main` pushed functional commit `f8c7bae` to `origin/main`

## 2026-06-24

Objective:

Support natural `I'm called ...` self-introductions so early-acquaintance parsing catches another real human name-sharing form without widening into fuzzy identity inference.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so preferred-name extraction now explicitly accepts `I'm called Aki.` style introductions
- added `called` to the preferred-name stopword guard so the older broad `I'm ...` fallback cannot misread `called` itself as a fake preferred name
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure `I'm called Aki.` becomes a preferred user name
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now surface `Confirmed preferred user name from shared history: Aki.` for this spoken introduction form too
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `93` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `e3a557a` - `Support I'm called introductions`

Push:

- succeeded: `git push origin main` pushed functional commit `e3a557a` to `origin/main`

## 2026-06-24

Objective:

Avoid `call me back ...` callback false positives so ordinary callback language does not get mistaken for preferred-name sharing.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so `back` is rejected instead of being treated as a preferred name after `call me ...`
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure `Call me back when you can.` does not become a fake name
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now continue to say `No confirmed preferred user name...` instead of surfacing a bogus shared-history name from this callback phrasing
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `91` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `b7e6cd6` - `Avoid call me back false positives`

Push:

- succeeded: `git push origin main` pushed functional commit `b7e6cd6` to `origin/main`

## 2026-06-24

Objective:

Avoid `call me once/after ...` sequencing false positives so ordinary step-order contact language does not get mistaken for preferred-name sharing.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so sequencing tokens like `once`, `after`, `before`, `whenever`, `soon`, and `again` are rejected instead of being treated as preferred names after `call me ...`
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure lines like `Call me once you get there.` and `Call me after work if you want.` do not become fake names
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now continue to say `No confirmed preferred user name...` instead of surfacing a bogus shared-history name from this sequencing phrasing
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `89` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `c687175` - `Avoid call me sequencing false positives`

Push:

- succeeded: `git push origin main` pushed functional commit `c687175` to `origin/main`

## 2026-06-24

Objective:

Avoid `call me later/tomorrow ...` scheduling false positives so ordinary contact-planning language does not get mistaken for preferred-name sharing.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so scheduling tokens like `later`, `tomorrow`, `tonight`, `anytime`, and `sometime` are rejected instead of being treated as preferred names after `call me ...`
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure lines like `Call me later tonight.` and `Call me tomorrow when you can.` do not become fake names
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now continue to say `No confirmed preferred user name...` instead of surfacing a bogus shared-history name from this scheduling phrasing
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `87` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `25581f1` - `Avoid call me scheduling false positives`

Push:

- succeeded: `git push origin main` pushed functional commit `25581f1` to `origin/main`

## 2026-06-24

Objective:

Avoid `call me if/when ...` false positives so ordinary care or scheduling follow-ups do not get mistaken for preferred-name sharing.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so captured follow-up tokens like `if` and `when` are rejected instead of being treated as preferred names after `call me ...`
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure lines like `Call me if you get worried later.` and `Call me when you are free.` do not become fake names
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now continue to say `No confirmed preferred user name...` instead of surfacing a bogus shared-history name from this follow-up phrasing
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `85` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `db29475` - `Avoid call me follow-up false positives`

Push:

- succeeded: `git push origin main` pushed functional commit `db29475` to `origin/main`

## 2026-06-24

Objective:

Support parenthesized name-sharing so early-acquaintance parsing still catches explicit introductions like `You can call me (Aki).` without broadening into fuzzy identity inference.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so preferred-name extraction now also accepts parenthesized variants of explicit self-introduction patterns such as `call me`, `my name is`, `my name's`, and direct `I'm / I am`
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure `You can call me (Aki) if you want.` becomes a preferred user name instead of being missed
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now surface `Confirmed preferred user name from shared history: Aki.` for this parenthesized form too
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `83` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `80038ae` - `Support parenthesized name sharing`

Push:

- succeeded: `git push origin main` pushed functional commit `80038ae` to `origin/main`

## 2026-06-24

Objective:

Support natural `my name's ...` self-introductions so early-acquaintance parsing catches a common spoken name-sharing form without widening into fuzzy identity inference.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so preferred-name extraction now also accepts `my name's ...` in both plain and quoted forms
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure `My name's Aki, by the way.` becomes a preferred user name instead of being missed
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now surface `Confirmed preferred user name from shared history: Aki.` for this spoken introduction form too
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `81` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `4142299` - `Support my name's introductions`

Push:

- succeeded: `git push origin main` pushed functional commit `4142299` to `origin/main`

## 2026-06-24

Objective:

Support quoted natural name-sharing so early-acquaintance parsing still catches real preferred names when users wrap them in quotes.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so the existing `my name is`, `call me`, and direct `I'm / I am` name-sharing patterns now tolerate optional surrounding single or double quotes
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure `You can call me "Aki".` becomes a preferred user name instead of being missed
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now surface `Confirmed preferred user name from shared history: Aki.` for quoted name-sharing too
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `79` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `9028fc6` - `Support quoted name sharing`

Push:

- succeeded: `git push origin main` pushed functional commit `9028fc6` to `origin/main`

## 2026-06-24

Objective:

Tighten early-acquaintance parsing so identity-style self-description does not get promoted into fake preferred-name memory.

Summary:

- updated `waveary-core/src/runtime/getting-to-know-you.ts` so preferred-name plausibility now also rejects identity-style self-description starters such as `the`, `a`, `an`, `someone`, `somebody`, and `person`
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure lines such as `I'm the kind of person who...` and `I'm someone who...` no longer become fake names while direct introductions like `I am Aki.` still work
- re-verified the full `@waveary/core` package through check, rebuild, and compiled tests; the package now passes `76` tests, and this pass stayed entirely inside the early-acquaintance dialogue-quality path without touching frontend, voice, or continuity-thread code

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `9f3dcaf` - `Tighten identity-style name inference`

Push:

- succeeded: `git push origin main` pushed functional commit `9f3dcaf` to `origin/main`

## 2026-06-24

Objective:

Extend dialogue continuity one more bounded step so weaker unsettled inferential follow-ups still stay anchored to the previous user topic instead of flattening into isolated practical-sounding statements.

Summary:

- updated `waveary-core/src/runtime/continuity-thread.ts` so continuity matching now also treats a bounded class of softer inferential-aftereffect turns such as `Probably why everything feels a bit unsettled tonight.` as continuation of the immediately previous user topic
- added focused core regression in `waveary-core/src/runtime/continuity-thread.test.ts` to lock both continuity-thread selection and history-aware focus summarization for this weaker unsettled drift case
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now preserve `Continuing ... Follow-up now ...` wording for this lighter inferential-aftereffect style too
- re-verified `@waveary/core` through check, rebuild, and compiled tests; the package now passes `75` tests, and this pass stayed entirely inside the dialogue-quality path without touching frontend or voice code

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `5be0a46` - `Handle weaker unsettled continuity carry-over`

Push:

- succeeded: `git push origin main` pushed functional commit `5be0a46` to `origin/main`

## 2026-06-24

Objective:

Tighten the public web shell's layout containment so chat, homepage hero, and console cards stop producing obvious overflow or clipped-composition problems before further feature work.

Summary:

- updated `waveary-web/src/styles.css` only, keeping runtime logic untouched while fixing the three specific UX complaints from the live site
- constrained the dedicated `#chat` journal canvas so long assistant replies and long metadata labels now wrap inside the bubble/card instead of forcing horizontal scrolling to read the tail of a sentence
- enlarged the homepage hero memory stage, drifting portrait frames, and active burn card so the burn-photo vignette reads as a complete first-screen composition rather than a cramped side module
- strengthened console-panel containment by letting headers, badges, status strips, saved-config snippets, and metadata rows shrink and wrap inside their panels, while keeping the existing inner-scroll control-desk model intact
- browser-verified the result live on `http://127.0.0.1:4173/` across `#home`, `#chat`, and `#console`

Files changed:

- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish open http://127.0.0.1:4173/#home --headed`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish open http://127.0.0.1:4173/#chat`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish open http://127.0.0.1:4173/#console`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-layout-polish snapshot`

Commit:

- `3cfa1ae` - `Polish home chat and console layout containment`

Push:

- succeeded: `git push origin main` pushed functional commit `3cfa1ae` to `origin/main`

## 2026-06-24

Objective:

Strengthen dialogue continuity again so low-affect pronoun follow-ups still stay anchored to the previous user topic instead of flattening into isolated present-tense statements.

Summary:

- updated `waveary-core/src/runtime/continuity-thread.ts` so continuity matching now also treats a bounded class of short, referential, low-affect follow-ups such as `It just feels strange now.` as carry-over from the immediately previous user topic
- added focused core regression in `waveary-core/src/runtime/continuity-thread.test.ts` to lock both continuity-thread selection and history-aware focus summarization for that low-affect pronoun case
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now preserve `Continuing ... Follow-up now ...` wording for this lighter continuation style too
- re-verified `@waveary/core` through check, rebuild, and compiled tests; the package now passes `66` tests, and this pass stayed entirely inside the dialogue-quality path without touching frontend or voice code

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`
- focused confirmation on the new test surfaces via:
  `node --test 'waveary-core\\dist\\runtime\\continuity-thread.test.js'`
  `node --test 'waveary-core\\dist\\adapters\\openai-compatible-provider.test.js'`

Commit:

- `244f105` - `Handle low-affect pronoun continuity carry-over`

Push:

- succeeded: `git push origin main` pushed functional commit `244f105` to `origin/main`

## 2026-06-24

Objective:

Strengthen dialogue continuity again so short inferential follow-ups still stay anchored to the previous user topic instead of flattening into isolated practical-sounding statements.

Summary:

- updated `waveary-core/src/runtime/continuity-thread.ts` so continuity matching now also treats a bounded class of short inferential carry-over turns such as `Maybe that's why I can't settle tonight.` as continuation of the immediately previous user topic
- added focused core regression in `waveary-core/src/runtime/continuity-thread.test.ts` to lock both continuity-thread selection and history-aware focus summarization for that inferential follow-up case
- added matching prompt-level regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` so live provider instructions now preserve `Continuing ... Follow-up now ...` wording for this subtler continuation style too
- re-verified `@waveary/core` through check, rebuild, and compiled tests; the package now passes `69` tests, and this pass stayed entirely inside the dialogue-quality path without touching frontend or voice code

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `b506bfa` - `Handle inferential continuity carry-over`

Push:

- succeeded: `git push origin main` pushed functional commit `b506bfa` to `origin/main`

## 2026-06-24

Objective:

Stop the new getting-to-know-you layer from misreading emotional self-description as a confirmed preferred user name, which was degrading provider prompt realism with fake names like `still` and `not`.

Summary:

- tightened `waveary-core/src/runtime/getting-to-know-you.ts` so the broad `I am X` name pattern now passes through a narrow plausibility filter instead of automatically accepting every captured word as a name
- added focused parser regression in `waveary-core/src/runtime/getting-to-know-you.test.ts` to ensure emotional follow-up lines such as `I am still scared about that`, `I am not over it yet`, `I am really tired tonight`, `I am so anxious lately`, and `我还没过去，还是那个感觉。` no longer become preferred names, while direct introductions like `I am Aki.` still work
- added provider-prompt regression in `waveary-core/src/adapters/openai-compatible-provider.test.ts` to ensure the live instruction body falls back to `No confirmed preferred user name...` instead of emitting fake shared-history names from ordinary emotional turns
- re-verified the `@waveary/core` package through typecheck, rebuild, and compiled tests; no frontend, voice, or broader continuity logic changed in this pass

Files changed:

- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `ddf4711` - `Tighten getting-to-know-you name inference`

Push:

- succeeded: `git push origin main` pushed functional commit `ddf4711` to `origin/main`

## 2026-06-24

Objective:

Make the companion feel more like a real caring person by tightening reply cadence and enriching the default persona contract, without broad refactors or frontend churn.

Summary:

- extended `PersonaProfile` with optional long-lived companionship fields such as `speakingStyle`, `emotionalStyle`, `humorStyle`, `conversationLengthPreference`, `followUpStyle`, and `boundaries`
- added `waveary-core/src/runtime/reply-shape.ts` plus tests as a small shared layer that classifies the current turn into bounded reply modes like `practical`, `ordinary`, `playful`, `reconnection`, and `emotional`
- updated `waveary-core/src/adapters/openai-compatible-provider.ts` so live-provider prompts now carry explicit cadence and follow-up constraints, keeping ordinary chat short and natural while allowing slightly longer replies only when the emotional moment truly calls for it
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so the fallback path consumes the same reply-shape guidance and stops defaulting to one mechanical three-part response shape for every turn
- enriched the default companion persona seeded by `waveary-web/server/chat-session-store.ts` so new sessions start from a more clearly defined human-like speaking style without forcing a broad new frontend settings flow yet
- verified the real source path through `check -> build -> compiled tests`, and confirmed again that the current `@waveary/core` npm test script is still unreliable on Windows because it passes compiled test-file arguments incorrectly unless run through a manual file expansion step

Files changed:

- `waveary-core/src/domain/session.ts`
- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/index.ts`
- `waveary-web/server/chat-session-store.ts`
- `docs/product-preferences.md`
- `docs/decision-log.md`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- manual compiled-test run via PowerShell-expanded file list:
  `$files = Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }; & node --test @files`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`

Commit:

- `413497a` - `Improve companion reply cadence and persona defaults`

Push:

- pending continuity sync, because the first push completed before the new commit existed locally

## 2026-06-24

Objective:

Prefer Bing over Google for default natural-language search-site opens in the managed local browser flow, while keeping explicit URLs untouched.

Summary:

- changed `waveary-web/server/local-actions.ts` so direct natural-language open requests now recognize both `bing` and `google`, but route both defaults to `https://www.bing.com/` with label `Bing`
- added focused route-level regression coverage in `waveary-web/server/provider-api.test.ts` for both `open google` -> `Bing` and direct `open bing`
- recorded the mainland-China search-default preference in `docs/product-preferences.md`, `docs/decision-log.md`, `PROJECT_STATE.md`, and `ACTIVE_TASKS.md` so later sessions do not drift back to Google-by-default behavior

Files changed:

- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/product-preferences.md`
- `docs/decision-log.md`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `git diff -- waveary-web/server/local-actions.ts waveary-web/server/provider-api.test.ts docs/product-preferences.md docs/decision-log.md PROJECT_STATE.md ACTIVE_TASKS.md`

Commit:

- `0ab9e9b` - `Prefer Bing for default search-site opens`

Push:

- succeeded: `git push origin main` pushed functional commit `0ab9e9b` to `origin/main`

## 2026-06-24

Objective:

Extend the permissioned managed-browser path with one next bounded interaction by letting Waveary open the first visible result link, or the closest visible result whose text matches a requested phrase.

Summary:

- extended `waveary-web/server/browser-automation.ts` so the existing `openManagedBrowserFirstVisibleLink(...)` primitive can now filter visible links by link text as well as href before navigating
- added a new `browser_open_first_result` local action in `waveary-web/server/local-actions.ts`, so natural requests such as `open result for Waveary` can flow through the same `allow / ask / deny` permission path as the earlier browser read, click, fill, and fill-submit actions
- refreshed `waveary-web/server/local-action-audit.ts` into an ASCII-safe version while preserving the existing audit-note behavior and adding the new result-opening action without re-touching unrelated browser or voice surfaces
- added route-level regression coverage in `waveary-web/server/provider-api.test.ts` for both pending-action detection and approved execution of the new result-opening path
- verified the new primitive with a direct compiled-module managed-browser pass against a synthetic result page: opening a page with a `Waveary official site` link and calling `openManagedBrowserFirstVisibleLink({ textIncludes: 'Waveary' })` navigates to the linked target page and reports the new page title correctly

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- direct compiled-module verification via `node --input-type=module -`, confirming:
  - `openManagedBrowserPage(sourceUrl)` opens a synthetic search-result page
  - `openManagedBrowserFirstVisibleLink({ textIncludes: 'Waveary', timeoutMs: 4000 })` navigates to the linked target page
  - `getManagedBrowserPageInfo()` returns the target page title `Waveary Result`

Commit:

- `c86b765` - `Add bounded browser result opening`

Push:

- succeeded: `git push origin main` pushed functional commit `c86b765` to `origin/main`

## 2026-06-24

Objective:

Make the managed browser fill-submit path actually trigger real navigation and remove the `.waveary` path split between source and compiled server runs.

Summary:

- replaced the DOM-only synthetic fill-submit path in `waveary-web/server/browser-automation.ts` with a real Playwright-side locator flow that matches the target field, fills it through Playwright, and submits through Enter or form submit against the live page
- added a search-intent fallback for search-box-like inputs so generic targets such as `search` can resolve to fields like Google's visible `textarea[name=q][role=combobox]` instead of failing to match
- unified browser automation state resolution in `waveary-web/server/data-dir.ts` so the default `.waveary` directory comes from the repo root during both source and compiled server runs, preventing managed browser profile state from splitting across two trees
- live-verified the repaired path with the compiled server module: `openManagedBrowserPage('https://www.google.com/')` followed by `fillAndSubmitManagedBrowserInputByText('search', 'Waveary')` now leaves the Google homepage and navigates to Google's anti-automation `sorry` page, which confirms that submit/navigation is real even though the current network path is challenged

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/data-dir.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --input-type=module -` importing `waveary-web/dist-server/server/data-dir.js`, confirming `getWavearyDataDir()` now resolves to repo-root `.waveary`
- `node --input-type=module -` importing `waveary-web/dist-server/server/browser-automation.js`, confirming:
  - `openManagedBrowserPage('https://www.google.com/')` opens Google
  - `fillAndSubmitManagedBrowserInputByText('search', 'Waveary')` changes the page away from the homepage
  - `getManagedBrowserPageInfo()` returns the navigated URL
  - `extractManagedBrowserPageText()` returns Google's `sorry` anti-automation page text, proving the submit reached a real search navigation boundary

Commit:

- `fafd231` - `Fix managed browser fill submit verification`

Push:

- succeeded: `git push origin main` pushed functional commit `fafd231` to `origin/main`

## 2026-06-24

Objective:

Extend the new permissioned browser fill path into one next bounded step by letting Waveary fill a visible page input and explicitly submit it through the same local-action approval flow.

Summary:

- added a new managed-browser primitive that reuses the existing visible-input matching logic and then performs a bounded Enter / form-submit step, instead of stopping at raw field fill
- exposed that capability through a new `/api/browser/fill-submit` route and a new `browser_fill_submit_text` pending local action kind, so chat requests like `fill search with Waveary and submit` can now be proposed and executed under the same `allow / ask / deny` permission model
- kept the change narrow and additive inside the existing browser-action architecture, added route-level and chat/local-action regression coverage for the new fill-submit path, and left the wider voice and console surfaces untouched

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `git diff -- waveary-web/server/browser-automation.ts waveary-web/server/local-actions.ts waveary-web/server/local-action-audit.ts waveary-web/server/provider-api.ts waveary-web/server/provider-api.test.ts waveary-web/src/App.tsx`

Commit:

- `0726087` - `Add bounded browser fill submit actions`

Push:

- pending

## 2026-06-24

Objective:

Extend the permissioned managed-browser path with one next bounded interaction step by letting Waveary fill visible page inputs through the same local-action approval flow.

Summary:

- added a new browser automation primitive that can match visible inputs and textareas by label-like text and fill them with real input/change events instead of relying only on click or read actions
- exposed that capability through a new `/api/browser/fill-text` route and a new `browser_fill_text` pending local action kind, so chat requests like `fill search with Waveary` can now be proposed and executed under the same `allow / ask / deny` permission model
- kept the change bounded to the existing browser-action architecture instead of introducing a broad free-form web agent, and added route-level plus chat/local-action regression coverage for the new fill path

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `git diff -- waveary-web/server/browser-automation.ts waveary-web/server/local-actions.ts waveary-web/server/provider-api.ts waveary-web/server/local-action-audit.ts waveary-web/server/provider-api.test.ts waveary-web/src/App.tsx`

Commit:

- `5ea0ca0` - `Add bounded browser input fill actions`

Push:

- succeeded: `git push origin main` pushed functional commit `5ea0ca0` to `origin/main`

## 2026-06-24

Objective:

Refresh the public GitHub README again so the repository front page feels more like a compelling formal open-source project homepage instead of a plain summary sheet.

Summary:

- rewrote the root `README.md` into a stronger bilingual project-homepage layout with a centered hero block, clearer positioning, stronger thesis sections, and a more persuasive narrative around continuity, memory, relationship, and companionship
- expanded the README structure so GitHub visitors can quickly understand what Waveary is, why it exists, what engines it includes, what capabilities already exist, and how the CE / Cloud / Enterprise direction is framed
- kept the change repository-surface-only and did not touch runtime, frontend, provider, or voice logic

Files changed:

- `README.md`

Verification:

- `npm run check:mojibake`
- `git diff -- README.md`

Commit:

- `0edf8b7` - `Refresh public README homepage`

Push:

- succeeded: `git push origin main` pushed functional commit `0edf8b7` to `origin/main`

## 2026-06-24

Objective:

Finalize the public GitHub repository surface after the rename by setting the formal public metadata, default branch, and discovery topics to match Waveary's current positioning.

Summary:

- changed the GitHub repository from the older private `K2st0r/-Waveary-` surface to the public `K2st0r/Waveary` surface and confirmed the renamed remote now resolves correctly
- rewrote the root `README.md` into a cleaner bilingual open-source homepage version centered on `Waveary / 回响之境`, `Digital Life Companion Framework`, and `念念不忘，终有回响`
- finalized the GitHub repository metadata through the GitHub API so the public surface now uses the formal description, `main` as the default branch, the README anchor as homepage, and Waveary-aligned discovery topics such as `digital-companion`, `llm-framework`, `long-term-memory`, `relationship-engine`, and `voice-agent`

Files changed:

- `README.md`
- `PROJECT_STATE.md`

Verification:

- `gh repo view K2st0r/Waveary --json name,nameWithOwner,visibility,url,description,homepageUrl,defaultBranchRef,repositoryTopics`
- `gh api -X PATCH repos/K2st0r/Waveary -f default_branch=main -f description=\"Open source digital life companion framework for memory, relationship, timeline, emotion, and voice.\" -f homepage=\"https://github.com/K2st0r/Waveary#readme\"`
- `gh api -X PUT repos/K2st0r/Waveary/topics -H \"Accept: application/vnd.github+json\" ...`
- `git remote -v`
- `npm run check:mojibake`

Commit:

- `46fa0e6` - `Refresh public project README`
- `1fb0b0f` - `Record public repository surface`

Push:

- succeeded: `46fa0e6` was already present on `origin/main`, and `git push origin main` on `2026-06-24` pushed delayed continuity commit `1fb0b0f` to `origin/main`

## 2026-06-24

Objective:

Make the live chat voice loop interruption-safe so pressing the live-chat control during assistant playback stops the current reply and returns to listening immediately instead of ending the whole realtime session.

Summary:

- kept the change narrow inside `waveary-web/src/App.tsx` and left the already-working provider/model console plus dedicated voice routing untouched
- added a dedicated live-conversation interruption path that stops active browser or provider playback, keeps realtime mode on, and immediately re-enters microphone listening when the user presses the live-chat button during assistant planning or speaking
- added request-id guarding around voice playback callbacks so stale browser-speech or provider-audio events cannot race back in and overwrite the newer listening state after an interruption
- tightened the automatic resume delays after reply completion and retry-listening so the browser loop feels less sluggish between turns
- browser-verified the new path on `http://127.0.0.1:4173/#chat` with a controlled stubbed voice flow: while the assistant was in `Using browser fallback speech in a warm tone.`, pressing the main live-chat button changed the status to `Okay. I will stop here and listen to you first.` while the mic status returned to `I am listening. Take your time and I will answer as soon as you finish.` and the button stayed on `End live chat`
- confirmed the current `npm run test --workspace @waveary/web` baseline still contains one pre-existing server-side failure unrelated to this frontend voice interruption cut: `chat turn clears unanswered proactive reachouts after the user replies`

Files changed:

- `waveary-web/src/App.tsx`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web` (current baseline still has the pre-existing failing test `chat turn clears unanswered proactive reachouts after the user replies`)
- `npm run check:mojibake`
- `curl.exe -I http://127.0.0.1:4173/`
- local Playwright-backed browser verification on `http://127.0.0.1:4173/#chat`, confirming live playback can be interrupted into immediate listening without leaving realtime mode

Commit:

- `09ff921` - `Handle live voice interruption resume`

Push:

- succeeded: `git push origin main` pushed functional commit `09ff921` and continuity commit `0888182` to `origin/main`

## 2026-06-24

Objective:

Close the remaining live-browser verification gap for the split Doubao voice path and confirm that the chat page still uses dedicated provider audio when the chat model stays on a different vendor.

Summary:

- restarted the local `web:dev` server and re-established the live browser verification baseline on `http://127.0.0.1:4173/`
- browser-verified the voice workspace in the live console: switching from `doubao` to `doubao-legacy` cleanly flips the visible credential surface from the v3 `Resource ID` route to the legacy `App ID` route while preserving the in-panel searchable picker behavior for the v3 branch
- confirmed from the running local `/api/voice/config` route that the active dedicated voice profile on this machine is currently `doubao-legacy` with `multi_female_shuangkuaisisi_moon_bigtts`, and that routing still reports `provider-audio` readiness
- browser-verified the live chat page with the text model still on `deepseek-v4-pro` while dedicated voice remains on `doubao-legacy`; real request capture showed `/api/chat/turn` returning the reply plus structured `delivery`, followed by `/api/voice/speak` receiving that reply, the same `delivery`, and the saved dedicated voice config, then returning `provider = doubao-legacy`, `mode = audio`, and `routing.target = provider-audio`

Files changed:

- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `git status --short -b`
- `curl.exe -I http://127.0.0.1:4173/`
- `Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/voice/config' -Method Get | ConvertTo-Json -Depth 10`
- `Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/provider/config' -Method Get | ConvertTo-Json -Depth 10`
- local Playwright DOM verification on `http://127.0.0.1:4173/#console`, confirming the live console switches from `doubao` `Resource ID` to `doubao-legacy` `App ID`
- local Playwright request/response capture on `http://127.0.0.1:4173/#chat`, confirming `deepseek-v4-pro` chat generation plus follow-up dedicated `doubao-legacy` `/api/voice/speak` provider audio routing

Commit:

- `a2d207e` - `Record live dedicated voice verification`

Push:

- succeeded: `git push origin main` pushed verification commit `a2d207e` to `origin/main`

## 2026-06-24

Objective:

Polish the dedicated `#chat` page so the conversation surface feels cleaner and stays anchored on the latest exchange without touching backend runtime behavior.

Summary:

- updated `waveary-web/src/App.tsx` so the chat page now derives one compact set of permission and voice-routing labels, renders a dedicated three-card status strip above the journal canvas, removes the duplicated live-chat button from the compact voice summary, and auto-scrolls the active conversation to the latest turn
- updated `waveary-web/src/styles.css` so the focused chat panel uses a more stable vertical layout, the composer reads more like a bottom control band, the compact voice summary has its own contained treatment, and the new status strip collapses cleanly on smaller screens
- live-browser verified the running `http://127.0.0.1:4173/#chat` page: the dedicated chat surface now shows only one realtime entry button, the top status strip renders session / voice / permission state correctly, and sending one real message keeps the view anchored at the bottom of the message log

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-polish open http://127.0.0.1:4173/#chat --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-polish resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-polish snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-polish fill e155 "测试一下自动滚动。"`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-polish click e159`
- `Start-Sleep -Seconds 4; npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-polish snapshot`

Commit:

- `d11cb39` - `Polish chat page status and flow`

Push:

- succeeded: `git push origin main` pushed functional commit `d11cb39` to `origin/main`

## 2026-06-23

Objective:

Refine the visible Doubao voice-picker layout so the loaded curated speakers are clearly visible inside the console panel instead of feeling hidden or pushing the card sideways.

Summary:

- kept the change narrow and frontend-only in `waveary-web/src/App.tsx` and `waveary-web/src/styles.css`, without touching the already-working dedicated Doubao routing or voice catalog truth
- changed the searchable Doubao picker from a compact inline trigger plus floating popover into a full-width in-panel vertical control, so the voice area now expands downward within the current control card
- removed the width pressure that previously made the voice card feel cramped and visually suggested that the dropdown was empty even when the curated speakers had already loaded
- browser-verified the live console on `http://127.0.0.1:4173/#console`: after switching to the voice workspace, selecting the `doubao` preset, and opening the picker, the page no longer overflowed horizontally and the visible in-panel list contained 13 curated speaker options

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `curl.exe -I http://127.0.0.1:4173/`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`
- local Playwright DOM verification on `http://127.0.0.1:4173/#console`, confirming `bodyScrollWidth === bodyClientWidth`, in-panel searchable picker rendering, and 13 visible curated Doubao speakers after selecting the `doubao` preset

Commit:

- `b1c4014` - `Refine in-panel Doubao voice picker layout`

Push:

- succeeded: `git push origin main` pushed functional commit `b1c4014` to `origin/main`

## 2026-06-23

Objective:

Make the dedicated Doubao voice console behave the way the user expects: as soon as Doubao is selected, show all supported curated speakers in a searchable picker instead of the old generic fallback list plus awkward dropdown/datalist mix.

Summary:

- replaced the old select-mode voice control in `waveary-web/src/App.tsx` with a searchable picker UI that shows the current voice label plus ID, opens an inline search popover, and lets users filter and choose supported voices directly
- kept the change frontend-only and narrow: no backend route contract changed, and manual-input vendors still stay on the existing text-entry path
- fixed the remaining Doubao-specific UX gap by auto-loading the curated Doubao voice catalog into frontend state when the `Doubao TTS` preset becomes active, so the picker no longer falls back to the older shared generic voice list before the user presses any extra button
- browser-verified the result with a local Playwright DOM pass on `http://127.0.0.1:4173/#console`: after switching to the voice workspace and selecting `doubao`, the picker existed immediately, the search input was present, and the rendered Doubao option list contained 13 curated supported voices; searching `zh_` narrowed the visible list while keeping current Doubao speaker IDs

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`
- `curl.exe -I http://127.0.0.1:4173/`
- local Node + Playwright DOM verification on `http://127.0.0.1:4173/#console`, confirming immediate Doubao searchable picker presence and 13 curated speaker options after selecting the `doubao` preset

Commit:

- `22bb6c7` - `Add searchable Doubao voice picker`

Push:

- succeeded: `git push origin main` pushed functional commit `22bb6c7` to `origin/main`

## 2026-06-23

Objective:

Close the split Doubao verification loop by proving that both the current v3 route and the legacy app route still return real provider audio on the running local server, then write the remaining browser-verification gap back into continuity records instead of reopening backend work.

Summary:

- confirmed from the live local `/api/voice/config` route that the persisted dedicated voice profile is currently set to `doubao-legacy` with `multi_female_shuangkuaisisi_moon_bigtts`, `App ID`, and `Access Token`, and that the routing diagnostic reports `provider-audio` readiness
- re-ran the live local `/api/voice/speak` route against that saved legacy profile with UTF-8-safe escaped Chinese text and confirmed non-zero provider audio bytes with `provider = doubao-legacy`
- separately re-ran the live local `/api/voice/speak` route with an explicit v3 `doubao` override using `resourceId = seed-tts-2.0` plus `zh_female_gaolengyujie_uranus_bigtts`, and confirmed non-zero provider audio bytes with `provider = doubao`
- browser-verified the real console voice workspace again and confirmed that the legacy preset is visibly selected, the visible credential block shows `App ID`, and the status card reports `doubao-legacy` as ready; the only remaining split-Doubao browser gap is an explicit preset-switch pass that visibly flips the console between the v3 `Resource ID` route and the legacy `App ID` route

Files changed:

- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/voice/config' -Method Get | ConvertTo-Json -Depth 8`
- `Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/voice/speak' -Method Post -ContentType 'application/json'` with UTF-8-safe escaped Chinese text against the saved `doubao-legacy` route
- `Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/voice/speak' -Method Post -ContentType 'application/json'` with an explicit dedicated `doubao` v3 override using `seed-tts-2.0` and `zh_female_gaolengyujie_uranus_bigtts`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-voice-verify open http://127.0.0.1:4173/#console --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-voice-verify snapshot`

Commit:

- `0232156` - `Record Doubao voice verification`

Push:

- succeeded: `git push origin main` pushed continuity commit `0232156` to `origin/main`

## 2026-06-23

Objective:

Tighten the visible chat/voice control surfaces and make dedicated Doubao TTS easier to use by exposing multiple curated speakers instead of only one default voice.

Summary:

- changed the dedicated Doubao voice catalog from manual-input-only into a curated built-in speaker selector while keeping the true OpenSpeech v3 `resourceId + speaker` route unchanged
- added route coverage proving the Doubao voice catalog now returns selectable speakers and still keeps local bridges on manual input
- tightened the chat composer action band so live chat, send, compact voice summary, and the permission tray fit more cleanly without the earlier oversized control strip
- kept the implementation scoped to voice-config/catalog truth plus visible chat/layout polish, without touching the already-working provider-backed TTS runtime path

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`
- `git diff -- waveary-web/src/App.tsx waveary-web/src/styles.css waveary-web/server/voice-config.ts waveary-web/server/provider-api.test.ts`

Commit:

- `bad9d85` - `Refine Doubao voice selection and chat controls`

Push:

- pending

## 2026-06-23

Objective:

Separate Doubao TTS from Doubao live speaker discovery so the console can optionally fetch the real `ListSpeakers` catalog without regressing the already-working OpenSpeech v3 playback path.

Summary:

- confirmed from public implementations that Doubao live speaker discovery is not part of the current OpenSpeech `x-api-key` TTS route and instead uses signed Volcengine OpenAPI `Action=ListSpeakers&Version=2025-05-20` under service `speech_saas_prod`
- kept the working dedicated Doubao TTS path unchanged while extending `waveary-web` voice config with optional `accessKeyId` and `secretAccessKey` fields reserved for live catalog fetch only
- updated `/api/voice/catalog` so Doubao now falls back to the existing curated local speaker list by default, but can return provider-fetched voices when those separate Volcengine keys are supplied
- updated the voice console so Doubao can store those optional access keys in the same provider workspace and send them only to the catalog route instead of confusing them with the TTS API key
- added route coverage proving that Doubao still returns the static fallback list without access keys and that the live catalog branch returns provider-sourced voices when a signed `ListSpeakers` response succeeds

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`

Commit:

- `9445ca6` - `Add live Doubao speaker catalog fetch`

Push:

- succeeded: `git push origin main` pushed functional commit `9445ca6` to `origin/main`
# Session Log

## 2026-06-23

Objective:

Finish the dedicated Doubao voice route end to end by aligning the current resource ID and default speaker with the latest docs, then parse the real chunked success stream so live local playback stops falling back.

Summary:

- queried the official Volcengine doc JSON endpoints directly instead of trusting the JS-rendered page, which confirmed that current Doubao / Ark voice synthesis 2.0 uses `X-Api-Resource-Id: seed-tts-2.0`
- found that the earlier `45002001 / No readable text!` conclusion was partly polluted by Windows / PowerShell direct-shell Chinese text encoding during ad hoc probes; upstream success returned once the request body used UTF-8-safe text
- narrowed the remaining live local bug to Waveary's Doubao adapter response parsing: the upstream HTTP unidirectional route was already succeeding, but it returned multiple newline-delimited JSON events with repeated audio `data` chunks instead of one JSON object
- updated the dedicated Doubao defaults and auto-normalization to prefer `seed-tts-2.0` plus `zh_female_gaolengyujie_uranus_bigtts`, and taught the adapter to concatenate chunked success-stream audio while tolerating the final `20000000 OK` completion event
- restarted the local `web:dev` server and verified that live local `POST /api/voice/speak` now returns `provider = doubao`, `mode = audio`, `routingTarget = provider-audio`, and real MPEG audio without browser fallback

Files changed:

- `waveary-voice/src/doubao-tts-provider.ts`
- `waveary-voice/src/doubao-tts-provider.test.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/voice`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- direct Node `fetch` probe against `https://openspeech.bytedance.com/api/v3/tts/unidirectional` with `X-Api-Resource-Id: seed-tts-2.0`, confirming upstream `code: 0` and audio data on UTF-8-safe Chinese input
- `Invoke-RestMethod http://127.0.0.1:4173/api/voice/config`, confirming the running local server now reports dedicated Doubao `resourceId = seed-tts-2.0` and `voice = zh_female_gaolengyujie_uranus_bigtts`
- live local `POST http://127.0.0.1:4173/api/voice/speak`, confirming `provider = doubao`, `mode = audio`, `routingTarget = provider-audio`, and no fallback reason

Commit:

- `a632b89` - `Fix Doubao chunked TTS playback`

Push:

- succeeded: `git push origin main` pushed functional commit `a632b89` to `origin/main`

## 2026-06-23

Objective:

Browser-verify the migrated dedicated Doubao voice route, then harden any remaining legacy local-config drift that still prevents the browser console from reflecting the real v3 path.

Summary:

- used the live `http://127.0.0.1:4173/#console` voice workspace to verify that the current Doubao UI now renders `Resource ID`, the v3 base URL, and the newer manual speaker default instead of the obsolete `App ID / Cluster` fields
- found a real local-environment regression during that pass: the saved `.waveary/voice-config.json` still carried legacy Doubao values (`/api/v1` base URL, `appId` copied from the API key, and `BV001_streaming`), which made the running browser console look partially stale even though the repository code had already moved to v3
- added config auto-normalization so known legacy Doubao leftovers are corrected on load and save before the browser reuses them
- confirmed after restarting the local dev server that `/api/voice/config` now reports the corrected dedicated Doubao state (`https://openspeech.bytedance.com`, `resourceId = volc.service_type.10029`, `voice = zh_male_beijingxiaoye_emo_v2_mars_bigtts`)
- re-ran `/api/voice/speak` through the live local server and confirmed the browser path now reaches the real upstream Doubao error directly: provider-backed audio is attempted, then falls back with `Doubao TTS returned code 45002001. No readable text!`

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- live browser snapshot pass on `http://127.0.0.1:4173/#console`
- `Invoke-RestMethod http://127.0.0.1:4173/api/voice/config`
- direct local `fetch` to `http://127.0.0.1:4173/api/voice/speak`

Commit:

- `2255aaf` - `Remove public third-party benchmark note`

Push:

- succeeded: `git push origin main` pushed functional commit `2255aaf` to `origin/main`

## 2026-06-26

Objective:

Tighten the first realism-focused dialogue pass so Waveary sounds less like a polished assistant and more like a real person in ordinary and emotional chat.

Summary:

- rebuilt `waveary-core/src/runtime/reply-shape.ts` into an ASCII-safe version and tightened the shared shape rules: softer support-seeking lines now classify as emotional earlier, low-intensity ordinary turns now usually avoid a trailing question, and the guidance now explicitly pushes against essay-like cadence
- updated `waveary-core/src/adapters/openai-compatible-provider.ts` so live-provider instructions push harder toward short human messaging rhythm and away from support-agent or coach-like phrasing
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so the fallback path keeps new-stage naming warmth and growing-stage continuity while still shortening ordinary everyday replies
- added and adjusted regression coverage in `waveary-core/src/runtime/reply-shape.test.ts`, `waveary-core/src/adapters/openai-compatible-provider.test.ts`, and `waveary-core/src/runtime/waveary-runtime.test.ts`
- re-verified `@waveary/core` through typecheck, build, and compiled test execution; the suite now passes `110` tests after the reply-realism tightening pass

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `24cdeec` - `Tighten dialogue realism cadence`

Push:

- succeeded: `git push origin main` pushed functional commit `24cdeec` to `origin/main`

## 2026-06-23

Objective:

Migrate the dedicated Doubao voice path from the obsolete `appId / cluster` contract to OpenSpeech v3 `resourceId` routing without regressing the rest of the Waveary voice console.

Summary:

- replaced the old Doubao adapter transport with `POST https://openspeech.bytedance.com/api/v3/tts/unidirectional`, now using `x-api-key`, `X-Api-Resource-Id`, `X-Api-Request-Id`, `user.uid`, and the v3 `req_params` payload shape
- updated `waveary-web` saved voice config, routing diagnostics, and runtime wiring so dedicated Doubao voice now uses `resourceId` instead of the earlier `App ID / Cluster` concept while still reading legacy local `appId` values for compatibility
- updated the voice console and chat-side voice settings so Doubao now asks for `Resource ID`, defaults its manual voice field to `zh_male_beijingxiaoye_emo_v2_mars_bigtts`, and no longer shows the obsolete `Cluster` input
- rewrote the Doubao route tests around the v3 request shape and re-verified that both `@waveary/voice` and `@waveary/web` pass after the migration
- live-probed the provided real key directly against the new upstream route: the old route-level mismatch is gone, but the upstream service still returns `code 45002001` / `No readable text!` even after adding `user.uid`, so the remaining blocker is now upstream request semantics or account-side expectations rather than the old Waveary route

Files changed:

- `waveary-voice/src/doubao-tts-provider.ts`
- `waveary-voice/src/doubao-tts-provider.test.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-routing-diagnostics.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/voice`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- direct Node `fetch` probe against `https://openspeech.bytedance.com/api/v3/tts/unidirectional` using the provided key, `X-Api-Resource-Id: volc.service_type.10029`, and `speaker: zh_male_beijingxiaoye_emo_v2_mars_bigtts`

Commit:

- `15af25b` - `Migrate Doubao voice to OpenSpeech v3`

Push:

- pending

## 2026-06-23

Objective:

Make Gemini TTS usable through Micu relay without regressing the existing dedicated Gemini voice flow.

Summary:

- live-tested the provided Micu key directly against the Gemini-style `v1beta/models/{model}:generateContent` audio route instead of guessing at compatibility
- confirmed that Micu currently returns `503 model_not_found` for `gemini-3.1-flash-tts-preview`, while `gemini-2.5-flash-tts-preview` and `gemini-2.5-pro-tts-preview` are recognized by the relay but the provided token currently lacks access and therefore returns `403`
- added a dedicated `Gemini TTS (Micu Relay)` preset in the Waveary voice console so Micu users no longer default onto the unsupported `3.1` alias
- changed static Gemini voice-catalog resolution to branch by preset ID, so the Micu relay preset now uses Micu-recognized `2.5` TTS model names while the official Gemini preset keeps the existing official-family list
- kept the code change intentionally narrow to voice preset selection and catalog routing, without touching the wider chat, STT, or console-shell behavior

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- direct Node `fetch` probes against `https://www.micuapi.ai/v1beta/models/{model}:generateContent` using both `x-goog-api-key` and `Authorization: Bearer` header styles
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`

Commit:

- `a16a365` - `Add Micu Gemini voice relay preset`

Push:

- pending

## 2026-06-23

Objective:

Make the Micu Gemini voice console tell the truth more clearly when upstream model naming or key permissions block real audio.

Summary:

- kept the change frontend-only inside `waveary-web/src/App.tsx` so the already-verified Micu routing path stayed untouched
- added Micu-specific English guidance in the voice workspace so the `Gemini TTS (Micu Relay)` preset now explicitly warns that Micu recognizes `gemini-2.5-flash-tts-preview` and `gemini-2.5-pro-tts-preview`, not the official `*-preview-tts` aliases
- added a small fallback-reason formatter so Gemini voice failures now surface more truthful explanations when the upstream route returns `model_not_found` or `This token has no access to model`, instead of only echoing the raw provider string everywhere
- preserved the wider console and voice runtime behavior; this cut only makes the control desk and fallback copy more legible after the real Micu tests

Files changed:

- `waveary-web/src/App.tsx`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `git diff -- waveary-web/src/App.tsx`

Commit:

- pending

Push:

- pending

## 2026-06-23

Objective:

Add Fish Audio as a dedicated voice-provider family for TTS and STT without disturbing the current chat-provider architecture.

Summary:

- added `FishAudioTextToSpeechProvider` and `FishAudioSpeechToTextProvider` inside `@waveary/voice`, using Fish's own `POST /v1/tts` and `POST /v1/asr` routes instead of pretending the vendor fits the OpenAI-compatible speech contract
- extended `waveary-web` voice routing, diagnostics, and provider API so dedicated voice mode can now recognize `fish-audio`, synthesize speech through Fish, transcribe microphone uploads through Fish, and fetch reusable Fish voice-model IDs from `/model`
- kept the frontend scope intentionally small: the existing voice console and chat provider-STT gate now accept `fish-audio` as a real provider-backed voice family without reworking the broader console shell
- verified the new Fish path with direct package tests plus web route tests, while also re-checking that the existing web voice routes still build and pass after the new provider family landed

Files changed:

- `waveary-voice/src/index.ts`
- `waveary-voice/src/fish-audio-tts-provider.ts`
- `waveary-voice/src/fish-audio-tts-provider.test.ts`
- `waveary-voice/src/fish-audio-stt-provider.ts`
- `waveary-voice/src/fish-audio-stt-provider.test.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-routing-diagnostics.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`

Commit:

- `94d2694` - `Add Fish Audio dedicated voice support`

Push:

- succeeded: `git push origin main` pushed functional commit `94d2694` to `origin/main`

## 2026-06-23

Objective:

Add Gemini as another dedicated voice-provider family, keeping the current voice console flow and routing boundaries intact.

Summary:

- added `GeminiTextToSpeechProvider` inside `@waveary/voice`, using Gemini's dedicated `models/{model}:generateContent` audio route plus Google's prebuilt voice names instead of pretending Gemini fits the OpenAI-compatible speech endpoint shape
- extended the voice console preset and routing layers so `Gemini TTS` now appears beside the other dedicated providers, with static supported-model selection, prebuilt voice selection, and dedicated readiness diagnostics
- kept the scope intentionally honest and bounded: Gemini is now available for dedicated TTS output, but provider-backed microphone transcription still does not route through Gemini in this cut
- added regression coverage proving that Gemini appears in the voice-provider preset list, exposes the expected model and voice catalog, and can synthesize provider-backed audio through the dedicated route contract

Files changed:

- `waveary-voice/src/gemini-tts-provider.ts`
- `waveary-voice/src/gemini-tts-provider.test.ts`
- `waveary-voice/src/index.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-routing-diagnostics.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/voice`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`

Commit:

- `8aa7056` - `Add Gemini dedicated voice provider`

Push:

- succeeded: `git push origin main` pushed functional commit `8aa7056` to `origin/main`

## 2026-06-23

Objective:

Run a real Fish Audio live verification pass with the provided key, then make upstream-connectivity failures visible enough to diagnose from the Waveary voice routes.

Summary:

- restarted the local `web:dev` server first, because the running `127.0.0.1:4173` process was initially serving an older build that did not yet expose the `fish-audio` voice preset
- verified that the current repository code does expose the Fish preset and dedicated Fish routes once the local dev server is restarted on the latest workspace state
- attempted live Fish catalog access through both direct machine-level requests and the local `/api/voice/catalog` route using the provided key, and confirmed the current machine cannot reach `https://api.fish.audio:443` before any HTTP response arrives
- confirmed the failure is network reachability rather than an obvious Waveary route bug by reproducing the same upstream timeout through direct Node `fetch` and `curl.exe` calls outside the local web server
- improved Fish catalog, TTS, and STT error handling so upstream failures now surface concrete diagnostics such as `UND_ERR_CONNECT_TIMEOUT` and attempted endpoint addresses instead of collapsing into a generic `fetch failed`

Files changed:

- `waveary-voice/src/fish-audio-tts-provider.ts`
- `waveary-voice/src/fish-audio-stt-provider.ts`
- `waveary-voice/src/fish-audio-tts-provider.test.ts`
- `waveary-voice/src/fish-audio-stt-provider.test.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/voice`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `Invoke-RestMethod http://127.0.0.1:4173/api/voice/presets`
- direct Node `fetch` against `https://api.fish.audio/model?self=false&page_size=1&page_number=1`, confirming `UND_ERR_CONNECT_TIMEOUT`
- `curl.exe -i -H "Authorization: Bearer …" "https://api.fish.audio/model?self=false&page_size=5&page_number=1"`, confirming no upstream HTTP response was reachable from this machine
- `curl.exe -i -X POST http://127.0.0.1:4173/api/voice/catalog --data-binary @<temp-json-file>`, confirming the local route now returns explicit Fish timeout diagnostics

Commit:

- `794ddad` - `Surface Fish Audio network diagnostics`

Push:

- succeeded: `git push origin main` pushed functional commit `794ddad` to `origin/main`

## 2026-06-23

Objective:

Replace the fixed short provider-STT recording window with a more truthful silence-based stop path without widening the current voice scope.

Summary:

- updated `waveary-web/src/App.tsx` so provider-backed microphone capture no longer always stops on one fixed 6-second timer
- added a browser-side speech-activity monitor using `AudioContext` + `AnalyserNode`, so Waveary now waits until the user has actually spoken and then stops after a short post-speech silence window
- kept the implementation bounded and honest by preserving a max-duration safety cap; this is a truer turn-end detector than the earlier timer-only path, but still not full duplex, interruption handling, or server-side VAD
- preserved the existing fallback boundaries: compatible provider STT still falls back to browser `SpeechRecognition` when needed, and the rest of the chat/voice console path stayed unchanged

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`

Commit:

- `d430380` - `Add silence-based provider STT stop detection`

Push:

- succeeded: `git push origin main` pushed functional commit `d430380` to `origin/main`

## 2026-06-23

Objective:

Add the first provider-backed STT path without breaking the current voice console or browser realtime-chat loop.

Summary:

- extended `@waveary/voice` with `OpenAICompatibleSpeechToTextProvider`, reusing the existing voice package boundary instead of hiding speech upload logic inside `waveary-web`
- extended saved voice config with `sttModel` and added a new `/api/voice/transcribe` route in `waveary-web/server/provider-api.ts`, reusing the current shared/dedicated voice routing state instead of creating a second speech-provider settings system
- kept the implementation honest about scope: compatible shared/dedicated voice routes can now transcribe uploaded microphone audio, while Doubao/local STT still return a clear “not implemented yet” error rather than pretending support exists
- updated `waveary-web/src/App.tsx` so live voice input now prefers provider-backed microphone capture plus upload/transcription on compatible routes and falls back to browser `SpeechRecognition` when provider STT is unavailable or the browser cannot capture audio that way
- kept the new browser-side provider STT loop intentionally bounded with a short capture window so the product moves forward without falsely claiming true interruption handling or full duplex already exists

Files changed:

- `waveary-voice/src/types.ts`
- `waveary-voice/src/index.ts`
- `waveary-voice/src/openai-compatible-stt-provider.ts`
- `waveary-voice/src/openai-compatible-stt-provider.test.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`

Commit:

- `cee0224` - `Add provider-backed speech transcription path`

Push:

- succeeded: `git push origin main` pushed functional commit `cee0224` to `origin/main`

## 2026-06-23

Objective:

Finish the live browser verification pass for the voice console routing card and fix the shared-mode UI regression discovered during that pass.

Summary:

- browser-verified the live voice workspace across the four targeted route families: shared chat-provider voice, dedicated OpenAI-compatible voice, dedicated Doubao voice, and dedicated local bridge voice
- confirmed via live `/api/voice/config` route responses that the routing evaluator already reported the correct readiness states for all four families, including shared-ready, Doubao-missing-app-id, compatible-missing-api-key, and local-missing-base-url
- found one real frontend regression during that pass: the right-side voice status card kept using the last dedicated-provider preset metadata even when the route was in shared mode, so the UI could claim `doubao` while the actual active route was the shared chat provider
- fixed `waveary-web/src/App.tsx` so the status card now reads provider type, provider label, guidance copy, and vendor-specific fill hints from the real routing state whenever voice is in shared mode
- re-verified in the live browser that shared mode now shows `shared-chat-provider` plus shared guidance, while dedicated Doubao still shows its real missing `App ID` state; restored the saved local voice config back to shared mode after the verification pass

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`
- `git diff -- waveary-web/src/App.tsx`
- live Playwright verification on `http://127.0.0.1:4173/#console`
- `Invoke-RestMethod -Method Post http://127.0.0.1:4173/api/voice/config` for shared, dedicated Doubao, dedicated OpenAI-compatible, and dedicated local routes

Commit:

- `98d01c7` - `Align shared voice routing status`

Push:

- succeeded later as part of the subsequent `git push origin main` that advanced `origin/main` to `6a857cb`

## 2026-06-23

Objective:

Make the voice console and voice route tell the truth about provider-backed playback readiness instead of silently falling back to browser speech.

Summary:

- added `waveary-web/server/voice-routing-diagnostics.ts` as a shared server-side routing evaluator that determines whether the current voice setup is actually ready for provider-backed audio, which required fields are still missing, and which provider family the route belongs to
- updated `/api/voice/config` and `/api/voice/speak` so both now return explicit routing diagnostics; `/api/voice/speak` also records whether provider audio was attempted and, when it falls back, the last fallback reason
- updated `waveary-web/src/App.tsx` so the voice console shows a concrete routing card with current target, readiness, missing fields, and last fallback reason, while live playback status now distinguishes browser-fallback speech from real provider audio instead of using ambiguous wording
- verified live against the running dev server that the current saved Doubao setup with empty `appId` now reports `dedicated-doubao-missing-app-id` both in `/api/voice/config` and `/api/voice/speak`, which matches the real reason that playback currently falls back to browser speech
- observed one separate verification caveat: `npx tsc --noEmit -p waveary-web/tsconfig.server.json` still reports older workspace-resolution issues unrelated to this voice-routing change, while the package build and `@waveary/web` test flow both pass

Files changed:

- `waveary-web/server/voice-routing-diagnostics.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `Invoke-RestMethod http://127.0.0.1:4173/api/voice/config`
- `Invoke-RestMethod -Method Post http://127.0.0.1:4173/api/voice/speak`

Commit:

- `442f9ec` - `Surface voice routing diagnostics`

Push:

- succeeded: `git push origin main` pushed functional commit `442f9ec` to `origin/main`

## 2026-06-23

Objective:

Add a repository-side mojibake guard so future Chinese-copy edits can be verified mechanically instead of relying only on Windows / PowerShell terminal rendering.

Summary:

- added `tools/check-mojibake.mjs` as a changed-files guard that inspects added lines in the current git diff for common mojibake patterns and fails fast when suspicious corruption appears
- exposed that guard through the root script `npm run check:mojibake` so future Waveary work blocks have one stable verification entrypoint
- updated repository workflow and continuity records plus the local `waveary-continuity-guard` skill so Chinese-facing copy edits now explicitly require `git diff` verification and the new mojibake check before commit
- kept the guard intentionally narrow: it protects future edits without trying to rewrite the repository's older historical mojibake as part of an unrelated feature pass

Files changed:

- `tools/check-mojibake.mjs`
- `package.json`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/workflow-rules.md`
- `docs/product-preferences.md`
- `docs/decision-log.md`
- `docs/session-log.md`
- `C:\\Users\\13571\\.codex\\skills\\waveary-continuity-guard\\SKILL.md`

Verification:

- `npm run check:mojibake`
- `git diff -- package.json docs\\workflow-rules.md docs\\product-preferences.md docs\\decision-log.md tools\\check-mojibake.mjs`
- `git status --short -b`

Commit:

- `18d8dec` - `Add repo-side mojibake guard`

Push:

- succeeded: `git push origin main` pushed functional commit `18d8dec` to `origin/main`

## 2026-06-23

Objective:

Browser-verify the voice workspace across provider types and fix any real preset-switch regression discovered during the pass.

Summary:

- ran a live browser pass on `http://127.0.0.1:4173/#console` against the dedicated voice workspace and confirmed shared mode still collapses the credential block into the expected shared-mode explanation
- found a real regression during that pass: switching from `Doubao TTS` to a manual-entry compatible provider left stale Doubao `model` and `voice` values in place, which could mislead users into saving an invalid cross-vendor route
- repaired the frontend preset-switch handler so dedicated voice provider presets now explicitly reset `model` and `voice` to the new preset defaults or empty strings instead of silently retaining the previous vendor's values
- repaired the server-side voice-config normalization so explicit empty `model` and `voice` values stay empty when the browser intentionally clears them, rather than being rehydrated from the quality-profile default voice preset
- added a regression test covering that explicit-empty preservation path and re-verified the live browser after restarting the local dev server; the compatible manual-entry path now shows an empty voice field and `-` in the status card instead of leaking `BV001_streaming` or `marin`
- restored the live browser configuration back to the Doubao dedicated path after verification so the user's current local voice setup is not left in the temporary compatible-vendor test state

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- live Playwright verification on `http://127.0.0.1:4173/#console` for shared mode, manual-entry compatible vendor mode, and restored Doubao mode
- `Invoke-RestMethod -Method Post http://127.0.0.1:4173/api/voice/config` with explicit empty `model` and `voice`, confirming the route now preserves empty values

Commit:

- `8483d9a` - `Stabilize voice provider preset switching`

Push:

- succeeded: `git push origin main` pushed functional commit `8483d9a` to `origin/main`

## 2026-06-23

Objective:

Repair the visible mojibake in the dedicated voice credential block without changing the voice-provider flow.

Summary:

- repaired the corrupted Chinese `Voice Key` label and both related dedicated-voice API-key placeholders in `waveary-web/src/App.tsx`
- used `\uXXXX` string literals for the repaired Chinese copy so the fix does not depend on unreliable Windows / PowerShell inline encoding behavior
- kept the change intentionally narrow to visible credential copy and left the surrounding dedicated voice-provider logic unchanged

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `git diff -- waveary-web/src/App.tsx`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`

Commit:

- `ebba2bd` - `Repair voice credential copy mojibake`

Push:

- succeeded: `git push origin main` first pushed functional commit `ebba2bd`, then pushed continuity follow-up `078f961`; final push-state record commit `0aa2c0e` is the remaining local sync step for this same work block

## 2026-06-23

Objective:

Investigate the new Chinese mojibake issue, preserve the finding in the continuity skill, and avoid repeating the same encoding mistake in later sessions.

Summary:

- confirmed that the immediate trigger was Windows / PowerShell encoding ambiguity during Chinese-copy editing, where raw terminal rendering was not reliable enough to prove whether text was correct
- confirmed separately that the repository already contains older historical mojibake in multiple files, so Chinese-copy cleanup must be treated as its own explicit pass instead of being mixed casually into unrelated feature work
- updated the local `waveary-continuity-guard` skill with hard rules for Chinese-text edits: do not trust raw PowerShell rendering, verify with `git diff`, prefer ASCII-safe insertion paths such as `\\uXXXX` when encoding looks unstable, and restore immediately if a shell write causes broad mojibake
- recorded the same workflow constraint in repository continuity files so later Waveary sessions will avoid repeating the mistake even before the skill is loaded

Files changed:

- `C:\\Users\\13571\\.codex\\skills\\waveary-continuity-guard\\SKILL.md`
- `PROJECT_STATE.md`
- `docs/product-preferences.md`
- `docs/session-log.md`

Verification:

- repository search confirming historical mojibake exists outside the newest voice-console edit too
- `git show HEAD:waveary-web/src/App.tsx` and `git diff` comparison showing that raw PowerShell rendering is not a trustworthy source of truth for Chinese-copy validation on this machine
- `git status --short -b`

Commit:

- `27df9f4` - `Record Chinese copy encoding guardrails`

Push:

- succeeded: `git push origin main` pushed continuity commit `27df9f4` to `origin/main`

## 2026-06-23

Objective:

Fix the dedicated voice console so the provider credential area visibly includes a `Voice Key` input instead of making the field disappear on some provider branches.

Summary:

- updated `waveary-web/src/App.tsx` so the dedicated voice-provider form now places `Voice Key` in a fixed credential slot near `Provider` and `Base URL` instead of leaving it buried in a later conditional branch
- kept the local-bridge path aligned with the same console layout by showing that `Voice Key` slot there as optional auth input, instead of removing it completely and making the credential area look incomplete
- browser-verified on the live local console that switching `控制台 -> 语音设置 -> 来源 = 独立真人语音` now reveals the `Voice Key` input in the provider setup block for the current Doubao preset

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- Playwright browser verification on `http://127.0.0.1:4173/#console` confirming `语音设置 -> 来源 = 独立真人语音` renders `Voice Key` inside the dedicated provider setup block

Commit:

- `1548477` - `Expose voice key field in console`

Push:

- succeeded: `git push origin main` pushed functional commit `1548477` and continuity follow-up `e2d72e2` to `origin/main`

## 2026-06-23

Objective:

Undo the mistaken top-tab height increase and instead make the lower console workspace panels taller, which is what the user actually meant by the settings modules below.

Summary:

- restored the top `.console-workspace-tab` cards in `waveary-web/src/styles.css` to their earlier compact height and padding
- increased the lower `.console-workspace-panel` stage height and matching inner scroll window so provider and other console workspaces have more vertical operating room without bloating the top navigation strip
- browser-verified on the live local console that the top tabs are back to roughly `82px` height while the provider workspace panels now render at roughly `984px` height

Files changed:

- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- browser DOM measurement on `http://127.0.0.1:4173/#console` confirming `.console-workspace-tab ≈ 82px` and provider `.console-workspace-panel ≈ 984px`

Commit:

- `b09f139` - `Increase console workspace panel height`

Push:

- succeeded: `git push origin main` pushed functional commit `b09f139` to `origin/main`

## 2026-06-23

Objective:

Make the top console workspace modules taller so the control-desk navigation feels less cramped without changing any underlying console logic or reopening long-page scrolling.

Summary:

- adjusted `waveary-web/src/styles.css` so the top workspace tabs now use a taller minimum height, slightly looser vertical gap, and slightly deeper padding
- kept the change intentionally local to the workspace-tab card shell rather than changing panel heights, page routing, or workspace content structure
- verified that the tabs now render at roughly `91px` height on the live local console while the top control region still fits cleanly before the main workspace stage

Files changed:

- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- browser DOM measurement on `http://127.0.0.1:4173/#console` confirming all five `.console-workspace-tab` cards render at `91px` height

Commit:

- `e2021ae` - `Lengthen console workspace tabs`

Push:

- succeeded: `git push origin main` pushed functional commit `e2021ae` to `origin/main`

## 2026-06-23

Objective:

Unify the Waveary console workspaces so provider, voice, sessions, care, and runtime all share the same stage footprint, panel rhythm, and inner-scroll behavior instead of switching between mismatched page layouts.

Summary:

- updated `waveary-web/src/App.tsx` so the provider, voice, sessions, care, and runtime workspaces all mount through one shared console-stage shell with common panel wrappers
- converted the sessions workspace from its older structurally different full-page feel into the same control-desk stage system, while keeping the existing session, persistence, import/export, and permission logic intact
- added shared console workspace CSS in `waveary-web/src/styles.css` for matched panel heights, single-panel full-width behavior, and internal scrolling so long content no longer forces awkward outer-page workspace changes on desktop
- browser-verified on the live local console that all five workspace tabs now render with aligned stage heights, and that the single-panel care workspace spans the full console width instead of collapsing into a narrower left column

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- Playwright browser verification on `http://127.0.0.1:4173/#console` for provider / voice / sessions / care / runtime workspace switching, matched panel heights, and full-width single-panel care layout

Commit:

- `c408d67` - `Unify console workspace shell`

Push:

- succeeded: `git push origin main` pushed functional commit `c408d67` to `origin/main`

## 2026-06-22

Objective:

Extend the new voice layer from browser-only speech planning into a real provider-backed TTS path without breaking the current chat-page voice experience.

Summary:

- expanded `waveary-voice/src/openai-compatible-tts-provider.ts` as the first concrete provider-backed TTS adapter, targeting OpenAI-compatible `/audio/speech` and returning base64 audio plus simple playback metadata
- updated `waveary-web/server/voice-runtime.ts` so `/api/voice/speak` first tries provider-backed TTS by reusing the saved provider config, then falls back automatically to the older `BrowserSpeechPlanner` path if the current provider does not support compatible TTS or the request fails
- updated `waveary-web/src/App.tsx` so the chat voice strip now plays real audio when the route returns it, while preserving browser `speechSynthesis` as the fallback path and keeping `auto speak`, manual `speak reply`, and `stop` behavior intact
- added route and package-level regression coverage for the new real-audio branch and re-verified that the broader `@waveary/web` route surface still passes

Files changed:

- `waveary-voice/README.md`
- `waveary-voice/src/types.ts`
- `waveary-voice/src/browser-speech-planner.ts`
- `waveary-voice/src/browser-speech-planner.test.ts`
- `waveary-voice/src/openai-compatible-tts-provider.ts`
- `waveary-voice/src/openai-compatible-tts-provider.test.ts`
- `waveary-voice/src/index.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run build --workspace @waveary/voice`
- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `22288c3` - `Add explicit voice presets and TTS config`

Push:

- succeeded: `git push origin main` pushed functional commit `22288c3` to `origin/main`

## 2026-06-22

Objective:

Make `full-access` on the chat page actually feel different from `high-permission` by auto-running local actions immediately instead of still waiting on the same approval card.

Summary:

- updated `waveary-web/src/App.tsx` so detected pending local actions now auto-execute as soon as the active conversation permission is `allow`, which is what the `full-access` preset maps to
- kept the existing trust boundary intact for lower-trust modes: `deny` still blocks, while `ask` still leaves the approval card visible and requires one explicit confirmation click
- hid the local-action confirmation card entirely when the active permission is already `allow`, so the chat page no longer shows a redundant confirmation step under `full-access`
- verified the change with frontend typecheck, full web production build, and a real browser pass confirming that switching the chat shell to `完全访问` and sending `打开Bilibili` no longer leaves the confirmation card on screen

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- Playwright browser check on `http://127.0.0.1:4173/#chat` confirming no confirmation card remains after `完全访问` + `打开Bilibili`

Commit:

- `bf44d5e` - `Auto-run local actions in full-access mode`

Push:

- succeeded: `git push origin main` pushed functional commit `bf44d5e` and continuity follow-up `ed4ae3b` to `origin/main`

## 2026-06-22

Objective:

Move the most important trust control in the chat shell closer to the send action by exposing a direct `limited / high-permission` mode switch beside the composer.

Summary:

- added a chat-side permission preset concept in `waveary-web/src/App.tsx` that maps the existing `WavearyPermissionProfile` onto two direct modes: a default limited profile and a high-permission profile
- kept the underlying permission model intact instead of rewriting runtime or server-side trust handling, so existing time-awareness, proactive-notification, desktop-presence, and local-action boundaries continue to work as before
- updated the chat composer toolbar so the new two-button mode switch sits beside the send flow, while the older fine-grained permission panel remains available as a secondary detail popover instead of disappearing entirely
- added matching toolbar and segmented-control styling in `waveary-web/src/styles.css` so the new control reads like a direct conversation-side mode switch rather than another buried settings block
- verified the change with frontend typecheck and full production web build

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- superseded by `e61ef3c` - `Add full-access chat permission preset`

Push:

- superseded by the later push record for `e61ef3c`

## 2026-06-22

Objective:

Extend the chat-side permission presets from two modes to three by adding an explicit `full-access` mode without weakening the existing ask-first trust boundary.

Summary:

- repaired `waveary-web/src/App.tsx` from the accidental malformed local edit by restoring the clean `HEAD` version first, then replaying only the intended permission-preset change on top
- expanded the chat-side preset type and toolbar from `limited / high-permission` to `limited / high-permission / full-access`
- kept the underlying `WavearyPermissionProfile` model unchanged and only remapped the presets more clearly: `limited` keeps `desktopPresence` and `localActions` at `ask`, `high-permission` allows desktop presence but still asks before local actions, and `full-access` allows both
- updated preset detection and status-copy feedback so the active segmented button stays aligned with the actual underlying permission profile
- verified the repaired file and the new preset mapping with frontend typecheck and full production web build

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `e61ef3c` - `Add full-access chat permission preset`

Push:

- succeeded: `git push origin main` pushed functional commit `e61ef3c` and continuity follow-up `d2c2be9` to `origin/main`

## 2026-06-22

Objective:

Keep permissioned local actions trustworthy by persisting executed and dismissed outcomes as a small conversation-visible trace instead of leaving them only in transient UI state.

Summary:

- added `recordLocalActionResolution(...)` in `waveary-web/server/chat-session-store.ts` so local-action resolution can append a flat-metadata assistant audit note into persisted session history while clearing `pendingLocalAction`
- updated `waveary-web/server/local-action-runtime.ts` to record executed and dismissed outcomes with localized companion-facing notes and reset the cached runtime session immediately after each resolution
- added `resetChatRuntimeSession(sessionId)` in `waveary-web/server/chat-runtime.ts` so persisted chat history and the in-memory runtime cache cannot drift after local-action approval or dismissal
- widened the first safe local-action detection set in `waveary-web/server/local-actions.ts` while keeping the boundary explicit and ask-first
- updated `/api/chat/local-action/execute` and `/api/chat/local-action/dismiss` plus the browser request payloads to forward locale, and repaired route tests so they verify the persisted chat-visible audit note and current local-time route behavior correctly
- verified the change with fresh server build, compiled route tests, frontend typecheck, and full production web build

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/local-action-runtime.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `be1b9ed` - `Record local action outcomes in chat history`

Push:

- succeeded: `git push origin main` pushed `be1b9ed` and continuity follow-up `fb2ae35` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Make permissioned local-time awareness trustworthy for real providers by guaranteeing direct time/date/day answers in `waveary-core` instead of relying only on prompt compliance.

Summary:

- added a shared deterministic local-time reply helper in `waveary-core/src/runtime/local-time-reply.ts` for direct time/date/day question detection plus localized reply formatting
- updated `WavearyRuntime.handleTurn()` to short-circuit these direct local-time questions before provider generation whenever permissioned `localTime` context is available
- updated `ScriptedChatProvider` to reuse the same helper so scripted and real-provider reply paths no longer drift on time-answer behavior
- added dedicated runtime and helper regression coverage proving that a direct Chinese time question now returns the local-clock answer even if the underlying provider would have replied with a generic "I do not know the time" disclaimer
- verified the change with `@waveary/core` typecheck, fresh build, and full compiled-test execution

Files changed:

- `waveary-core/src/runtime/local-time-reply.ts`
- `waveary-core/src/runtime/local-time-reply.test.ts`
- `waveary-core/src/runtime/waveary-runtime.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/index.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- `npm run test --workspace @waveary/core`

Commit:

- `ae0b112` - `Short-circuit local time replies in runtime`

Push:

- succeeded: `git push origin main` pushed `ae0b112` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Turn chat-side `localActions` from a preference-only permission into the first real ask-first local execution boundary, without allowing any silent high-trust action path.

Summary:

- added a first local-action detection and execution layer in `waveary-web/server/local-actions.ts` and `waveary-web/server/local-action-runtime.ts`
- kept the first supported action set intentionally narrow and auditable: simple open-url, open-folder, and launch-app requests only, detected by lightweight rule matching rather than model-side tool execution
- extended chat turn payloads and persisted `latestInsights` so a pending local action can survive session persistence and re-render as a compact approval card in the chat page
- added new `/api/chat/local-action/execute` and `/api/chat/local-action/dismiss` routes, with explicit permission handling: `deny` blocks execution, `ask` requires approval, and executed or dismissed actions clear the pending state
- added a compact approval surface above the chat composer in `waveary-web/src/App.tsx` and `waveary-web/src/styles.css`, preserving the journal-style chat focus while keeping local trust decisions visible near the message flow
- verified the new execution boundary with `@waveary/web` route tests, frontend typecheck, and full web production build

Files changed:

- `waveary-web/server/local-actions.ts`
- `waveary-web/server/local-action-runtime.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `41b6fb5` - `Add ask-first local action chat flow`

Push:

- succeeded: `git push origin main` pushed `41b6fb5` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Move the most important permission controls closer to the live conversation surface so users can adjust companionship-relevant trust settings without leaving the chat page.

Summary:

- added a compact chat-side permission tray beside the conversation composer in `waveary-web/src/App.tsx`
- reused the existing permission model and `handlePermissionLevelChange()` flow instead of creating a second permission state path, so the chat tray and console permission center stay synchronized
- exposed the highest-conversation-relevance permissions there first: time awareness, proactive notifications, desktop presence, and local actions
- added dedicated chat-tray styling in `waveary-web/src/styles.css`, including a floating desktop popover and a stacked mobile layout
- verified the UI change with TypeScript and full web production build

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `6897423` - `Add chat-side permission tray`

Push:

- succeeded: `git push origin main` pushed `6897423` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Shift the default proactive-care posture toward a more companion-like baseline so Waveary does not wait for users to manually enable ordinary care behavior before it can feel present.

Summary:

- changed the core default proactive-care policy so new sessions now start with `enabled: true` instead of inheriting an inert disabled baseline
- changed the web defaults so browser-local proactive auto-checking and proactive notification intent both start enabled unless the user has already stored a local preference
- widened the default local permission profile from `ask/ask/allow/ask/deny` to `allow/allow/allow/ask/ask`, keeping higher-trust capabilities revocable while removing extra setup friction from ordinary time-aware companionship
- updated route-level tests so persisted snapshot and export assertions now match the new autonomous-care default instead of expecting the old disabled baseline
- re-verified the change with root typecheck/build, `@waveary/core` tests, `@waveary/web` tests, and a full web production build

Files changed:

- `waveary-core/src/domain/proactive-care.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test --workspace @waveary/core`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `1d981d7` - `Default proactive care toward autonomous companionship`

Push:

- succeeded: `git push origin main` pushed `1d981d7` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Expand the homepage doodle inventory with more correspondence and keepsake objects so the background feels richer without changing homepage structure or runtime logic.

Summary:

- generated four new transparent black-and-white doodle assets under `waveary-web/public/images/doodles/`: stamp, envelope, train ticket, and postcard
- kept the same working image-generation strategy as the previous doodle pass: `gpt-image-2`, `1024x1024`, transparent background, short prompts, and one-image serial requests
- observed that the train-ticket request still hit `524` timeout twice before succeeding, which reinforced that the low-complexity prompt strategy helps but does not eliminate current network-path instability
- extended the `homeDoodles` array in `waveary-web/src/App.tsx` so the new paper-memory assets actually render in the homepage background layer instead of remaining unused files
- re-verified the frontend with TypeScript and full web production build after wiring the new assets into the homepage

Files changed:

- `waveary-web/public/images/doodles/stamp.png`
- `waveary-web/public/images/doodles/envelope.png`
- `waveary-web/public/images/doodles/train-ticket.png`
- `waveary-web/public/images/doodles/postcard.png`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `0ed7111` - `Expand homepage doodle object set`

Push:

- succeeded: `git push origin main` pushed `0ed7111` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Replace the homepage doodle placeholder PNGs with real generated assets and preserve the working generation constraints so future sessions do not regress into timeout-prone image requests.

Summary:

- replaced all homepage doodle placeholder PNGs under `waveary-web/public/images/doodles/` with real black-and-white generated object assets
- kept the homepage visual direction intact by generating nostalgic everyday doodles with transparent backgrounds instead of changing layout or chat / console logic
- confirmed the practical generation boundary for the current local tool and network path: `gpt-image-2`, `1024x1024`, transparent background, one image per request, and short prompts succeeded while heavier prompts or requests often failed with `524`
- re-verified the web surface with TypeScript and production build checks after the asset replacement, and previously confirmed the refreshed homepage visually through a Playwright browser pass

Files changed:

- `waveary-web/public/images/doodles/bow.png`
- `waveary-web/public/images/doodles/butterfly.png`
- `waveary-web/public/images/doodles/cassette.png`
- `waveary-web/public/images/doodles/eraser.png`
- `waveary-web/public/images/doodles/notebook.png`
- `waveary-web/public/images/doodles/paper-star.png`
- `waveary-web/public/images/doodles/paperclip.png`
- `waveary-web/public/images/doodles/pencil.png`
- `waveary-web/public/images/doodles/ribbon.png`
- `waveary-web/public/images/doodles/ruler.png`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- Playwright homepage visual check previously completed against `http://127.0.0.1:4173/#home` after asset replacement

Commit:

- `a2bdd96` - `Replace homepage doodle placeholders with generated assets`

Push:

- succeeded: `git push origin main` pushed `a2bdd96` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Compress the homepage hero further and tighten the console shell into a denser operational surface without changing provider, session, or care logic.

Summary:

- compressed the homepage hero again by reducing vertical spacing, card height, text rhythm, and doodle inset so the opening screen fits more fully on common desktop heights
- tightened the console shell with smaller toolbar spacing, denser workspace tabs, a new compact status strip, reduced shell padding, and shorter viewport-based panel heights
- kept the current provider, session, proactive-care, and runtime logic intact by limiting the change to shell structure and visual density in `waveary-web/src/App.tsx` and `waveary-web/src/styles.css`
- verified the result with `tsc`, full web production build, and a real Playwright browser pass against `#home` and `#console`

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-tighten open http://127.0.0.1:4173/#home --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-tighten resize 1440 1100`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-tighten screenshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-tighten tab-new http://127.0.0.1:4173/#console`

Commit:

- `d4208f3` - `Tighten homepage hero and compact console shell`

Push:

- succeeded: `git push origin main` pushed `be1b9ed` and continuity follow-up `fb2ae35` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Make the console feel like a compact real control desk instead of a second landing section, and switch the homepage doodle system toward image-based assets with continuity rules for the local image tool.

Summary:

- added a compact console toolbar ahead of the workspace tabs so the page now exposes one clear operational header instead of relying on the older long-form intro treatment
- suppressed the old console intro / summary / flow presentation through the stylesheet so the console reads more like a usable control surface and less like a marketing continuation of the homepage
- changed homepage doodle rendering from CSS shape variants to image-backed doodle assets under `waveary-web/public/images/doodles/`
- added temporary transparent placeholder PNG files so the build stays green while the final hand-drawn object set is still pending generation from `C:\Users\13571\Desktop\micu-image-20260608.html`
- updated product and continuity records so future sessions remember the console-density preference and the requirement to use the local image tool for final homepage doodle assets

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `waveary-web/public/images/doodles/README.md`
- `waveary-web/public/images/doodles/*.png`
- `docs/product-preferences.md`
- `ACTIVE_TASKS.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`
- `C:\Users\13571\.codex\skills\waveary-continuity-guard\SKILL.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `75b8064` - `Tighten console workspace and image doodle pipeline`

Push:

- succeeded: `git push origin main` pushed `75b8064` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Tighten the homepage first screen and split the web console into focused workspaces so the public shell feels more like a formal project homepage plus a usable system desk.

Summary:

- compressed the homepage hero so the slogan, framework copy, and portrait burn stage sit more completely inside the first screen instead of forcing an immediate downward scroll on desktop
- shortened the hero definition copy into two compact summary notes and added drifting monochrome doodle background objects outside the portrait area to reinforce the milk-white hand-drawn direction
- added a console workspace switcher that separates provider setup, session controls, proactive care, and runtime observation instead of keeping everything in one long stacked page
- preserved the existing provider, session, permissions, proactive-care, and runtime logic by reorganizing only the presentation layer in `waveary-web/src/App.tsx` and `waveary-web/src/styles.css`
- verified the frontend pass with real typecheck and production build commands after the structural UI changes

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/`

Commit:

- `aa0a2ef` - `Refine homepage hero and console workspace layout`

Push:

- succeeded: `git push origin main` pushed `be1b9ed` and continuity follow-up `fb2ae35` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Add a minimal source-turn-aware refinement to shared continuity-thread selection so same-age tied memories prefer the thread anchored in the more recent user turn instead of falling back to array order.

Summary:

- added focused `selectContinuityThread()` regression coverage proving that two otherwise equal memory candidates should prefer the one tied to the more recent user-source turn
- kept the refinement inside the shared runtime helper by extending it with optional message history rather than reintroducing provider-local continuity heuristics
- updated the shared continuity helper to derive a very small source-turn bonus from memory `sourceMessageIds` across recent user messages, while keeping current-turn lexical match and broad recency as the dominant ranking signals
- updated both the OpenAI-compatible and scripted provider paths to pass their current message history into the shared helper so the new weighting applies consistently across reply surfaces
- verified the refinement with `@waveary/core` typecheck, fresh build, and compiled-test execution against `dist/**/*.test.js`

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell `Get-ChildItem waveary-core/dist -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }` followed by `node --test <compiled test files>`

Commit:

- `519e500` - `Add source-turn weighting to continuity memories`

Push:

- succeeded: `git push origin main` pushed `519e500` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Add a minimal recency-aware refinement to shared continuity-thread selection so near-tied remembered threads prefer fresher context instead of falling back to retrieval order.

Summary:

- added focused `selectContinuityThread()` regression coverage proving that when two memory candidates are equally relevant to the latest user turn, the newer remembered thread should become the primary continuity thread
- the new regression exposed a real ranking gap: after moving to match-based ordering, tie-like memory candidates could still be decided by raw retrieval order because no light recency signal existed
- updated the shared continuity helper to apply a small age-based ranking bonus for recent memories while keeping lexical relevance as the dominant signal
- kept the recency bonus intentionally small and banded so it only resolves near ties instead of overpowering clearly stronger semantic matches
- verified the refinement with `@waveary/core` typecheck, fresh build, and compiled-test execution against `dist/**/*.test.js`

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell `Get-ChildItem waveary-core/dist -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }` followed by `node --test <compiled test files>`

Commit:

- `319d9ba` - `Add recency-aware continuity memory ranking`

Push:

- succeeded: `git push origin main` pushed `319d9ba` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Extend real-provider continuity regression into emotionally heavy and timeline-led cases, then fix any shared continuity-helper gap that the new provider coverage exposes.

Summary:

- added focused `OpenAICompatibleChatProvider` regression coverage for emotionally heavy turns where only a weak timeline thread is available, so provider-side guidance must stay present and avoid over-forcing continuity
- added focused provider regression coverage for turns where a timeline event matches the latest user concern more strongly than weak recalled memories, so the prompt should choose timeline as the primary continuity thread while preserving relevant supporting memories
- the new regression exposed a real shared-helper asymmetry: weak memories already received emotional-turn restraint, but weak timeline threads still used strong anchoring guidance
- updated `selectContinuityThread()` so weak timeline threads now receive the same conservative "do not force it" treatment during emotional turns, and documented that timeline-led secondary recalled memories are ordered by current-turn relevance
- verified the fix and new provider coverage with `@waveary/core` typecheck, fresh build, and compiled-test execution against `dist/**/*.test.js`

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell `Get-ChildItem waveary-core/dist -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }` followed by `node --test <compiled test files>`

Commit:

- `09ffe0e` - `Harden emotional timeline continuity guidance`

Push:

- succeeded: `git push origin main` pushed `09ffe0e` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Strengthen real-provider dialogue regression around multi-turn continuity-thread choice and relationship-stage distance, then fix any provider-path continuity bug that the new regression exposes.

Summary:

- added focused `OpenAICompatibleChatProvider` regression coverage for multi-turn continuity-thread selection based on the latest user turn instead of a flat recalled-memory order
- added focused provider-prompt regression coverage proving `new`, `warming`, and `growing` relationship stages emit distinct relationship-distance guidance in the real-provider instruction path
- the new multi-turn regression exposed a real shared-helper bug: `selectContinuityThread()` still trusted the first recalled memory entry even when another recalled memory matched the newest user turn more strongly
- updated the shared continuity helper to rank memory and timeline candidates by latest-turn match before choosing the primary thread, while keeping the existing emotional-turn conservatism and secondary-memory behavior
- verified the fix and new coverage with `@waveary/core` typecheck, fresh build, and compiled-test execution against `dist/**/*.test.js`

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/continuity-thread.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell `Get-ChildItem waveary-core/dist -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }` followed by `node --test <compiled test files>`

Commit:

- `a625c32` - `Improve multi-turn continuity thread selection`

Push:

- succeeded: `git push origin main` pushed `a625c32` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-22

Objective:

Promote continuity-thread selection out of provider-local prompt logic into shared `waveary-core` runtime utilities so scripted and real-provider dialogue paths follow the same continuity rule.

Summary:

- added `waveary-core/src/runtime/continuity-thread.ts` with shared continuity-thread selection and current-turn focus summarization helpers
- moved primary-thread scoring, emotional-turn conservatism, and secondary-memory selection out of `OpenAICompatibleChatProvider` and into that shared runtime helper
- updated `ScriptedChatProvider` to consume the same helper and avoid forcing weak recalled memories into emotionally heavy turns just to sound continuous
- added focused runtime-level regression coverage for strong continuity matches and emotional weak-memory fallback behavior
- verified the change with `@waveary/core` typecheck, fresh build, and compiled-test execution against `dist/**/*.test.js`

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-core/src/index.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell `Get-ChildItem waveary-core/dist -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }` followed by `node --test <compiled test files>`

Commit:

- `3f3ef8c` - `Share continuity thread selection across runtime paths`

Push:

- succeeded: `git push origin main` pushed `3f3ef8c` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Strengthen real OpenAI-compatible provider dialogue behavior by structuring one primary continuity thread per turn instead of leaving all recalled memories flat in the prompt.

Summary:

- updated `OpenAICompatibleChatProvider` so its developer instruction now includes current-turn focus, one named primary continuity thread, and a secondary recalled-memory block
- made provider-side continuity selection more conservative for emotionally heavy turns, so weakly related memories are less likely to be forced into the reply just to prove recall
- added focused regression coverage that checks both the new primary-thread structure and the fallback behavior when no strong thread actually matches the current emotional moment
- verified the change with `@waveary/core` typecheck plus the build-first compiled-test path already required on Windows

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- `npm run build --workspace @waveary/core; <direct Node compiled-test invocation>` with explicit `dist/**/*.test.js` expansion succeeded on `2026-06-21`

Commit:

- `8c3a7be` - `Structure provider continuity thread guidance`

Push:

- succeeded: `git push origin main` pushed `8c3a7be` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Push `waveary-core` dialogue quality further toward believable companionship by tightening memory recall, broadening user-emotion detection, enriching companion-emotion carryover, and separating reply distance more clearly by relationship stage.

Summary:

- strengthened repository-backed memory recall so unrelated high-importance memories no longer surface without lexical overlap, and recalled items now persist `lastRecalledAt` for future continuity-aware behavior
- replaced the old coarse `SimpleEmotionAnalyzer` with broader lightweight detection for sadness, anxiety, joy, affection, and playfulness
- expanded `SimpleCompanionEmotionEngine` so companion-side emotion responds more richly to vulnerability, reconnection, affection, playfulness, and relationship stage instead of collapsing too often into one neutral/warm path
- upgraded `ScriptedChatProvider` and OpenAI-compatible developer instructions so `new`, `warming`, and `growing` produce more distinct closeness, continuity wording, and emotional pacing
- added focused regression coverage for memory relevance filtering, provider prompt guidance, and relationship-stage reply differences
- verified the core package with a real build plus direct compiled-test execution; noted that the current Windows `npm run test --workspace @waveary/core` path is not sufficient on its own unless build/test ordering is handled carefully

Files changed:

- `waveary-core/src/storage/repository-backed-session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.test.ts`
- `waveary-core/src/adapters/simple-emotion-analyzer.ts`
- `waveary-core/src/adapters/simple-companion-emotion-engine.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- `npm run test --workspace @waveary/core` before rebuild reflected the known compiled-output caveat and was not treated as sufficient final verification
- `npm run build --workspace @waveary/core; <direct Node compiled-test invocation>` with explicit `dist/**/*.test.js` expansion succeeded on `2026-06-21`

Commit:

- `b5fcd27` - `Improve companion dialogue continuity`

Push:

- succeeded: `git push origin main` pushed `b5fcd27` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Extend the new proactive draft contract into the first explicit repeated delivery loop without introducing hidden background behavior.

Summary:

- added a browser-local proactive check loop in `waveary-web/src/App.tsx` with an explicit enable switch, user-controlled interval, and last-run status display in the console
- kept the loop bounded to the current visible browser tab so repeated `WPCE` evaluation stays legible and does not imply desktop-level background automation
- reused the existing `/api/chat/proactive/evaluate` route and returned draft contract for repeated checks instead of adding another browser-only proactive message path
- preserved the existing notification permission model and delivery bookkeeping, so automatic browser notifications still respect explicit user settings and persisted unanswered-reachout suppression
- updated continuity and decision records so future sessions know the first proactive scheduler is browser-local, visible, and intentionally trust-bounded

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `3b714cd` - `Add browser-local proactive check loop`

Push:

- succeeded: `git push origin main` pushed `3b714cd` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Promote the proactive message draft into a route-visible server contract so `WPCE` evaluation, console presentation, and browser notification delivery all consume the same draft output.

Summary:

- extended `waveary-web/server/chat-runtime.ts` so proactive-care evaluation now returns a server-generated draft alongside the existing decision and session snapshot
- updated `/api/chat/proactive/evaluate` to accept optional permissioned time context and return `{ decision, draft, session }`, allowing bounded local daypart tone shaping without expanding into desktop presence
- switched the web console and browser notification path to prefer the returned draft instead of recomputing the same message shape locally, while keeping a frontend fallback only as a safety net
- added route-level regression coverage for affirmative and blocked proactive evaluations so the draft contract is tested directly
- updated continuity files to record that the proactive draft is no longer presentation-only

Files changed:

- `waveary-web/src/proactive-message-drafts.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `da3f103` - `Expose proactive message drafts through web API`

Push:

- succeeded: `git push origin main` pushed `da3f103` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Extract the proactive message composer out of `App.tsx` into a dedicated web utility module so the draft interface has a cleaner boundary before any future API exposure.

Summary:

- created `waveary-web/src/proactive-message-drafts.ts` to own the proactive draft contract, daypart resolution, draft builder, and tone formatter
- removed the inlined proactive composer implementation from `App.tsx` and switched the current console and browser-notification surfaces over to imports from the new utility module
- kept behavior unchanged while reducing coupling inside `App.tsx`, so the next architectural decision can focus on whether to expose this draft through the local API rather than first untangling UI-local code
- updated continuity state so future work now targets whether the draft stays web-only or becomes a route-visible contract

Files changed:

- `waveary-web/src/proactive-message-drafts.ts`
- `waveary-web/src/App.tsx`
- `ACTIVE_TASKS.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `df3ee17` - `Extract proactive message draft utilities`

Push:

- succeeded: `git push origin main` pushed `df3ee17` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Upgrade the shared proactive message composer from presentation-only copy into a structured suggested-message draft interface that future delivery channels can reuse.

Summary:

- expanded the web-side `ProactiveMessageDraft` shape so it now carries `tone`, `deliveryKind`, and `suggestedMessage` in addition to the existing `lead`, `title`, and `body`
- updated the `WPCE` console card to surface the new structured draft fields directly, including the recommended tone and a first concrete suggested proactive message
- kept the change inside `waveary-web` for now, so the draft interface is real and visible without prematurely promoting it into `WPCE` engine state or a backend contract
- updated continuity state so the next step is now the architectural decision of whether this draft should stay presentation-layer-only or become a reusable route-visible contract

Files changed:

- `waveary-web/src/App.tsx`
- `ACTIVE_TASKS.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `2064826` - `Add structured proactive message drafts`

Push:

- succeeded: `git push origin main` pushed `2064826` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Strengthen the repository-side continuity layer so Waveary can survive heavy long-running use with less drift, less wrong resumption, and less reliance on fragile chat memory.

Summary:

- added `ACTIVE_TASKS.md` as a short-horizon execution queue so a resumed session can see the current implementation focus, current cut, and key deferred work without reconstructing it from chat history
- added `docs/product-preferences.md` to preserve stable product, tone, permission-boundary, UX, and workflow preferences that should survive context compression
- updated `START_HERE.md`, `docs/workflow-rules.md`, `PROJECT_STATE.md`, and the local `waveary-continuity-guard` skill so future sessions read these new files as part of the default recovery routine
- kept the goal focused on continuity quality and recovery accuracy rather than token minimization; the intent is to make long-term high-intensity development easier to resume correctly

Files changed:

- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `START_HERE.md`
- `docs/workflow-rules.md`
- `PROJECT_STATE.md`
- `C:\Users\13571\.codex\skills\waveary-continuity-guard\SKILL.md`
- `docs/session-log.md`

Verification:

- `git diff --check`
- `git status --short --branch`
- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`

Commit:

- `8c09d1d` - `Strengthen repository continuity memory`

Push:

- succeeded: `git push origin main` pushed `8c09d1d` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Refactor the daypart-aware proactive copy into one reusable web-side message composer so console summaries and browser notifications stop carrying separate tone logic.

Summary:

- replaced the split `buildProactiveNotificationLead()` plus `buildProactiveDecisionSummary()` path with one shared `buildProactiveMessageDraft()` composer inside `waveary-web/src/App.tsx`
- updated both the browser notification path and the `WPCE` console card summary to consume the same draft structure, keeping lead, title, and body copy aligned across surfaces
- kept the refactor strictly inside the web presentation layer; no `WPCE` engine behavior, persistence shape, permission rules, or delivery bookkeeping changed
- left the composer inside `App.tsx` for now because only the current console and browser notification surfaces use it, but recorded the follow-up to extract it once another delivery surface needs the same output

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `ce2ff14` - `Refactor proactive message composition`

Push:

- succeeded: `git push origin main` pushed `ce2ff14` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Align the `WPCE` console decision summary with the new daypart-aware browser notification tone so the local product surface explains proactive recommendations in the same voice it delivers them.

Summary:

- added a shared console-summary formatter in `waveary-web/src/App.tsx` that derives top-level `WPCE` decision title/body copy from `decision + locale + daypart`
- updated the proactive decision card so affirmative recommendations now read differently in morning, evening, and late-night contexts when `timeAwareness` is allowed, while blocked evaluations keep a stable explanatory tone
- kept the change inside the web presentation layer only; `WPCE` policy, evaluation logic, persistence state, and notification delivery bookkeeping remain unchanged
- tightened the relationship between console copy and notification copy so the user no longer sees one tone in the control surface and a different tone in the actual browser notification

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `25adc3f` - `Align proactive console tone with daypart guidance`

Push:

- succeeded: `git push origin main` pushed `25adc3f` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Make browser-side proactive care notifications sound more companion-like across morning, evening, and late-night moments without changing `WPCE` decision policy or adding any new permission source.

Summary:

- updated `deliverProactiveBrowserNotification()` so the notification body now begins with a softer time-of-day-aware lead sentence before the existing intent, urgency, and reason details
- kept the new tone shaping behind the existing `timeAwareness` permission; if that permission is not allowed, notifications fall back to a neutral lead instead of inferring local time
- limited the change to browser notification copy only, so `WPCE` evaluation logic, persistence counters, quiet-hour policy, and outreach frequency all remain unchanged
- kept the implementation entirely inside `waveary-web/src/App.tsx` as a small presentation-layer enhancement rather than pushing notification copy logic into the core engine too early

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npx tsc --noEmit -p waveary-web/tsconfig.server.json` failed in isolation on `2026-06-21` because the server build path could not resolve `@waveary/core` without refreshed workspace build output; this was a workspace build-order issue, not a TypeScript error caused by the notification-copy change
- `npm run test --workspace @waveary/web`

Commit:

- `fb51ae2` - `Add daypart-aware proactive notification tone`

Push:

- succeeded: `git push origin main` pushed `fb51ae2` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Extend the new permissioned local-time path into a small daypart-aware tone layer so evening and late-night turns feel more companion-like without introducing broader device awareness.

Summary:

- added a shared local-time guidance helper in `waveary-core` that resolves a bounded `dayPart` hint from the already-authorized local time context
- updated the OpenAI-compatible provider instruction prompt so real model providers now receive explicit daypart tone guidance alongside the raw local time, timezone, and locale
- adjusted the scripted provider so late-night and evening turns soften their opening tone when time awareness is present, while leaving the broader relationship and emotion flow unchanged
- kept the change inside `waveary-core`, with no new permissions, no new frontend controls, and no extra persistence fields

Files changed:

- `waveary-core/src/adapters/local-time-guidance.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/index.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run test --workspace @waveary/core`

Commit:

- `c2f0455` - `Add daypart-aware companion tone guidance`

Push:

- succeeded: `git push origin main` pushed `c2f0455` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Give normal chat turns a permissioned local time awareness path so the companion can answer device-local time/date questions without pretending it has no real-time context.

Summary:

- extended the frontend chat turn payload so `waveary-web` now sends local ISO time, timezone, and locale only when the existing `timeAwareness` permission is set to `allow`
- threaded that bounded time context through the local `/api/chat/turn` route, the web runtime, and the core provider request contract instead of persisting it into session state
- updated the OpenAI-compatible instruction builder so real providers are explicitly told to use the supplied local time context for questions about time, date, and relative day references
- added a small scripted-provider fallback for time/date questions plus regression coverage proving the prompt and route path now carry the local time data correctly

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/providers/interfaces.ts`
- `waveary-core/src/runtime/types.ts`
- `waveary-core/src/runtime/waveary-runtime.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run test --workspace @waveary/core`
- `npm run check --workspace @waveary/web` failed once due to a Windows `waveary-core/dist` cleanup `EPERM` file-lock on `2026-06-21`; the failure occurred during `@waveary/core` prebuild cleanup rather than from a TypeScript error in the time-awareness change
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npx tsc --noEmit -p waveary-web/tsconfig.server.json`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `3fc1fa1` - `Add permissioned local time awareness to chat`

Push:

- succeeded: `git push origin main` pushed `3fc1fa1` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Make the `WPCE` console result easier to scan by visually separating proactive recommendations from blocked evaluations instead of rendering both as the same neutral card.

Summary:

- restructured the proactive decision card into a clearer header, badge, summary, and detail layout so the outcome is readable before users inspect the raw fields
- added distinct visual states for affirmative reachout recommendations versus blocked evaluations, using restrained but noticeable surface and accent differences
- kept the scope inside `waveary-web` so the change improves trust and legibility without modifying `WPCE` engine logic or persistence behavior
- reused the existing bilingual decision labels and kept the card aligned with the current notebook-style console language rather than introducing a new component vocabulary

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npx tsc --noEmit -p waveary-web/tsconfig.server.json`
- `npm run web:build`
- `npm run check --workspace @waveary/web` failed once due to a Windows `waveary-core/dist` cleanup `EPERM` file-lock on `2026-06-21`; the failure occurred during `@waveary/core` prebuild cleanup rather than from a TypeScript error in this UI change

Commit:

- `67d98d5` - `Strengthen proactive decision visual hierarchy`

Push:

- succeeded: `git push origin main` pushed `67d98d5` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Translate raw `WPCE` decision metadata into user-facing bilingual labels so proactive-care output reads like product behavior instead of internal engine diagnostics.

Summary:

- added localized frontend mappings for proactive-care intent, urgency, and reason codes inside `waveary-web`
- updated the proactive decision card so the console now shows readable Chinese and English labels instead of raw enum-style strings
- reused the same mapping for browser notification copy so the local delivery path and console evaluation surface stay semantically aligned
- kept the change strictly inside the `waveary-web` presentation layer without modifying `WPCE` engine logic, persistence semantics, or server contracts

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `9829a9f` - `Localize proactive care decision labels`

Push:

- succeeded: `git push origin main` pushed `9829a9f` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Automatically clear persisted `WPCE` unanswered-reachout state after a successful real user reply so proactive care does not remain blocked after the user has already responded.

Summary:

- added a focused server-side reset path that clears `unansweredReachoutCount` only after a real `/api/chat/turn` completes successfully and is persisted
- preserved `dailyReachoutsSent` and `lastReachOutAt` so the daily-limit and delivery-history semantics stay intact while only the reply-wait gate is lifted
- added route-level regression coverage proving that a session blocked by `awaiting_user_response` becomes eligible again after the user sends a new message
- kept the change entirely inside the runtime and persisted-session layer without adding new frontend toggles, scheduler behavior, or background automation

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `8d5d7b3` - `Clear proactive wait state on user reply`

Push:

- succeeded: `git push origin main` pushed `8d5d7b3` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Close the first proactive-notification loop by recording delivery state back into the persisted session so `WPCE` does not recommend repeated outreach immediately after one notification is sent.

Summary:

- updated the `waveary-web` proactive notification flow so a delivered browser notification now writes `dailyReachoutsSent`, `unansweredReachoutCount`, and `lastReachOutAt` back through the existing proactive settings route
- kept the change scoped to post-delivery bookkeeping rather than introducing any new background scheduler or hidden automation path
- added route-level regression coverage proving that once a delivered reachout is recorded, the next proactive evaluation is suppressed with `awaiting_user_response`
- preserved the existing frontend permission model and manual evaluation flow while making the first delivery path behaviorally safer

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `bb0c15e` - `Record delivered proactive notification state`

Push:

- succeeded: `git push origin main` pushed `bb0c15e` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Introduce an explicit permission center in `waveary-web` so users can choose Waveary's local consent boundaries instead of inheriting hidden or scattered capability toggles.

Summary:

- added a first frontend permission profile covering browser notifications, proactive notifications, time awareness, desktop presence, and local actions, persisted locally in the browser
- surfaced the permission model as a dedicated console card so consent decisions live in one place rather than being buried only inside the proactive-care panel
- linked the existing browser notification flow to the new permission center so proactive notification behavior now follows an explicit user-selected policy
- kept future capabilities such as desktop presence and local actions unimplemented but represented as permission slots, preserving the boundary that high-trust powers must be explicitly granted before they ever exist

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `9005089` - `Add web permission center`

Push:

- succeeded: `git push origin main` pushed `9005089` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Add the first permissioned `WPCE` delivery path in `waveary-web` so a proactive-care evaluation can produce a real browser-local notification without crossing into desktop automation.

Summary:

- extended the proactive-care console card with browser notification permission state, a local auto-notify toggle, and an explicit permission request action
- wired manual `WPCE` evaluation so a granted browser notification can be delivered locally when the decision recommends outreach, while leaving background scheduling and desktop control out of scope
- kept the delivery path browser-local and user-controlled through `Notification` permission plus local toggle state instead of introducing any hidden autonomous process
- verified the change without touching the server contract, preserving the current read-only evaluation route and the split home / console / chat shell

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `660dffe` - `Add browser proactive care notification path`

Push:

- succeeded: `git push origin main` pushed `660dffe` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Surface persisted `WPCE` session policy/state controls and read-only evaluation output in the `waveary-web` console so proactive-care settings can be inspected and exercised from the product UI.

Summary:

- extended the `waveary-web` frontend session snapshot contract so proactive-care policy and state now load with the rest of the persisted session data
- added a dedicated proactive-care console card in `waveary-web/src/App.tsx` with editable per-session policy/state controls plus save and evaluate actions wired to the existing local API routes
- rendered the current `WPCE` evaluation result in the console, including reachout decision, intent, urgency, reasons, suggested delay, and evaluated timestamp
- kept the change scoped to console diagnostics and reused the current page split, persistence flow, and session-loading path without changing homepage or chat-page structure

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `cbf0e14` - `Add web proactive care console controls`

Push:

- succeeded: `git push origin main` pushed `cbf0e14` and continuity follow-up `a396d71` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Persist per-session `WPCE` policy and care-state settings so proactive-care evaluation can reuse saved limits and user preferences across restarts, export, and import.

Summary:

- extended the core persisted session contract and repository-backed session state adapter so proactive-care policy and care-state counters are stored alongside context, memory, relationship, emotion, and timeline state
- updated `waveary-web` session snapshots, export/import payloads, and validation rules so proactive-care settings survive local migration and stay backward-compatible when older packages omit them
- added a writable `/api/chat/proactive/settings` route and updated `evaluateChatProactiveCare()` so later `WPCE` evaluations reuse persisted policy/state by default instead of only one-off request overrides
- added route-level regression coverage proving proactive-care settings persist, appear in session snapshots, and affect later read-only evaluation results without requiring provider configuration

Files changed:

- `waveary-core/src/storage/session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.test.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `docs/examples/session-export.sample.json`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run test --workspace @waveary/core`
- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `0cbfe68` - `Persist proactive care session settings`

Push:

- succeeded: `git push origin main` pushed `0cbfe68` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Expose the current `WPCE` decision output through a read-only local web route so proactive-care policy evaluation can be exercised from the product surface before delivery is implemented.

Summary:

- added a read-only `/api/chat/proactive/evaluate` route in `waveary-web/server/provider-api.ts`
- extended `waveary-web/server/chat-runtime.ts` with `evaluateChatProactiveCare()` so persisted sessions can be evaluated through `WavearyRuntime.evaluateProactiveCare()` without requiring a configured model provider
- kept the route inspection-only by reusing persisted session context and returning the current session snapshot plus decision result, without generating any outbound message or mutating proactive policy state
- added route-level coverage proving proactive evaluation works without provider config and still returns a real `WPCE` decision for a persisted session

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `3f07ce2` - `Add proactive care inspection route`

Push:

- succeeded: `git push origin main` pushed `3f07ce2` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Implement the first `WPCE` decision-only runtime layer so proactive care becomes a bounded, relationship-aware system capability instead of an unstructured future idea.

Summary:

- added proactive care domain types and defaults for policy, state, intent, urgency, and decision output in `waveary-core`
- implemented `SimpleProactiveCareEngine` so Waveary can evaluate quiet hours, daily limits, unanswered reachouts, interaction gap, relationship stage, and companion concern before recommending a bounded outreach intent
- added a dedicated `WavearyRuntime.evaluateProactiveCare()` entrypoint rather than mixing proactive-care logic into `handleTurn`, preserving the architectural boundary between chat replies and outbound-care decisions
- updated runtime construction points in examples and `waveary-web` so the new engine is wired consistently, while keeping delivery and notifications explicitly out of scope for this step

Files changed:

- `waveary-core/src/domain/proactive-care.ts`
- `waveary-core/src/providers/interfaces.ts`
- `waveary-core/src/adapters/simple-proactive-care-engine.ts`
- `waveary-core/src/adapters/simple-proactive-care-engine.test.ts`
- `waveary-core/src/runtime/types.ts`
- `waveary-core/src/runtime/waveary-runtime.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-core/src/index.ts`
- `waveary-web/server/chat-runtime.ts`
- `examples/src/run-demo.ts`
- `examples/src/run-openai-demo.ts`
- `examples/src/verify-provider.ts`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run test --workspace @waveary/core`
- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`

Commit:

- `f774b3d` - `Implement proactive care decision engine foundation`

Push:

- succeeded: `git push origin main` pushed `f774b3d` to the SSH remote `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Implement the first companion-side emotion runtime layer so Waveary no longer treats emotion as only one-turn user classification, but as persisted companion state that can shape replies and survive across turns.

Summary:

- extended the core emotion model and provider/runtime interfaces so Waveary can carry both detected user emotion and companion-side emotion state separately
- added `InMemoryEmotionStore` plus `SimpleCompanionEmotionEngine` and wired them into `WavearyRuntime` so each turn can load prior emotion, transition it, persist it, and return it
- updated scripted and OpenAI-compatible reply scaffolding so companion emotion influences reply framing while staying within the current framework boundaries
- extended repository-backed persistence, SQLite coverage, demos, and web runtime wiring so the first `WEE` layer survives both in-memory and persisted session paths
- aligned route-level web assertions with the already-established recall-friendly memory extraction and current relationship delta behavior

Files changed:

- `waveary-core/src/domain/emotion.ts`
- `waveary-core/src/providers/interfaces.ts`
- `waveary-core/src/runtime/waveary-runtime.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-core/src/adapters/in-memory-emotion-store.ts`
- `waveary-core/src/adapters/simple-companion-emotion-engine.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/storage/session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.test.ts`
- `waveary-core/src/storage/sqlite-session-state-repository.test.ts`
- `waveary-core/src/index.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `examples/src/run-demo.ts`
- `examples/src/run-openai-demo.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run test --workspace @waveary/core`
- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`

Commit:

- `35d7e56` - `Add companion emotion runtime foundation`

Push:

- succeeded: `git push origin main` pushed the first companion emotion runtime foundation over the SSH remote

## 2026-06-21

Objective:

Turn the user's target for emotional companionship, proactive care, and future presence-aware behavior into a formal Waveary product and architecture draft instead of leaving it as chat-only intent.

Summary:

- added `docs/emotion-proactive-care.md` as the first formal design draft for `Waveary Emotion Engine (WEE)` and `Waveary Proactive Care Engine (WPCE)`
- aligned `docs/vision.md`, `docs/architecture.md`, and `docs/roadmap.md` so Waveary is clearly framed as a continuity-first companion system that should eventually remember, feel, and care proactively rather than act like a generic assistant
- recorded the architectural decision that emotion and care are stateful core systems, while future desktop awareness or local action must stay in a separate permissioned layer
- updated continuity state so future Codex sessions can continue from the correct product direction without drifting back toward generic chatbot framing

Files changed:

- `docs/emotion-proactive-care.md`
- `docs/vision.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/decision-log.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `git status --short --branch`
- `git diff --check`

Commit:

- `317f59f` - `Document emotion and proactive care architecture`

Push:

- succeeded: `git push origin main` pushed the formal emotion and proactive care architecture draft over the SSH remote

## 2026-06-21

Objective:

Improve the core conversation feel so Waveary replies sound less like a generic assistant, recall memories more naturally, and let relationship growth react to what the user actually shares.

Summary:

- rewrote the scripted runtime reply behavior so continuity is expressed as warmer companion-style follow-up instead of flat assistant acknowledgment plus raw echoing
- updated the OpenAI-compatible prompt assembly to guide real model providers toward stage-aware companionship, restrained memory mention, and emotion-first response behavior
- replaced the old length-based relationship delta logic with signal-based scoring that reacts to openness, vulnerability, trust, and warmth in what the user says
- changed memory extraction so longer user turns are condensed into shorter recall-friendly fragments instead of storing the entire sentence as the memory verbatim

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/adapters/simple-relationship-engine.ts`
- `waveary-core/src/adapters/in-memory-relationship-store.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-memory/src/simple-memory-extractor.ts`
- `waveary-memory/src/simple-memory-extractor.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/core`
- `npm run test --workspace @waveary/memory`
- `npm run check`

Commit:

- `18997cd` - `Improve dialogue continuity heuristics`

Push:

- succeeded: `git push origin main` pushed the dialogue-quality heuristics pass over the SSH remote

## 2026-06-21

Objective:

Add a repeatable real-provider verification path and use it to check the currently saved DeepSeek configuration end-to-end without relying on the browser flow.

Summary:

- added a dedicated `npm run verify:provider` script that lists models from the active saved or environment-supplied provider config, resolves a usable model, and attempts one real runtime turn
- hardened the provider verification scripts so model-listing or runtime failures now return structured diagnostics instead of crashing with low-signal output
- ran both `npm run verify:provider` and `npm run models:provider` against the currently saved local DeepSeek config
- confirmed the present saved DeepSeek credential is not usable because `/models` returns `401 invalid api key`, so the current blocker is credential freshness rather than adapter compatibility

Files changed:

- `package.json`
- `examples/src/list-provider-models.ts`
- `examples/src/verify-provider.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run verify:provider`
- `npm run models:provider`

Commit:

- `d102c80` - `Add provider verification CLI path`

Push:

- succeeded: `git push origin main` pushed the provider verification CLI scaffolding and DeepSeek validation record over the SSH remote

## 2026-06-21

Objective:

Harden the OpenAI-compatible provider layer so model discovery and reply extraction stay usable across more domestic-provider payload variations without changing Waveary's framework boundaries.

Summary:

- relaxed the core provider adapter so `/models` discovery no longer requires a preselected chat model and can normalize nested model containers plus alternate metadata fields such as `model_id`, `displayName`, and additional context-window keys
- expanded reply extraction so structured text payloads from both `/chat/completions` and `/responses` style providers are accepted more broadly instead of assuming one narrow content shape
- kept the browser provider flow aligned by surfacing normalized context-window hints directly in the model selector
- updated route-level and adapter-level tests to lock the broader compatibility behavior while preserving existing persistence and import/export coverage

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/core`
- `npm run check --workspace @waveary/web`
- `npm run web:build`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `5d3b676` - `Harden provider compatibility payload handling`

Push:

- succeeded: `git push origin main` pushed the provider compatibility hardening pass over the SSH remote

## 2026-06-21

Objective:

Restore GitHub push reliability for the Waveary repository by moving the local `origin` remote from HTTPS to SSH and syncing the accumulated local commits to GitHub successfully.

Summary:

- verified that GitHub CLI auth was already valid and confirmed the HTTPS push failures were network-path issues rather than repository or token issues
- generated a local ed25519 SSH key, authenticated successfully against GitHub over SSH, and switched `origin` from HTTPS to `git@github.com:K2st0r/-Waveary-.git`
- pushed the previously accumulated local Waveary commits successfully after the SSH remote change
- left the repository in a clean synchronized state so future pushes can use SSH directly instead of the unstable HTTPS path

Files changed:

- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `ssh -o StrictHostKeyChecking=accept-new -T git@github.com`
- `git push origin main`
- `git status --short -b`

Commit:

- `556580a` - `Record SSH push migration`

Push:

- succeeded: `git push origin main` completed over SSH after switching `origin` to `git@github.com:K2st0r/-Waveary-.git`

## 2026-06-21

Objective:

Nudge the homepage lighter flame one more step left and upward so the visible ignition point sits even closer to the lighter tip while keeping the rebuilt flame stack and burn timing unchanged.

Summary:

- adjusted only the `.hero-memory-lighter-flame` anchor coordinates again in `waveary-web/src/styles.css`
- moved the flame a small additional amount left/up across desktop, tablet, and mobile breakpoints rather than changing flame size, shape, or animation layers
- preserved all homepage motion structure so this remains a pure positional polish pass
- verified the homepage still builds successfully after the micro-adjustment

Files changed:

- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run web:build`

Commit:

- `731ac1a` - `Refine homepage flame anchor again`

Push:

- failed: `git push origin main` could not connect to `github.com:443` after 21 seconds; branch remained ahead of `origin/main` by 8 commits after the attempt

## 2026-06-21

Objective:

Nudge the homepage lighter flame slightly further left and upward so the burn focal point sits more convincingly on the lighter nozzle without changing the flame animation structure or any runtime behavior.

Summary:

- adjusted only the `.hero-memory-lighter-flame` anchor coordinates in `waveary-web/src/styles.css`
- kept the rebuilt multi-layer flame stack, glow, and burn-cycle timing unchanged so this stays a pure placement correction
- aligned the flame slightly further left/up across desktop, tablet, and mobile breakpoints to tighten the visual contact point with the hand-drawn lighter
- verified the homepage still builds cleanly after the micro-adjustment

Files changed:

- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run web:build`

Commit:

- `4e4a832` - `Nudge homepage flame anchor`

Push:

- failed: `git push origin main` could not connect to `github.com:443` after 21 seconds; branch remained ahead of `origin/main` by 6 commits after the attempt

## 2026-06-21

Objective:

Rebuild the homepage lighter flame so it feels materially closer to a real flame while preserving the current burn vignette structure and homepage behavior.

Summary:

- replaced the old single-layer teardrop flame with a multi-layer flame stack in `waveary-web/src/App.tsx`, including halo, outer flame, inner flame, and core layers
- rewrote the flame motion in `waveary-web/src/styles.css` so the lighter now has pivot, pulse, and irregular shape changes instead of one flat scale animation
- kept the effect within the existing product tone by making the flame richer and more believable without turning the homepage into a flashy decorative animation demo
- verified the change with scoped web checks and a full production build after the flame rebuild

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`

Commit:

- `fdf5281` - `Rebuild homepage lighter flame motion`

Push:

- failed: `git push origin main` could not connect to `github.com:443` after 21 seconds; branch remained ahead of `origin/main` by 4 commits after the attempt

## 2026-06-21

Objective:

Refine the homepage memory-burn vignette so it cycles through multiple portraits, uses a hand-drawn lighter asset, and feels more intentional without affecting provider, session, persistence, or chat behavior.

Summary:

- generated a hand-drawn lighter asset for the homepage burn vignette and saved it under `waveary-web/public/images/hero/lighter.png`
- replaced the fixed burn-photo implementation with a timed portrait rotation so different question-mark portraits are pulled into the burn focal point over time
- tuned the burn-card, glow, scorch, ash, and lighter positioning layers together in `waveary-web/src/styles.css` so the effect reads more like a repeated memory ritual than one looping static card
- verified the refinement with scoped web checks and a full production build after wiring the new asset and rotation state into the existing homepage shell

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `waveary-web/public/images/hero/lighter.png`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`

Commit:

- `3676f57` - `Refine homepage rotating burn vignette`

Push:

- failed: `git push origin main` timed out after 244 seconds; branch remained ahead of `origin/main` by 2 commits after the attempt

## 2026-06-21

Objective:

Add the first Waveary homepage portrait-memory visual system so the public front page feels less static and more like a digital companionship project with drifting, emotionally projectable identities.

Summary:

- generated a first local portrait asset set under `waveary-web/public/images/portraits` using the user's image workflow, keeping the core rule that every face stays a question mark with no visible facial features
- widened the character spread beyond one repeated anonymous-boy look by adding both male and female youthful silhouettes with different hairstyles, outfits, and companion temperaments
- extended the homepage hero in `waveary-web/src/App.tsx` and `waveary-web/src/styles.css` with a floating portrait cloud plus a central burn-to-ash memory vignette without touching provider setup, session management, persistence, or live chat behavior
- verified the result with scoped web checks and a full production build after wiring the portrait layer into the existing Waveary homepage shell

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `waveary-web/public/images/portraits/portrait-01.png`
- `waveary-web/public/images/portraits/portrait-02.png`
- `waveary-web/public/images/portraits/portrait-03.png`
- `waveary-web/public/images/portraits/portrait-04.png`
- `waveary-web/public/images/portraits/portrait-05.png`
- `waveary-web/public/images/portraits/portrait-06.png`
- `waveary-web/public/images/portraits/portrait-07.png`
- `waveary-web/public/images/portraits/portrait-08.png`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`

Commit:

- `586845c` - `Add homepage portrait memory visual layer`

Push:

- succeeded: `git push origin main` pushed `be1b9ed` and continuity follow-up `fb2ae35` to the SSH remote `git@github.com:K2st0r/-Waveary-.git` at time of record; local branch was ahead of origin by one commit before the current burn-vignette refinement pass

## 2026-06-21

Objective:

Refine the split `waveary-web` surfaces so the homepage feels like a formal open source project front page, the console reads like a management desk, and the chat page feels more like a focused conversation room, without breaking any existing provider, session, import/export, persistence, or live chat behavior.

Summary:

- added `waveary-web/PRODUCT.md` so future frontend skill runs have stable local product context instead of inferring Waveary Web from scratch
- reshaped the homepage hero so the primary brand statement and the project-definition composition feel more intentional and less like repeated documentation cards
- compressed the console first screen into a clearer masthead plus current-status panel so actionable setup and runtime context sit higher in the viewport
- tightened the chat page header into an inline session strip and gave the journal conversation canvas more of the screen so the page feels closer to a single-purpose dialogue room
- verified the visual pass with scoped TypeScript checks, a production web build, a live local HTTP check, and fresh Playwright first-screen browser captures for `#home`, `#console`, and `#chat`

Files changed:

- `waveary-web/PRODUCT.md`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-check open http://127.0.0.1:4173/#home --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-check resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-check screenshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-check open http://127.0.0.1:4173/#console --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-check resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-console-check screenshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-check open http://127.0.0.1:4173/#chat --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-check resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-chat-check screenshot`

Commit:

- `f01e9f1` - `Polish split waveary web page hierarchy`

Push:

- succeeded

Objective:

Reorganize the `waveary-web` multi-page shell so all explanatory framework content lives on the homepage, the console page focuses on management, and the conversation experience moves into a separate minimal chat page.

Summary:

- removed the separate framework page path and folded its introduction, positioning, engine, and structure content back into the homepage
- split the old mixed console/runtime page into a management-focused console view plus a dedicated chat page with a much cleaner journal-style conversation canvas
- preserved provider setup, session switching, persistence switching, import/export, bilingual behavior, and live chat turn handling while only reshaping the render tree
- verified the change with scoped TypeScript checks, a production web build, live local HTTP access, and real browser checks against `#console` and `#chat`

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-console-chat-check open http://127.0.0.1:4173/#console --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-console-chat-check resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-console-chat-check snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-console-chat-check open http://127.0.0.1:4173/#chat --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-console-chat-check resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-home-console-chat-check snapshot`

Commit:

- `19b5bc8` - `Split waveary web console and chat surfaces`

Push:

- succeeded

Objective:

Split the `waveary-web` landing surface into shorter multi-page views and remove the visible persisted-session archive panel, without breaking provider setup, session management, runtime chat, or bilingual behavior.

Summary:

- replaced the earlier long single-page flow with shorter hash-based views for home, framework, console, and roadmap while keeping the existing React state and local API flows intact
- kept the public homepage focused on brand and positioning, moved framework detail into its own view, and isolated provider setup plus runtime tools into a dedicated console page
- removed the visible persisted-session archive panel from the runtime rail so the live console feels less abrupt and less like an internal debug surface
- verified the refactor through scoped type checks, a production web build, a live local HTTP response, and a headed Playwright browser pass across `#home`, `#framework`, and `#console`

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-multipage-check open http://127.0.0.1:4173/ --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-multipage-check resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-multipage-check snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-multipage-check screenshot`

Commit:

- `48b52e6` - `Split waveary web into focused pages`

Push:

- succeeded

Objective:
Objective:

Add a direct Chinese and English language toggle to the `waveary-web` homepage and runtime console without breaking the existing provider setup, session management, chat, import/export, or persistence behavior.

Summary:

- rebuilt `waveary-web/src/App.tsx` around a single bilingual copy layer so the homepage narrative, provider setup controls, session management UI, runtime panels, and roadmap all switch together
- added a topbar `涓?/ EN` language toggle that keeps the current visual paper-and-doodle direction and persists the selected locale locally
- kept language switching presentation-only so changing locale does not re-run initial page loading or wipe any in-progress provider form input
- verified the change through scoped TypeScript checks and a full production web build

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run web:build`

Commit:

- `45d5cc3` - `Add bilingual homepage language toggle`

Push:

- succeeded

Objective:

Restructure the `waveary-web` homepage into a stronger single-page open source project front page with anchor navigation and a pure introduction-first first screen, without changing provider, session, chat, import/export, or persistence behavior.

Summary:

- moved the homepage toward a more formal project-home rhythm by making the first screen purely explanatory and pushing the interactive console deeper into the page
- replaced the earlier repeated feature-card feel with a clearer introduction essay, project-definition panel, repository-structure section, and leaner positioning rail
- aligned the navbar with the new single-page section order so homepage navigation now jumps across introduction, engines, structure, console, and roadmap sections directly
- verified the refactor through scoped TypeScript checks, server build, production web build, live local HTTP access, and a headed Playwright snapshot plus screenshot against `http://127.0.0.1:4173/`

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish open http://127.0.0.1:4173/ --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-homepage-polish screenshot`

Commit:

- `7c04b2e` - `Refine single-page framework homepage`

Push:

- succeeded

Objective:

Redesign the `waveary-web` frontend so it feels like a higher-end open source AI product homepage and control surface without changing any existing provider, session, chat, import/export, or persistence behavior.

Summary:

- reworked the landing page into a clearer product-home structure with a stronger hero, live proof strip, framework framing, and a more intentional engine section
- rebuilt the visual system around a quieter brand layer plus a more cinematic console shell instead of repeating one dark glass card treatment everywhere
- restructured the runtime area into a clearer main conversation canvas with a secondary inspection rail for signals and archive state while preserving all existing event handlers and API flows
- verified the redesign through scoped TypeScript checks, server build, production web build, live local HTTP check, and a Playwright screenshot plus DOM snapshot against the running page

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-redesign open http://127.0.0.1:4173/ --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-redesign resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-redesign screenshot`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-redesign snapshot`

Commit:

- `340f1cc` - `Redesign waveary web product shell`

Push:

- succeeded

Objective:

Refactor the `waveary-web` homepage so it reads as a formal open source framework site first and a companion console second, without changing existing provider, session, or chat behavior.

Summary:

- split the landing experience into clearer layers: brand hero, framework positioning, engine stack, companion console overview, provider setup, and live runtime
- preserved the existing provider setup, session management, persistence switching, import/export, and runtime chat flows while changing how they are introduced and grouped
- reworked the visual system so the top of the page feels like a framework homepage while the lower shell feels like an intentional product console instead of one repeated dark panel stack
- verified the refactor through TypeScript checks, server build, production web build, live local page request, and desktop-plus-mobile browser layout inspection

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/`
- Playwright browser screenshot pass against `http://127.0.0.1:4173/` on desktop and mobile widths

Commit:

- `1ca74b4` - `Refine waveary web landing and console hierarchy`

Push:

- succeeded for `1ca74b4`; follow-up continuity commit `970b2f2` is still local because `git push origin main` failed to connect to `github.com:443` after 21 seconds

## 2026-06-21

Objective:

Extend Waveary browser session import semantic validation so `snapshot.latestInsights.relationship` cannot drift away from `snapshot.relationship`.

Summary:

- added a cross-structure semantic check that requires latest-insight relationship stage, score fields, and `lastUpdatedAt` to match the snapshot relationship payload
- kept the rule narrow by comparing only the shared exported fields and explicitly ignoring `userId`, which may differ across restore contexts
- expanded the existing semantic inconsistency regression package so relationship summary drift now fails alongside the current memory and timeline summary checks
- documented the relationship-summary consistency rule in the session package format reference for external generators

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `fd6688b` - `Validate session import relationship summary consistency`

Push:

- succeeded for `fd6688b`; follow-up continuity commits `d588015` and `6722140` were later pushed successfully together with `1ca74b4`

Continuation note:

- this import-semantic hardening line is intentionally paused after relationship, memory, and timeline summary consistency
- if resumed later, the next optional check is content-level duplicate handling across imported summaries, but it is not current priority

## 2026-06-21

Objective:

Extend Waveary browser session import semantic validation so `snapshot.latestInsights.recalledMemories` and `snapshot.latestInsights.storedMemories` cannot drift away from the imported memory archive.

Summary:

- added cross-structure semantic checks that require both latest-insight memory summary arrays to match memory content present in `snapshot.memoryArchive`
- kept the rule deterministic by matching exported memory content strings instead of inventing fuzzy reconciliation or merge behavior
- expanded the route-level semantic inconsistency package so unmatched recalled and stored memory summaries now fail independently alongside the existing timeline-summary checks
- documented the new memory-summary consistency rules in the session package format reference for external generators

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `7f1f147` - `Validate session import memory summary consistency`

Push:

- succeeded

## 2026-06-21

Objective:

Extend Waveary browser session import semantic validation so `snapshot.latestInsights.timeline` cannot describe timeline events that are missing from the imported snapshot timeline.

Summary:

- added a cross-structure semantic check that requires each `latestInsights.timeline` entry to correspond to an event in `snapshot.timelineEvents`
- kept the match rule narrow and deterministic by comparing title, type, and eventTime instead of introducing fuzzy merge behavior
- expanded the route-level semantic regression package so a timeline summary can now fail independently when it drifts away from the imported snapshot timeline
- documented the new timeline-summary consistency rule in the session package format reference for external generators

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `9794449` - `Validate session import timeline summary consistency`

Push:

- failed: `git push origin main` timed out after 184 seconds, and immediate `git ls-remote origin refs/heads/main` failed to connect to `github.com:443` after 21 seconds

## 2026-06-21

Objective:

Extend Waveary browser session import semantic validation so duplicate message identities inside one imported snapshot are rejected before restore.

Summary:

- added duplicate ID checks for `snapshot.messages` so one import package cannot restore multiple chat messages under the same identity
- kept the new rule aligned with the existing message-ordering and timestamp semantics instead of expanding into merge or overwrite behavior
- expanded the semantic route-level regression package so duplicate message IDs are rejected alongside the existing session, timeline, and memory consistency failures
- documented the duplicate message identity rule in the session package format reference for external generators

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `a0e62a5` - `Validate session import duplicate message identities`

Push:

- succeeded

## 2026-06-21

Objective:

Strengthen the Waveary continuity workflow so every completed work block must end with verified state records, a push attempt, and an explicit next step for the following session.

Summary:

- tightened `docs/workflow-rules.md` so functional verification, continuity updates, push attempt, and next-step recording are part of the mandatory closeout path
- updated `START_HERE.md` so a new session sees the stronger end-of-block routine immediately
- updated the `waveary-continuity-guard` skill so it now explicitly requires recording the next step and clearing `pending` placeholders after push results are known
- recorded the workflow change in `docs/decision-log.md` so future sessions treat this as an accepted process decision rather than an optional habit

Files changed:

- `docs/workflow-rules.md`
- `START_HERE.md`
- `docs/decision-log.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`
- `C:\\Users\\13571\\.codex\\skills\\waveary-continuity-guard\\SKILL.md`

Verification:

- `git status --short -b`

Commit:

- `ddb8936` - `Strengthen continuity closeout workflow`

Push:

- succeeded

## 2026-06-21

Objective:

Extend Waveary browser session import semantic validation so duplicate memory and timeline identities inside one imported snapshot are rejected before restore.

Summary:

- added duplicate ID checks for `snapshot.memoryArchive` so one import package cannot restore multiple memory rows under the same identity
- added duplicate ID checks for `snapshot.timelineEvents` so one import package cannot restore conflicting timeline event identities
- kept the change inside the existing `waveary-web` import contract and expanded the semantic regression route coverage rather than changing `waveary-core`
- documented the duplicate identity rule in the session package format reference for external generators

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `b93ef31` - `Validate session import duplicate identities`

Push:

- succeeded

## 2026-06-21

Objective:

Extend Waveary browser session import semantic validation so message and timeline arrays with backward-moving timestamps are rejected before restore.

Summary:

- added ordering checks for valid message `createdAt` timestamps so imported conversation history cannot move backward in time
- added ordering checks for `snapshot.timelineEvents` and `snapshot.latestInsights.timeline` so imported recall sequences stay chronologically coherent
- kept the change scoped to `waveary-web` import semantics and expanded the route-level regression to cover out-of-order arrays
- documented the stricter ordering rule in the session file format reference for external generators

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `756a8e6` - `Validate session import ordering semantics`

Push:

- succeeded after network recovered

## 2026-06-21

Objective:

Add semantic consistency validation to Waveary browser session imports so packages with internally contradictory session IDs or out-of-order timestamps are rejected before restore.

Summary:

- added cross-field validation for top-level versus snapshot session IDs
- added consistency checks for message session IDs and for timestamps that should not exceed `snapshot.updatedAt` or `exportedAt`
- kept the import contract in `waveary-web` while expanding regression coverage for semantically inconsistent packages
- updated the session file format docs so external generators know the importer now checks both structure and internal consistency

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `46f87f2` - `Add session import semantic validation`

Push:

- failed: `git push origin main` timed out after 124 seconds, and immediate `git ls-remote origin refs/heads/main` also timed out after 34 seconds

## 2026-06-21

Objective:

Tighten Waveary browser session import from structural validation into value-level validation so obviously bad timestamps, score ranges, and unsupported message roles are rejected before restore.

Summary:

- added value-level validation for ISO timestamps across export, relationship, memory, and timeline fields
- restricted imported message roles to `user` and `assistant`
- enforced `0..1` score ranges for relationship metrics, emotion intensity, and importance fields
- expanded route-level regression coverage for invalid timestamps, invalid score ranges, and unsupported message roles while keeping the valid import path green

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `docs/session-file-format.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `4c7ba5b` - `Validate session import field values`

Push:

- succeeded

## 2026-06-21

Objective:

Harden Waveary browser session import validation so malformed relationship, insight, memory, and timeline payloads fail before a bad package is restored locally.

Summary:

- expanded `waveary-web` session package validation beyond the top-level version gate into richer snapshot structure checks
- added explicit validation for `exportedAt`, `snapshot.updatedAt`, `snapshot.latestInsights`, `snapshot.relationship`, memory metadata fields, and timeline metadata fields
- added route-level regression coverage for malformed relationship and latest-insight payloads while preserving valid imports and legacy unversioned package compatibility
- kept the change inside the `waveary-web` import boundary so the browser restore path gets safer without changing `waveary-core` contracts

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `34a7afd` - `Harden session import snapshot validation`

Push:

- succeeded

## 2026-06-21

Objective:

Add explicit schema versioning to the Waveary browser session package without breaking older exports that were created before version metadata existed.

Summary:

- added `schemaVersion: "waveary-session@1"` to the current `waveary-web` session export package contract
- kept import backward-compatible for legacy unversioned packages while rejecting unsupported future schema versions with a clear validation error
- surfaced the active schema version through `/api/chat/session/format`, the browser import reference card, the export callout, and the sample package docs
- expanded route-level regression coverage for versioned export, legacy import, unsupported-version rejection, and the updated format reference payload

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `docs/session-file-format.md`
- `docs/examples/session-export.sample.json`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`

Commit:

- `c27f755` - `Add session package schema versioning`

Push:

- failed: first `git push origin main` attempt timed out after 124 seconds, and immediate retry failed to connect to `github.com:443`; `git ls-remote origin refs/heads/main` still resolved successfully between attempts

## 2026-06-21

Objective:

Surface the Waveary session package format directly inside the browser import/export flow so users can see the safety rule, required fields, and sample package without leaving the product UI.

Summary:

- added a local `/api/chat/session/format` route in `waveary-web` that returns the current import mode, package rule summary, required field lists, and the sample session export JSON
- updated the browser import panel to show package rules, required top-level fields, required snapshot arrays, and a one-click sample package loader
- updated the browser export preview to repeat the import safety rule so users understand that imports always restore into a brand-new session
- added route-level regression coverage for the new session format reference endpoint and verified the scoped web package check plus direct compiled server route tests

Files changed:

- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`
- `npm run test --workspace @waveary/web` failed with the existing Windows `waveary-core/dist` `EPERM` cleanup issue before route tests started

Commit:

- `9a81d95` - `Expose session package reference in web UI`

Push:

- succeeded

## 2026-06-20

Objective:

Document the current Waveary browser session package so continuity tooling and external generators can target a stable import/export shape.

Summary:

- added a dedicated session file format reference for the current `waveary-web` browser import/export package
- added a valid sample export JSON file so external tooling has a concrete compatibility target
- linked the new session package docs from the repository homepage and `waveary-web` package README
- corrected continuity records so earlier commits and pushes now match the real Git history after the delayed network recovery

Files changed:

- `README.md`
- `waveary-web/README.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`
- `docs/session-file-format.md`
- `docs/examples/session-export.sample.json`

Verification:

- `git status --short -b`
- `git push origin main`

Commit:

- `ed81dff` - `Document session package format`

Push:

- failed: `git push origin main` timed out, and `git ls-remote origin refs/heads/main` then failed to connect to `github.com:443`

## 2026-06-20

Objective:

Add structured import diagnostics so invalid Waveary session files fail with actionable field-level feedback instead of a generic error.

Summary:

- upgraded the web session import validator to collect multiple structural problems across session metadata, messages, memory archive, and timeline events
- introduced a dedicated `ChatSessionImportValidationError` so the local API can return both a top-level import failure message and a list of detailed validation findings
- added route-level regression coverage for malformed session packages and verified that the browser-facing import flow still works for valid packages
- updated the browser import UI to render the returned validation details as an import diagnostics panel under the session import controls

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`

Commit:

- `22fbcda` - `Add import validation diagnostics`

Push:

- succeeded later after network recovered and follow-up commits were pushed

## 2026-06-20

Objective:

Upgrade the new Waveary session migration flow from raw text handling into real browser file export and file-based import.

Summary:

- upgraded browser session export so the structured JSON package is downloaded as a real local `.json` file instead of only being shown inline
- added browser-side file selection for session import while preserving the existing JSON paste path as a fallback
- kept the migration model unchanged: exports remain structured session packages and imports still restore into a brand-new local session instead of overwriting existing state
- verified that the `waveary-web` route and type-check coverage still pass after the browser-side file handling upgrade

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`

Commit:

- `bcb13b5` - `Add browser file import export flow`

Push:

- succeeded

## 2026-06-20

Objective:

Add safe in-browser session import so a Waveary export package can be restored as a new local companion session without overwriting existing state.

Summary:

- added a guarded `importChatSession` flow in the web session layer that validates exported session packages and always restores them into a brand-new local session
- preserved the existing architecture boundary by mapping imported conversation, memory, relationship, and timeline data back into the current web persistence format instead of changing `waveary-core`
- exposed the import capability through a new `/api/chat/session/import` route and added route-level regression coverage for importing a structured export package
- updated the browser session controls with a JSON paste import panel and automatic switch into the newly imported session after successful restore
- kept the scope product-first and low-risk by explicitly not supporting overwrite or merge semantics in this first import version

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`

Commit:

- `ca6f537` - `Add web chat session import flow`

Push:

- succeeded later after network recovered and follow-up commits were pushed

## 2026-06-20

Objective:

Add structured single-session export so persisted Waveary companion state can be carried out of the current browser session as a coherent JSON package.

Summary:

- added a local `exportChatSession` flow in the web session layer that packages conversation history, persisted memories, relationship snapshot, timeline events, and latest insights without changing core runtime boundaries
- exposed the export capability through a new `/api/chat/session/export` route in the same local API family as the existing session endpoints
- added route-level regression coverage proving that a real session with persisted memory and timeline state can be exported as a structured package
- updated the browser session management panel with an `Export Session JSON` action and an inline structured JSON preview for the active session
- kept the change scoped to `waveary-web` so it advances product capability without introducing new storage contracts or cloud assumptions

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`

Commit:

- `988bf49` - `Add web chat session export flow`

Push:

- succeeded

## 2026-06-20

Objective:

Make Waveary's persisted session intelligence visible so users can verify long-term memory, relationship state, and timeline continuity after reloads.

Summary:

- extended the web session snapshot contract to include persisted memory archive entries, relationship snapshot data, and timeline events from stored session state
- kept the change inside the web session layer by reusing the existing core persistence contract instead of introducing new runtime storage paths
- added route-level regression assertions proving that reloading `/api/chat/session` returns persisted memory, relationship, and timeline data after a chat turn
- updated the browser chat surface with a dedicated persisted session archive panel so users can inspect durable memory and continuity artifacts beyond the latest-turn insight cards
- verified the scoped web package checks and tests, plus the root test flow; root `npm run check` still reproduces the known Windows dist cleanup race and is recorded as an existing issue rather than a new regression

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`
- `npm run test`
- `npm run check` failed with the existing Windows `dist` cleanup race while rebuilding workspaces in sequence

Commit:

- `fd83d34` - `Surface persisted session archive in web chat`

Push:

- succeeded

## 2026-06-20

Objective:

Improve real browser usability by letting the user reset the active local chat session without deleting the session entry, including the default main companion session.

Summary:

- added a `resetChatSession` server-side operation that clears local messages and latest runtime insights while preserving the session identity and title
- exposed the reset capability through a new `/api/chat/sessions/reset` route and reset the in-memory runtime cache immediately after the reset so the next turn rebuilds from clean persisted state
- extended route-level coverage to verify that resetting the default main session clears persisted history but keeps the session available in the session list
- updated the web session management panel so the active session can be reset directly from the browser UI, including the default main companion session
- kept the change scoped to the web session layer without altering the core runtime or provider abstractions

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check`
- `npm run test`

Commit:

- `80b7360` - `Add browser chat session reset flow`

Push:

- succeeded later after network recovered and follow-up commits were pushed

## 2026-06-20

Objective:

Extend provider request compatibility beyond model discovery by encoding the first real vendor-specific chat request differences and making the workspace test scripts reliably execute compiled tests on Windows.

Summary:

- added a provider compatibility profile layer in `waveary-core` so request-shape differences can be handled per provider without forking the whole OpenAI-compatible adapter
- normalized DeepSeek preset handling so a configured `https://api.deepseek.com/v1` base URL is rewritten to the provider's documented OpenAI-compatible base path before requests are sent
- updated responses fallback assembly so DeepSeek uses a `system` instruction role instead of `developer`, matching the provider's documented compatibility limitation
- expanded `waveary-core` adapter tests to cover DeepSeek base URL normalization and responses fallback role behavior
- replaced the remaining glob-based package test scripts with Node-driven compiled test discovery so `@waveary/core`, `@waveary/memory`, and `@waveary/web` tests execute reliably in the current Windows shell

Files changed:

- `waveary-core/package.json`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-memory/package.json`
- `waveary-web/package.json`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/core`
- `npm run test --workspace @waveary/memory`
- `npm run test --workspace @waveary/web`
- `npm run check`
- `npm run test`

Commit:

- `c6262f4` - `Add DeepSeek provider request compatibility`

Push:

- failed: `git push origin main` and `git ls-remote origin refs/heads/main` could not connect to `github.com:443`

## 2026-06-20

Objective:

Harden the OpenAI-compatible provider layer so browser model discovery tolerates more real vendor payload shapes and the core test scripts actually execute under the current Windows environment.

Summary:

- expanded `waveary-core` model discovery normalization so `/models` can accept string entries plus object entries using fields like `id`, `name`, or `model`
- preserved optional `label` and `contextWindow` metadata during normalization and deduplicated repeated model IDs so the browser provider picker gets stable results
- improved upstream model-listing failures to include provider response bodies instead of collapsing into a generic status-only message
- extended route-level coverage in `waveary-web/server/provider-api.test.ts` so the browser-facing `/api/provider/models` flow is protected against broader OpenAI-compatible payload variants
- corrected the `@waveary/core` and `@waveary/memory` `test` scripts so their compiled Node tests actually run on the current Windows shell instead of silently matching zero files

Files changed:

- `waveary-core/package.json`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-memory/package.json`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `node --test dist/adapters/openai-compatible-provider.test.js` in `waveary-core`
- `node --test dist/runtime/waveary-runtime.test.js dist/storage/repository-backed-session-state.test.js dist/storage/sqlite-session-state-repository.test.js` in `waveary-core`
- `node --test dist/in-memory-memory-store.test.js dist/simple-memory-extractor.test.js` in `waveary-memory`
- `npm run test --workspace @waveary/web`
- `npm run test`
- `npm run check`

Commit:

- `8e1c0b5` - `Harden provider model discovery normalization`

Push:

- succeeded later after network recovered and follow-up commits were pushed

## 2026-06-20

Objective:

Verify that the browser-facing persistence migration flow also works in the reverse `sqlite -> file` direction and record the result in the continuity files.

Summary:

- confirmed through the running local dev server that `GET /api/chat/sessions` initially showed `sqlite` as active and `file` as `behind`
- performed a live `POST /api/chat/persistence` switch from `sqlite` to `file` and verified that `lastSync.fromBackend`, `lastSync.toBackend`, and synchronized session counts reflected the reverse migration correctly
- reloaded `waveary-main` immediately after the switch and confirmed that the restored file-backed session still contained the full prior message history
- sent a real `POST /api/chat/turn` after the reverse switch and confirmed the new user/assistant pair persisted under the file backend
- confirmed with follow-up `GET /api/chat/sessions` and `POST /api/chat/session` that `file` stayed active, `sqlite` became `behind`, and the new persisted turn was recoverable through the browser-facing API

Files changed:

- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run web:dev`
- `Invoke-WebRequest http://127.0.0.1:4173/`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence` with `{"backend":"file"}`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session` with `{"sessionId":"waveary-main"}`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn` with `{"sessionId":"waveary-main","message":"Please reply with one short sentence confirming the file backend is now active after the live reverse switch."}`

Commit:

- `0c5e5d3` - `Record reverse persistence API verification`

Push:

- succeeded later after network recovered and follow-up commits were pushed

## 2026-06-20

Objective:

Complete route-level regression coverage for the remaining `waveary-web` session APIs and fix runtime-side sqlite handle cleanup so repeated local verification stays stable on Windows.

Summary:

- extended `waveary-web/server/provider-api.test.ts` to cover `GET /api/chat/sessions`, `POST /api/chat/session`, `POST /api/chat/sessions/rename`, and `POST /api/chat/sessions/delete`
- added assertions for default main-session protection so rename and delete requests fail cleanly for `waveary-main`
- tightened the provider API test harness to reset persisted local state between test cases without cross-case leakage
- added `PersistentChatSessionState.close()` and updated runtime cache reset logic to close cached repositories before clearing session state
- verified that the full `waveary-web` package and root monorepo checks/tests pass after the sqlite resource cleanup fix

Files changed:

- `waveary-web/server/provider-api.test.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`
- `npm run check`
- `npm run test`

Commit:

- `6e249db` - `Add session API regression tests`

Push:

- succeeded

## 2026-06-20

Objective:

Verify the richer `waveary-web` persistence payload through a real local dev-server API flow, not only through isolated tests.

Summary:

- started the local `waveary-web` dev server and verified the app was serving on `http://127.0.0.1:4173`
- confirmed that `GET /api/chat/sessions` initially reported `file` as active and `sqlite` as `behind`
- performed a live `POST /api/chat/persistence` switch from `file` to `sqlite` and verified `lastSync`, `importedSessionCount`, and `backendDetails`
- sent a real `POST /api/chat/turn` after the switch and verified that the new turn persisted under the sqlite-backed active session
- confirmed with a follow-up `GET /api/chat/sessions` that `file` became `behind` after the new sqlite write, matching the intended frontend status semantics

Files changed:

- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run web:dev`
- `Invoke-WebRequest http://127.0.0.1:4173/`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence` with `{"backend":"sqlite"}`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn`

Commit:

- `0442c6b` - `Record live persistence API verification`

Push:

- succeeded

## 2026-06-20

Objective:

Add route-level regression coverage for `waveary-web` `/api/chat/persistence` so backend status payloads and runtime cache reset behavior are protected at the middleware layer.

Summary:

- added a dedicated `provider-api` middleware test file in `waveary-web/server`
- verified that `POST /api/chat/persistence` returns the richer persistence payload, including `lastSync`, `backendDetails`, and synchronized session counts
- verified that switching persistence backends clears the in-memory runtime cache so the next chat turn is recreated under the new backend key
- kept the change scoped to the local web API layer without altering runtime or frontend behavior

Files changed:

- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`
- `npm run check`
- `npm run test`

Commit:

- `52f659f` - `Add chat persistence API regression tests`

Push:

- succeeded

## 2026-06-20

Objective:

Surface richer local persistence backend status in `waveary-web` so the session layer shows active backend health, alternate-backend sync state, and last migration details.

Summary:

- expanded chat persistence config and status types to include `lastSync` metadata plus per-backend status details
- updated the server-side session store to compare file and SQLite records, compute `active / in-sync / behind / ahead / diverged`, and expose differing session counts
- extended the browser session panel with backend status cards, last sync metadata, and sync-state badges for both local stores
- corrected the `sqlite -> file` regression expectation so post-sync status is treated as `in-sync`
- updated `@waveary/web` `check` to prebuild workspace dependencies, matching the package's existing `test` behavior

Files changed:

- `waveary-web/package.json`
- `waveary-web/server/chat-persistence-config.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/chat-session-store.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npm run check --workspace @waveary/web`
- `npm run check`
- `npm run test`

Commit:

- `5eb777f` - `Add web persistence status insights`

Push:

- failed: `git push origin main` could not connect to `github.com:443`

## 2026-06-20

Objective:

Add automated regression coverage for `waveary-web` local persistence backend switching so `file / sqlite` continuity does not rely only on manual browser checks.

Summary:

- added a test-isolated Waveary data directory override for local web server persistence files
- added a separate Node-side TypeScript build path for `waveary-web/server` tests without changing the browser build path
- added `waveary-web` regression tests that verify `file -> sqlite` import and `sqlite -> file` synchronization of newer session state
- wired root `npm run test` to include `@waveary/web` server-side regression coverage
- verified that the new coverage passes alongside existing `waveary-core` and `waveary-memory` tests

Files changed:

- `package.json`
- `waveary-web/package.json`
- `waveary-web/tsconfig.server.json`
- `waveary-web/server/data-dir.ts`
- `waveary-web/server/provider-config.ts`
- `waveary-web/server/chat-persistence-config.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/chat-session-store.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run check`
- `npm run test`

Commit:

- `4d382bd` - `Add web persistence switching regression tests`

Push:

- succeeded later after network recovered and follow-up commits were pushed

## 2026-06-20

Objective:

Wire the new local persistence backends into `waveary-web` so the browser chat can switch between JSON file storage and SQLite without losing session continuity.

Summary:

- extended the core `SessionStateRepository` contract with `list()` so storage backends can support session enumeration and migration
- added a local chat persistence config in `waveary-web` with visible backend status and a browser-side backend switch control
- wired `waveary-web` session storage and runtime cache to select either JSON file or SQLite based on current local persistence config
- added `/api/chat/persistence` and updated existing session endpoints to return backend status alongside session data
- verified real `file -> sqlite -> file` switching through live local API requests, including persistence import and post-switch session recovery

Files changed:

- `waveary-core/src/storage/session-state.ts`
- `waveary-core/src/storage/sqlite-session-state-repository.ts`
- `waveary-core/src/storage/repository-backed-session-state.test.ts`
- `waveary-web/server/chat-persistence-config.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence` with `{"backend":"sqlite"}`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session` with `{"sessionId":"waveary-main"}`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn` with `{"sessionId":"waveary-main","message":"Please reply with one short sentence confirming sqlite persistence is active."}`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/persistence` with `{"backend":"file"}`

Commit:

- `e16bb91` - `Add web chat persistence backend switching`

Push:

- failed: `git push origin main` timed out, and `git ls-remote origin refs/heads/main` then failed to connect to `github.com:443`

## 2026-06-20

Objective:

Add the first structured non-file persistence backend on top of the core session state contract.

Summary:

- added a SQLite session state repository to `waveary-core` using Node's built-in `node:sqlite`
- kept the implementation aligned with the existing `SessionStateRepository` contract instead of introducing a parallel storage path
- added a core regression test that verifies SQLite save, load, and delete behavior for persisted companion state
- recorded SQLite as the first accepted non-file backend for the current CE stage

Files changed:

- `waveary-core/src/index.ts`
- `waveary-core/src/storage/sqlite-session-state-repository.ts`
- `waveary-core/src/storage/sqlite-session-state-repository.test.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`
- `docs/decision-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run web:build`

Commit:

- `2fc7e07` - `Add SQLite session state repository`

Push:

- succeeded

## 2026-06-20

Objective:

Move runtime persistence from a web-only local implementation toward a reusable framework contract that later storage backends can adopt safely.

Summary:

- added a persisted session state contract to `waveary-core`
- added a repository-backed runtime session state adapter that exposes memory, relationship, and timeline stores
- added a core regression test that verifies persisted context, memory, relationship, and timeline behavior through a repository
- refactored `waveary-web/server/chat-session-store.ts` to reuse the core repository-backed state while preserving web-only metadata such as session title and latest insights
- recorded the persistence boundary decision so future sessions do not move runtime persistence back into UI-only code

Files changed:

- `waveary-core/src/index.ts`
- `waveary-core/src/storage/session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.ts`
- `waveary-core/src/storage/repository-backed-session-state.test.ts`
- `waveary-web/server/chat-session-store.ts`
- `PROJECT_STATE.md`
- `docs/session-log.md`
- `docs/decision-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run web:build`

Commit:

- `14fd6cf` - `Add core persisted session state contract`

Push:

- succeeded

## 2026-06-20

Objective:

Finish the browser session management flow so non-default sessions can be renamed and deleted without dropping back to terminal or raw APIs.

Summary:

- completed the local `/api/chat/sessions/rename` and `/api/chat/sessions/delete` flow in the web UI
- replaced the old session dropdown with a session list and management cards
- kept the default `waveary-main` session protected from rename and delete operations
- made local session history load even before a provider is configured so persistence remains visible
- added `.waveary/` to `.gitignore` so local provider and chat state stay out of commits

Files changed:

- `.gitignore`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions` `POST`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions/rename` `POST`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions/delete` `POST`

Commit:

- `0f80e08` - `Add web session management controls`

Push:

- failed: `git push origin main` could not connect to `github.com:443`

## 2026-06-20

Objective:

Build the first runnable `waveary-core` flow and split out the initial `waveary-memory` module.

Summary:

- added root workspace configuration
- added `waveary-memory` package
- added runnable adapters for `waveary-core`
- added root demo entry
- verified build, check, and demo flow

Files changed:

- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `examples/src/run-demo.ts`
- `waveary-core/src/adapters/*`
- `waveary-memory/src/*`

Verification:

- `npm run check`
- `npm run demo`

Commit:

- `7b62365` - `Add runnable core demo and initial memory module`

Push:

- succeeded after network recovered

## 2026-06-20

Objective:

Add continuity guardrails so a new Codex session can resume work safely, keep progress records current, and reduce refactor mistakes after context reset.

Summary:

- created a local Codex skill at `C:\Users\13571\.codex\skills\waveary-continuity-guard`
- added `PROJECT_STATE.md`
- added `docs/session-log.md`
- added `docs/workflow-rules.md`
- validated the skill and kept repository verification green

Files changed:

- `PROJECT_STATE.md`
- `docs/session-log.md`
- `docs/workflow-rules.md`

Verification:

- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`
- `npm run check`

Commit:

- `d9e7cf3` - `Add repository continuity tracking files`

Push:

- succeeded

## 2026-06-20

Objective:

Replace the single fixed browser chat session with a default main session plus optional additional sessions so conversation context does not collapse into one bucket.

Summary:

- added local session listing and creation support on top of `.waveary/chat-sessions.json`
- introduced a default `waveary-main` companion session that always exists
- added browser APIs for listing sessions, creating sessions, and loading a chosen session
- updated the web UI so the user can switch between the main companion session and additional sessions
- verified that different sessions keep separate histories after real chat turns

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/sessions`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn`

Commit:

- `39f1bf5` - `Add main and optional web chat sessions`

Push:

- first push attempt failed because GitHub was unreachable from the current network

## 2026-06-20

Objective:

Persist the browser chat session beyond process memory so the first Waveary web conversation survives a local dev server restart.

Summary:

- added a file-backed chat session store in `waveary-web/server` using `.waveary/chat-sessions.json`
- persisted runtime context history, memories, relationship state, timeline state, and latest runtime insights per session
- added local `/api/chat/session` recovery support so the frontend can restore messages and the latest signals
- updated the browser chat UI to reload persisted history automatically when a saved provider configuration is present
- verified that a message survives a full `waveary-web` dev server restart and can be restored through the local API

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn`
- restart `npm run web:dev`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/session`

Commit:

- `ef4e5e3` - `Persist web chat sessions across restarts`

Push:

- succeeded

## 2026-06-20

Objective:

Strengthen the continuity system by recording major decisions, not just task progress.

Summary:

- added `docs/decision-log.md`
- linked decision tracking into `PROJECT_STATE.md`
- updated workflow rules so future sessions must read and update the decision log when needed

Files changed:

- `docs/decision-log.md`
- `PROJECT_STATE.md`
- `docs/workflow-rules.md`
- `docs/session-log.md`

Verification:

- `npm run check`

Commit:

- `d426519` - `Add architectural decision log`

Push:

- pushed later as part of continuity cleanup

## 2026-06-20

Objective:

Strengthen auto-resume behavior so future Codex sessions in the Waveary repository trigger continuity recovery without needing a manual reminder.

Summary:

- expanded the skill trigger description to match Waveary repository cues
- added an explicit continuity entry note to `PROJECT_STATE.md`
- added an explicit continuity note to `docs/workflow-rules.md`

Files changed:

- `PROJECT_STATE.md`
- `docs/workflow-rules.md`

Verification:

- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`

Commit:

- `76f45e5` - `Strengthen continuity auto-resume entrypoints`

Push:

- succeeded

## 2026-06-20

Objective:

Add one last root-level entrypoint so any new session sees the continuity path immediately before touching code.

Summary:

- added `START_HERE.md`
- updated `PROJECT_STATE.md` to reflect the latest verified continuity commit
- cleaned up stale pending markers in `docs/session-log.md`

Files changed:

- `START_HERE.md`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `git status --short -b`

Commit:

- `291869e` - `Add root continuity entrypoint`

Push:

- succeeded

## 2026-06-20

Objective:

Start formal development by turning the current runtime and memory behavior into regression-tested code instead of leaving them as unchecked demo logic.

Summary:

- added Node-based tests to `waveary-core`
- added Node-based tests to `waveary-memory`
- added root `npm run test`
- fixed TypeScript config so repeated builds and tests stay stable

Files changed:

- `package.json`
- `tsconfig.base.json`
- `examples/tsconfig.json`
- `waveary-core/package.json`
- `waveary-core/tsconfig.json`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-memory/package.json`
- `waveary-memory/tsconfig.json`
- `waveary-memory/src/*.test.ts`

Verification:

- `npm run check`
- `npm run test`
- `npm run demo`

Commit:

- `1503868` - `Add initial regression tests for core and memory`

Push:

- succeeded

## 2026-06-20

Objective:

Make Waveary directly connectable to real model providers while keeping compatibility broad enough for domestic platforms.

Summary:

- replaced the single-vendor OpenAI path with an OpenAI-compatible multi-provider adapter
- added provider presets for OpenAI, DeepSeek, DashScope, Volcengine Ark, and SiliconFlow
- added model discovery support through a provider `/models` path
- added `npm run demo:provider`
- added `npm run models:provider`

Files changed:

- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `examples/src/run-openai-demo.ts`
- `examples/src/list-provider-models.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/providers/interfaces.ts`
- `waveary-core/src/index.ts`
- `waveary-core/README.md`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run demo`
- `npm run demo:provider`

Commit:

- `95dfb27` - `Add multi-provider AI integration layer`

Push:

- succeeded

## 2026-06-20

Objective:

Match the real provider flow more closely: choose provider, enter API key, discover models, select model, then use the runtime without re-entering everything manually.

Summary:

- added interactive `npm run setup:provider`
- added saved provider config support through `.waveary/provider-config.json`
- updated `demo:provider` and `models:provider` to load saved config automatically

Files changed:

- `package.json`
- `examples/src/provider-config.ts`
- `examples/src/setup-provider.ts`
- `examples/src/list-provider-models.ts`
- `examples/src/run-openai-demo.ts`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run demo:provider`

Commit:

- `7f76d2e` - `Add interactive provider setup flow`

Push:

- local commit existed and branch was ahead of origin at the time of recording

## 2026-06-20

Objective:

Stand up the first official `waveary-web` page and define the package boundary for the web surface without collapsing runtime logic into the UI layer.

Summary:

- added a standalone `waveary-web` React and Vite workspace
- implemented a formal homepage for Waveary positioning, engine stack, provider compatibility, roadmap, and repository structure
- added root web scripts for dev and preview
- fixed package build hygiene by cleaning `dist` before compile so stale adapter tests stop leaking into verification

Files changed:

- `package.json`
- `package-lock.json`
- `waveary-core/package.json`
- `waveary-memory/package.json`
- `waveary-web/package.json`
- `waveary-web/tsconfig.json`
- `waveary-web/vite.config.ts`
- `waveary-web/index.html`
- `waveary-web/README.md`
- `waveary-web/src/App.tsx`
- `waveary-web/src/main.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run demo`
- `npm run build --workspace @waveary/web`

Commit:

- `1e43c8a` - `Add official waveary-web homepage`

Push:

- succeeded later after continuity records were synced

## 2026-06-20

Objective:

Connect the provider setup flow to `waveary-web` so browser users can choose a provider, fetch models, and save local configuration without dropping into terminal scripts.

Summary:

- replaced the static provider section with a real setup console in `waveary-web`
- added local same-origin `/api/provider/*` middleware for presets, model discovery, and config persistence
- reused `@waveary/core` provider presets and OpenAI-compatible model listing instead of duplicating provider logic in the UI
- updated root web scripts so the browser setup flow can run through the existing workspace

Files changed:

- `package.json`
- `package-lock.json`
- `waveary-web/package.json`
- `waveary-web/vite.config.ts`
- `waveary-web/README.md`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-config.ts`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run web:dev`
- `Invoke-WebRequest http://127.0.0.1:4173/api/provider/presets`

Commit:

- `3cbc4f3` - `Add web provider setup console`

Push:

- succeeded

## 2026-06-20

Objective:

Add the first in-browser Waveary chat shell on top of the saved provider configuration so the web app can send real messages and surface runtime signals.

Summary:

- added local `/api/chat/turn` support backed by `WavearyRuntime`
- introduced a lightweight in-memory browser chat session state on the server side
- extended `waveary-web` with a chat panel plus runtime insight cards for memory, relationship, emotion, and timeline
- kept provider usage behind local API routes instead of calling the model provider directly from frontend code

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run build --workspace @waveary/web`

Commit:

- `9f33468` - `Add browser runtime chat shell`

Push:

- succeeded

## 2026-06-20

Objective:

Stabilize `waveary-web` local development on the current Windows workspace path and make the browser chat flow work against the saved DeepSeek provider configuration.

Summary:

- replaced direct Vite CLI dev and preview entrypoints with Node-based wrappers that resolve `vite.config.ts` safely under the current Windows path
- updated root web scripts so `waveary-web` always prebuilds both `@waveary/core` and `@waveary/memory`
- added `@waveary/memory` as an explicit `waveary-web` dependency for the local server runtime
- updated the OpenAI-compatible provider adapter to prefer `/chat/completions` and fall back to `/responses`
- switched the primary instruction role to `system` for broader domestic provider compatibility
- improved provider error reporting so upstream response bodies are surfaced during debugging
- verified that `npm run web:dev` serves the site and that `/api/chat/turn` returns a real DeepSeek-backed reply

Files changed:

- `package.json`
- `package-lock.json`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-web/README.md`
- `waveary-web/package.json`
- `waveary-web/server/dev-server.mjs`
- `waveary-web/server/preview-server.mjs`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run check`
- `npm run test`
- `npm run web:build`
- `Invoke-WebRequest http://127.0.0.1:4173/`
- `Invoke-WebRequest http://127.0.0.1:4173/api/provider/presets`
- `Invoke-WebRequest http://127.0.0.1:4173/api/chat/turn`

Commit:

- `bca3a54` - `Stabilize web dev runtime and provider compatibility`

Push:

- succeeded



## 2026-06-22

Objective:

Extend the managed browser layer one step beyond read-only inspection by adding explicit clickable-target discovery and click-by-text actions without turning Waveary into a free-form browser agent.

Summary:

- expanded `waveary-web/server/browser-automation.ts` so the managed Playwright layer can now list visible clickable elements and click the first visible match by text, on top of the existing page-info, extract-text, and search-text primitives
- exposed those capabilities as `/api/browser/clickable-elements` and `/api/browser/click-text` through `waveary-web/server/provider-api.ts`, keeping the browser interaction boundary explicit and separate from normal chat generation
- added route-level regression coverage in `waveary-web/server/provider-api.test.ts` for clickable-element listing and click-by-text payload handling through browser-automation test overrides
- re-ran `@waveary/web` tests and typecheck successfully, and recorded that root `npm run web:build` still hit the known Windows `EPERM` dist-cleanup issue in `waveary-core/dist` rather than a new browser-layer logic failure

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build` failed on Windows with `EPERM` while removing `waveary-core/dist`

Commit:

- `c076eb1` - `Add bounded browser click actions`

Push:

- succeeded: `git push origin main` pushed functional commit `c076eb1` to `origin/main`

## 2026-06-22

Objective:

Extend the managed browser layer beyond `open_url` so Waveary can inspect the page it opened through a bounded, testable API instead of stopping at shell-level browser launch.

Summary:

- expanded `waveary-web/server/browser-automation.ts` from plain `openManagedBrowserPage()` into a small managed-browser service that can also report the current page, extract visible page text, and search that text for snippets
- kept the boundary explicit by exposing these capabilities as `/api/browser/page`, `/api/browser/extract-text`, and `/api/browser/search-text` in `waveary-web/server/provider-api.ts` rather than mixing them into unconstrained chat-generation behavior
- added route-level regression coverage in `waveary-web/server/provider-api.test.ts` for null-page state, text extraction, and page-text search through browser-automation test overrides
- reconciled continuity files so the stored next step now points at one next bounded browser interaction such as click-by-text or link selection instead of rediscovering the browser-read layer from scratch

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `31202cb` - `Add bounded managed browser read routes`

Push:

- succeeded: `git push origin main` pushed functional commit `31202cb` to `origin/main`

## 2026-06-22

Objective:

Make browser-opening local actions feel more reliable and more human by moving `open_url` into a Waveary-managed browser context and tightening the companion-side reply wording around those actions.

Summary:

- added a new `waveary-web/server/browser-automation.ts` service backed by `playwright`, using one persistent browser profile under `.waveary/` so Waveary now has its own managed browser execution context for web opens
- updated `waveary-web/server/local-actions.ts` so `open_url` actions no longer delegate straight to `explorer.exe`, and instead open inside the managed Playwright browser while folder/app actions keep their previous local paths
- widened local open-intent and site matching so Chinese phrasing like `打开哔哩哔哩` is detected reliably as the same Bilibili action path
- rewrote `waveary-web/server/local-action-audit.ts` so successful and dismissed local-action replies stay factually grounded but sound more companion-like, avoiding both hollow “virtual homepage” improvisation and overly sterile audit-log phrasing
- extended route-level tests to cover the new Chinese Bilibili alias detection and the warmer post-action response wording

Files changed:

- `package-lock.json`
- `waveary-web/package.json`
- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `8a2308e` - `Add managed browser open action layer`

Push:

- succeeded: `git push origin main` pushed functional commit `8a2308e` to `origin/main`

## 2026-06-22

Objective:

Keep `full-access` local actions trustworthy by making same-turn assistant replies match the action that actually ran, instead of claiming it cannot open apps after already opening them.

Summary:

- added a shared `waveary-web/server/local-action-audit.ts` helper so local-action audit wording can be reused consistently by both same-turn auto-execution and the existing execute / dismiss routes
- updated `waveary-web/server/chat-runtime.ts` so `/api/chat/turn` now detects pending local actions before persistence, receives the current local-action permission, and auto-runs supported actions server-side when that permission is `allow`
- changed the same-turn `full-access` path to replace the visible assistant reply with an execution-consistent audit note, while preserving the narrower ask-first and deny trust boundary for lower permission modes
- extended `/api/chat/turn` request payloads through `waveary-web/server/provider-api.ts` and `waveary-web/src/App.tsx` so the backend receives the active local-action permission and locale from the chat page
- added route-level regression coverage proving that a provider can say "I cannot open apps" while the same `full-access` turn still returns `I opened Bilibili for you.` and persists only the consistent audited reply in session history

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/local-action-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run web:build`

Commit:

- `f0e7da6` - `Keep full-access action replies consistent`

Push:

- succeeded: `git push origin main` pushed functional commit `f0e7da6` to `origin/main`

## 2026-06-22

Objective:

Keep deterministic local-time replies trustworthy for natural Chinese conversation by catching indirect complaint-style time questions before they fall back to provider-generated disclaimers.

Summary:

- expanded `waveary-core/src/runtime/local-time-reply.ts` so the runtime now treats more indirect Chinese phrasings as time questions, including complaint-style turns like asking why it still cannot tell the exact time
- normalized whitespace before matching and added extra Chinese patterns around `具体几点`, `现在几分`, and `没法/无法/不能告诉你` style wording without changing the broader permission boundary
- added focused regression coverage in `waveary-core/src/runtime/local-time-reply.test.ts` for both direct detection and deterministic reply generation on that indirect Chinese wording
- verified the fix with `@waveary/core` typecheck, build, and direct compiled runtime test execution for the local-time helper plus `WavearyRuntime`

Files changed:

- `waveary-core/src/runtime/local-time-reply.ts`
- `waveary-core/src/runtime/local-time-reply.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- `node --test waveary-core/dist/runtime/local-time-reply.test.js waveary-core/dist/runtime/waveary-runtime.test.js`

Commit:

- `a33efc3` - `Expand deterministic local-time detection`

Push:

- succeeded: `git push origin main` pushed functional commit `a33efc3` and continuity follow-up `eb96a8a` to `origin/main`
## 2026-06-22

Objective:

Integrate bounded browser read and click actions into the chat page's existing permissioned local-action flow instead of leaving them as standalone browser routes only.

Summary:

- expanded `waveary-web/server/local-actions.ts` so chat-side pending actions can now detect bounded browser intents for reading the current page, searching page text, listing visible clickable items, and clicking a visible target by text
- kept those browser actions inside the existing `allow / ask / deny` local-action trust boundary instead of creating a second browser-only confirmation model
- updated `waveary-web/server/chat-runtime.ts` and `waveary-web/server/local-action-runtime.ts` so `full-access` auto-run and explicit ask-first execution both prefer grounded action-returned companion notes for browser actions
- refreshed `waveary-web/server/local-action-audit.ts` and `waveary-web/src/App.tsx` so the chat card and localized status copy can represent browser read/search/click actions cleanly instead of assuming everything is only open-url / open-folder / launch-app
- added route-level regression coverage for pending browser read actions, full-access browser page search, and ask-first browser clickable-list execution

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/local-action-runtime.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`

Commit:

- `8bd9c62` - `Integrate browser actions into chat permission flow`

Push:

- succeeded: `git push origin main` pushed functional commit `8bd9c62` to `origin/main`
# Session Log

## 2026-06-22

Objective:

Start the first dedicated voice module by creating a real `waveary-voice` package, wiring emotion-aware TTS planning into `waveary-web`, and making the chat page speak replies.

Summary:

- added a new `waveary-voice` workspace package with stable TTS-facing contracts plus a first `BrowserSpeechPlanner` that maps locale, relationship stage, and companion emotion into browser speech rate, pitch, volume, and preferred-voice hints
- added first voice-domain contracts to `waveary-core` through `VoiceSession`, `SpeechInput`, and `SpeechOutput`, so the framework boundary now has explicit voice objects instead of leaving voice only in docs
- added `waveary-web/server/voice-runtime.ts` plus `/api/voice/speak` in the local API layer, keeping voice planning on the server side and out of direct UI-only heuristics
- updated the chat page in `waveary-web/src/App.tsx` and `waveary-web/src/styles.css` with a first voice strip: `auto speak`, `speak reply`, and `stop`, using browser `speechSynthesis` and the server-returned emotional speech plan
- fixed one managed-browser test hang while doing this work by moving current-page search intent detection ahead of the narrower Bilibili follow-up branch and by explicitly closing managed browser automation between `provider-api` tests
- updated `package.json`, `waveary-web/package.json`, and `package-lock.json` so the new voice workspace is built and tested as part of the monorepo workflow

Files changed:

- `package.json`
- `package-lock.json`
- `waveary-core/src/domain/voice.ts`
- `waveary-core/src/index.ts`
- `waveary-core/src/providers/interfaces.ts`
- `waveary-voice/package.json`
- `waveary-voice/README.md`
- `waveary-voice/tsconfig.json`
- `waveary-voice/src/index.ts`
- `waveary-voice/src/types.ts`
- `waveary-voice/src/browser-speech-planner.ts`
- `waveary-voice/src/browser-speech-planner.test.ts`
- `waveary-web/package.json`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `node --test waveary-web/dist-server/server/provider-api.test.js`
- `node --test waveary-web/dist-server/server/chat-session-store.test.js`
- `npm run check --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `e5a68af` - `Add first voice module and chat speech playback`

Push:

- succeeded: `git push origin main` pushed functional commit `e5a68af` to `origin/main`



## 2026-06-22

Objective:

Expose explicit high-quality provider-backed TTS configuration so Waveary voice can move beyond one hidden default and feel more human without breaking the existing chat-page speech flow.

Summary:

- added reusable `waveary-voice/src/voice-presets.ts` so provider-backed TTS can choose quality-oriented profiles such as `cinematic`, `gentle`, `bright`, and `steady` with profile-specific instruction seeds, speed bias, and default model / voice pairs
- updated `OpenAICompatibleTextToSpeechProvider` to accept `qualityProfile`, derive stronger human-delivery instructions from the preset plus emotion / relationship context, and include the chosen quality profile in returned metadata
- added `waveary-web/server/voice-config.ts` plus new `/api/voice/config` routes so voice profile, model, voice, and output format can be saved locally in `.waveary/voice-config.json` instead of being trapped in hardcoded TTS defaults
- updated `waveary-web/server/voice-runtime.ts` so `/api/voice/speak` now merges saved voice config, request overrides, and preset defaults before attempting provider-backed TTS, while preserving browser speech fallback
- extended `waveary-web/src/App.tsx` with a compact chat voice control strip for profile / model / voice selection beside the existing `auto speak`, `speak reply`, and `stop` controls
- added regression coverage for the new voice config routes and verified that the provider-backed TTS path now honors explicit preset / voice overrides

Files changed:

- `waveary-voice/src/voice-presets.ts`
- `waveary-voice/src/index.ts`
- `waveary-voice/src/openai-compatible-tts-provider.ts`
- `waveary-voice/src/openai-compatible-tts-provider.test.ts`
- `waveary-voice/src/types.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run build --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- pending

Push:

- succeeded: `git push origin main` pushed functional commit `ba4a3af` plus continuity follow-up `e6293aa` to `origin/main`

## 2026-06-22

Objective:

Add the first browser-native microphone input path so the user can speak to Waveary from the chat page now, without waiting for realtime duplex voice.

Summary:

- updated `waveary-web/src/App.tsx` so the chat page can start and stop browser microphone capture through the Web Speech API, draft interim transcript text into the existing composer, and auto-send the final recognized turn through the normal `/api/chat/turn` flow
- kept this first STT slice intentionally bounded inside the chat surface instead of adding a new server-side speech upload path or separate provider setup flow
- added localized microphone status messaging for listening, sending, unsupported-browser, and common speech-recognition error states so the new path fails clearly instead of silently
- updated `waveary-web/src/styles.css` so the voice area can represent microphone state alongside existing TTS controls without disturbing the rest of the chat layout
- ignored `.playwright-cli/` in `.gitignore` so local browser tooling does not keep appearing as unrelated untracked noise
- reconciled continuity records so the repo now points at the true preexisting TTS head (`22288c3`) and records browser-native STT as the current next voice slice baseline

Files changed:

- `.gitignore`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `38c2c1a` - `Add browser speech input to chat`

Push:

- succeeded: `git push origin main` pushed functional commit `38c2c1a` to `origin/main`



## 2026-06-22

Objective:

Turn the existing browser STT and reply playback path into a continuous live voice conversation loop so Waveary can alternate between listening and speaking more like a real spoken chat.

Summary:

- updated `waveary-web/src/App.tsx` so the chat page now has an explicit live voice conversation mode instead of only one-shot browser speech capture
- wired that mode through the existing browser STT and provider/browser TTS paths, so recognized speech still flows through the normal `/api/chat/turn` request while spoken replies automatically resume listening afterward
- added bounded live-loop recovery behavior for `no-speech`, playback completion, and playback failure cases so the user does not have to restart the whole voice flow after every turn
- tightened playback cleanup around browser speech synthesis and provider audio object URLs so stopping live chat or stopping speech does not leave stale auto-resume timers behind
- updated the chat voice control copy so the primary mic button now reads as `寮€濮嬪疄鏃跺璇?/ 缁撴潫瀹炴椂瀵硅瘽` and the mic status line describes the continuous listen-reply-listen behavior more clearly

Files changed:

- `waveary-web/src/App.tsx`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `586c0b1` - `Add continuous live voice chat loop`

Push:

- succeeded: `git push origin main` pushed functional commit `586c0b1` to `origin/main`

## 2026-06-22

Objective:

Restore the visibility of provider and model setup in the console after the compact workspace shell made that flow feel missing.

Summary:

- confirmed that provider presets, model discovery state, selected model state, and the provider setup panel code were still present in `waveary-web/src/App.tsx`; the regression was a console-shell visibility problem rather than deleted model logic
- updated the console toolbar so `妯″瀷鎺ュ叆 / Model setup` is always one click away even after switching into other workspaces
- changed the console status strip to show provider and model separately, so the current setup state no longer collapses into one ambiguous runtime label
- added an automatic return to the provider workspace whenever the runtime is not fully configured, so users cannot land in another workspace and conclude the model selector is gone
- re-verified the web package through typecheck, server build, route tests, and production build after the console visibility fix

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`
- `npm run web:build`

Commit:

- `1374a56` - `Restore visible provider model setup in console`

Push:

- succeeded: `git push origin main` pushed functional commit `1374a56` to `origin/main`
## 2026-06-22

Objective:

Restore provider setup reliability in the console when the local voice config route is missing or stale.

Summary:

- updated `waveary-web/src/App.tsx` so `loadInitialState()` no longer hard-fails the entire console when `/api/voice/config` returns `404`
- kept provider presets, saved provider config, session metadata, and model setup on the required init path while downgrading voice-config loading to an optional warning-only branch
- verified the specific split-state regression directly against the local dev server: `/api/provider/presets` returned the expected provider list while `/api/voice/config` still returned `404`
- preserved the existing provider/model setup UX instead of refactoring that flow again, so this fix only hardens initialization against adjacent voice-route drift

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `curl.exe -s http://127.0.0.1:4173/api/provider/presets`
- `curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:4173/api/voice/config`

Commit:

- `ba4a3af` - `Tolerate missing voice config during console init`

Push:

- pending

## 2026-06-22

Objective:

Make真人语音 usable even when the active chat provider does not expose a strong `/audio/speech` path.

Summary:

- extended `waveary-web/server/voice-config.ts` so saved voice config can now choose between `shared` chat-provider mode and a `dedicated` voice-provider mode, with separate `provider`, `baseURL`, and `apiKey` fields for TTS
- updated `waveary-web/server/voice-runtime.ts` so provider-backed TTS now prefers the dedicated voice provider when configured, instead of always reusing the saved chat provider
- widened the `/api/voice/config` request shape and the chat-page voice strip so the browser UI can switch between shared and dedicated voice sources without rewriting the rest of the chat flow
- added route-level regression coverage proving that chat can stay on one provider while真人语音 playback uses a separate OpenAI-compatible `/audio/speech` endpoint successfully

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`

Commit:

- `b4c460a` - `Add dedicated provider-backed voice path`

Push:

- succeeded: `git push origin main` pushed functional commit `b4c460a` to `origin/main`

## 2026-06-22

Objective:

Add Doubao as the first dedicated domestic真人语音 adapter without disturbing the already-working OpenAI-compatible voice path.

Summary:

- added `waveary-voice/src/doubao-tts-provider.ts` plus test coverage as the first provider-specific domestic TTS adapter, posting ByteDance-style request bodies and returning provider audio in the same shared `TextToSpeechResult` contract
- extended saved voice config so dedicated voice mode now also stores `appId` and `cluster`, which are required by the Doubao path but do not belong in the normal chat provider config
- updated `waveary-web/server/voice-runtime.ts` so dedicated voice mode now branches between `doubao` and the earlier OpenAI-compatible adapter instead of forcing all真人语音 through `/audio/speech`
- widened the chat-page dedicated voice UI so choosing `provider = doubao` reveals `App ID` and `Cluster` fields beside the dedicated voice key and voice name inputs
- added route-level regression proving the web voice route can successfully synthesize through a dedicated Doubao configuration while leaving the normal chat provider untouched

Files changed:

- `waveary-voice/src/doubao-tts-provider.ts`
- `waveary-voice/src/doubao-tts-provider.test.ts`
- `waveary-voice/src/index.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`

Commit:

- `60953e3` - `Add dedicated Doubao voice adapter`

Push:

- succeeded: `git push origin main` pushed functional commit `60953e3` to `origin/main`


## 2026-06-22

Objective:

Add the first local/self-hosted voice-provider path through a generic HTTP bridge without disturbing the already-working shared, dedicated OpenAI-compatible, or Doubao voice flows.

Summary:

- added `waveary-voice/src/local-http-tts-provider.ts` plus direct package tests as a generic self-hosted TTS adapter that can accept either raw audio responses or normalized JSON base64 audio payloads
- extended saved voice config so dedicated voice mode now also stores `endpointPath`, `engine`, `speaker`, and `referenceVoiceId` for local bridge setups
- updated `waveary-web/server/voice-runtime.ts` so dedicated voice mode now branches between `doubao`, `local`, and the earlier OpenAI-compatible adapter instead of assuming all non-Doubao真人语音 should hit `/audio/speech`
- widened the chat-page dedicated voice UI so choosing `provider = local` reveals `Engine`, `Endpoint`, `Speaker`, and `Reference Voice ID` fields beside the existing dedicated voice controls
- added route-level regression proving the web voice route can successfully synthesize through a dedicated local self-hosted configuration while leaving the normal chat provider untouched

Files changed:

- `waveary-voice/README.md`
- `waveary-voice/src/index.ts`
- `waveary-voice/src/local-http-tts-provider.ts`
- `waveary-voice/src/local-http-tts-provider.test.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`

Commit:

- `d872579` - `Add local self-hosted voice bridge`

Push:

- succeeded: `git push origin main` pushed functional commit `d872579` to `origin/main`

## 2026-06-22

Objective:

Add the first local/self-hosted voice-provider path through a generic HTTP bridge without disturbing the already-working shared, dedicated OpenAI-compatible, or Doubao voice flows.

Summary:

- added waveary-voice/src/local-http-tts-provider.ts plus direct package tests as a generic self-hosted TTS adapter that can accept either raw audio responses or normalized JSON base64 audio payloads
- extended saved voice config so dedicated voice mode now also stores endpointPath, engine, speaker, and referenceVoiceId for local bridge setups
- updated waveary-web/server/voice-runtime.ts so dedicated voice mode now branches between doubao, local, and the earlier OpenAI-compatible adapter instead of assuming all non-Doubao voice requests should hit /audio/speech
- widened the chat-page dedicated voice UI so choosing provider = local reveals Engine, Endpoint, Speaker, and Reference Voice ID fields beside the existing dedicated voice controls
- added route-level regression proving the web voice route can successfully synthesize through a dedicated local self-hosted configuration while leaving the normal chat provider untouched

Files changed:

- waveary-voice/README.md
- waveary-voice/src/index.ts
- waveary-voice/src/local-http-tts-provider.ts
- waveary-voice/src/local-http-tts-provider.test.ts
- waveary-web/server/provider-api.test.ts
- waveary-web/server/provider-api.ts
- waveary-web/server/voice-config.ts
- waveary-web/server/voice-runtime.ts
- waveary-web/src/App.tsx
- PROJECT_STATE.md
- ACTIVE_TASKS.md
- docs/decision-log.md
- docs/session-log.md

Verification:

- npm run check --workspace @waveary/voice
- npm run test --workspace @waveary/voice
- npm run build:server --workspace @waveary/web
- npm run test --workspace @waveary/web

Commit:

- d872579 - Add local self-hosted voice bridge

Push:

- succeeded: git push origin main pushed functional commit d872579 to origin/main
## 2026-06-22

Objective:

Make voice output follow an explicit companion delivery contract from chat/runtime instead of relying only on raw text plus generic emotion hints.

Summary:

- added a shared `companion-delivery` mapper in the web server layer that turns relationship stage plus companion emotion into a structured delivery hint (`style / pace / closeness / expressiveness`)
- updated `waveary-web/server/chat-runtime.ts` and `chat-session-store.ts` so normal chat turns now return that delivery hint alongside reply text, relationship, memory, timeline, and emotion
- updated `waveary-web/server/voice-runtime.ts`, `/api/voice/speak`, and `waveary-web/src/App.tsx` so live reply playback forwards the delivery hint into the voice layer
- updated `waveary-voice` browser speech planning and OpenAI-compatible TTS instruction building so they both consume the explicit delivery hint instead of only guessing from the reply text
- added regression coverage proving that the voice route honors delivery hints and that `/api/chat/turn` now returns a structured companion delivery hint for downstream voice

Files changed:

- `waveary-voice/src/types.ts`
- `waveary-voice/src/browser-speech-planner.ts`
- `waveary-voice/src/browser-speech-planner.test.ts`
- `waveary-voice/src/openai-compatible-tts-provider.test.ts`
- `waveary-voice/src/voice-presets.ts`
- `waveary-web/server/companion-delivery.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/voice`
- `npm run test --workspace @waveary/voice`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run build:server --workspace @waveary/web`
- `npm run test --workspace @waveary/web`

Commit:

- `e19b20c` - `Add companion delivery hints for voice`

Push:

- succeeded: `git push origin main` pushed functional commit `e19b20c` to `origin/main`

## 2026-06-23

Objective:

Expose the richer local/self-hosted voice tuning controls in the chat voice strip and complete the previously verified backend bridge enhancement as a fully resumable voice step.

Summary:

- extended the local self-hosted voice config shape end-to-end so the generic HTTP bridge persists and forwards `textLanguage`, `promptLanguage`, `referenceTranscript`, `stylePrompt`, `styleStrength`, `temperature`, and `topP` in addition to the earlier local bridge fields
- kept the architecture generic by preserving the normalized local HTTP boundary instead of binding the web layer to one self-hosted engine family, while also forwarding the shared `delivery` hint into the local bridge payload
- updated `waveary-web/src/App.tsx` so the existing chat voice strip now exposes those richer local-only controls only when `provider = local`, without reworking the broader provider, chat, or permission surfaces
- added minimal styling support for multiline local prompt/reference fields in the existing voice control strip and cleaned the accidental BOM-only diff in `App.tsx` before verification

Files changed:

- `waveary-voice/src/local-http-tts-provider.ts`
- `waveary-voice/src/local-http-tts-provider.test.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/voice`
- `npm run build:server --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `591557e` - `Expose richer local self-hosted voice controls`

Push:

- succeeded: `git push origin main` pushed functional commit `591557e` to `origin/main`

## 2026-06-23

Objective:

Run a focused browser verification pass for the chat-page local self-hosted voice controls before touching the next voice implementation step.

Summary:

- restarted the local `waveary-web` dev server and verified `http://127.0.0.1:4173/` was healthy again before opening the chat page
- used Playwright against `http://127.0.0.1:4173/#chat` to confirm the live voice strip still renders correctly with the realtime voice button, dedicated voice mode, and compact chat layout intact
- confirmed that switching the dedicated voice provider input to `local` expands the new local-only controls exactly as intended, including `engine`, `endpointPath`, `speaker`, `referenceVoiceId`, `textLanguage`, `promptLanguage`, `referenceTranscript`, `stylePrompt`, `styleStrength`, `temperature`, and `topP`
- confirmed through `/api/voice/config` plus a refresh pass that edited local fields such as `provider`, `textLanguage`, `promptLanguage`, and `stylePrompt` persist correctly; the only observed browser-console error during the pass was an external Google Fonts timeout rather than a Waveary runtime failure

Files changed:

- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-voice-pass open http://127.0.0.1:4173/#chat --headed`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-voice-pass resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s=waveary-voice-pass snapshot`
- `curl.exe -s http://127.0.0.1:4173/api/voice/config`

Commit:

- `1cf326c` - `Tighten voice console onboarding flow`

Push:

- succeeded: `git push origin main` pushed functional commit `1cf326c` to `origin/main`

## 2026-06-23

Objective:

Move voice configuration into its own console workspace and shrink the chat-page voice surface back to a compact live-entry strip.

Summary:

- added a fifth console workspace dedicated to voice so realtime voice routing, preset selection, dedicated provider settings, and local bridge tuning no longer have to live inline inside the chat page
- reused the existing saved voice config state and handlers instead of introducing a second voice settings flow, keeping provider-backed, Doubao, and local self-hosted fields aligned with the existing `/api/voice/config` path
- restored the chat page to a more companion-first shape by replacing the long inline voice provider form with a compact live-voice entry summary plus a direct jump back to the console voice workspace
- browser-verified that the console now renders five workspace tabs, the new voice workspace opens correctly, the compact chat-page voice summary appears, and the legacy inline form is hidden from the conversation surface

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `curl.exe -I http://127.0.0.1:4173/`
- Playwright DOM verification for `http://127.0.0.1:4173/#console` and `http://127.0.0.1:4173/#chat` confirming `tabCount = 5`, `voiceHeading = 语音控制台`, `consoleVoiceSelects = 18`, `compactSummary = 1`, and hidden legacy inline voice controls

Commit:

- `1cf326c` - `Tighten voice console onboarding flow`

Push:

- succeeded: `git push origin main` pushed functional commit `1cf326c` to `origin/main`

## 2026-06-23

Objective:

Make the console voice workspace follow a provider-onboarding flow closer to model setup, instead of relying only on local voice presets.

Summary:

- added dedicated voice-provider presets plus a new `/api/voice/presets` route so the voice console can start from known vendor paths such as OpenAI TTS, Doubao TTS, and the local voice bridge
- added `/api/voice/catalog` so OpenAI-compatible voice vendors can now fetch real model catalogs from their `/models` endpoint while still using provider-mapped voice-name directories where no shared cross-vendor voice-list API exists
- kept Doubao and local bridge behavior realistic instead of pretending they expose one universal discoverable voice-list contract: Doubao and local now return input-mode catalogs, while OpenAI-compatible vendors return discovered models plus mapped voice options
- browser-verified that the voice console now shows a selectable voice-provider preset control and a `获取语音模型 / Fetch voice catalog` action without regressing the earlier compact chat-page voice surface

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- Playwright DOM verification for `http://127.0.0.1:4173/#console` confirming a voice-provider preset select is present and the `获取语音模型 / Fetch voice catalog` button is visible inside the voice workspace

Commit:

- `1cf326c` - `Tighten voice console onboarding flow`

Push:

- succeeded: `git push origin main` pushed functional commit `1cf326c` to `origin/main`

## 2026-06-23

Objective:

Tighten the console voice onboarding flow so it behaves more like model setup while staying honest about vendor-specific voice discovery limits.

Summary:

- updated `waveary-web/src/App.tsx` so switching voice provider mode or applying a voice-provider preset clears stale voice-catalog state instead of leaving the previous vendor's catalog visible
- changed the voice-console model selector to use normalized discovered model descriptors, matching the earlier provider-model setup behavior more closely
- changed the dedicated voice field so OpenAI-compatible vendors still use mapped selectable voices, while Doubao and local bridges now switch to explicit manual input instead of pretending there is one universal selectable voice list
- ran API-level verification proving `/api/voice/catalog` still returns `voiceFieldMode: input` for both Doubao and local, and a focused DOM-level browser check confirming those vendors now render input fields rather than only dropdown selection

Files changed:

- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `curl.exe -s http://127.0.0.1:4173/api/voice/presets`
- `Invoke-RestMethod http://127.0.0.1:4173/api/voice/catalog` with `provider = doubao`
- `Invoke-RestMethod http://127.0.0.1:4173/api/voice/catalog` with `provider = local`
- Playwright-backed DOM check on `http://127.0.0.1:4173/#console` confirming Doubao and local voice vendors render manual input fields after catalog fetch

Commit:

- `1cf326c` - `Tighten voice console onboarding flow`

Push:

- succeeded: `git push origin main` pushed functional commit `1cf326c` to `origin/main`

## 2026-06-23

Objective:

Refine the console voice workspace into a clearer provider-specific control desk with more realistic vendor presets and a live guidance panel.

Summary:

- expanded `waveary-web/server/voice-config.ts` so the voice console now offers a broader preset roster for domestic and compatible vendors including SiliconFlow, Alibaba DashScope, and Volcengine Ark instead of stopping at OpenAI, Doubao, and local
- kept the architecture honest by recording per-preset voice-field behavior: OpenAI can still use a mapped selectable voice list, while other compatible vendors stay on manual `voice / speaker ID` entry instead of pretending one shared cross-vendor voice directory exists
- reworked `waveary-web/src/App.tsx` so the console voice form is now grouped by route, output selection, and provider-specific configuration rather than one long repeated field strip, with local-only and Doubao-only fields shown only when relevant
- turned the right-side voice console area into a mixed status-and-guidance panel that now explains what the active provider path expects and how the current fields should be filled, instead of leaving that area as a thin generic status readout
- added route-level regression coverage proving that a compatible manual-entry vendor such as SiliconFlow still discovers models while staying in `voiceFieldMode = input`, and re-verified frontend typecheck plus full web build after the console UX change

Files changed:

- `waveary-web/server/voice-config.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`

Commit:

- `614e6a0` - `Refine voice console provider workspace`

Push:

- succeeded: `git push origin main` pushed functional commit `614e6a0` to `origin/main`
## 2026-06-23

Objective:

Split legacy Doubao app-style voices from the newer OpenSpeech v3 route, clean the polluted voice-catalog access-key state, and verify that `multi_female_shuangkuaisisi_moon_bigtts` can reach real provider audio through the correct legacy route.

Summary:

- confirmed by direct upstream probes that the current v3 Doubao path with `X-Api-Resource-Id: seed-tts-2.0` works for current 2.0 speakers such as `zh_female_gaolengyujie_uranus_bigtts`, but correctly rejects `multi_female_shuangkuaisisi_moon_bigtts` with `resource ID is mismatched with speaker related resource`
- confirmed by direct upstream probes that the user-provided older Doubao `App ID + Access Token` path on `POST /api/v1/tts` can still synthesize successfully for `multi_female_shuangkuaisisi_moon_bigtts`, so that voice must stay on a separate legacy route instead of being forced into the v3 resource family
- added `DoubaoLegacyTextToSpeechProvider`, a `doubao-legacy` dedicated voice preset, route diagnostics for `appId`, and voice-console support for saving the legacy app credential shape without disturbing the current v3 Doubao route
- added config normalization that clears a polluted saved `accessKeyId` when it was accidentally overwritten with the same string as the selected voice ID and no secret key exists, preventing future sessions from confusing live speaker-discovery keys with normal voice selection state
- verified with UTF-8-safe escaped Chinese text that both the direct provider call and the live local `/api/voice/speak` route now return `provider = doubao-legacy`, `mode = audio`, and real provider audio bytes for the legacy route

Files changed:

- `waveary-voice/src/doubao-legacy-tts-provider.ts`
- `waveary-voice/src/doubao-legacy-tts-provider.test.ts`
- `waveary-voice/src/index.ts`
- `waveary-web/server/voice-config.ts`
- `waveary-web/server/voice-routing-diagnostics.ts`
- `waveary-web/server/voice-runtime.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/voice`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- direct Node `fetch` probes against `https://openspeech.bytedance.com/api/v3/tts/unidirectional`, confirming that `multi_female_shuangkuaisisi_moon_bigtts` mismatches `seed-tts-2.0` while current 2.0 speakers succeed
- direct Node `fetch` probes against `https://openspeech.bytedance.com/api/v1/tts`, confirming the user-provided legacy `App ID + Access Token` path succeeds for `multi_female_shuangkuaisisi_moon_bigtts`
- direct module-level verification with UTF-8-safe escaped Chinese text through `DoubaoLegacyTextToSpeechProvider`
- live local `POST http://127.0.0.1:4173/api/voice/speak` with UTF-8-safe escaped Chinese text, confirming `provider = doubao-legacy`, `mode = audio`, `routing.reasonCode = dedicated-doubao-legacy-ready`, and non-zero provider audio bytes

Commit:

- `0713ba0` - `Add legacy Doubao voice route`

Push:

- succeeded: `git push origin main` pushed functional commit `0713ba0` to `origin/main`
## 2026-06-24

Objective:

Make early companion identity feel natural by letting Waveary get to know the user through chat instead of a preset persona form, while preserving names and desired vibe into memory.

Summary:

- added `waveary-core/src/runtime/getting-to-know-you.ts` plus direct tests as a shared early-acquaintance helper that infers preferred user name, user-given companion nickname, desired style descriptors, and whether the next reply should invite one more personal detail
- updated `waveary-core/src/adapters/openai-compatible-provider.ts` so live-provider prompts now carry explicit getting-to-know-you guidance in the `new` relationship stage, including lighter mutual-discovery behavior when the turn is not practical or emotionally heavy
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` plus runtime regression so fallback replies now naturally ask what to call the user, let the user name the companion, or ask what kind of presence they want, instead of relying only on prompt-side behavior
- extended `waveary-memory/src/simple-memory-extractor.ts` and tests so early conversation details such as `call me Aki`, `I am going to call you Echo`, and preferred vibe descriptors like `playful / teasing / caring` are stored as durable memory candidates
- verified the change through `core -> memory` build/test order after catching two real issues during the pass: the new name parser originally misread `I am going to call you Echo` as user name `going`, and parallel build/test execution caused a false `dist` missing failure on Windows

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/index.ts`
- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-memory/src/simple-memory-extractor.ts`
- `waveary-memory/src/simple-memory-extractor.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/product-preferences.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/memory`
- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core; npm run test --workspace @waveary/core; npm run build --workspace @waveary/memory; npm run test --workspace @waveary/memory`

Commit:

- `35e0c64` - `Add natural getting-to-know-you dialogue guidance`

Push:

- pending
## 2026-06-24

Objective:

Strengthen live-provider dialogue regression for companionship cadence and early-acquaintance prompts without widening the frontend or changing unrelated runtime behavior.

Summary:

- extended `waveary-core/src/adapters/openai-compatible-provider.test.ts` with focused prompt-body regression for four high-value cases: practical new-stage turns staying short, emotional new-stage turns staying presence-first, reconnection turns staying short and emotion-led, and `What should I call you?` correctly entering mutual-discovery guidance
- while adding those tests, found one real bug: the current getting-to-know-you guidance treated direct companion-name questions as generic practical requests because `reply-shape` marked `what` questions as `practical` first
- fixed that bug with a minimal runtime change in `waveary-core/src/runtime/getting-to-know-you.ts` by prioritizing `latestTurnAskedCompanionName` ahead of the generic practical-turn deflection, so the system now preserves natural mutual discovery when the user asks the companion's name
- re-verified the whole `@waveary/core` package through typecheck, rebuild, and compiled tests after the fix; no frontend or memory-layer changes were needed for this pass

Files changed:

- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/getting-to-know-you.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core; npm run test --workspace @waveary/core`

Commit:

- `86fc75c` - `Add provider dialogue regression coverage`

Push:

- pending

## 2026-06-24

Objective:

Strengthen dialogue continuity again so more oblique emotional follow-ups still stay anchored to the previous user topic instead of reading like isolated fragments.

Summary:

- rebuilt `waveary-core/src/runtime/continuity-thread.ts` into a cleaner ASCII-safe version around the carry-over detection block, preserving the earlier short-follow-up logic while adding explicit support for oblique emotional residue turns such as `that part still hurts`, `I am not over it yet`, and `我还没过去，还是那个感觉`
- adjusted the history-aware focus summary path so provider prompts now preserve the previous topic plus the new emotional carry-over line together, instead of accidentally collapsing the focus back onto the new fragment alone
- added focused regression coverage in both `waveary-core/src/runtime/continuity-thread.test.ts` and `waveary-core/src/adapters/openai-compatible-provider.test.ts` for English and Chinese emotional carry-over follow-ups
- verified the full `@waveary/core` package again after the continuity-file rebuild, including check, build, and compiled tests

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `7adeace` - `Handle oblique emotional follow-up continuity`

Push:

- pending

## 2026-06-24

Objective:

Strengthen dialogue continuity so short carry-over user follow-ups still stay anchored to the immediately previous topic instead of being treated like isolated new requests.

Summary:

- updated `waveary-core/src/runtime/continuity-thread.ts` so continuity matching now detects short carry-over follow-ups and blends them with the previous user turn when the new message is clearly elliptical rather than self-contained
- added a history-aware focus summary path so live provider prompts can describe the current turn as `Continuing ... Follow-up now ...`, which gives stronger grounding for high-end model replies
- added focused regression coverage in both `waveary-core/src/runtime/continuity-thread.test.ts` and `waveary-core/src/adapters/openai-compatible-provider.test.ts` to lock the new continuation behavior before later dialogue-quality work
- kept the change narrow to `waveary-core` dialogue logic and avoided frontend or provider-route churn

Files changed:

- `waveary-core/src/runtime/continuity-thread.ts`
- `waveary-core/src/runtime/continuity-thread.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }; & node --test @files`

Commit:

- `c380a5a` - `Blend short follow-up turns into continuity matching`

Push:

- pending

## 2026-06-24

Objective:

Remove the separate roadmap page from the public web surface and turn it into a stronger homepage-ending project-route section without disturbing the console or chat flows.

Summary:

- removed the standalone top-nav roadmap destination from the live homepage shell and kept only `home / console / chat` in the public top navigation
- kept old `#roadmap` links truthful by redirecting that hash into the homepage closing section instead of breaking existing anchors and CTA buttons
- replaced the old future-roadmap framing with a stronger `Project Route / 项目路线` close that presents Waveary as an already-built progression from framework substrate, to continuity systems, to presence, to voice
- removed the leftover duplicated route paragraph from `waveary-web/src/App.tsx` and deleted the temporary CSS hide-rule that had only been masking that stale text
- polished the closing route cards into a more formal end-of-homepage promo block with clearer `step / track` hierarchy and a stronger full-width section heading treatment

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `npm run web:build`
- `curl.exe -I http://127.0.0.1:4173/`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-route-polish open http://127.0.0.1:4173/#home --headed`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-route-polish resize 1440 1200`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-route-polish snapshot`
- `npx --yes --package @playwright/cli playwright-cli -s waveary-route-polish eval "window.location.hash = '#roadmap'"`

Commit:

- `e704c09` - `Move project route into homepage close`

Push:

- succeeded: `git push origin main` pushed functional commit `e704c09` to `origin/main`

## 2026-06-24

Objective:

Fix the voice-console discoverability bug where the UI could report a loaded voice catalog but still make the actual selectable voices look missing.

Summary:

- confirmed the bug was frontend-side discoverability, not missing data: the console could already show `已加载语音目录：1 个模型，13 个可选音色。` while the actual select-mode voices were still hidden behind a subtle extra trigger
- updated `waveary-web/src/App.tsx` so loaded select-mode voice catalogs now render their searchable in-panel voice list directly instead of requiring a second hidden click before any options become visible
- kept the provider contract unchanged: no backend route shape changed, and manual-input vendors still stay on their explicit text-entry path
- simplified the picker presentation in `waveary-web/src/styles.css` so the current selected voice summary stays visible above the list while the searchable catalog remains plainly exposed below it

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`
- `npm run web:build`

Commit:

- `932ffa1` - `Expose loaded voice catalogs directly`

Push:

- succeeded: `git push origin main` pushed functional commit `932ffa1` to `origin/main`

## 2026-06-24

Objective:

Add a reliable post-commit local test-memory reset flow so stale chat/session memory can be cleared before the next live Waveary verification pass without wiping saved provider or voice configuration.

Summary:

- added `POST /api/chat/sessions/reset-all` in `waveary-web/server/provider-api.ts` plus `resetAllChatSessions()` in `waveary-web/server/chat-session-store.ts` so the running local server can clear persisted chat memory and rebuild the default `waveary-main` shell in one step
- added regression coverage in `waveary-web/server/provider-api.test.ts` proving the reset-all route clears both the default and extra sessions while preserving the default-session shell and returning file-backend persistence status
- added the root `npm run reset:test-memory` command via `tools/reset-waveary-test-memory.mjs`, which first tries the running local API and falls back to deleting only chat-memory files under `.waveary/`
- preserved `provider-config.json` and `voice-config.json` during the reset flow, matching the user's workflow requirement to clear stale remembered dialogue without redoing model and voice setup
- recorded the durable workflow preference in `docs/product-preferences.md`, because this reset should survive future context compression and session restarts

Files changed:

- `docs/product-preferences.md`
- `package.json`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `tools/reset-waveary-test-memory.mjs`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run reset:test-memory`

Commit:

- `ef798e7` - `Add local test memory reset flow`

Push:

- succeeded: `git push origin main` pushed functional commit `ef798e7` to `origin/main`

## 2026-06-24

Objective:

Add a bounded concept-level identity-summary layer so Waveary can persist higher-level understanding of the user and the bond instead of relying only on recalled fact fragments.

Summary:

- added `waveary-core/src/domain/identity.ts`, `InMemoryIdentityStore`, and `SimpleIdentityEngine` as the first explicit concept-level identity-memory layer
- extended `waveary-core` provider/runtime contracts so `IdentitySummary` can be loaded before reply generation, injected into live-provider prompt assembly, updated after each turn, and persisted through repository-backed and SQLite session state
- updated scripted fallback and live-provider prompt guidance so both paths can use stable bond and user-understanding cues rather than only raw memory snippets
- wired the new runtime dependencies through `waveary-web/server/chat-runtime.ts`, `waveary-web/server/chat-session-store.ts`, and the example entrypoints without widening the browser export/import schema yet
- added focused regression coverage for identity-summary derivation, persistence, prompt injection, runtime result shape, and web server integration, then re-verified both `@waveary/core` and `@waveary/web`
- re-confirmed an existing workflow caveat during verification: `@waveary/core` compiled-test runs must stay serial with `build` on Windows because parallel `dist` use can make tests read a missing or stale build tree

Files changed:

- `examples/src/run-demo.ts`
- `examples/src/run-openai-demo.ts`
- `examples/src/verify-provider.ts`
- `waveary-core/src/adapters/in-memory-identity-store.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/adapters/simple-identity-engine.test.ts`
- `waveary-core/src/adapters/simple-identity-engine.ts`
- `waveary-core/src/domain/identity.ts`
- `waveary-core/src/index.ts`
- `waveary-core/src/providers/interfaces.ts`
- `waveary-core/src/runtime/types.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `waveary-core/src/runtime/waveary-runtime.ts`
- `waveary-core/src/storage/repository-backed-session-state.test.ts`
- `waveary-core/src/storage/repository-backed-session-state.ts`
- `waveary-core/src/storage/session-state.ts`
- `waveary-core/src/storage/sqlite-session-state-repository.test.ts`
- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`
- `npm run test --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`

Commit:

- `c999e6d` - `Add concept-level identity summaries`

Push:

- succeeded: `git push origin main` pushed functional commit `c999e6d` to `origin/main`

## 2026-06-24

Objective:

Refine concept-level identity-summary derivation so ordinary chat, emotional turns, and relationship-warming turns produce more precise higher-level understanding instead of flattening into generic continuity or comfort labels.

Summary:

- refined `waveary-core/src/adapters/simple-identity-engine.ts` into a more signal-aware bounded rules layer that separates continuity, emotional-truth, cadence, tone, loneliness, overwhelm, naming, reconnection, and ritual cues instead of relying on a few broad keyword buckets
- kept stable identity themes merged conservatively, but now favor newer higher-signal entries for recurring needs and emotional patterns so fresh loneliness / overwhelm care requirements are not buried behind older generic comfort lines
- made relationship-warming bond summaries more specific by preserving remembered naming, repeated return, and small rituals when those are what actually make the bond feel more real
- added focused regression coverage in `waveary-core/src/adapters/simple-identity-engine.test.ts` for three failure-prone buckets: ordinary short-natural cadence preference without false vulnerability, emotional loneliness/overwhelm differentiation, and warming-stage naming/ritual trust inference
- re-verified `@waveary/core` serially on Windows through typecheck, rebuild, and compiled tests after one real failing test exposed a priority-order bug in bond-theme trimming

Files changed:

- `waveary-core/src/adapters/simple-identity-engine.ts`
- `waveary-core/src/adapters/simple-identity-engine.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `8fb3f8d` - `Refine identity summary derivation`

Push:

- succeeded: `git push origin main` pushed functional commit `8fb3f8d` to `origin/main`

## 2026-06-25

Objective:

Tighten identity-summary conflict handling so newer high-signal care needs can suppress older generic comfort themes instead of being flattened by them.

Summary:

- refined `waveary-core/src/adapters/simple-identity-engine.ts` so the summary merger can suppress stale generic comfort lines when the current turn clearly contains loneliness, overwhelm, anxiety, or sadness
- kept the narrower summary rules focused on the highest-signal emotional and bond cues, then added regression coverage proving the new care need can outrank the older generic theme
- updated the repository continuity files to reflect the new summary behavior and the next bounded identity-summary decision point

Files changed:

- `waveary-core/src/adapters/simple-identity-engine.ts`
- `waveary-core/src/adapters/simple-identity-engine.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `f976852` - `Tighten identity summary conflict handling`

Push:

- succeeded: `git push origin main` pushed functional commit `f976852` to `origin/main`

## 2026-06-26

Objective:

Extend the bounded managed-browser result-opening path so Waveary can explicitly open the requested nth visible result without widening into a broad browser agent.

Summary:

- extended `waveary-web/server/browser-automation.ts` with an explicit `openManagedBrowserNthVisibleLink(...)` path that reuses the same visible-link filtering logic while selecting a requested visible result index
- updated `waveary-web/server/provider-api.ts` so `/api/browser/open-result` now accepts `resultIndex`, preserving the existing route shape while adding explicit indexed selection
- updated `waveary-web/server/local-actions.ts` plus `waveary-web/server/local-action-audit.ts` so natural requests such as `open second result for Waveary` become a new bounded `browser_open_result_at_index` action with grounded execution, dismissal, and failure notes
- added route and chat-flow regression coverage in `waveary-web/server/provider-api.test.ts`, then re-verified the web package end to end

Files changed:

- `waveary-web/server/browser-automation.ts`
- `waveary-web/server/local-action-audit.ts`
- `waveary-web/server/local-actions.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/server/provider-api.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `73a6e5e` - `Add nth browser result opening`

Push:

- succeeded: `git push origin main` pushed functional commit `73a6e5e` to `origin/main`

## 2026-06-26

Objective:

Rewrite the root GitHub homepage into a stronger formal bilingual README that matches Waveary's current framework positioning.

Summary:

- replaced the older root `README.md` draft with a cleaner bilingual GitHub homepage centered on `回响之境 · Waveary`, the final slogan `念念不忘，终有回响。`, and the open source Digital Life Companion Framework positioning
- tightened the homepage information architecture into a more formal open-source-project flow: overview, why, positioning, core thesis, current capabilities, engines, architecture, repository structure, quick start, project route, and contribution entrypoints
- kept the README aligned with the current repository reality by using the actual monorepo packages and current root scripts instead of writing speculative module names or nonexistent commands
- re-verified the changed Chinese-facing lines with the repo mojibake guard and a direct `git diff`

Files changed:

- `README.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check:mojibake`
- `git diff -- README.md`

Commit:

- `2601439` - `Rewrite GitHub project homepage`

Push:

- succeeded: `git push origin main` pushed functional commit `2601439` to `origin/main`

## 2026-06-26

Objective:

Strengthen the GitHub homepage visually by adding a portrait-based hero banner and a public star-history chart to the root README.

Summary:

- created `docs/assets/readme-hero-fan.png` as a custom repository-local banner using the existing question-mark portrait set arranged in a fan of overlapping polaroid-style cards
- updated `README.md` to place that banner at the top of the GitHub homepage and added a dedicated `Star History` section powered by `star-history.com`
- kept the README structure otherwise intact while correcting one Chinese overview line and preserving the framework-first bilingual positioning
- re-verified the changed copy with the mojibake guard and a direct README diff

Files changed:

- `README.md`
- `docs/assets/readme-hero-fan.png`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check:mojibake`
- `git diff -- README.md docs/assets/readme-hero-fan.png`

Commit:

- `8427908` - `Polish README hero presentation`

Push:

- succeeded: `git push origin main` pushed functional commit `8427908` to `origin/main`

## 2026-06-26

Objective:

Make the GitHub homepage banner feel more dramatic and premium by flipping the portrait fan direction and tightening the static poster composition.

Summary:

- rebuilt `docs/assets/readme-hero-fan.png` from the existing portrait set as a new outward-fanned spread where the shorter inner arc stays tucked inside and the longer outer arc opens across the header
- strengthened the banner's static presentation with cleaner paper layering, softer but deeper shadows, calmer cream lighting, and a more deliberate title block so the README cover feels less like a stacked mockup and more like a formal project poster
- kept the change tightly scoped to GitHub-homepage presentation only, with no product or runtime code changes

Files changed:

- `docs/assets/readme-hero-fan.png`
- `PROJECT_STATE.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- visual inspection of `docs/assets/readme-hero-fan.png`
- `npm run check:mojibake`
- `git diff -- docs/assets/readme-hero-fan.png PROJECT_STATE.md docs/decision-log.md docs/session-log.md`

Commit:

- `8227a3d` - `Refine README hero banner composition`

Push:

- succeeded: `git push origin main` pushed functional commit `8227a3d` to `origin/main`

## 2026-06-26

Objective:

Remove the public named third-party benchmark note and keep repository guidance generic about external borrowing.

Summary:

- removed `docs/open-source-benchmark.md` so the public Waveary repository no longer carries a whitelist-style note naming outside projects
- replaced the earlier named-project guidance with a generic rule: do not publish external borrowing target lists in-repo, and review any real reuse case-by-case before code is brought in
- kept the product-learning direction intact by preserving the broader realism and dialogue-quality focus without tying public continuity files to named third-party shortlists

Files changed:

- `docs/product-preferences.md`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `git diff -- docs/product-preferences.md PROJECT_STATE.md ACTIVE_TASKS.md docs/decision-log.md docs/session-log.md`

Commit:

- `01d75ec` - `Add open-source chat benchmark note`

Push:

- succeeded: `git push origin main` pushed functional commit `01d75ec` to `origin/main`

## 2026-06-26

Objective:

Tighten everyday reply realism for low-stakes status updates so short check-in texts feel more like real messaging, while preventing those same status words from being mis-saved as user names.

Summary:

- refined `waveary-core/src/runtime/reply-shape.ts` so light status-update turns such as `I'm home now`, `I'm back`, and `just finished` are treated as a dedicated ordinary-chat subtype instead of falling through the broader low-intensity bucket
- updated `waveary-core/src/adapters/openai-compatible-provider.ts` so live-provider prompt instructions now explicitly tell the model to answer those quick updates with one warm acknowledgment and stop, rather than drifting into recap or assistant-like follow-up cadence
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so scripted fallback replies now also stay brief for that subtype instead of expanding into generic continuity or `tell me a little more` patterns
- fixed a real early-acquaintance regression in `waveary-core/src/runtime/getting-to-know-you.ts` where broad `I'm ...` parsing could misread status words like `home` or `done` as the user's preferred name
- added focused regression coverage across `reply-shape`, `getting-to-know-you`, live-provider prompt assembly, and runtime behavior, then re-verified the full compiled `@waveary/core` test suite

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/runtime/getting-to-know-you.ts`
- `waveary-core/src/runtime/getting-to-know-you.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | Sort-Object FullName | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `e2efa10` - `Tighten low-stakes chat cadence`

Push:

- succeeded: `git push origin main` pushed functional commit `e2efa10` to `origin/main`

## 2026-06-26

Objective:

Turn the internal `IdentitySummary` continuity layer into a visible web product surface so Waveary's higher-level user understanding is felt in the runtime UI instead of staying hidden inside prompt assembly.

Summary:

- updated `waveary-web/server/chat-runtime.ts` so chat-turn payloads now include `identitySummary` when the runtime returns it
- updated `waveary-web/server/chat-session-store.ts` so persisted session snapshots, export/import flows, and validation rules now carry `identitySummary` consistently across `snapshot.identitySummary` and `snapshot.latestInsights.identitySummary`
- added a lightweight `Companion Understanding` runtime panel in `waveary-web/src/App.tsx` backed by the existing concept-level summary fields for self-concept, bond themes, recurring needs, emotional patterns, and companion stance
- added the supporting runtime-shell styling in `waveary-web/src/styles.css`
- updated focused web tests in `waveary-web/server/provider-api.test.ts` to keep the new session snapshot contract explicit

Files changed:

- `waveary-web/server/chat-runtime.ts`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `031132c` - `Expose identity summaries in web runtime`

Push:

- succeeded: `git push origin main` pushed functional commit `031132c` to `origin/main`

## 2026-06-26

Objective:

Turn the new visible `Companion Understanding` panel into a bounded correction surface so the user can keep Waveary's higher-level understanding aligned with reality instead of leaving it as a read-only guess.

Summary:

- added a narrow identity-summary update path in `waveary-web/server/chat-session-store.ts` plus a dedicated `/api/chat/identity-summary` route in `waveary-web/server/provider-api.ts`
- kept the persistence contract coherent by saving corrected understanding back into persisted session state and mirroring the same corrected summary into `latestInsights`, so runtime snapshots and export/import-visible state do not drift
- updated `waveary-web/src/App.tsx` so the existing runtime `Companion Understanding` card now supports an in-place edit mode with bounded section editing and save/cancel actions instead of introducing a separate persona-setup page
- added matching runtime-shell styling in `waveary-web/src/styles.css`
- added a focused route test in `waveary-web/server/provider-api.test.ts` proving that a saved correction persists through `/api/chat/session` and updates both `session.identitySummary` and `session.latestInsights.identitySummary`

Files changed:

- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`

Commit:

- `bc9df0a` - `Add editable companion understanding panel`

Push:

- succeeded: `git push origin main` pushed functional commit `bc9df0a` to `origin/main`

## 2026-06-26

Objective:

Fix stale provider-session reuse so saving a new provider key or model in the console immediately affects the next chat turn instead of leaving the active session on an old in-memory provider config.

Summary:

- updated `waveary-web/server/provider-api.ts` so `POST /api/provider/config` now calls `resetChatRuntimeSessions()` right after `saveProviderConfig(...)`
- added a focused regression in `waveary-web/server/provider-api.test.ts` proving that the same active session switches from `model-a` to `model-b` on the very next chat turn after saving a new provider config
- confirmed the fix through `@waveary/web` typecheck and full server test coverage, with the new regression passing alongside the existing runtime-cache reset coverage for chat persistence switching

Files changed:

- `waveary-web/server/provider-api.ts`
- `waveary-web/server/provider-api.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`

Commit:

- `d8f4682` - `Reset chat runtime on provider config save`

Push:

- succeeded later: `git push origin main` advanced `origin/main` to include `d8f4682`, and continuity was left stale until the next recorded sync

## 2026-06-26

Objective:

Add a dedicated micro-ack cadence so tiny confirmations get one short human reply instead of assistant-style recap or follow-up drift.

Summary:

- updated `waveary-core/src/runtime/reply-shape.ts` so tiny confirmations such as `got it`, `okay`, `sure`, `收到`, `知道了`, and `嗯嗯` are classified as a dedicated `micro_ack` ordinary subtype instead of falling through the broader ordinary-chat bucket
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so scripted fallback replies now return only the short acknowledgment prefix for `micro_ack` turns instead of adding continuity or follow-up pressure
- added focused regression coverage in `waveary-core/src/runtime/reply-shape.test.ts`, `waveary-core/src/adapters/openai-compatible-provider.test.ts`, and `waveary-core/src/runtime/waveary-runtime.test.ts` proving both prompt guidance and runtime output stay very short for these tiny confirmations
- re-verified the full compiled `@waveary/core` test suite after the bounded realism pass

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | Sort-Object FullName | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `afe4379` - `Add micro-ack chat cadence`

Push:

- succeeded: `git push origin main` pushed functional commit `afe4379` to `origin/main`

## 2026-06-26

Objective:

Extend the new `micro_ack` cadence to softer acknowledgment endings so low-stakes closers still get one short human reply instead of broader ordinary-chat drift.

Summary:

- updated `waveary-core/src/runtime/reply-shape.ts` so softer acknowledgment endings such as `okay then`, `gotcha`, `sounds good then`, `知道啦`, `收到啦`, `好喔`, `好哦`, `好啦`, and `行呀` are also classified as `micro_ack` turns
- added focused regression coverage in `waveary-core/src/runtime/reply-shape.test.ts`, `waveary-core/src/adapters/openai-compatible-provider.test.ts`, and `waveary-core/src/runtime/waveary-runtime.test.ts` so both prompt guidance and runtime behavior stay on the same one-line acknowledgment track for these softer closers
- kept the change fully inside the shared reply-shape realism layer, preserving the current small-cut strategy for improving everyday companion cadence
- re-verified the full compiled `@waveary/core` test suite after the bounded cadence expansion

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | Sort-Object FullName | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `fb7bd53` - `Broaden micro-ack endings`

Push:

- succeeded: `git push origin main` pushed functional commit `fb7bd53` to `origin/main`

## 2026-06-26

Objective:

Improve GitHub discoverability by adding Chinese-aware repository metadata without changing the repository URL.

Summary:

- kept the repository name as `Waveary` to avoid changing the GitHub URL, clone path, badges, and inbound links
- updated the GitHub `About` description to include both Chinese and English positioning around `回响之境`, `开源数字生命陪伴框架`, and the current framework scope
- replaced the repository topics with a broader search-oriented set that stays URL-safe while still covering Chinese discovery through pinyin and companion-framework semantics, including `hui-xiang-zhi-jing`, `digital-life-companion`, `companion-framework`, `memory-framework`, and related runtime terms
- recorded the new public repository metadata back into continuity files so future sessions do not drift back to the older English-only GitHub surface

Files changed:

- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `gh repo view K2st0r/Waveary --json name,description,url,homepageUrl`
- `gh api repos/K2st0r/Waveary/topics -H "Accept: application/vnd.github+json"`

Commit:

- not applicable; this work updated GitHub repository metadata directly and only synced local continuity notes

Push:

- not applicable

## 2026-06-26

Objective:

Broaden the everyday short-texting realism pass so lightly deferential closers stay on the same one-line human acknowledgment track as other `micro_ack` turns.

Summary:

- updated `waveary-core/src/runtime/reply-shape.ts` so lightly deferential closers such as `we can do that then`, `that works then`, `guess that's fine then`, `那行吧`, `先这样`, and `那就先这样` are also classified as `ordinarySubtype: micro_ack`
- added focused regression coverage in `waveary-core/src/runtime/reply-shape.test.ts`, `waveary-core/src/adapters/openai-compatible-provider.test.ts`, and `waveary-core/src/runtime/waveary-runtime.test.ts` so both prompt guidance and scripted runtime behavior keep those closers short and stop cleanly
- kept the change fully inside the shared reply-shape realism layer, preserving the current small-cut strategy for improving everyday companion cadence without reopening architecture or frontend work

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | Sort-Object FullName | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `7d1b3e1` - `Broaden deferential micro-ack cadence`

Push:

- succeeded: `git push origin main` pushed functional commit `7d1b3e1` to `origin/main`

## 2026-06-26

Objective:

Make provider-config persistence feel truthful in the web console by distinguishing unsaved draft credentials from the saved runtime config that chat actually uses.

Summary:

- updated `waveary-web/src/App.tsx` with a bounded provider-draft helper layer so the provider workspace can compare current inputs against the saved provider config instead of treating every visible field as already active
- added a masked saved API key preview plus two explicit saved-vs-draft status surfaces in the provider workspace, so users can immediately see whether chat is using the current inputs or the previously saved config
- kept the change frontend-only and runtime-truthful: chat still uses the saved backend config, but the UI now says so clearly instead of making API key edits look broken

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run test --workspace @waveary/web`
- `npm run check:mojibake`

Commit:

- `2ecfe92` - `Clarify provider draft vs saved runtime config`

Push:

- succeeded: `git push origin main` pushed functional commit `2ecfe92` to `origin/main`

## 2026-06-26

Objective:

Tighten everyday companion realism one more step by giving lightly hedged micro-updates and quiet plan confirmations their own short texting cadence.

Summary:

- updated `waveary-core/src/runtime/reply-shape.ts` so bounded low-stakes lines such as `maybe a bit later`, `I think I'll head back soon`, and similar short hesitant updates are classified as `ordinarySubtype: soft_update`
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so scripted fallback keeps those turns brief and question-light instead of reopening the conversation with ordinary follow-up pressure
- added focused regression coverage in `waveary-core/src/runtime/reply-shape.test.ts`, `waveary-core/src/adapters/openai-compatible-provider.test.ts`, and `waveary-core/src/runtime/waveary-runtime.test.ts` so prompt guidance and runtime output stay aligned on this new low-stakes texting bucket
- confirmed an additional workflow caveat during verification: on this Windows workspace, `@waveary/core` build and compiled `dist` tests must be run sequentially, not in parallel, or the shared `dist` directory can produce misleading false failures

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | Sort-Object FullName | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- `9dc4cd8` - `Add soft-update chat cadence`

Push:

- succeeded: `git push origin main` pushed functional commit `9dc4cd8` and continuity sync commit `ef6a05e` to `origin/main`

## 2026-06-26

Objective:

Continue tightening everyday companion realism by giving small apology and delayed-reply repair texts their own short, warm resume-the-thread cadence.

Summary:

- updated `waveary-core/src/runtime/reply-shape.ts` so bounded low-stakes apology or delayed-reply lines such as `sorry for the late reply`, `just saw this`, `回晚了`, and `刚刚在忙` are classified as `ordinarySubtype: delay_repair`
- updated `waveary-core/src/adapters/scripted-chat-provider.ts` so scripted fallback keeps those turns brief, warm, and low-pressure instead of reopening the thread with a follow-up question
- added focused regression coverage in `waveary-core/src/runtime/reply-shape.test.ts`, `waveary-core/src/adapters/openai-compatible-provider.test.ts`, and `waveary-core/src/runtime/waveary-runtime.test.ts` so prompt guidance and runtime output stay aligned on this new everyday-texting bucket
- re-verified `@waveary/core` in the stored sequential Windows order: `check`, then `build`, then compiled `dist` tests

Files changed:

- `waveary-core/src/runtime/reply-shape.ts`
- `waveary-core/src/runtime/reply-shape.test.ts`
- `waveary-core/src/adapters/scripted-chat-provider.ts`
- `waveary-core/src/adapters/openai-compatible-provider.test.ts`
- `waveary-core/src/runtime/waveary-runtime.test.ts`
- `ACTIVE_TASKS.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `npm run check --workspace @waveary/core`
- `npm run build --workspace @waveary/core`
- PowerShell compiled-test verification via:
  `$files = @(Get-ChildItem 'waveary-core\\dist' -Recurse -Filter '*.test.js' | Sort-Object FullName | ForEach-Object { $_.FullName }); & node --test @files`

Commit:

- pending

Push:

- pending
