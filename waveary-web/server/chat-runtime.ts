import {
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  OpenAICompatibleChatProvider,
  SimpleEmotionAnalyzer,
  SimpleRelationshipEngine,
  SimpleTimelineEngine,
  WavearyRuntime,
  type Message,
  type RuntimeContext,
  type RuntimeTurnResult
} from "@waveary/core";
import { InMemoryMemoryStore, SimpleMemoryExtractor } from "@waveary/memory";

import { loadSavedProviderConfig } from "./provider-config.js";

interface ChatSessionState {
  context: RuntimeContext;
  runtime: WavearyRuntime;
}

interface ChatReplyPayload {
  reply: string;
  relationship: RuntimeTurnResult["relationship"];
  emotion?: RuntimeTurnResult["emotion"];
  recalledMemories: string[];
  storedMemories: string[];
  timeline: Array<{
    title: string;
    type: string;
    eventTime: string;
  }>;
}

const sessions = new Map<string, ChatSessionState>();

export async function sendChatTurn(sessionId: string, content: string): Promise<ChatReplyPayload> {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Message content is required.");
  }

  const state = createOrReuseSession(sessionId);
  const input: Message = {
    id: `user-${Date.now()}`,
    sessionId: state.context.session.id,
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await state.runtime.handleTurn(state.context, input);

  state.context.history = [...state.context.history, input, result.reply];

  return {
    reply: result.reply.content,
    relationship: result.relationship,
    emotion: result.emotion,
    recalledMemories: result.recalledMemories.map((memory) => memory.content),
    storedMemories: result.storedMemories.map((memory) => memory.content),
    timeline: result.timeline.map((event) => ({
      title: event.title,
      type: event.eventType,
      eventTime: event.eventTime
    }))
  };
}

function createOrReuseSession(sessionId: string): ChatSessionState {
  const existing = sessions.get(sessionId);
  if (existing) {
    return existing;
  }

  const savedConfig = loadSavedProviderConfig();
  if (!savedConfig) {
    throw new Error("Provider configuration is missing. Save a provider before opening chat.");
  }

  const runtime = new WavearyRuntime({
    chatProvider: new OpenAICompatibleChatProvider({
      provider: savedConfig.provider,
      apiKey: savedConfig.apiKey,
      baseURL: savedConfig.baseURL,
      model: savedConfig.model
    }),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    memoryStore: new InMemoryMemoryStore(),
    memoryExtractor: new SimpleMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context: RuntimeContext = {
    session: {
      id: sessionId,
      userId: "user-web-1",
      personaId: "persona-waveary-1",
      startedAt: new Date().toISOString(),
      channel: "text",
      state: "active"
    },
    user: {
      id: "user-web-1",
      displayName: "Waveary User",
      profileTraits: ["reflective", "long-term thinker"],
      preferences: ["continuity", "memory"]
    },
    persona: {
      id: "persona-waveary-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["steady", "attentive"],
      relationshipStyle: "supportive"
    },
    history: []
  };

  const state = { context, runtime };
  sessions.set(sessionId, state);
  return state;
}
