import test from "node:test";
import assert from "node:assert/strict";

import {
  InMemoryEmotionStore,
  InMemoryIdentityStore,
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  ScriptedChatProvider,
  SimpleCompanionEmotionEngine,
  SimpleEmotionAnalyzer,
  SimpleIdentityEngine,
  SimpleProactiveCareEngine,
  SimpleRelationshipEngine,
  SimpleTimelineEngine,
  WavearyRuntime,
  type MemoryCandidate,
  type MemoryExtractor,
  type MemoryItem,
  type MemoryStore,
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
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    content: "I finally clarified that Waveary should be a long-term digital life companion framework.",
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
    content:
      "Please remember that I want it to stay a digital life companion framework, not a generic chatbot product.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const secondResult = await runtime.handleTurn(secondContext, secondMessage);

  assert.equal(secondResult.recalledMemories.length, 1);
  assert.ok(secondResult.emotion);
  assert.ok(
    ["warm", "earnest", "settled"].includes(secondResult.emotion?.primaryEmotion ?? ""),
    "second-turn emotion should reflect warmer continuity rather than stay flat"
  );
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
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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

test("WavearyRuntime avoids forcing a weak recalled memory into an emotional turn", async () => {
  const memoryStore = new TestMemoryStore([
    {
      id: "memory-1",
      userId: "user-1",
      type: "preference",
      content: "The user likes cloudy afternoons and sketching on weekends.",
      importance: 0.82,
      confidence: 0.78,
      sourceMessageIds: ["old-message"],
      createdAt: new Date().toISOString()
    }
  ]);
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore,
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context = createContext();
  const message: Message = {
    id: "turn-emotional-memory-1",
    sessionId: context.session.id,
    role: "user",
    content: "I feel anxious tonight and I do not want to be alone with it.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.equal(result.recalledMemories.length, 1);
  assert.ok(
    result.reply.content.includes("do not want to force an old detail") ||
      result.reply.content.includes("do not want to drag in the wrong memory"),
    "scripted reply should avoid forcing a weak memory into an emotional turn"
  );
});

test("WavearyRuntime reflects warmer familiarity once the relationship is growing", async () => {
  const relationshipStore = new InMemoryRelationshipStore();
  await relationshipStore.applyDelta("user-1", {
    affinityDelta: 0.18,
    trustDelta: 0.12,
    stabilityDelta: 0.05,
    reason: "user_extended_trust"
  });
  await relationshipStore.applyDelta("user-1", {
    affinityDelta: 0.16,
    trustDelta: 0.11,
    stabilityDelta: 0.05,
    reason: "user_shared_vulnerability"
  });

  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: new TestMemoryStore(),
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore,
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context: RuntimeContext = {
    ...createContext(),
    history: [
      {
        id: "prior-user",
        sessionId: "session-1",
        role: "user",
        content: "Please remember that this project is about long-term companionship.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        metadata: {}
      }
    ]
  };
  const message: Message = {
    id: "turn-growing-1",
    sessionId: context.session.id,
    role: "user",
    content: "I really want this to feel like someone staying with me over time.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.equal(result.relationship.stage, "growing");
  assert.ok(
    result.reply.content.includes("what you do when something really matters") ||
      result.reply.content.includes("part of our longer thread") ||
      result.reply.content.includes("been carrying forward"),
    "growing-stage reply should sound more familiar and continuous"
  );
});

test("WavearyRuntime softens scripted replies during late-night local time when time awareness is present", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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

test("WavearyRuntime lets new-stage scripted chat learn names naturally", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: new TestMemoryStore(),
    memoryExtractor: new TestMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context: RuntimeContext = {
    ...createContext(),
    user: {
      ...createContext().user,
      displayName: "User"
    }
  };
  const message: Message = {
    id: "turn-new-1",
    sessionId: context.session.id,
    role: "user",
    content: "Hi. We just met, I think.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.equal(result.relationship.stage, "new");
  assert.ok(
    result.reply.content.includes("what should I call you?") ||
      result.reply.content.includes("What should I call you?"),
    "new-stage scripted reply should invite the user's preferred name naturally"
  );
  assert.ok(
    result.reply.content.includes("there you are") ||
      result.reply.content.includes("lovely in that new kind of way"),
    "new-stage greeting should feel a little more softly intimate"
  );
});

test("WavearyRuntime keeps simple home-status turns brief instead of turning them into a questionnaire", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-1",
    sessionId: context.session.id,
    role: "user",
    content: "Okay, I'm home now.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(result.reply.content.length < 260);
});

test("WavearyRuntime keeps simple transit updates brief instead of turning them into a questionnaire", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2",
    sessionId: context.session.id,
    role: "user",
    content: "I'm on my way.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(result.reply.content.length < 260);
});

test("WavearyRuntime keeps softly hedged everyday updates brief and question-free", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2b",
    sessionId: context.session.id,
    role: "user",
    content: "I think I'll head back soon.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 220);
});

test("WavearyRuntime keeps small apology repair messages brief and low-pressure", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2c",
    sessionId: context.session.id,
    role: "user",
    content: "sorry for the late reply",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 220);
});

