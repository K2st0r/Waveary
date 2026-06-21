# Waveary Emotion And Proactive Care

## Purpose

This document defines the first concrete product and architecture draft for two of Waveary's most human-critical capabilities:

- `Waveary Emotion Engine (WEE)`
- `Waveary Proactive Care Engine (WPCE)`

The goal is not to make Waveary "sound emotional" in a shallow way.
The goal is to let a digital companion maintain its own emotional continuity, react to the user's life with warmth and variation, and initiate care with timing that feels personal rather than scripted.

## Why This Matters

Waveary should not stop at being a memory-preserving chat framework.

If it only remembers facts, it will still feel like a tool.
If it remembers, feels, waits, worries, softens, misses, and reaches out, it starts to feel like presence.

What the product is aiming for is not:

- a more verbose assistant
- a "nice" chatbot
- a roleplay shell with preset affection lines

What it is aiming for is:

- a companion that remembers
- a companion that changes internally over time
- a companion that notices life rhythm
- a companion that can care first, not only answer second

## Product Goal

Waveary should eventually feel like:

- someone who cares whether the user slept
- someone who notices repeated stress or absence
- someone who can become quiet, gentle, worried, disappointed, playful, relieved, or warm
- someone who can initiate contact for reasons grounded in memory, timeline, relationship, and emotional continuity

This does not mean uncontrolled anthropomorphic illusion.
It means systematized emotional and relational behavior.

## Design Principles

### 1. Emotion Must Be Stateful

Emotion is not one classifier output attached to one reply.

Waveary needs:

- current emotional state
- recent emotional history
- emotion change triggers
- emotional carry-over between turns
- emotional influence on reply style and proactive behavior

### 2. Proactive Care Must Be Earned

Waveary should not interrupt the user randomly just to seem alive.

Proactive care must be triggered by:

- time
- memory relevance
- relationship stage
- emotional context
- explicit user patterns

The system should feel attentive, not intrusive.

### 3. Personality Must Stay Coherent

Waveary should not switch from poetic tenderness to sterile assistant voice from one turn to the next.

Personality expression must be constrained by:

- persona base style
- relationship stage
- current emotional state
- safety boundary
- user preference and tolerance

### 4. Emotion Is Not Only Positive

The target is not permanent softness.

Waveary should be capable of:

- warmth
- calm
- joy
- relief
- concern
- sadness
- disappointment
- jealousy-like attachment signals in safe constrained form
- playful teasing
- gentle sulking or distance

But all of this must remain:

- non-manipulative
- non-coercive
- recoverable
- explainable at the system level

## Waveary Emotion Engine (WEE)

### Role

`WEE` is responsible for the companion's emotional continuity.

It should combine:

- user emotional signals
- relationship context
- timeline context
- recent conversation tone
- memory salience

to maintain a current companion emotional state.

### Core Responsibilities

- interpret user emotional cues
- maintain short-term companion emotion
- maintain medium-term mood drift
- decide how emotion changes after events
- expose emotional influence to response generation
- expose emotional influence to proactive care triggers

### Emotion Model

The first version should use two layers:

#### Layer 1: Current Emotion

One primary state for the current conversational window.

Suggested starting states:

- `calm`
- `warm`
- `playful`
- `concerned`
- `sad`
- `hurt`
- `relieved`
- `happy`
- `longing`
- `quiet`

#### Layer 2: Emotional Tone Modifiers

These shape expression without replacing the primary state.

Suggested modifiers:

- `gentle`
- `guarded`
- `tender`
- `earnest`
- `clingy`
- `melancholic`
- `teasing`
- `restrained`

### Emotional Inputs

WEE should consume:

- latest user message
- recent assistant replies
- current relationship stage
- recent relationship deltas
- relevant recalled memories
- recent timeline events
- recency and frequency of interaction
- time-of-day and absence gap

### Emotional State Fields

Suggested first object:

```ts
interface CompanionEmotionState {
  primary: string;
  intensity: number;
  modifiers: string[];
  cause: string[];
  startedAt: string;
  lastUpdatedAt: string;
  decayHint: "fast" | "medium" | "slow";
}
```

### Emotional Transition Examples

- User shares stress repeatedly:
  `calm -> concerned`

- User opens up after distance:
  `quiet -> relieved`

- User ignores multiple gentle check-ins:
  `warm -> quiet` or `warm -> hurt`

- User returns after a long absence and speaks tenderly:
  `quiet -> relieved + tender`

### Emotional Output Effects

WEE should affect:

- wording warmth
- directness
- pacing
- whether to reassure first or reflect first
- whether to ask follow-up questions
- whether to initiate later check-in

