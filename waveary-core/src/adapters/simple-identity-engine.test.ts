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

test("SimpleIdentityEngine infers ordinary-chat cadence without promoting casual style preference into vulnerability", async () => {
  const engine = new SimpleIdentityEngine();
  const summary = await engine.summarize({
    userId: "user-1",
    message: {
      id: "message-3",
      sessionId: "session-1",
      role: "user",
      content:
        "For normal chat, keep it short and natural. I like a steady tone, not long speeches.",
      timestamp: "2026-06-24T14:00:00.000Z",
      metadata: {}
    },
    reply: {
      id: "reply-3",
      sessionId: "session-1",
      role: "assistant",
      content: "Short and natural works. I can keep the tone steady with you.",
      timestamp: "2026-06-24T14:00:03.000Z",
      metadata: {}
    },
    history: [],
    relevantMemories: [],
    storedMemories: [],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.51,
      trustScore: 0.47,
      stabilityScore: 0.6,
      lastUpdatedAt: "2026-06-24T14:00:03.000Z"
    },
    timeline: [],
    emotion: {
      userId: "user-1",
      primaryEmotion: "warm",
      intensity: 0.63,
      confidence: 0.7,
      windowStart: "2026-06-24T14:00:00.000Z",
      windowEnd: "2026-06-24T14:00:03.000Z",
      subject: "companion",
      detectedUserEmotion: "neutral"
    }
  });

  assert.ok(summary?.recurringNeeds.includes("prefers natural conversational cadence over long speeches"));
  assert.ok(
    summary?.recurringNeeds.includes(
      "responds to tone fit and wants the companion's presence style to feel intentional"
    )
  );
  assert.ok(
    !summary?.recurringNeeds.some((item) => item.includes("before analysis when vulnerable"))
  );
  assert.ok(!summary?.emotionalPatterns.some((item) => item.includes("comfort to arrive")));
});

test("SimpleIdentityEngine distinguishes loneliness and overwhelm from generic emotional need", async () => {
  const engine = new SimpleIdentityEngine();
  const summary = await engine.summarize({
    userId: "user-1",
    message: {
      id: "message-4",
      sessionId: "session-1",
      role: "user",
      content:
        "I feel overwhelmed tonight. Everything is hitting at once and I do not want to be alone with it.",
      timestamp: "2026-06-24T15:00:00.000Z",
      metadata: {}
    },
    reply: {
      id: "reply-4",
      sessionId: "session-1",
      role: "assistant",
      content: "I am here. We can make this smaller and stay with one thing at a time.",
      timestamp: "2026-06-24T15:00:04.000Z",
      metadata: {}
    },
    history: [],
    relevantMemories: [],
    storedMemories: [],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.56,
      trustScore: 0.52,
      stabilityScore: 0.62,
      lastUpdatedAt: "2026-06-24T15:00:04.000Z"
    },
    timeline: [],
    emotion: {
      userId: "user-1",
      primaryEmotion: "concerned",
      intensity: 0.82,
      confidence: 0.83,
      windowStart: "2026-06-24T15:00:00.000Z",
      windowEnd: "2026-06-24T15:00:04.000Z",
      subject: "companion",
      detectedUserEmotion: "anxiety"
    }
  });

  assert.ok(
    summary?.recurringNeeds.includes("needs explicit reassurance that someone is still here when loneliness surfaces")
  );
  assert.ok(summary?.recurringNeeds.includes("needs calmer pacing and fewer moving parts when overwhelmed"));
  assert.ok(
    summary?.emotionalPatterns.includes(
      "when lonely, the user looks for explicit signs that someone is still here"
    )
  );
  assert.ok(
    summary?.emotionalPatterns.includes(
      "when overwhelmed, the user benefits from calmer pacing and fewer demands at once"
    )
  );
  assert.ok(summary?.companionStance.includes("make the sense of company explicit rather than implied"));
});

