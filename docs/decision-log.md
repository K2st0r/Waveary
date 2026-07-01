# Decision Log

This file records durable project decisions that future sessions should preserve.

Only keep decisions here when they change architecture, product identity, workflow, or continuity assumptions in a meaningful way.

## 2026-07-01 - Continuity Docs Should Prefer Compact Current Truth Over Giant Historical Accumulation

Status:

- accepted

Decision:

Waveary continuity documents should be rewritten as compact, authoritative current-state docs when they become bloated or mojibake-corrupted, instead of trying to preserve every historical note in one ever-growing file.

Reason:

- the old continuity files had grown so large and polluted that they were no longer serving their main purpose: helping a new session resume safely
- byte-level repair of mixed corruption was lower value than rebuilding a clean, truthful snapshot from the repository's current state
- continuity only works if the state files remain readable, high-signal, and cheap to trust

Impact:

- `PROJECT_STATE.md`, `docs/vision.md`, `docs/architecture.md`, `docs/decision-log.md`, and `docs/session-log.md` were rewritten into shorter authoritative forms
- future sessions should summarize and prune instead of endlessly appending low-value history
- detailed history can still live in git; the continuity docs should stay resume-friendly first

## 2026-07-01 - Keep Code Open And Reserve The Official Brand Separately

Status:

- accepted

Decision:

Waveary keeps its source code under the repository's open-source code license, while reserving the official `Waveary` name, official logos, portrait cards, and other brand assets separately.

Reason:

- the project should stay open for learning, building, and community use
- the official identity still needs protection against direct copying, impersonation, or unauthorized commercial use
- code rights and trademark / brand rights are different and should be explained separately

Impact:

- the repository now includes `TRADEMARKS.md`, `BRAND-ASSETS.md`, and `NOTICE`
- public docs must keep the code-license / brand-rights split accurate

## 2026-07-01 - Keep Client Workspaces Layered Instead Of Mixing Persona, Models, And Skills

Status:

- accepted

Decision:

Waveary's client shell should keep companion profiles, provider capability setup, and skills as separate layers: sessions/profile owns companion identity, the model workspace owns language / voice / vision / image / video access, and skills remain callable abilities.

Reason:

- mature AI clients tend to stay understandable by separating presets or agents, model capability configuration, and tools / skills instead of exposing one mixed settings wall
- Waveary's product identity depends on relationship continuity and memory, so persona setup should not become a generic model preset form
- chat should stay emotionally focused and should not duplicate a full configuration surface inside the first-message empty state

Impact:

- future UI work should refine these layers rather than adding new competing top-level tabs
- public repository docs should not list third-party projects as borrowing targets; any learning from mature products should be generalized into Waveary's own architecture

## 2026-07-01 - Commercial Use And Editions Should Be Explained On Dedicated Public Pages

Status:

- accepted

Decision:

Commercial-use guidance and the `CE / Cloud / Enterprise` packaging story should live on dedicated public docs instead of being implied by short README fragments.

Reason:

- public visitors need a clear answer about what exists today, what is future packaging, and when official cooperation or brand permission is needed
- dedicated docs are easier to keep accurate than overloaded README bullets

Impact:

- the repo now includes commercialization and editions pages in both English and Simplified Chinese
- future repo-facing policy work should extend those pages instead of bloating the main README

## 2026-06-24 - Waveary Is A Framework-First Companion Runtime, Not AI Girlfriend Framing

Status:

- accepted

Decision:

Waveary must be positioned as an open source digital life companion framework, not as an AI girlfriend project, AI boyfriend project, or generic chatbot wrapper.

Reason:

- the product's real value is its continuity system: memory, relationship, timeline, emotion, and voice
- narrow romance framing would shrink the architecture and public identity in the wrong direction

Impact:

- public and internal docs should reinforce framework-first positioning
- future product work should support emotionally close companionship without reducing the whole project identity to romance framing

## 2026-06-24 - Companion Soul Should Live In Markdown And Center One Continuous Caring Bond

Status:

- accepted

Decision:

Waveary's companion soul should primarily live in markdown files, and the companion should feel like one continuous caring relationship rather than a visibly scripted ladder of modes.

Reason:

- behavioral philosophy, tone, and emotional boundaries need a durable human-readable source of truth
- the user wants continuity and emotional realism, not a form-driven persona shell or obvious stage acting

Impact:

- `waveary-dataset/` is the source-of-truth layer for companion soul and conversation rules
- future prompt or runtime work should extend that layer instead of scattering the companion identity across ad hoc prompt snippets

## 2026-06-24 - Learn Mature Companion Systems Without Copying Their Framing

Status:

- accepted

Decision:

Waveary should learn from mature companion products at the systems level, especially layered memory, identity continuity, voice/text continuity, visible controls, and safety posture, without copying shallow commercial framing.

Reason:

- the strongest products tend to win through continuity systems, not through surface labels alone
- Waveary's opportunity is to absorb durable systems while keeping an open framework identity

Impact:

- future prioritization should keep favoring memory, identity, continuity, and voice cohesion over gimmick features

## 2026-06-24 - Deterministic Local Time Must Stay Narrow

Status:

- accepted

Decision:

Deterministic local-time replies should trigger only on actual time/date/day questions or direct complaints about time awareness, not on ordinary emotional turns that happen to mention `today`, `tonight`, or similar words.

Reason:

- emotional companionship quality breaks immediately if comfort turns are hijacked by an overly broad utility shortcut

Impact:

- future presence-aware work should keep deterministic utility shortcuts narrow and leave emotionally meaningful turns to the main companion runtime

## 2026-06-24 - Local Runtime Persistence Uses SQLite, Portability Uses JSON

Status:

- accepted

Decision:

Waveary should use `SQLite` as the primary local live runtime store and `JSON` as the portable import/export package for moving a companion archive between devices.

Reason:

- SQLite is a better fit for active local runtime persistence
- JSON is easier for export, import, backup, and migration packaging

Impact:

- session transfer work should preserve this split
- export/import should carry the whole companion archive, not only plain messages

## 2026-06-29 - The Runtime Shell Uses One Persistent Left Sidebar

Status:

- accepted

Decision:

The active product runtime should use one persistent left sidebar as its main shell, and it should not return to the older top-navigation layout.

Reason:

- the product should feel like a focused client surface, not a mixed marketing page plus tools page
- the left-sidebar pattern better supports chat, sessions, control, and settings as one operational shell

Impact:

- future shell work should tighten density inside this architecture, not rebuild the old top navigation

## 2026-06-29 - The Product Runtime Should Not Depend On An Internal Homepage

Status:

- accepted

Decision:

The in-product runtime should open on active product surfaces such as chat or console rather than depending on an internal homepage route.

Reason:

- once the user is inside the product, runtime value matters more than internal marketing presentation

Impact:

- future product-shell work should keep chat and console as the main runtime destinations
- homepage or official-site work should stay separate from the in-product client flow

## 2026-06-29 - Higher-Trust Capabilities Must Stay Explicit, Permissioned, And Auditable

Status:

- accepted

Decision:

Local time awareness, local actions, browser actions, and future desktop-presence capabilities must remain bounded, visible, and permissioned instead of becoming hidden background power.

Reason:

- trust is part of the product, not a secondary implementation detail
- the user wants richer powers, but also wants clear control over them

Impact:

- future desktop or automation work must stay behind explicit permission boundaries
- chat behavior should not silently absorb broader authority
