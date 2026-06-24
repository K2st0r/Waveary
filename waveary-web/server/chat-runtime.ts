import {
  type ChatProvider,
  InMemoryEmotionStore,
  InMemoryIdentityStore,
  type LocalTimeContext,
  OpenAICompatibleChatProvider,
  type ProactiveCarePolicy,
  type ProactiveCareState,
  SimpleEmotionAnalyzer,
  SimpleCompanionEmotionEngine,
  SimpleIdentityEngine,
  SimpleProactiveCareEngine,
  SimpleRelationshipEngine,
  SimpleTimelineEngine,
  WavearyRuntime,
  type Message,
  type RuntimeTurnResult
} from "@waveary/core";
import { SimpleMemoryExtractor } from "@waveary/memory";
import {
  buildProactiveMessageDraft,
  resolveDayPartFromLocalTime,
  type Locale,
  type ProactiveMessageDraft
} from "../src/proactive-message-drafts.js";
import { buildCompanionDeliveryHint } from "./companion-delivery.js";
import {
  detectPendingLocalAction,
  runPendingLocalAction,
  type LocalActionPermissionLevel
} from "./local-actions.js";
import {
  buildLocalActionAuditNote,
  buildLocalActionFailureNote,
  type LocalActionAuditLocale
} from "./local-action-audit.js";

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

export interface ChatProactiveCareEvaluationOptions {
  now?: string;
  policy?: Partial<ProactiveCarePolicy>;
  state?: Partial<ProactiveCareState>;
  timeContext?: {
    localTimeIso?: string;
    timeZone?: string;
    locale?: string;
  };
}

const sessions = new Map<string, ChatSessionState>();

export interface ChatProactiveCareEvaluationResult {
  decision: Awaited<ReturnType<WavearyRuntime["evaluateProactiveCare"]>>;
  draft: ProactiveMessageDraft;
  session: ChatSessionSnapshot | null;
}

