# Session Log

This file records recent verified Waveary work blocks in chronological form.

It is intentionally compact.
Git history keeps the fine-grained archive; this file keeps the current continuation trail.

## 2026-07-01

Objective:

Fix the runtime shell bug where lower left-sidebar controls were not clickable at shorter desktop heights and the right chat utility rail could feel missing.

Summary:

- changed the app sidebar grid to give the middle navigation a real scrollable `minmax(0, 1fr)` row
- kept the sidebar footer in its own non-overlapping layer and compacted it at shorter desktop heights
- stabilized the chat runtime grid so the right utility rail keeps a visible fixed strip
- verified the sidebar hit targets and chat rail at `1080x760` with Playwright

Files changed:

- `waveary-web/src/styles.css`

Verification:

- Playwright hit-test check at `1080x760`: all 7 `.app-sidebar-nav-item` centers hit their own button content
- Playwright click-flow check: each sidebar item activates its matching console workspace
- Playwright rail check at `#chat`: `.chat-utility-rail` visible with 68px width and chat / console buttons present
- `npm run check --workspace @waveary/web`
- `npm run check:mojibake`

Commit:

- `377e6a5` - `Fix runtime sidebar hit areas`

Push:

- pending continuity sync

## 2026-06-28

Objective:

Make the public GitHub onboarding usable for real users instead of only developers who can infer the monorepo startup path.

Summary:

- rewrote the public README and deployment guidance into practical onboarding docs
- split public onboarding into separate English and Simplified Chinese documents instead of mixed inline bilingual copy
- kept the public repo identity aligned with the framework-first companion direction

Files changed:

- `README.md`
- `README.zh-CN.md`
- `docs/deployment-guide.md`
- `docs/deployment-guide.zh-CN.md`
- continuity docs from that work block

Verification:

- manual review of startup and deployment instructions against real repo scripts

Commit:

- multiple verified commits in this period; later continuity docs now summarize this as the onboarding baseline

Push:

- succeeded

## 2026-06-29

Objective:

Move the runtime shell toward the approved client-style layout and improve session-scoped companion persistence.

Summary:

- removed the product's dependency on an internal homepage and moved the runtime default flow to active surfaces
- adopted the left-sidebar shell as the main runtime structure instead of the old top navigation
- tightened the chat and console shell to feel more like a focused client
- persisted session companion-profile setup more fully so portrait, naming, vibe, and related profile data survive edit and export/import flows

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- `waveary-web/server/chat-session-store.ts`
- `waveary-web/server/provider-api.ts`
- related tests
- continuity docs from those work blocks

Verification:

- `npm run test --workspace @waveary/web`
- `npm run build --workspace @waveary/web`
- `npm run build:server --workspace @waveary/web`
- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check:mojibake`

Commit:

- `a7f3034` - `Simplify sidebar shell entrypoints`

Push:

- succeeded: pushed to `origin/main`

## 2026-06-30

Objective:

Polish the grouped console shell so sparse workspaces and session-control surfaces feel denser and more client-like.

Summary:

- rebalanced grouped console workspaces into a more stable control-desk structure
- kept provider, sessions, skills, channels, and settings inside one denser stage rhythm
- preserved the sidebar-first shell direction and avoided reintroducing long explanatory control pages

Files changed:

- `waveary-web/src/App.tsx`
- `waveary-web/src/styles.css`
- continuity docs from that work block

Verification:

- `npx tsc --noEmit -p waveary-web/tsconfig.json`
- `npm run check --workspace @waveary/web`
- `npm run check:mojibake`
- browser/screenshot checks recorded in that work period

Commit:

- `9965738` - `Polish grouped console workspace density`

Push:

- succeeded: pushed to `origin/main`

## 2026-07-01

Objective:

Finish the public repo policy surface so the code can stay open while the official project identity stays protected and easier to understand.

Summary:

- added explicit trademark and brand-asset reservation docs
- added dedicated commercialization docs
- added dedicated editions docs
- aligned the public README surfaces with the real Apache 2.0 code license and the reserved-brand policy

Files changed:

- `TRADEMARKS.md`
- `BRAND-ASSETS.md`
- `NOTICE`
- `docs/commercial-use.md`
- `docs/commercial-use.zh-CN.md`
- `docs/editions.md`
- `docs/editions.zh-CN.md`
- `README.md`
- `README.zh-CN.md`
- continuity docs from those work blocks

Verification:

- `npm run check:mojibake`
- repo-doc review against current license and brand policy

Commit:

- `d5ff7ca` - `Add trademark and brand asset notices`
- `eedbcf9` - `Sync trademark notice continuity log`
- `c93ac72` - `Add commercial use guidance docs`
- `b77dcd2` - `Sync commercial docs continuity log`
- `7f6651d` - `Add editions and README doc polish`
- `b1ba191` - `Sync editions docs continuity log`

Push:

- succeeded: pushed to `origin/main`

## 2026-07-01

Objective:

Create a dedicated continuity-doc cleanup block and remove mojibake / drift from the internal resume documents only.

Summary:

- rewrote `PROJECT_STATE.md`, `docs/vision.md`, `docs/architecture.md`, `docs/decision-log.md`, and `docs/session-log.md` into compact current-truth continuity docs
- removed large accumulated historical noise and replaced it with shorter authoritative guidance
- kept this work block isolated from product/UI/functionality changes

Files changed:

- `PROJECT_STATE.md`
- `docs/vision.md`
- `docs/architecture.md`
- `docs/decision-log.md`
- `docs/session-log.md`

Verification:

- `git diff -- PROJECT_STATE.md docs/vision.md docs/architecture.md docs/decision-log.md docs/session-log.md`
- `npm run check:mojibake`
- `git status --short -b`

Commit:

- `9342cd9` - `Rewrite continuity docs`

Push:

- succeeded: `git push origin main` pushed functional commit `9342cd9` to `origin/main`

## 2026-07-01

Objective:

Fix packaged desktop static serving after the packaged runtime returned `Waveary desktop runtime could not find the requested page.`

Summary:

- corrected `standalone-server.mjs` so `distRoot` resolves to `app-runtime/waveary-web/dist` inside packaged desktop builds
- rebuilt the desktop installer
- verified the packaged `Waveary.exe` standalone runtime serves both `/#chat` and the bundled JS asset with HTTP 200

