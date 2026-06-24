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
  type Message,
  type RuntimeContext
} from "../../waveary-core/dist/index.js";
import {
  InMemoryMemoryStore,
  SimpleMemoryExtractor
} from "../../waveary-memory/dist/index.js";

function createBaseContext(): RuntimeContext {
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
      preferences: ["long-term continuity"]
    },
    persona: {
      id: "persona-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["attentive", "steady"],
      relationshipStyle: "supportive"
    },
    history: []
  };
}

async function runDemo(): Promise<void> {
  const runtime = new WavearyRuntime({
    chatProvider: new ScriptedChatProvider(),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: new InMemoryMemoryStore(),
    memoryExtractor: new SimpleMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context = createBaseContext();
  const firstMessage: Message = {
    id: "turn-1",
    sessionId: context.session.id,
    role: "user",
    content: "我今天很开心，因为我终于把 Waveary 的定位想清楚了。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const firstResult = await runtime.handleTurn(context, firstMessage);
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

  console.log(
    JSON.stringify(
      {
        firstReply: firstResult.reply.content,
        secondReply: secondResult.reply.content,
        emotion: secondResult.emotion,
        recalledMemories: secondResult.recalledMemories.map((memory) => memory.content),
        relationship: secondResult.relationship,
        timeline: secondResult.timeline.map((event) => ({
          title: event.title,
          type: event.eventType
        }))
      },
      null,
      2
    )
  );
}

void runDemo();
