# Waveary Roadmap

## Goal

Waveary's near-term goal is not to ship a feature-stacked companion app.
The goal is to build a clear, extensible, open source core for digital companionship.

## Phase 1: V0.1 / 30 Days

Goal:

Build the first usable Waveary core loop.

Scope:

- text chat
- long-term memory write path
- long-term memory retrieval
- basic relationship growth
- timeline event recording
- basic memory reinjection

Deliverables:

- initial `waveary-core` runtime structure
- minimum `waveary-memory` schema and primitives
- base `Session -> Memory -> Relationship -> Timeline` data flow
- one runnable reference chat flow

Completion criteria:

- the user can start a conversation
- the system can extract and store key memories
- the system can recall relevant memories in later turns
- the system can record important life events
- the system can maintain a basic relationship state

## Phase 2: V0.2 / 60 Days

Goal:

Move Waveary from text continuity toward bounded proactivity and early multimodal companionship.

Scope:

- voice input and output
- emotion analysis
- proactive care
- event-triggered care behavior

Deliverables:

- initial `waveary-voice` interface
- emotion signal recognition and a short-term emotion window
- timeline and relationship trigger evaluation
- basic proactive care flow
- companion-side emotional state foundation as defined in `docs/emotion-proactive-care.md`
- relationship-aware reply style variation driven by emotional continuity
- basic meal, sleep, and absence care with user-controlled proactive policy

Completion criteria:

- the user can interact with the system by voice
- the system can recognize basic emotional signals
- the system can perform limited proactive care based on events or relationship state
- the companion begins to show continuous emotional state rather than only detecting the user's emotion
- proactive care remains configurable, bounded, and trustworthy for the user

## Phase 3: V0.3 / 90 Days

Goal:

Move the experience from sustainable chat toward real-time companionship.

Scope:

- real-time voice
- interruption handling
- full duplex conversation
- streaming session orchestration

Deliverables:

- real-time voice session runtime
- interruption handling
- duplex conversation state flow
- latency-aware orchestration

Completion criteria:

- the user can have near-natural real-time voice conversation
- the system supports interruption and re-coordination
- voice, memory, and relationship state remain coherent together

## Out of Scope for Early Versions

The following should not become the main focus of early versions:

- large-scale character marketplace work
- heavily entertainment-first romance packaging
- general agent capability piles unrelated to long-term companionship
- overly complex multi-character universe systems
- premature enterprise expansion

## Strategic Direction

Waveary should develop in this order:

1. build memory as a real system
2. build relationship as a real state machine
3. build timeline as a recallable life structure
4. add emotion and bounded proactivity on top of those foundations
5. push voice toward real-time and full duplex only after continuity is stable

Core principle:

**Build continuity first, then immersion.**
