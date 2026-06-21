# Workflow Rules

## Purpose

This file defines the working rules for continuing Waveary safely across multiple Codex sessions.

If Codex starts in this repository with limited context, it should immediately use the local `waveary-continuity-guard` skill and follow this file.

## Required Routine

For every non-trivial work block:

1. Read `PROJECT_STATE.md`
2. Read `ACTIVE_TASKS.md`
3. Read `docs/product-preferences.md`
4. Read `docs/session-log.md`
5. Read `docs/decision-log.md`
6. Inspect `git status --short -b`
7. Inspect recent commits
8. Make one cohesive change set
9. Run verification commands
10. Update `PROJECT_STATE.md`
11. Update `ACTIVE_TASKS.md` when the active queue or current implementation target changes
12. Update `docs/product-preferences.md` when a stable long-term preference becomes explicit enough to preserve
13. Update `docs/session-log.md`
14. Update `docs/decision-log.md` if a meaningful decision was made
15. Record the next recommended step in `PROJECT_STATE.md`
16. Commit the functional change
17. Push the functional commit if GitHub is reachable
18. If state files still contain `pending` placeholders after the push result is known, update them immediately
19. Commit and push that continuity sync as a separate follow-up record when needed

## Completion Rule

A work block is not considered complete until all of the following are true:

- the relevant verification commands were actually run
- `PROJECT_STATE.md` reflects the newest verified functional commit
- `docs/session-log.md` records the real commit hash and real push result
- the next recommended step is written down for the next session

Do not stop at "code changed locally" or "tests passed once".

The repository continuity files must end in a state where a new Codex session can continue safely without relying on chat history.

## Commit Rule

Each completed part must produce:

- a verified change
- a local commit
- a push attempt
- a recorded next step

If the first functional commit is pushed before continuity placeholders are resolved, make a second small continuity-only commit immediately after that sync.

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
- continue from `PROJECT_STATE.md`, `ACTIVE_TASKS.md`, `docs/product-preferences.md`, `docs/session-log.md`, and `docs/decision-log.md`
