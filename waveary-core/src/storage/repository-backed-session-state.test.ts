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