export async function sendChatTurn(
  sessionId: string,
  content: string,
  options: {
    localTime?: LocalTimeContext;
    localActionPermission?: LocalActionPermissionLevel;
    locale?: LocalActionAuditLocale;
  } = {}
): Promise<ChatReplyPayload> {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Message content is required.");
  }

  const state = createOrReuseSession(sessionId);
  const context = state.persistentState.getContext();
  const pendingLocalAction = await detectPendingLocalAction(trimmed);
  const input: Message = {
    id: `user-${Date.now()}`,
    sessionId: context.session.id,
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await state.runtime.handleTurn(context, input, {
    ...(options.localTime ? { localTime: options.localTime } : {})
  });
  const payload = toReplyPayload(result);
  const locale = options.locale ?? "en";
  const shouldAutoRunLocalAction =
    pendingLocalAction !== null && options.localActionPermission === "allow";

  if (shouldAutoRunLocalAction && pendingLocalAction) {
    try {
      const actionResult = await runPendingLocalAction({
        action: pendingLocalAction,
        permission: "allow",
        approved: true,
        locale
      });

      const auditReply: Message = {
        id: `assistant-local-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sessionId: context.session.id,
        role: "assistant",
        content:
          actionResult.assistantNote ??
          buildLocalActionAuditNote(pendingLocalAction, "executed", locale),
        timestamp: new Date().toISOString(),
        metadata: {
          source: "local-action",
          localActionId: pendingLocalAction.id,
          localActionKind: pendingLocalAction.kind,
          localActionTarget: pendingLocalAction.target,
          localActionTargetLabel: pendingLocalAction.targetLabel,
          localActionStatus: "executed"
        }
      };

      context.history = [...context.history, input, auditReply];
      payload.reply = auditReply.content;
      payload.pendingLocalAction = null;
    } catch (error) {
      context.history = [...context.history, input, result.reply];
      payload.pendingLocalAction = pendingLocalAction;
      payload.reply = buildLocalActionFailureNote(
        pendingLocalAction,
        locale,
        error instanceof Error ? error.message : undefined
      );
    }
  } else {
    context.history = [...context.history, input, result.reply];
    payload.pendingLocalAction = pendingLocalAction;
  }

  state.persistentState.clearUnansweredProactiveReachouts();
  state.persistentState.saveTurn(context, payload);

  return payload;
}

export function loadChatSessionSnapshot(sessionId: string): ChatSessionSnapshot | undefined {
  const existing = sessions.get(getRuntimeCacheKey(sessionId));
  if (existing) {
    return existing.persistentState.getSnapshot();
  }

  const persistentState = new PersistentChatSessionState(sessionId);

  try {
    return persistentState.getSnapshot();
  } finally {
    persistentState.close();
  }
}

export function resetChatRuntimeSessions(): void {
  for (const state of sessions.values()) {
    state.persistentState.close();
  }

  sessions.clear();
}

export function resetChatRuntimeSession(sessionId: string): void {
  for (const [cacheKey, state] of sessions.entries()) {
    if (!cacheKey.endsWith(`:${sessionId}`)) {
      continue;
    }

    state.persistentState.close();
    sessions.delete(cacheKey);
  }
}

export async function evaluateChatProactiveCare(
  sessionId: string,
  options: ChatProactiveCareEvaluationOptions = {}
): Promise<ChatProactiveCareEvaluationResult> {
  const cacheKey = getRuntimeCacheKey(sessionId);
  const cached = sessions.get(cacheKey);

  if (cached) {
    const context = cached.persistentState.getContext();
    const decision = await cached.runtime.evaluateProactiveCare(context, {
      ...(options.now ? { now: options.now } : {}),
      policy: {
        ...cached.persistentState.getProactiveCarePolicy(),
        ...(options.policy ?? {})
      },
      state: {
        ...cached.persistentState.getProactiveCareState(),
        ...(options.state ?? {})
      }
    });

    return {
      decision,
      draft: buildProactiveEvaluationDraft(decision, options.timeContext),
      session: cached.persistentState.getSnapshot() ?? null
    };
  }

  const transientState = createSessionState(sessionId, { requireProvider: false });

  try {
    const context = transientState.persistentState.getContext();
    const decision = await transientState.runtime.evaluateProactiveCare(context, {
      ...(options.now ? { now: options.now } : {}),
      policy: {
        ...transientState.persistentState.getProactiveCarePolicy(),
        ...(options.policy ?? {})
      },
      state: {
        ...transientState.persistentState.getProactiveCareState(),
        ...(options.state ?? {})
      }
    });

    return {
      decision,
      draft: buildProactiveEvaluationDraft(decision, options.timeContext),
      session: transientState.persistentState.getSnapshot() ?? null
    };
  } finally {
    transientState.persistentState.close();
  }
}

function createOrReuseSession(sessionId: string): ChatSessionState {
  const cacheKey = getRuntimeCacheKey(sessionId);
  const existing = sessions.get(cacheKey);
  if (existing) {
    return existing;
  }

  const state = createSessionState(sessionId, { requireProvider: true });
  sessions.set(cacheKey, state);
  return state;
}

function createSessionState(
  sessionId: string,
  options: {
    requireProvider: boolean;
  }
): ChatSessionState {
  const savedConfig = loadSavedProviderConfig();

  if (options.requireProvider && !savedConfig) {
    throw new Error("Provider configuration is missing. Save a provider before opening chat.");
  }

  const persistentState = new PersistentChatSessionState(sessionId);
  const runtime = new WavearyRuntime({
    chatProvider: createChatProvider(savedConfig),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: persistentState.getEmotionStore
      ? persistentState.getEmotionStore()
      : new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    identityStore: persistentState.getIdentityStore
      ? persistentState.getIdentityStore()
      : new InMemoryIdentityStore(),
    identityEngine: new SimpleIdentityEngine(),
    proactiveCareEngine: new SimpleProactiveCareEngine(),
    memoryStore: persistentState.getMemoryStore(),
    memoryExtractor: new SimpleMemoryExtractor(),
    relationshipStore: persistentState.getRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: persistentState.getTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  return { persistentState, runtime };
}

function getRuntimeCacheKey(sessionId: string): string {
  return `${loadChatPersistenceConfig().backend}:${sessionId}`;
}

function toReplyPayload(result: RuntimeTurnResult): ChatReplyPayload {
  const delivery = result.emotion
    ? buildCompanionDeliveryHint(result.relationship, result.emotion)
    : undefined;

  return {
    reply: result.reply.content,
    relationship: result.relationship,
    recalledMemories: result.recalledMemories.map((memory) => memory.content),
    storedMemories: result.storedMemories.map((memory) => memory.content),
    pendingLocalAction: null,
    timeline: result.timeline.map((event) => ({
      title: event.title,
      type: event.eventType,
      eventTime: event.eventTime
    })),
    ...(result.emotion ? { emotion: result.emotion } : {}),
    ...(delivery ? { delivery } : {})
  };
}

function createChatProvider(
  savedConfig: ReturnType<typeof loadSavedProviderConfig>
): ChatProvider {
  if (savedConfig) {
    return new OpenAICompatibleChatProvider({
      provider: savedConfig.provider,
      apiKey: savedConfig.apiKey,
      baseURL: savedConfig.baseURL,
      model: savedConfig.model
    });
  }

  return {
    async generateReply(): Promise<string> {
      throw new Error("Provider configuration is missing. Save a provider before opening chat.");
    }
  };
}

function buildProactiveEvaluationDraft(
  decision: Awaited<ReturnType<WavearyRuntime["evaluateProactiveCare"]>>,
  timeContext?: {
    localTimeIso?: string;
    timeZone?: string;
    locale?: string;
  }
): ProactiveMessageDraft {
  const locale = normalizeDraftLocale(timeContext?.locale);
  const dayPart =
    timeContext?.localTimeIso
      ? resolveDayPartFromLocalTime(timeContext.localTimeIso, timeContext.timeZone)
      : undefined;

  return buildProactiveMessageDraft(decision, locale, dayPart);
}

function normalizeDraftLocale(locale: string | undefined): Locale {
  if (!locale) {
    return "en";
  }

  return locale.toLowerCase().startsWith("zh") ? "zh" : "en";
}
