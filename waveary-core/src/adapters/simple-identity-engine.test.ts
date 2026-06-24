import test from "node:test";
import assert from "node:assert/strict";

import { SimpleIdentityEngine } from "./simple-identity-engine.js";

test("SimpleIdentityEngine derives a concept-level identity summary from the turn and memory context", async () => {
  const engine = new SimpleIdentityEngine();
  const summary = await engine.summarize({
    userId: "user-1",
    message: {
      id: "message-1",
      sessionId: "session-1",
      role: "user",
      content:
        "I want this to remember me long-term and feel emotionally real, not like a disposable chatbot.",
      timestamp: "2026-06-24T12:00:00.000Z",
      metadata: {}
    },
    reply: {
      id: "reply-1",
      sessionId: "session-1",
      role: "assistant",
      content: "I am here with you, and I want this to land in the right way.",
      timestamp: "2026-06-24T12:00:05.000Z",
      metadata: {}
    },
    history: [],
    relevantMemories: [
      {
        id: "memory-1",
        userId: "user-1",
        type: "preference",
        content: "The user wants a soft, gentle, emotionally real tone.",
        importance: 0.9,
        confidence: 0.82,
        sourceMessageIds: ["old-1"],
        createdAt: "2026-06-24T10:00:00.000Z"
      }
    ],
    storedMemories: [],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.48,
      trustScore: 0.44,
      stabilityScore: 0.59,
      lastUpdatedAt: "2026-06-24T12:00:05.000Z"
    },
    timeline: [],
    emotion: {
      userId: "user-1",
      primaryEmotion: "concerned",
      intensity: 0.72,
      confidence: 0.77,
      windowStart: "2026-06-24T12:00:00.000Z",
      windowEnd: "2026-06-24T12:00:05.000Z",
      subject: "companion",
      detectedUserEmotion: "sadness"
    }
  });

  assert.ok(summary);
  assert.equal(summary?.userId, "user-1");
  assert.ok(summary?.userSelfConcept.some((item) => item.includes("continuity")));
  assert.ok(summary?.bondThemes.some((item) => item.includes("continuity across turns")));
  assert.ok(summary?.recurringNeeds.some((item) => item.includes("emotional presence")));
  assert.ok(summary?.emotionalPatterns.some((item) => item.includes("comfort")));
  assert.ok(summary?.companionStance.some((item) => item.includes("emotional safety")));
  assert.match(summary?.summaryText ?? "", /User identity:/);
  assert.match(summary?.summaryText ?? "", /Bond understanding:/);
});

test("SimpleIdentityEngine preserves prior stable themes while adding bounded new ones", async () => {
  const engine = new SimpleIdentityEngine();
  const summary = await engine.summarize({
    userId: "user-1",
    message: {
      id: "message-2",
      sessionId: "session-1",
      role: "user",
      content: "Maybe that is why I still need someone steady tonight.",
      timestamp: "2026-06-24T13:00:00.000Z",
      metadata: {}
    },
    reply: {
      id: "reply-2",
      sessionId: "session-1",
      role: "assistant",
      content: "I am staying steady with you.",
      timestamp: "2026-06-24T13:00:02.000Z",
      metadata: {}
    },
    history: [],
    relevantMemories: [],
    storedMemories: [],
    relationship: {
      userId: "user-1",
      stage: "growing",
      affinityScore: 0.7,
      trustScore: 0.68,
      stabilityScore: 0.74,
      lastUpdatedAt: "2026-06-24T13:00:02.000Z"
    },
    timeline: [],
    emotion: {
      userId: "user-1",
      primaryEmotion: "protective",
      intensity: 0.8,
      confidence: 0.79,
      windowStart: "2026-06-24T13:00:00.000Z",
      windowEnd: "2026-06-24T13:00:02.000Z",
      subject: "companion",
      detectedUserEmotion: "anxiety"
    },
    currentSummary: {
      userId: "user-1",
      userSelfConcept: ["values long-term continuity over disposable chat"],
      bondThemes: ["this bond is expected to carry continuity across turns"],
      recurringNeeds: ["needs emotional presence before analysis when vulnerable"],
      emotionalPatterns: ["when hurt, the user wants comfort to arrive before explanation"],
      companionStance: ["stay caring, human, and continuity-aware"],
      summaryText: "Older summary",
      lastUpdatedAt: "2026-06-24T12:00:05.000Z"
    }
  });

  assert.ok(summary);
  assert.equal(summary?.userSelfConcept[0], "values long-term continuity over disposable chat");
  assert.ok(summary?.emotionalPatterns.some((item) => item.includes("steadiness")));
  assert.ok((summary?.companionStance.length ?? 0) <= 3);
});