Files changed:

- `waveary-web/server/standalone-server.mjs`
- `PROJECT_STATE.md`
- `docs/session-log.md`

Verification:

- `npm run desktop:dist`
- packaged `Waveary.exe` launched with `ELECTRON_RUN_AS_NODE=1`
- `GET /#chat` returned HTTP 200
- `GET /assets/index-DpsKmIb1.js` returned HTTP 200
- `npm run check:mojibake`

Commit:

- `fab3a63` - `Fix desktop packaged static serving`

Push:

- pending continuity sync

## 2026-07-01

Objective:

Finish the first Windows desktop installer path and verify that the packaged runtime can start without the Vite dev server.

Summary:

- fixed the standalone desktop server import path so packaged builds load `dist-server/server/provider-api.js`
- added a desktop installer build wrapper that can fall back to an existing `win-unpacked` bundle when Electron resource downloads time out
- made desktop runtime preparation more tolerant of short Windows file-lock races
- set the desktop app user-data path to `AppData/Roaming/Waveary`
- produced `waveary-desktop/dist/Waveary-Setup-0.1.0.exe`
- verified the packaged `Waveary.exe` can run the bundled `standalone-server.mjs` and emit `__WAVEARY_SERVER_READY__:<port>`

Files changed:

- `package.json`
- `tools/build-desktop-installer.mjs`
- `tools/prepare-desktop-runtime.mjs`
- `waveary-desktop/package.json`
- `waveary-desktop/src/main.cjs`
- `waveary-web/server/standalone-server.mjs`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm run desktop:dist`
- packaged `Waveary.exe` launched with `ELECTRON_RUN_AS_NODE=1` against bundled `app-runtime/waveary-web/server/standalone-server.mjs`
- output contained `__WAVEARY_SERVER_READY__:<port>`

Commit:

- `b9118fb` - `Finish desktop installer packaging path`

Push:

- pending continuity sync

## 2026-07-01

Objective:

Start the first real desktop packaging path so Waveary can move toward an installable Windows app instead of remaining source-run only.

Summary:

- added a new `waveary-desktop` Electron package as the first desktop shell
- added `waveary-web/server/standalone-server.mjs` so the built app can serve static assets plus the existing API/runtime middleware without depending on the Vite dev server
- added `tools/prepare-desktop-runtime.mjs` plus root desktop scripts so the built `core / memory / voice / web` runtime can be materialized into a standalone desktop bundle
- verified that `npm run desktop:prepare` succeeds and that desktop dev launch can start the embedded runtime, with successful reachability at `http://127.0.0.1:4173`
- attempted Windows packaging through `electron-builder`; configuration issues were fixed, but final packaging verification is still blocked by transient network timeouts while downloading packaging resources

Files changed:

- `package.json`
- `package-lock.json`
- `.gitignore`
- `tools/prepare-desktop-runtime.mjs`
- `waveary-web/server/standalone-server.mjs`
- `waveary-desktop/package.json`
- `waveary-desktop/README.md`
- `waveary-desktop/src/main.cjs`
- `PROJECT_STATE.md`
- `ACTIVE_TASKS.md`
- `docs/session-log.md`

Verification:

- `npm install`
- `npm run desktop:prepare`
- `npm run dev --workspace @waveary/desktop`
- runtime reachability check against `http://127.0.0.1:4173`
- `npm run pack --workspace @waveary/desktop` reached `electron-builder`, but final packaging verification is still blocked by remote resource download timeout on the current network path after config fixes

Commit:

- `200c6c3` - `Add desktop app packaging scaffold`

Push:

- succeeded: `git push origin main` pushed functional commit `200c6c3` to `origin/main`
