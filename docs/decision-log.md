# Decision Log

This file records important product, architecture, and workflow decisions for Project Waveary.

Use it to preserve the reason behind major choices so future Codex sessions do not repeat or undo settled work.

## 2026-06-20 - Product Repositioning

Status:

- accepted

Decision:

Waveary is positioned as an open source digital life companion framework, not an AI girlfriend, AI boyfriend, or generic chatbot product.

Reason:

- the framework direction is broader and more defensible
- it aligns with memory, relationship, timeline, and companionship as first-class systems
- it avoids collapsing the project into a narrow roleplay or entertainment label

Impact:

- product language should reinforce `Digital Life Companion Framework`
- architecture should optimize for continuity, not short-term chat novelty
- future modules should preserve framework-first boundaries

## 2026-06-20 - Brand Line

Status:

- accepted

Decision:

Use `念念不忘，终有回响。` as the primary brand line.

Reason:

- it matches the product name `回响之境`
- it captures memory, time, and response in one phrase
- it works as brand philosophy, not just marketing copy

Impact:

- README and vision docs should use this line consistently
- future outward-facing materials should prefer this line over earlier slogan variants

## 2026-06-20 - Core Runtime Direction

Status:

- accepted

Decision:

`waveary-core` should provide runtime orchestration and domain abstractions, while memory implementation can evolve as a separate package.

Reason:

- keeps `core` focused on long-term system coordination
- allows memory behavior to evolve independently
- reduces the chance of mixing storage logic into UI or runtime glue

Impact:

- `waveary-core` owns session flow and interfaces
- `waveary-memory` owns extractor/store primitives

## 2026-06-20 - Continuity Workflow

Status:

- accepted

Decision:

Use repository-side continuity files plus a local Codex skill to recover context across sessions.

Reason:

- chat history is not a reliable source of project truth
- state files are versioned and reviewable
- a skill can enforce read order, commit discipline, and anti-regression behavior

Impact:

- update `PROJECT_STATE.md` after each verified work block
- append to `docs/session-log.md`
- read `docs/decision-log.md` before major structural changes

## 2026-06-20 - Early Testing Strategy

Status:

- accepted

Decision:

Use Node built-in tests for the early `waveary-core` and `waveary-memory` packages before introducing a larger test framework.

Reason:

- keeps the first testing layer simple
- avoids adding unnecessary tooling before the runtime contracts stabilize
- still gives fast regression coverage for memory recall and runtime turn flow

Impact:

- `npm run test` becomes part of the default verification set
- future persistence and provider changes should extend this test layer before larger framework adoption
