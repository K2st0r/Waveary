# Waveary Session File Format

This document defines the current browser-facing import/export package for Waveary local sessions.

Use it when:

- exporting a session from `waveary-web`
- importing a session into `waveary-web`
- generating compatible session packages from external tooling

## Purpose

Waveary treats session history, memory, relationship state, and timeline state as durable companion assets.

The session export package is the first portable container for those assets in Waveary CE.

Current design goals:

- human-readable JSON
- safe local portability
- compatible with browser export and import
- import always restores into a new local session

## Current Import Rule

The current `waveary-web` importer does **not** overwrite or merge an existing session.

Instead it:

1. validates the incoming JSON package
2. creates a brand-new local session ID
3. restores conversation, memories, relationship, timeline, and latest insights into that new session

This rule is deliberate. It keeps session migration safe during the current CE stage.

## Top-Level Shape

```json
{
  "schemaVersion": "waveary-session@1",
  "exportedAt": "2026-06-20T00:00:00.000Z",
  "sessionId": "waveary-main",
  "title": "Main Companion Session",
  "snapshot": {
    "sessionId": "waveary-main",
    "messages": [],
    "latestInsights": null,
    "memoryArchive": [],
    "relationship": null,
    "timelineEvents": [],
    "updatedAt": "2026-06-20T00:00:00.000Z"
  }
}
```

## Field Reference

### `schemaVersion`

- type: `string`
- current emitted value: `waveary-session@1`
- meaning: explicit Waveary browser session package version

### `exportedAt`

- type: `string`
- expected shape: ISO timestamp
- meaning: when the export package was produced

### `sessionId`

- type: `string`
- meaning: original session ID at export time

### `title`

- type: `string`
- meaning: human-readable session title at export time

### `snapshot`

- type: `object`
- meaning: exported session content and companion state

## Snapshot Fields

### `snapshot.sessionId`

- type: `string`
- meaning: original session ID inside the snapshot payload

### `snapshot.messages`

- type: `array`
- required for import: yes
- imported roles currently expected: `user` and `assistant`

Minimal message shape:

```json
{
  "id": "user-1",
  "role": "user",
  "content": "I want you to remember this.",
  "sessionId": "waveary-main"
}
```

Required import-safe fields:

- `role`: string
- `content`: string

Other fields may be preserved if present, but the current importer primarily depends on the fields above.

### `snapshot.latestInsights`

- type: `object | null`
- meaning: latest runtime response metadata shown by the browser UI

Current shape when present:

```json
{
  "reply": "I remember that.",
  "relationship": {
    "userId": "user-web-1",
    "stage": "growing",
    "affinityScore": 0.55,
    "trustScore": 0.51,
    "stabilityScore": 0.62,
    "lastUpdatedAt": "2026-06-20T00:00:00.000Z"
  },
  "emotion": {
    "userId": "waveary-main",
    "primaryEmotion": "neutral",
    "intensity": 0.35,
    "confidence": 0.6,
    "windowStart": "2026-06-20T00:00:00.000Z",
    "windowEnd": "2026-06-20T00:00:00.000Z"
  },
  "recalledMemories": [],
  "storedMemories": [],
  "timeline": []
}
```

### `snapshot.memoryArchive`

- type: `array`
- required for import: yes

Minimal memory item shape:

```json
{
  "id": "memory-1",
  "type": "reflection",
  "content": "I want you to remember this.",
  "importance": 0.7,
  "createdAt": "2026-06-20T00:00:00.000Z"
}
```

Required import-safe fields:

- `content`: string

Recommended fields:

- `id`
- `type`
- `importance`
- `createdAt`

### `snapshot.relationship`

- type: `object | null`
- meaning: current relationship snapshot for the session

Shape:

```json
{
  "stage": "growing",
  "affinityScore": 0.55,
  "trustScore": 0.51,
  "stabilityScore": 0.62,
  "lastUpdatedAt": "2026-06-20T00:00:00.000Z"
}
```

### `snapshot.timelineEvents`

- type: `array`
- required for import: yes

Minimal timeline event shape:

```json
{
  "id": "timeline-1",
  "title": "Important reflection",
  "description": "I want you to remember this.",
  "type": "reflection",
  "eventTime": "2026-06-20T00:00:00.000Z",
  "importance": 0.7
}
```

Required import-safe fields:

- `title`: string

Recommended fields:

- `description`
- `type`
- `eventTime`
- `importance`

### `snapshot.updatedAt`

- type: `string`
- expected shape: ISO timestamp
- meaning: when the session snapshot was last updated before export

## Current Validation Behavior

The current importer returns structured validation diagnostics when the package is malformed.

It currently checks for:

- unsupported top-level `schemaVersion` when a version is present
- missing top-level `sessionId`
- missing or invalid top-level `exportedAt`
- missing top-level `title`
- missing `snapshot`
- missing or invalid `snapshot.updatedAt`
- missing `snapshot.latestInsights`
- missing `snapshot.relationship`
- non-array `snapshot.messages`
- non-array `snapshot.memoryArchive`
- non-array `snapshot.timelineEvents`
- message entries without string `role`
- message entries using unsupported roles outside `user` and `assistant`
- message entries without string `content`
- memory entries without required type, content, importance, and createdAt fields
- memory entries with `importance` outside `0..1`
- memory entries with invalid ISO timestamps
- timeline entries without required title, description, type, eventTime, and importance fields
- timeline entries with `importance` outside `0..1`
- timeline entries with invalid ISO timestamps
- relationship and latest insight score fields outside `0..1`
- relationship and latest insight timestamp fields that are not valid ISO timestamps
- mismatched `sessionId` values between top-level package, snapshot payload, and message entries
- timestamps that are structurally valid but semantically later than `snapshot.updatedAt` or `exportedAt`
- message arrays whose valid `createdAt` values move backward in time
- timeline arrays whose valid `eventTime` values move backward in time
- duplicate `id` values inside `snapshot.memoryArchive`
- duplicate `id` values inside `snapshot.timelineEvents`

## Compatibility Notes

- Current exports include `schemaVersion: "waveary-session@1"`.
- The current importer remains backward-compatible with older packages that do not include `schemaVersion`.
- Packages that declare an unsupported `schemaVersion` are rejected explicitly.
- This is the current CE browser session package, not a final long-term interchange standard.
- Future versions may add stricter schema validation or richer metadata.
- External tooling should preserve unknown fields when possible.

## Example

See:

- `docs/examples/session-export.sample.json`