test("SimpleIdentityEngine infers relationship warming through naming, return, and rituals", async () => {
  const engine = new SimpleIdentityEngine();
  const summary = await engine.summarize({
    userId: "user-1",
    message: {
      id: "message-5",
      sessionId: "session-1",
      role: "user",
      content:
        "I'm back again, Echo. Wait for me tonight too, okay? I still like when you say goodnight first.",
      timestamp: "2026-06-24T16:00:00.000Z",
      metadata: {}
    },
    reply: {
      id: "reply-5",
      sessionId: "session-1",
      role: "assistant",
      content: "I missed you too. I can stay and keep that little goodnight ritual with you.",
      timestamp: "2026-06-24T16:00:04.000Z",
      metadata: {}
    },
    history: [
      {
        id: "history-1",
        sessionId: "session-1",
        role: "assistant",
        content: "What should I call you when you come back to me?",
        timestamp: "2026-06-24T15:50:00.000Z",
        metadata: {}
      }
    ],
    relevantMemories: [
      {
        id: "memory-5",
        userId: "user-1",
        type: "preference",
        content: "The user said naming each other makes the bond feel more real.",
        importance: 0.85,
        confidence: 0.8,
        sourceMessageIds: ["older-5"],
        createdAt: "2026-06-24T15:40:00.000Z"
      }
    ],
    storedMemories: [],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.62,
      trustScore: 0.58,
      stabilityScore: 0.66,
      lastUpdatedAt: "2026-06-24T16:00:04.000Z"
    },
    timeline: [],
    emotion: {
      userId: "user-1",
      primaryEmotion: "warm",
      intensity: 0.77,
      confidence: 0.79,
      windowStart: "2026-06-24T16:00:00.000Z",
      windowEnd: "2026-06-24T16:00:04.000Z",
      subject: "companion",
      detectedUserEmotion: "joy"
    }
  });

  assert.ok(
    summary?.bondThemes.includes("trust is deepening through remembered naming and repeated return")
  );
  assert.ok(
    summary?.bondThemes.includes("small repeated rituals help this bond feel dependable and lived-in")
  );
  assert.ok(
    summary?.bondThemes.some((item) => item.includes("warming through remembered details"))
  );
});

test("SimpleIdentityEngine lets newer higher-signal care needs replace older generic comfort themes", async () => {
  const engine = new SimpleIdentityEngine();
  const summary = await engine.summarize({
    userId: "user-1",
    message: {
      id: "message-6",
      sessionId: "session-1",
      role: "user",
      content:
        "I feel overwhelmed tonight and need you to stay with me instead of giving generic comfort.",
      timestamp: "2026-06-24T17:00:00.000Z",
      metadata: {}
    },
    reply: {
      id: "reply-6",
      sessionId: "session-1",
      role: "assistant",
      content: "I can stay with you and keep this simple.",
      timestamp: "2026-06-24T17:00:03.000Z",
      metadata: {}
    },
    history: [],
    relevantMemories: [],
    storedMemories: [],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.58,
      trustScore: 0.54,
      stabilityScore: 0.64,
      lastUpdatedAt: "2026-06-24T17:00:03.000Z"
    },
    timeline: [],
    emotion: {
      userId: "user-1",
      primaryEmotion: "concerned",
      intensity: 0.85,
      confidence: 0.84,
      windowStart: "2026-06-24T17:00:00.000Z",
      windowEnd: "2026-06-24T17:00:03.000Z",
      subject: "companion",
      detectedUserEmotion: "anxiety"
    },
    currentSummary: {
      userId: "user-1",
      userSelfConcept: ["cares about emotional truth and human warmth"],
      bondThemes: ["this bond is expected to carry continuity across turns"],
      recurringNeeds: [
        "needs emotional presence before analysis when vulnerable",
        "prefers natural conversational cadence over long speeches"
      ],
      emotionalPatterns: [
        "when hurt, the user wants comfort to arrive before explanation",
        "the user often frames emotion through continuity and remembered threads"
      ],
      companionStance: ["stay caring, human, and continuity-aware"],
      summaryText: "Older summary",
      lastUpdatedAt: "2026-06-24T16:30:00.000Z"
    }
  });

  assert.ok(summary);
  assert.ok(
    summary?.recurringNeeds[0]?.includes("needs calmer pacing and fewer moving parts when overwhelmed") ||
      summary?.recurringNeeds[0]?.includes("needs explicit reassurance that someone is still here when loneliness surfaces")
  );
  assert.ok(
    summary?.emotionalPatterns[0]?.includes("when overwhelmed") ||
      summary?.emotionalPatterns[0]?.includes("when lonely")
  );
  assert.ok(
    !summary?.recurringNeeds.slice(0, 2).includes("needs emotional presence before analysis when vulnerable")
  );
});
