import test from "node:test";
import assert from "node:assert/strict";

import type {
  EmotionState,
  Message,
  PersistedSessionState,
  PersistedSessionStateRecord,
  SessionStateRepository
} from "../index.js";
import { RepositoryBackedSessionState } from "../index.js";

test("RepositoryBackedSessionState persists context, memories, relationship, and timeline through a repository", async () => {
  const repository = new TestSessionStateRepository();
  const sessionState = new RepositoryBackedSessionState({
    sessionId: "session-1",
    repository,
    createInitialState: createInitialState
  });

  const context = sessionState.getContext();
  const input: Message = {
    id: "message-1",
    sessionId: "session-1",
    role: "user",
    content: "Waveary should remember this long-term design note.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  context.history = [...context.history, input];
  sessionState.saveContext(context);

  const storedMemories = await sessionState.getMemoryStore().saveMemories(context.user.id, input, [
    {
      type: "fact",
      content: input.content,
      importance: 0.9,
      confidence: 0.85
    }
  ]);
  const relationship = await sessionState.getRelationshipStore().applyDelta(context.user.id, {
    affinityDelta: 0.2,
    trustDelta: 0.05,
    stabilityDelta: 0.03,
    reason: "meaningful design continuity"
  });
  const emotion: EmotionState = {
    userId: context.user.id,
    subject: "companion",
    primaryEmotion: "warm",
    intensity: 0.62,
    confidence: 0.7,
    modifiers: ["gentle"],
    causes: ["test_emotion_persist"],
    windowStart: new Date().toISOString(),
    windowEnd: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    decayHint: "medium",
    detectedUserEmotion: "joy"
  };
  await sessionState.getEmotionStore().saveState(context.user.id, emotion);
  const timeline = await sessionState.getTimelineStore().appendEvents(context.user.id, [
    {
      id: "timeline-1",
      userId: context.user.id,
      title: "Design note captured",
      description: "Recorded a framework-level persistence direction.",
      eventType: "reflection",
      eventTime: new Date().toISOString(),
      importance: 0.8,
      linkedMemoryIds: storedMemories.map((memory) => memory.id)
    }
  ]);
  const recalled = await sessionState
    .getMemoryStore()
    .recallRelevantMemories(context.user.id, "remember design note");
  const proactiveCarePolicy = sessionState.saveProactiveCarePolicy({
    enabled: true,
    maxDailyReachouts: 3
  });
  const proactiveCareState = sessionState.saveProactiveCareState({
    dailyReachoutsSent: 1,
    unansweredReachoutCount: 1,
    lastReachOutAt: "2026-06-21T12:00:00.000Z"
  });

  const saved = repository.load("session-1");

  assert.ok(saved, "state should be saved in repository");
  assert.equal(saved?.context.history.length, 1);
  assert.equal(saved?.memories.length, 1);
  assert.equal(saved?.emotion?.primaryEmotion, "warm");
  assert.equal(saved?.identitySummary, undefined);
  assert.equal(saved?.proactiveCarePolicy?.enabled, true);
  assert.equal(saved?.proactiveCarePolicy?.maxDailyReachouts, 3);
  assert.equal(saved?.proactiveCareState?.dailyReachoutsSent, 1);
  assert.equal(saved?.proactiveCareState?.unansweredReachoutCount, 1);
  assert.equal(saved?.relationship?.stage, "warming");
  assert.equal(saved?.timeline.length, 1);
  assert.equal(storedMemories.length, 1);
  assert.equal(recalled.length, 1);
  assert.equal(relationship.userId, context.user.id);
  assert.equal(timeline.length, 1);
  assert.equal(proactiveCarePolicy.enabled, true);
  assert.equal(proactiveCareState.dailyReachoutsSent, 1);
});

test("RepositoryBackedSessionState recalls only context-relevant memories and updates recall timestamp", async () => {
  const repository = new TestSessionStateRepository();
  const sessionState = new RepositoryBackedSessionState({
    sessionId: "session-memory-recall",
    repository,
    createInitialState
  });
  const context = sessionState.getContext();
  const createdAt = "2026-06-15T12:00:00.000Z";

  repository.save("session-memory-recall", {
    ...createInitialState("session-memory-recall"),
    memories: [
      {
        id: "memory-1",
        userId: context.user.id,
        type: "fact",
        content: "The user wants Waveary to preserve long-term memory continuity.",
        importance: 0.95,
        confidence: 0.9,
        sourceMessageIds: ["m1"],
        createdAt
      },
      {
        id: "memory-2",
        userId: context.user.id,
        type: "fact",
        content: "The user once mentioned liking cloudy afternoons and quiet music.",
        importance: 0.92,
        confidence: 0.88,
        sourceMessageIds: ["m2"],
        createdAt
      }
    ],
    updatedAt: createdAt
  });

  const recalled = await sessionState
    .getMemoryStore()
    .recallRelevantMemories(context.user.id, "Please remember the long-term memory continuity direction.");

  assert.equal(recalled.length, 1);
  assert.equal(recalled[0]?.id, "memory-1");
  assert.ok(recalled[0]?.lastRecalledAt);

  const saved = repository.load("session-memory-recall");
  const recalledMemory = saved?.memories.find((memory) => memory.id === "memory-1");
  const untouchedMemory = saved?.memories.find((memory) => memory.id === "memory-2");

  assert.ok(recalledMemory?.lastRecalledAt);
  assert.equal(untouchedMemory?.lastRecalledAt, undefined);
});

test("RepositoryBackedSessionState persists concept-level identity summaries", async () => {
  const repository = new TestSessionStateRepository();
  const sessionState = new RepositoryBackedSessionState({
    sessionId: "session-identity-summary",
    repository,
    createInitialState
  });
  const context = sessionState.getContext();

  await sessionState.getIdentityStore().saveSummary(context.user.id, {
    userId: context.user.id,
    userSelfConcept: ["values long-term continuity over disposable chat"],
    bondThemes: ["this bond is expected to carry continuity across turns"],
    recurringNeeds: ["needs emotional presence before analysis when vulnerable"],
    emotionalPatterns: ["when hurt, the user wants comfort to arrive before explanation"],
    companionStance: ["stay caring, human, and continuity-aware"],
    summaryText:
      "User identity: values long-term continuity over disposable chat. Bond understanding: this bond is expected to carry continuity across turns.",
    lastUpdatedAt: "2026-06-24T12:00:00.000Z"
  });

  const saved = repository.load("session-identity-summary");
  const loaded = await sessionState.getIdentityStore().getSummary(context.user.id);

  assert.equal(saved?.identitySummary?.userSelfConcept[0], "values long-term continuity over disposable chat");
  assert.equal(loaded?.bondThemes[0], "this bond is expected to carry continuity across turns");
  assert.match(loaded?.summaryText ?? "", /Bond understanding:/);
});

function createInitialState(sessionId: string): PersistedSessionState {
  return {
    context: {
      session: {
        id: sessionId,
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
      history: []
    },
    memories: [],
    timeline: [],
    updatedAt: new Date().toISOString()
  };
}

class TestSessionStateRepository
  implements SessionStateRepository<PersistedSessionState>
{
  private readonly records = new Map<string, PersistedSessionState>();

  load(sessionId: string): PersistedSessionState | undefined {
    return this.records.get(sessionId);
  }

  save(sessionId: string, state: PersistedSessionState): void {
    this.records.set(sessionId, JSON.parse(JSON.stringify(state)) as PersistedSessionState);
  }

  delete(sessionId: string): void {
    this.records.delete(sessionId);
  }

  list(): PersistedSessionStateRecord<PersistedSessionState>[] {
    return [...this.records.entries()].map(([sessionId, state]) => ({
      sessionId,
      state: JSON.parse(JSON.stringify(state)) as PersistedSessionState
    }));
  }
}
