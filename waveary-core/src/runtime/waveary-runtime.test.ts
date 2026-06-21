import test from "node:test";
import assert from "node:assert/strict";

import {
  InMemoryEmotionStore,
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  ScriptedChatProvider,
  SimpleCompanionEmotionEngine,
  SimpleEmotionAnalyzer,
  SimpleProactiveCareEngine,
  SimpleRelationshipEngine,
  SimpleTimelineEngine,
  WavearyRuntime,
  type MemoryCandidate,
  type MemoryItem,
  type MemoryStore,
  type MemoryExtractor,
  type Message,
  type RuntimeContext
} from "../index.js";

function createContext(): RuntimeContext {
  return {
    session: {
      id: "session-1",
      userId: "user-1",
      personaId: "persona-1",
      startedAt: new Date().toISOString(),
      channel: "text",
      state: "active"
    },
    user: {
      id: "user-1",
      displayName: "K2st0r",
      profileTraits: ["reflective"],
      preferences: ["continuity"]
    },
    persona: {
      id: "persona-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["attentive"],
      relationshipStyle: "supportive"
    },
    history: []
  };
}

test("WavearyRuntime stores memories and recalls them on later turns", async () => {
  const memoryStore = new TestMemoryStore();
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore,
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context = createContext();
  const firstMessage: Message = {
    id: "turn-1",
    sessionId: context.session.id,
    role: "user",
    content: "我今天很开心，因为我终于把 Waveary 的定位想清楚了。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const firstResult = await runtime.handleTurn(context, firstMessage);

  assert.equal(firstResult.storedMemories.length, 1);
  assert.equal(firstResult.timeline.length, 1);
  assert.equal(firstResult.relationship.userId, context.user.id);
  assert.equal(firstResult.emotion?.subject, "companion");
  assert.ok(firstResult.reply.content.includes("I am here, and I am listening carefully."));

  const secondContext: RuntimeContext = {
    ...context,
    history: [firstMessage, firstResult.reply]
  };
  const secondMessage: Message = {
    id: "turn-2",
    sessionId: context.session.id,
    role: "user",
    content: "请记住，我希望它是一个数字生命陪伴框架，而不是普通聊天产品。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const secondResult = await runtime.handleTurn(secondContext, secondMessage);

  assert.equal(secondResult.recalledMemories.length, 1);
  assert.ok(secondResult.emotion);
  assert.equal(secondResult.emotion?.primaryEmotion, "warm");
  assert.equal(secondResult.emotion?.detectedUserEmotion, "neutral");
  assert.ok(
    secondResult.reply.content.includes("I still remember"),
    "second reply should mention recalled memory"
  );
  assert.equal(secondResult.timeline.length, 2);
  assert.ok(secondResult.relationship.affinityScore > firstResult.relationship.affinityScore);
  assert.ok(secondResult.relationship.trustScore > firstResult.relationship.trustScore);
});

test("WavearyRuntime shifts companion emotion toward concern when the user is sad", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: new TestMemoryStore(),
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context = createContext();
  const sadMessage: Message = {
    id: "turn-sad-1",
    sessionId: context.session.id,
    role: "user",
    content: "I feel sad and worried tonight.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, sadMessage);

  assert.equal(result.emotion?.primaryEmotion, "concerned");
  assert.equal(result.emotion?.subject, "companion");
  assert.equal(result.emotion?.detectedUserEmotion, "sadness");
  assert.ok(result.reply.content.includes("weight") || result.reply.content.includes("carefully"));
});

test("WavearyRuntime softens scripted replies during late-night local time when time awareness is present", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: new TestMemoryStore(),
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context = createContext();
  const message: Message = {
    id: "turn-night-1",
    sessionId: context.session.id,
    role: "user",
    content: "I do not really want advice, I just want someone here with me.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message, {
    localTime: {
      iso: "2026-06-21T17:30:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "en-US"
    }
  });

  assert.ok(
    result.reply.content.includes("quieter kind of presence"),
    "late-night reply should shift into a softer presence-aware tone"
  );
});

test("WavearyRuntime evaluates proactive care through relationship, emotion, and policy state", async () => {
  const relationshipStore = new InMemoryRelationshipStore();
  const emotionStore = new InMemoryEmotionStore();
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore,
    emotionEngine: new SimpleCompanionEmotionEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: new TestMemoryStore(),
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore,
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  await relationshipStore.applyDelta("user-1", {
    affinityDelta: 0.18,
    trustDelta: 0.12,
    stabilityDelta: 0.04,
    reason: "earned_warmth"
  });
  await emotionStore.saveState("user-1", {
    userId: "user-1",
    subject: "companion",
    primaryEmotion: "concerned",
    intensity: 0.78,
    confidence: 0.81,
    windowStart: "2026-06-20T21:00:00.000Z",
    windowEnd: "2026-06-20T21:00:00.000Z",
    lastUpdatedAt: "2026-06-20T21:00:00.000Z",
    decayHint: "slow",
    detectedUserEmotion: "sadness"
  });

  const context: RuntimeContext = {
    ...createContext(),
    history: [
      {
        id: "prior-user",
        sessionId: "session-1",
        role: "user",
        content: "I have been stressed and sad all evening.",
        timestamp: "2026-06-20T21:00:00.000Z",
        metadata: {}
      },
      {
        id: "prior-reply",
        sessionId: "session-1",
        role: "assistant",
        content: "I am here with you.",
        timestamp: "2026-06-20T21:01:00.000Z",
        metadata: {}
      }
    ]
  };

  const decision = await runtime.evaluateProactiveCare(context, {
    now: "2026-06-21T06:30:00.000Z",
    policy: {
      enabled: true
    }
  });

  assert.equal(decision.shouldReachOut, true);
  assert.equal(decision.intent, "stress_followup");
  assert.equal(decision.urgency, "high");
  assert.ok(decision.reasons.includes("companion_concern_detected"));
});

class TestMemoryStore implements MemoryStore {
  private readonly records = new Map<string, MemoryItem[]>();

  async recallRelevantMemories(userId: string): Promise<MemoryItem[]> {
    return [...(this.records.get(userId) ?? [])].slice(-5);
  }

  async saveMemories(
    userId: string,
    sourceMessage: Message,
    candidates: MemoryCandidate[]
  ): Promise<MemoryItem[]> {
    const existing = this.records.get(userId) ?? [];
    const created = candidates.map<MemoryItem>((candidate, index) => ({
      id: `memory-${sourceMessage.id}-${index}`,
      userId,
      type: candidate.type,
      content: candidate.content,
      importance: candidate.importance,
      confidence: candidate.confidence,
      sourceMessageIds: [sourceMessage.id],
      createdAt: new Date().toISOString()
    }));

    this.records.set(userId, [...existing, ...created]);
    return created;
  }
}

class TestMemoryExtractor implements MemoryExtractor {
  async extractCandidates(message: Message): Promise<MemoryCandidate[]> {
    if (message.content.trim().length < 12) {
      return [];
    }

    return [
      {
        type: "fact",
        content: message.content,
        importance: 0.8,
        confidence: 0.8
      }
    ];
  }
}
