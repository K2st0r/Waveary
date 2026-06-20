# Workflow Rules

## Purpose

This file defines the working rules for continuing Waveary safely across multiple Codex sessions.

If Codex starts in this repository with limited context, it should immediately use the local `waveary-continuity-guard` skill and follow this file.

## Required Routine

For every non-trivial work block:

1. Read `PROJECT_STATE.md`
2. Read `docs/session-log.md`
3. Read `docs/decision-log.md`
4. Inspect `git status --short -b`
5. Inspect recent commits
6. Make one cohesive change set
7. Run verification commands
8. Update `PROJECT_STATE.md`
9. Update `docs/session-log.md`
10. Update `docs/decision-log.md` if a meaningful decision was made
11. Commit
12. Push if GitHub is reachable

## Commit Rule

Each completed part must produce:

- a verified change
- a local commit
- a push attempt

## Refactor Rule

Do not refactor just because the previous chat context is gone.

Only refactor when:

- the repository state proves duplication or wrong boundaries
- the change aligns with architecture docs
- the change is captured in updated state files

## Recovery Rule

If a new session starts with little or no context:

- rebuild from repository files
- trust repository evidence over chat memory
- continue from `PROJECT_STATE.md`, `docs/session-log.md`, and `docs/decision-log.md`
