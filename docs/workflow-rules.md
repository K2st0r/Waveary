# Workflow Rules

## Purpose

This file defines the working rules for continuing Waveary safely across multiple Codex sessions.

## Required Routine

For every non-trivial work block:

1. Read `PROJECT_STATE.md`
2. Read `docs/session-log.md`
3. Inspect `git status --short -b`
4. Inspect recent commits
5. Make one cohesive change set
6. Run verification commands
7. Update `PROJECT_STATE.md`
8. Update `docs/session-log.md`
9. Commit
10. Push if GitHub is reachable

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
- continue from `PROJECT_STATE.md` and `docs/session-log.md`
