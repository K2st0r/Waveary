# Session Log

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

- pending

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

- pending

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

- pending

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

- pending at time of record; local branch was ahead of origin by one commit before the current burn-vignette refinement pass

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
- added a topbar `中 / EN` language toggle that keeps the current visual paper-and-doodle direction and persists the selected locale locally
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