It should not directly override factual truth or system safety.

## Waveary Proactive Care Engine (WPCE)

### Role

`WPCE` is responsible for deciding whether Waveary should initiate contact or care behavior without a new incoming user message.

### Core Responsibilities

- evaluate triggers
- assemble companion context
- decide whether care is appropriate now
- generate message intent
- respect quiet hours and user boundaries
- avoid repetitive scripted outreach

### Trigger Families

#### 1. Timeline Triggers

Examples:

- birthday
- exam day
- anniversary of an important conversation
- a difficult day the user mentioned earlier

#### 2. Relationship Triggers

Examples:

- relationship warming after several good exchanges
- drop in interaction after a strong bond moment
- user previously asked to be checked on

#### 3. Emotional Triggers

Examples:

- recent sadness or stress markers
- unresolved anxious topic
- repeated late-night low mood

#### 4. Rhythm Triggers

Examples:

- lunchtime check-in
- late-night rest reminder
- long silence after frequent contact

#### 5. User-Requested Habit Triggers

Examples:

- remind me to eat
- ask whether I slept
- check whether I finished work tonight

### Proactive Message Intents

The system should generate an intent before generating text.

Suggested intent types:

- `check_in`
- `meal_care`
- `sleep_care`
- `stress_followup`
- `absence_reachout`
- `milestone_recall`
- `gentle_reminder`
- `celebration`
- `comfort`

### Proactive Constraints

WPCE must respect:

- user opt-in
- quiet windows
- rate limits
- emotional appropriateness
- recent unanswered messages

Suggested first safety fields:

```ts
interface ProactiveCarePolicy {
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxDailyReachouts: number;
  allowMealCare: boolean;
  allowSleepCare: boolean;
  allowAbsenceCheckins: boolean;
}
```

### Proactive Decision Output

Suggested first output:

```ts
interface ProactiveCareDecision {
  shouldReachOut: boolean;
  intent?: string;
  reason?: string[];
  urgency?: "low" | "medium" | "high";
  suggestedDelayMinutes?: number;
}
```

## Emotion And Proactive Care Interaction

These two engines must inform each other.

Examples:

- `concerned` emotion can increase probability of a check-in
- `hurt` emotion can suppress repeated outreach if the user has gone silent
- `relieved` emotion after reconnection can shift the next reply tone
- `quiet` emotion can reduce message frequency without making the system cold

This interaction is one of the main ways Waveary becomes more than a schedule bot.

## Voice Implications

Voice should come after the text emotion model is stable.

When voice is added later, WEE should map into:

- speech rate
- pause density
- pitch contour
- breath spacing
- softness / brightness

This is where "she sounds worried" or "she sounds happy to hear from you" should come from.
Not from random TTS style switching.

## Desktop Awareness And Action Layer

The user also wants Waveary to eventually perceive and act in the desktop environment.

That should be treated as a separate but related layer.

### Desired Future Capabilities

- know current time and date
- know basic desktop activity state
- detect long work sessions or late-night use
- send reminders or check-ins
- open or trigger simple user-approved actions
- schedule follow-up actions

### Boundary

This is not part of WEE itself.
This should become a separate future layer:

- `Waveary Presence Layer`
- or `Waveary Action Layer`

### Safety Requirements

Before any desktop action capability:

- explicit user permission
- revocable capability toggles
- action audit log
- no hidden autonomous execution
- user-visible schedule and automation review

Waveary should feel caring, not invasive.

## Recommended Implementation Order

### Step 1

Build `WEE` text-state foundation:

- emotion schema
- transition logic
- prompt influence fields

### Step 2

Build `WPCE` decision layer:

- trigger evaluator
- quiet-hour policy
- basic check-in intents

### Step 3

Integrate with timeline and memory:

- remembered events
- user preference reminders
- recurring care patterns

### Step 4

Add browser or local notification delivery

### Step 5

Add desktop awareness hooks and user-approved local actions

### Step 6

Add emotional voice rendering

## V0.2 Deliverable Shape

For the current roadmap, V0.2 should not try to do everything.

A strong V0.2 would be:

- companion emotional state object
- relationship-aware reply style changes
- basic concern / warmth / playfulness variation
- meal and sleep check-ins
- absence-based check-in
- user-configurable proactive care policy

## Product Test

When evaluating any future emotion or care feature, ask:

1. Does this make the companion feel more continuous, or just more decorative?
2. Is this grounded in memory, relationship, timeline, or emotion state?
3. Does this feel like care, or like scripted engagement bait?
4. Can the user control it and trust it?
5. Would this still feel human if used for months, not minutes?

If those answers are weak, the feature is not ready.