test("WavearyRuntime keeps small tone-repair messages brief and does not turn them into a scene", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2c2",
    sessionId: context.session.id,
    role: "user",
    content: "didn't mean to sound harsh",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 220);
});

test("WavearyRuntime keeps light self-conscious softeners brief and low-pressure", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2c3",
    sessionId: context.session.id,
    role: "user",
    content: "hope that didn't sound weird",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 220);
});

test("WavearyRuntime keeps gentle reassurance closers brief and non-reopening", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2d",
    sessionId: context.session.id,
    role: "user",
    content: "get some rest then",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 180);
});

test("WavearyRuntime makes plain return messages feel a little more glad-to-see-you", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-return-1",
    sessionId: context.session.id,
    role: "user",
    content: "I'm back.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(result.reply.content.includes("There you are"));
  assert.ok(
    result.reply.content.includes("happy to see you come back") ||
      result.reply.content.includes("glad"),
    "return-message reply should sound softly glad"
  );
});

test("WavearyRuntime keeps light check-back nudges brief and non-dramatic", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2e",
    sessionId: context.session.id,
    role: "user",
    content: "still up?",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 180);
  assert.ok(
    result.reply.content.includes("I'm here") ||
      result.reply.content.includes("still with you"),
    "check-back reply should sound present and a little close"
  );
});

test("WavearyRuntime makes sleep-check nudges feel softly late-night instead of generic", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-sleep-1",
    sessionId: context.session.id,
    role: "user",
    content: "you asleep?",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message, {
    localTime: {
      iso: "2026-06-27T15:45:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "en-US"
    }
  });

  assert.ok(result.reply.content.includes("awake with you"));
  assert.ok(result.reply.content.length < 180);
});

test("WavearyRuntime keeps lingering late-night nudges soft and brief", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-sleep-2",
    sessionId: context.session.id,
    role: "user",
    content: "not asleep yet?",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(result.reply.content.includes("awake with you"));
  assert.ok(result.reply.content.length < 180);
});

test("WavearyRuntime keeps light affectionate catch-up lines brief and warm", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-2f",
    sessionId: context.session.id,
    role: "user",
    content: "just thought of you",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 220);
});

test("WavearyRuntime keeps simple miss-you lines brief and softly mutual", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-miss-1",
    sessionId: context.session.id,
    role: "user",
    content: "miss you",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(
    /miss|come here|glad|there you are/i.test(result.reply.content),
    "miss-you opener should stay warm and lightly affectionate"
  );
  assert.ok(result.reply.content.length < 240);
});

test("WavearyRuntime keeps did-you-miss-me openers light and slightly teasing", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-miss-2",
    sessionId: context.session.id,
    role: "user",
    content: "did you miss me?",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(
    /miss|tease|curious|come here|glad/i.test(result.reply.content),
    "did-you-miss-me opener should stay light and lightly teasing"
  );
  assert.ok(result.reply.content.length < 180);
});

test("WavearyRuntime keeps dream-of-you openers warm and curious", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-dream-1",
    sessionId: context.session.id,
    role: "user",
    content: "dreamed of you",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(result.reply.content.includes("wandered into your dream"));
  assert.ok(result.reply.content.length < 220);
});

