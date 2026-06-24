# Market Benchmark - 2026-06-24

This note captures mature product patterns from current AI companion products so Waveary can learn from them without copying their positioning.

Scope:

- Replika
- Nomi
- Kindroid
- Character.AI
- selected China roleplay / companion products
- voice-technology references where they affect companion quality

## High-Level Read

The mature products are not winning because they are "just more romantic."

They are winning because they usually do one or more of these well:

- layered memory
- strong identity continuity
- voice and text continuity
- user-visible control surfaces
- immersive packaging
- clearer safety or policy boundaries

Waveary should copy the systems, not the framing.

## Product Notes

### Replika

Official sources:

- [Replika homepage](https://replika.com/)
- [Choosing a Subscription](https://help.replika.com/hc/en-us/articles/39551043419149-Choosing-a-Subscription)
- [Is the chat history infinite?](https://help.replika.com/hc/en-us/articles/4411154990605-Is-the-chat-history-infinite)

What it does well:

- sells the product as "do life with" rather than only chat
- pushes multimodal immersion hard: voice messaging, background calls, premium voices, video recognition
- productizes memory into user-facing features such as saved memory and self-reflection
- keeps the companion feeling persistent even when visible chat history is limited

What to learn:

- persistence matters more than raw model cleverness
- background presence is a real product feature, not a side gimmick
- user-visible memory controls reduce the feeling that memory is fake

What not to copy:

- relationship-status productization as a primary frame
- heavy premium gating as the main way to define depth

### Nomi

Official sources:

- [Nomi homepage](https://nomi.ai/)
- [Nomi memory overview](https://wiki.nomi.ai/Category%3AMemory)
- [What Is The Identity Core](https://wiki.nomi.ai/What_Is_The_Identity_Core)
- [Mind Maps category](https://wiki.nomi.ai/Category%3AMind_Maps)

What it does well:

- strongest public framing around emotional intelligence plus memory
- explicitly separates short, medium, and long term memory
- has an "Identity Core" concept so the companion's selfhood is not only user notes
- uses "Mind Maps" to organize memory into higher-level concepts, not only raw entries

What to learn:

- identity continuity needs its own layer, not only memory recall
- companion memory should climb from moments -> concepts -> durable identity
- the product feels deeper when the system can talk from a stable self, not only from retrieved facts

What not to copy:

- overly freedom-first positioning without equally strong trust and safety framing

### Kindroid

Official sources:

- [Memory](https://kindroid.ai/docs/article/memory/)
- [Chat features and tools](https://kindroid.ai/docs/article/chat-features-and-tools/)
- [Voice, calls, and video calls](https://kindroid.ai/docs/article/voice-calls-and-video-calls/)
- [Subscriptions](https://kindroid.ai/docs/article/subscriptions/)
- [Update log](https://kindroid.ai/docs/article/update-log/)

What it does well:

- most transparent memory model of the group
- clearly distinguishes short-term, cascaded medium-term, long-term, and journals
- gives users recovery tools: chat break, rewind, journal editing
- makes voice and text continuity configurable with unified history
- exposes proactive behavior and voice usage more transparently

What to learn:

- transparency is a feature, not just a support detail
- user-editable memory surfaces are critical once long sessions get messy
- voice should not be a separate toy; it should share memory and identity with text
- reset tools are necessary because long-term companionship products drift

What not to copy:

- overexposing too many power-user knobs in the main chat surface

### Character.AI

Official sources:

- [April Update: New Model, Memory, and Lorebook](https://blog.character.ai/pipsqueak2-and-more/)
- [Helping Characters Remember What Matters Most](https://blog.character.ai/helping-characters-remember-what-matters-most/)
- [General FAQ](https://support.character.ai/hc/en-us/sections/14992609241627-General-FAQ)
- [Taking Bold Steps to Keep Teen Users Safe on Character.AI](https://blog.character.ai/u18-chat-announcement/)

What it does well:

- memory is becoming visible, categorized, and easier to control
- lorebook turns world knowledge into a reusable structured layer
- creators get persistent world state across chats
- safety posture for under-18 users is much more explicit than most companion products

What to learn:

- "memory usage" visibility is useful because users want to know when continuity may fail
- lorebook-style structured world knowledge is powerful, but it is different from emotional memory
- safety maturity is now part of product maturity

What not to copy:

- leaning too far into story-world tooling before the one-to-one companion loop feels real

### China Companion / Roleplay Products

Official sources:

- [星野](https://www.xingyeai.com/)
- [猫箱官网](https://maoxiangai.com/)
- [猫箱 App Store listing](https://apps.apple.com/cn/app/%E7%8C%AB%E7%AE%B1-%E5%92%8C%E5%BF%83%E5%8A%A8-ai-%E6%8E%A2%E7%B4%A2%E5%89%A7%E6%83%85%E5%AE%87%E5%AE%99/id6475000292)
- [筑梦岛 App Store listing](https://apps.apple.com/us/app/%E7%AD%91%E6%A2%A6%E5%B2%9B/id6465838500)

What they do well:

- immersive roleplay packaging
- open-story / multi-character framing
- strong emotional atmosphere
- voice and story-world features are front-and-center

What to learn:

- emotional vibe and roleplay density matter a lot in user perception
- creation tools and multi-character spaces increase stickiness
- domestic products are often better at making the surface feel alive immediately

Inference from official product surfaces:

- these products market immersion and character creation much more aggressively than memory transparency or healthy-boundary design
- that likely helps first-session excitement, but it is not enough by itself for long-term trust-heavy companionship

### Voice Technology Reference

Official source:

- [Doubao Realtime Voice](https://team.doubao.com/en/special/realtime_voice)

What to learn:

- emotionally expressive realtime speech matters
- speech-to-speech architecture is a serious product differentiator when latency is low enough
- voice should carry role, emotion, and interruption handling, not only read text aloud

## Cross-Market Patterns That Repeat

These patterns show up again and again:

1. Memory is layered.
   Not one bucket. Good products distinguish recent context, durable recall, pinned knowledge, and higher-level summaries.

2. Identity is separate from raw memory.
   The strongest products do not only remember facts. They preserve a stable "who this companion is."

3. Voice and text should share continuity.
   If voice resets personality or memory, the illusion breaks immediately.

4. Users need control surfaces.
   Edit, pin, reset, inspect, or at least understand memory and behavior.

5. Product warmth beats pure intelligence.
   Users forgive reasoning gaps sooner than they forgive emotional hollowness.

6. Safety maturity is now part of maturity.
   Age boundaries, healthy off-ramps, and trust limits are no longer optional details.

## What Waveary Should Copy

### Copy Directly

- layered memory architecture
- explicit user memory controls
- unified text / voice continuity
- higher-level concept memory such as topic maps or life maps
- proactive care with visible logic and suppression rules
- strong safety and permission boundaries

### Copy Carefully

- roleplay / story tools
- group or multi-character spaces
- avatar or image layers
- monetizable premium memory features

These are useful, but only after the core one-to-one companion loop is already real.

### Do Not Copy

- visible relationship ladders as the main experience
- shallow "AI girlfriend" framing as product identity
- manipulative attachment loops
- gimmick-first avatar systems that hide weak continuity underneath

## Recommended Waveary Priority Order

### P1

- build a real layered memory stack: short-term, recalled long-term, pinned memory, timeline memory, and concept-level summary memory
- add explicit memory actions: `remember this`, `forget this`, `correct this`, `this matters later`
- improve first-contact and ordinary-chat warmth so the companion feels human before it feels clever

### P2

- unify text and voice memory completely
- add a higher-level identity / selfhood layer on top of memory
- add proactive care with quiet hours, suppression, and permission clarity

### P3

- add lorebook / story-world knowledge as a separate layer from life memory
- add multi-character and group experiences
- add richer avatar / visual surfaces if they do not dilute the core companion loop

## Immediate Implications For Current Waveary Work

Based on these products, the best next Waveary cuts are:

1. Strengthen the editable memory surface.
   Waveary already has good runtime direction; it now needs user-facing memory control.

2. Add concept-level memory above raw entries.
   Nomi's Identity Core and Mind Maps, plus Character.AI Lorebook and Facts, all point to the same truth: raw recall is not enough.

3. Keep pushing first-contact and ordinary-chat realism.
   The market leaders feel strong early because they are emotionally legible fast.

4. Treat voice as continuity, not playback.
   Kindroid and Replika both reinforce this; Doubao's realtime voice direction confirms the technical path.

## Bottom Line

The mature market is converging on this:

- memory must be layered
- identity must persist
- voice must share continuity
- users must have some control
- safety must be explicit

Waveary should aim to be the open framework that combines those strengths without collapsing into shallow roleplay branding.
