# Open-Source Benchmark For Waveary

## Purpose

This note records which open-source chat products and companion-adjacent projects Waveary should learn from, which ones are safe to reuse directly, and which ones should stay at the level of architecture or UX reference only.

The goal is not to copy another product.

The goal is to accelerate Waveary's shell, provider plumbing, and interaction quality without weakening its own framework identity or creating avoidable license risk.

## Evaluation Rules

When reviewing an external project for Waveary, judge it on four axes:

1. License compatibility with Waveary's intended distribution path
2. Relevance to Waveary's actual needs
3. Maintenance health
4. Whether the project offers shell value, companionship value, or both

In practice:

- permissive licenses such as `MIT`, `Apache-2.0`, or `BSD-3-Clause` are the easiest sources for direct code reuse
- `GPL` or custom community licenses should be treated as reference-first unless Waveary intentionally chooses to accept those downstream obligations
- current companion-market leaders are useful mostly as product-behavior benchmarks because their real companionship logic is generally closed

## Quick Decision Table

| Project | License posture | Reuse posture for Waveary | Why it matters |
| --- | --- | --- | --- |
| [LibreChat](https://github.com/danny-avila/LibreChat) | Permissive (`MIT`) | Safe for selective direct reuse | Strong multi-provider chat shell, conversation UI, self-hosted product patterns |
| [Chatbox CE](https://github.com/chatboxai/chatbox) | Copyleft (`GPLv3`) | Reference only unless Waveary accepts GPL implications | Strong desktop and provider UX, but direct reuse would likely pull Waveary into GPL obligations |
| [Open WebUI](https://github.com/open-webui/open-webui) | Custom current license, mixed history | Reference carefully, not a default copy source | Useful local/self-hosted compatibility ideas, but current licensing and branding conditions need deliberate review |
| [LobeHub / current LobeChat line](https://github.com/lobehub/lobe-chat) | Community/custom current license | Reference carefully, not a default copy source | Strong product thinking and UX polish, but current license is not the easiest direct-reuse path |
| [CakeChat](https://github.com/lukalabs/cakechat) | Permissive (`Apache-2.0`) but archived and outdated | Research only | Historically interesting emotional-dialog work, but not a modern runtime base |

## Project Notes

### 1. LibreChat

Repository:

- <https://github.com/danny-avila/LibreChat>

Why it is valuable:

- mature multi-provider chat surface
- strong self-hosted product framing
- practical session, model, and tool-routing patterns
- active project with real product pressure

What Waveary should learn from:

- provider and model selection flows
- chat-shell information architecture
- conversation history ergonomics
- production-minded self-hosted packaging patterns

What Waveary should not inherit blindly:

- generic assistant product tone
- feature-first complexity that does not improve companionship continuity

Waveary stance:

- best current candidate for selective direct code reuse where the fit is strong
- especially relevant for shell structure, provider plumbing, and admin-quality UX patterns

### 2. Chatbox Community Edition

Repository:

- <https://github.com/chatboxai/chatbox>

Why it is valuable:

- clean cross-platform AI client framing
- good provider onboarding patterns
- practical desktop-oriented multi-model shell

What Waveary should learn from:

- provider preset design
- model management UX
- lightweight chat-client interaction details

What Waveary should avoid:

- direct code adoption without an explicit license decision

Waveary stance:

- learn from the product shell and interaction choices
- do not merge or adapt code directly into Waveary under the current repo direction unless Waveary explicitly decides to accept `GPLv3` downstream effects

### 3. Open WebUI

Repository:

- <https://github.com/open-webui/open-webui>

Why it is valuable:

- strong local-first and self-hosted compatibility story
- broad model and runtime integration surface
- good lessons around local deployment expectations

Why it is risky as a copy source:

- the project currently uses a custom `Open WebUI License`
- the repository also records licensing history across older code and newer code
- branding-preservation requirements make casual reuse less clean than a permissive source

Waveary stance:

- useful for architecture and deployment reference
- not the first source to copy code from
- any reuse should happen only after targeted file-by-file license review

### 4. LobeHub / LobeChat Family

Repository:

- <https://github.com/lobehub/lobe-chat>

Why it is valuable:

- unusually polished product and interaction design
- strong model/tool ecosystem thinking
- good examples of how an AI product can feel deliberate instead of generic

Why it is risky as a copy source:

- the current project line does not offer the same simple permissive reuse posture as `MIT` or `Apache-2.0` projects
- the modern LobeHub direction has its own community-license path

Waveary stance:

- study UX, product architecture, and quality bar
- do not treat it as the default code donor

### 5. CakeChat

Repository:

- <https://github.com/lukalabs/cakechat>

Why it is still worth reading:

- early emotional-dialog research artifact from the Replika orbit
- useful reminder that emotional expression was treated as a first-class problem long before the current LLM wave

Why it is not a base for Waveary:

- archived and read-only
- old TensorFlow / Keras stack
- pre-LLM architecture
- emotional output style research is more valuable than implementation reuse

Waveary stance:

- use as historical inspiration only
- do not invest engineering time trying to revive it as a runtime layer

## Closed Products We Should Benchmark But Not Expect To Reuse

These are important behavioral references, not open-source dependency candidates:

- `Nomi`
- `Kindroid`
- `Replika`

What they are good for:

- measuring companionship realism
- comparing memory continuity
- comparing voice and text consistency
- comparing proactive care quality

What they are not good for:

- direct code reuse
- reliable architecture visibility

## Practical Reuse Policy For Waveary

### Safe for direct reuse by default

- targeted code from permissive-license projects such as `MIT`, `Apache-2.0`, or `BSD-3-Clause`
- examples:
  - provider selection flows
  - session list ergonomics
  - model-discovery adapters
  - shell-level UI patterns

### Reference first, legal review before copying

- projects under `GPL`, custom community licenses, or mixed-license histories
- examples:
  - Chatbox CE
  - Open WebUI
  - current LobeHub / LobeChat line

### Behavior-only inspiration

- closed companion products
- archived emotional-dialog research systems

## Recommended Waveary Adoption Order

1. Borrow shell and provider ideas from `LibreChat`
2. Study `Chatbox CE` for desktop-feeling model and provider UX, but keep the implementation original
3. Study `Open WebUI` for local-first deployment and compatibility ideas
4. Study `LobeHub / LobeChat` for product polish and interaction quality, not as a code donor
5. Use `Nomi`, `Kindroid`, and `Replika` as realism benchmarks for memory, voice, and companionship behavior

## Concrete Next Steps

1. Run a focused local benchmark pass against `LibreChat` and extract only the specific shell patterns Waveary still lacks.
2. Keep all future companion-quality work inside Waveary-owned memory, relationship, identity-summary, and emotion layers.
3. If a future Waveary module needs direct third-party code reuse, prefer a permissive-license source first and record that choice in `docs/decision-log.md`.