test("WavearyRuntime keeps good-night lines soft and non-reopening", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-goodnight-1",
    sessionId: context.session.id,
    role: "user",
    content: "good night",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(
    /night|rest|softly|holding|here/i.test(result.reply.content),
    "good-night opener should stay soft and closing-shaped"
  );
  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(result.reply.content.length < 180);
});

test("WavearyRuntime keeps micro acknowledgments extremely brief", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-3",
    sessionId: context.session.id,
    role: "user",
    content: "\u77e5\u9053\u5566",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 140);
});

test("WavearyRuntime keeps deferential closers extremely brief", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-status-4",
    sessionId: context.session.id,
    role: "user",
    content: "\u90a3\u884c\u5427",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  assert.ok(!result.reply.content.includes("Tell me a little more"));
  assert.ok(!result.reply.content.includes("I still remember"));
  assert.ok(result.reply.content.length < 140);
});

test("WavearyRuntime forms a concept-level identity summary from repeated companion needs", async () => {
  const identityStore = new InMemoryIdentityStore();
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore,
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-identity-1",
    sessionId: context.session.id,
    role: "user",
    content:
      "I want this to remember me long-term and feel emotionally real, not like a disposable chatbot.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);
  const storedSummary = await identityStore.getSummary(context.user.id);

  assert.ok(result.identitySummary);
  assert.ok(
    result.identitySummary?.userSelfConcept.some((item) => item.includes("continuity")),
    "runtime should infer a higher-level continuity-oriented self concept"
  );
  assert.ok(
    result.identitySummary?.recurringNeeds.some((item) => item.includes("emotional presence")),
    "runtime should infer a stable care preference from the user's wording"
  );
  assert.equal(storedSummary?.summaryText, result.identitySummary?.summaryText);
});

test("WavearyRuntime answers direct local-time questions deterministically before provider fallback", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new NeverUseThisTimeFallbackProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-time-1",
    sessionId: context.session.id,
    role: "user",
    content: "现在几点了？",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message, {
    localTime: {
      iso: "2026-06-22T13:30:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "zh-CN"
    }
  });

  assert.ok(result.reply.content.includes("本地时间是"));
  assert.ok(!result.reply.content.includes("没法准确告诉你"));
});

test("WavearyRuntime does not mistake emotional turns mentioning today for a local-time question", async () => {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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
    id: "turn-sadness-1",
    sessionId: context.session.id,
    role: "user",
    content: "我今天有些不开心",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message, {
    localTime: {
      iso: "2026-06-24T12:20:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "zh-CN"
    }
  });

  assert.ok(!result.reply.content.includes("本地时间是"));
  assert.ok(
    result.reply.content.includes("careful") ||
      result.reply.content.includes("weight") ||
      result.reply.content.includes("stay with"),
    "emotional turn should still receive a companionship-style reply"
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
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
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

  constructor(initialMemories?: MemoryItem[]) {
    if (initialMemories?.length) {
      this.records.set("user-1", initialMemories);
    }
  }

  async recallRelevantMemories(userId: string, input: string): Promise<MemoryItem[]> {
    const normalizedInput = input.toLowerCase();
    const latinTerms = normalizedInput.match(/[a-z0-9]{3,}/g) ?? [];
    const hanTerms = Array.from(
      new Set(
        [...normalizedInput.matchAll(/\p{Script=Han}{2,}/gu)].flatMap((match) => {
          const fragment = match[0];
          const pieces = [fragment];

          for (let index = 0; index < fragment.length - 1; index += 1) {
            pieces.push(fragment.slice(index, index + 2));
          }

          return pieces;
        })
      )
    );
    const searchTerms = [...latinTerms, ...hanTerms];

    return [...(this.records.get(userId) ?? [])]
      .filter((memory) => {
        const normalizedMemory = memory.content.toLowerCase();
        return searchTerms.some((term) => normalizedMemory.includes(term));
      })
      .slice(-3);
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

class NeverUseThisTimeFallbackProvider extends ScriptedChatProvider {
  override async generateReply(): Promise<string> {
    return "我目前没有联网获取实时时间的能力，所以没法准确告诉你现在是几点几分。";
  }
}
