# Waveary Architecture

## Purpose

This document defines the current architecture boundary for Waveary so future sessions can extend the system without collapsing module responsibilities.

The goal is not to freeze the final form forever.
The goal is to keep the current system coherent while the project moves from prototype surfaces toward a more complete companion runtime.

## System Placement

Waveary sits between product surfaces and model providers.

```text
Application UI / Client Surface
        |
Waveary Runtime
        |
Provider / Capability Adapters
        |
Underlying LLM / STT / TTS / Image / Other Models
```

Waveary is therefore:

- not the base model itself
- not only a frontend
- not just a prompt bundle

It is the runtime layer that turns short-lived model capability into longer-lived companion behavior.

## Design Goals

- keep memory as durable system state
- keep relationship continuity stateful and explainable
- keep timeline awareness first-class
- keep emotion and care behavior grounded in state, not only copywriting
- keep model/provider compatibility replaceable
- keep trust-sensitive abilities permissioned and inspectable

## Core Runtime Layers

### 1. Session Layer

Owns the active conversation lifecycle.

Responsibilities:

- receive user input
- maintain the active context window
- coordinate memory, relationship, timeline, emotion, and provider calls
- persist per-session state

Key objects:

- `Session`
- `Message`
- `ContextWindow`

### 2. Memory Layer

Owns long-term remembered material.

Responsibilities:

- extract candidate memory from conversation
- store and retrieve memory
- score relevance
- support recall in later turns
- support concept-level understanding beyond raw fact fragments

Key objects:

- `MemoryItem`
- `MemoryRecall`
- identity-summary structures such as the persisted concept-level user/relationship understanding

### 3. Relationship Layer

Owns the evolving bond state between user and companion.

Responsibilities:

- maintain relationship state
- track trust and familiarity changes
- surface relationship context back into reply generation
- support continuity without exposing a gamified visible ladder in normal chat

Key objects:

- `RelationshipProfile`
- relationship-stage and relationship-signal structures

### 4. Timeline Layer

Owns life-event ordering and temporal recall.

Responsibilities:

- record meaningful events
- support recall by time or phase
- help the system understand "what happened before this"
- support future care, anniversaries, and rhythm-aware outreach

Key objects:

- `TimelineEvent`
- milestone or life-event records

### 5. Emotion Layer

Owns emotional state and emotional interpretation.

Responsibilities:

- detect user emotional cues
- maintain companion-side emotional continuity
- influence tone, pacing, and care behavior
- feed future proactive-care decisions

Key objects:

- `EmotionState`
- emotion signals and short-horizon mood windows

Important rule:

Emotion should not stop at user classification.
Waveary should preserve companion-side emotional continuity as its own runtime concern.

### 6. Voice Layer

Owns voice I/O and live voice coordination.

Responsibilities:

- STT routing
- TTS routing
- voice-session orchestration
- interruption handling
- future duplex behavior

Key objects:

- `VoiceSession`
- speech input/output descriptors

## Module Boundaries

### `waveary-core`

Primary responsibility:

- runtime orchestration
- provider abstraction
- dialogue shaping
- relationship and continuity logic
- permission-aware action intent logic

Should not become:

- a UI layer
- a vendor-specific one-off bundle
- a dumping ground for unrelated client concerns

### `waveary-memory`

Primary responsibility:

- extraction
- storage
- retrieval
- scoring
- memory-oriented persistence helpers

### `waveary-voice`

Primary responsibility:

- voice provider adapters
- live voice session behavior
- playback / capture coordination
- future duplex and interruption behavior

### `waveary-web`

Primary responsibility:

- official interactive client surface
- chat experience
- console / control experience
- local operator flows for provider, voice, session, and settings management

### `waveary-dataset`

Primary responsibility:

- markdown-first companion soul
- conversation rules
- healthy-boundary guidance

This package should remain the durable philosophy layer, not be replaced by scattered inline prompt strings.

## Provider Abstraction

Waveary should remain multi-provider by design.

Stable capability boundaries should include:

- chat provider
- embeddings provider
- speech-to-text provider
- text-to-speech provider
- future image / video / vision capability adapters where appropriate

This keeps the framework from collapsing into one vendor's product assumptions.

## Persistence Strategy

Current durable direction:

- local runtime state should primarily live in `SQLite`
- portable migration packages should use `JSON`

That split should remain explicit:

- `SQLite` is the live store
- `JSON` is the import/export surface

Session export/import should carry the companion archive, not only raw messages:

- portrait / identity metadata
- voice preferences
- conversation history
- memory / relationship / timeline state
- latest understanding summaries

## Web Shell Direction

The current `waveary-web` shell direction is now part of the architecture truth:

- persistent left sidebar
- chat as the main companion surface
- denser grouped console workspaces
- no return to a broad top-of-page runtime navigation
- no return to a marketing-style intro wall inside the control surface

This is a product-shell decision, but it also matters architecturally because it shapes where configuration, session management, and runtime awareness belong.

## Permission Boundary

Higher-trust capabilities must remain explicit:

- local time awareness may be used as a bounded input
- local actions must stay permissioned
- browser actions must stay visible and revocable
- future desktop awareness or automation must remain separate from ordinary chat reply generation

Do not blur these abilities into hidden background power.

## Current Architectural Priorities

1. improve dialogue realism without breaking continuity logic
2. keep concept-level identity understanding stable across sessions
3. keep voice growth inside the `waveary-voice` boundary
4. keep browser/local actions bounded and auditable
5. keep the web shell denser without mixing control surfaces back into one long page

## Open Questions

- how far concept-level understanding should go before a richer dedicated memory package rewrite
- whether the next voice cut should prioritize deeper duplex transport or wider provider-specific STT coverage
- how much of the current web-session persistence model should move into a more shared package over time
- when broader import/export diagnostics and schema migration rules should become first-class
