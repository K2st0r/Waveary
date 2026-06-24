import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import type { PersistedSessionState } from "../index.js";
import { SqliteSessionStateRepository } from "../index.js";

test("SqliteSessionStateRepository saves, loads, and deletes persisted session state", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "waveary-sqlite-"));
  const databasePath = join(tempDir, "session-state.db");
  const repository = new SqliteSessionStateRepository({
    filename: databasePath
  });

  const state: PersistedSessionState = {
    context: {
      session: {
        id: "session-sqlite-1",
        userId: "user-1",
        personaId: "persona-1",
        startedAt: new Date().toISOString(),
        channel: "text",
        state: "active"
      },
      user: {
        id: "user-1",
        displayName: "Waveary User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      persona: {
        id: "persona-1",
        name: "Waveary",
        tone: "warm",
        personaTraits: ["steady"],
        relationshipStyle: "supportive"
      },
      history: [
        {
          id: "message-1",
          sessionId: "session-sqlite-1",
          role: "user",
          content: "Persist this in SQLite.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ]
    },
    memories: [
      {
        id: "memory-1",
        userId: "user-1",
        type: "fact",
        content: "Persist this in SQLite.",
        importance: 0.8,
        confidence: 0.9,
        sourceMessageIds: ["message-1"],
        createdAt: new Date().toISOString()
      }
    ],
    emotion: {
      userId: "user-1",
      subject: "companion",
      primaryEmotion: "warm",
      intensity: 0.6,
      confidence: 0.7,
      modifiers: ["gentle"],
      causes: ["sqlite_test"],
      windowStart: new Date().toISOString(),
      windowEnd: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      decayHint: "medium",
      detectedUserEmotion: "joy"
    },
    identitySummary: {
      userId: "user-1",
      userSelfConcept: ["values long-term continuity over disposable chat"],
      bondThemes: ["the bond is becoming more personal and continuous"],
      recurringNeeds: ["prefers natural conversational cadence over long speeches"],
      emotionalPatterns: ["the user often frames emotion through continuity and remembered threads"],
      companionStance: ["stay caring, human, and continuity-aware"],
      summaryText: "User identity: values long-term continuity over disposable chat.",
      lastUpdatedAt: new Date().toISOString()
    },
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.4,
      trustScore: 0.3,
      stabilityScore: 0.55,
      lastUpdatedAt: new Date().toISOString()
    },
    timeline: [
      {
        id: "timeline-1",
        userId: "user-1",
        title: "SQLite test event",
        description: "Verified persisted state writes to SQLite.",
        eventType: "reflection",
        eventTime: new Date().toISOString(),
        importance: 0.7,
        linkedMemoryIds: ["memory-1"]
      }
    ],
    updatedAt: new Date().toISOString()
  };

  repository.save("session-sqlite-1", state);

  const loaded = repository.load("session-sqlite-1");

  assert.ok(loaded);
  assert.equal(loaded?.context.session.id, "session-sqlite-1");
  assert.equal(loaded?.memories[0]?.content, "Persist this in SQLite.");
  assert.equal(loaded?.emotion?.primaryEmotion, "warm");
  assert.equal(loaded?.identitySummary?.bondThemes[0], "the bond is becoming more personal and continuous");
  assert.equal(loaded?.relationship?.stage, "warming");
  assert.equal(loaded?.timeline[0]?.title, "SQLite test event");

  repository.delete("session-sqlite-1");

  assert.equal(repository.load("session-sqlite-1"), undefined);

  repository.close();
  rmSync(tempDir, { recursive: true, force: true });
});
