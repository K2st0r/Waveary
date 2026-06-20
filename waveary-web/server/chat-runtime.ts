import {
  OpenAICompatibleChatProvider,
  SimpleEmotionAnalyzer,
  SimpleRelationshipEngine,
  SimpleTimelineEngine,
  WavearyRuntime,
  type Message,
  type RuntimeTurnResult
} from "@waveary/core";
import { SimpleMemoryExtractor } from "@waveary/memory";

import {
  PersistentChatSessionState,
  type ChatReplyPayload,
  type ChatSessionSnapshot
} from "./chat-session-store.js";
import { loadChatPersistenceConfig } from "./chat-persistence-config.js";
import { loadSavedProviderConfig } from "./provider-config.js";

interface ChatSessionState {
  persistentState: PersistentChatSessionState;
  runtime: WavearyRuntime;
}

const sessions = new Map<string, ChatSessionState>();

export async function sendChatTurn(sessionId: string, content: string): Promise<ChatReplyPayload> {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Message content is required.");
  }

  const state = createOrReuseSession(sessionId);
  const context = state.persistentState.getContext();
  const input: Message = {
    id: `user-${Date.now()}`,
    sessionId: context.session.id,
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await state.runtime.handleTurn(context, input);
  context.history = [...context.history, input, result.reply];

  const payload = toReplyPayload(result);
  state.persistentState.saveTurn(context, payload);

  return payload;
}

export function loadChatSessionSnapshot(sessionId: string): ChatSessionSnapshot | undefined {
  const existing = sessions.get(getRuntimeCacheKey(sessionId));
  if (existing) {
    return existing.persistentState.getSnapshot();
  }

  return new PersistentChatSessionState(sessionId).getSnapshot();
}

export function resetChatRuntimeSessions(): void {
  sessions.clear();
}

function createOrReuseSession(sessionId: string): ChatSessionState {
  const cacheKey = getRuntimeCacheKey(sessionId);
  const existing = sessions.get(cacheKey);
  if (existing) {
    return existing;
  }

  const savedConfig = loadSavedProviderConfig();
  if (!savedConfig) {
    throw new Error("Provider configuration is missing. Save a provider before opening chat.");
  }

  const persistentState = new PersistentChatSessionState(sessionId);
  const runtime = new WavearyRuntime({
    chatProvider: new OpenAICompatibleChatProvider({
      provider: savedConfig.provider,
      apiKey: savedConfig.apiKey,
      baseURL: savedConfig.baseURL,
      model: savedConfig.model
    }),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    memoryStore: persistentState.getMemoryStore(),
    memoryExtractor: new SimpleMemoryExtractor(),
    relationshipStore: persistentState.getRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: persistentState.getTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const state = { persistentState, runtime };
  sessions.set(cacheKey, state);
  return state;
}

function getRuntimeCacheKey(sessionId: string): string {
  return `${loadChatPersistenceConfig().backend}:${sessionId}`;
}

function toReplyPayload(result: RuntimeTurnResult): ChatReplyPayload {
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
