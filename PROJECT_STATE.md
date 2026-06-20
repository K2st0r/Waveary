# Project State

## Project

Waveary is an open source digital life companion framework.

Brand line:

念念不忘，终有回响。

## Current Branch

- `main`

## Latest Verified Commit

- `d9e7cf3` - `Add repository continuity tracking files`

## Modules

- `waveary-core`
  - TypeScript runtime skeleton is implemented
  - in-memory relationship, timeline, emotion, and scripted chat adapters are implemented
  - runnable demo flow exists through root `examples/`
- `waveary-memory`
  - independent package exists
  - simple memory extractor exists
  - in-memory memory store exists

## Verified Commands

- `npm run check`
- `npm run demo`
- `python C:\Users\13571\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\13571\.codex\skills\waveary-continuity-guard`

## Decision Sources

- `docs/decision-log.md`

## Next Steps

- add persistence interfaces beyond in-memory storage
- add tests for runtime and memory behavior
- define `waveary-web` package boundary
- start recording major product and architecture decisions in `docs/decision-log.md`
- keep updating `PROJECT_STATE.md` and `docs/session-log.md` after each verified work block

## Open Issues

- no active repository-side blocker
