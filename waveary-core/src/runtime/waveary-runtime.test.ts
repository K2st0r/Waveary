import test from "node:test";
import assert from "node:assert/strict";

import {
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  ScriptedChatProvider,
  SimpleEmotionAnalyzer,
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
  assert.ok(firstResult.reply.content.includes("I am listening carefully."));

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
  assert.ok(
    secondResult.reply.content.includes("I remember you mentioned"),
    "second reply should mention recalled memory"
  );
  assert.equal(secondResult.timeline.length, 2);
  assert.ok(secondResult.relationship.affinityScore > firstResult.relationship.affinityScore);
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
