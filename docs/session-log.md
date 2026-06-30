# Session Log

This file records recent verified Waveary work blocks in chronological form.

It is intentionally compact.
Git history keeps the fine-grained archive; this file keeps the current continuation trail.

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
