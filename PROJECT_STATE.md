# Project State

## Project

Waveary is an open source digital life companion framework.

Brand line:

念念不忘，终有回响。

## Current Branch

- `main`

## Latest Verified Commit

- `7b62365` - `Add runnable core demo and initial memory module`

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

## Next Steps

- add persistence interfaces beyond in-memory storage
- add tests for runtime and memory behavior
- define `waveary-web` package boundary
- push latest local commit when GitHub connectivity is available

## Open Issues

- local branch is ahead of remote by one commit when GitHub `443` connectivity is unavailable
