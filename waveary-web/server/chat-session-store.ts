import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  EmotionState,
  MemoryItem,
  Message,
  RelationshipProfile,
  RuntimeContext,
  TimelineEvent
} from "@waveary/core";
import {
  RepositoryBackedSessionState,
  type PersistedSessionState,
  type SessionStateRepository
} from "@waveary/core";

export interface ChatReplyPayload {
  reply: string;
  relationship: RelationshipProfile;
  emotion?: EmotionState;
  recalledMemories: string[];
  storedMemories: string[];
  timeline: Array<{
    title: string;
    type: string;
    eventTime: string;
  }>;
}

export interface ChatSessionSnapshot {
  sessionId: string;
  messages: Message[];
  latestInsights: ChatReplyPayload | null;
  updatedAt: string;
}

export interface ChatSessionListItem {
  sessionId: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface PersistedChatSession extends PersistedSessionState {
  latestInsights: ChatReplyPayload | null;
  title?: string;
}

type PersistedChatSessions = Record<string, PersistedChatSession>;

const SESSION_STORE_PATH = fileURLToPath(new URL("../../.waveary/chat-sessions.json", import.meta.url));
export const DEFAULT_CHAT_SESSION_ID = "waveary-main";

export class PersistentChatSessionState {
  private readonly runtimeState: RepositoryBackedSessionState<PersistedChatSession>;

  constructor(private readonly sessionId: string) {
    this.runtimeState = new RepositoryBackedSessionState({
      sessionId,
      repository: new FileBackedSessionRepository(),
      createInitialState: createInitialSessionState
    });
  }

  getContext(): RuntimeContext {
    return this.runtimeState.getContext();
  }

  getMemoryStore() {
    return this.runtimeState.getMemoryStore();
  }

  getRelationshipStore() {
    return this.runtimeState.getRelationshipStore();
  }

  getTimelineStore() {
    return this.runtimeState.getTimelineStore();
  }

  saveTurn(context: RuntimeContext, latestInsights: ChatReplyPayload): void {
    this.runtimeState.saveState((current) => ({
      ...current,
      context: cloneContext(context),
      latestInsights,
      updatedAt: new Date().toISOString()
    }));
  }

  getSnapshot(): ChatSessionSnapshot | undefined {
    const persisted = loadPersistedChatSession(this.sessionId);
    if (!persisted) {
      return undefined;
    }

    return {
      sessionId: this.sessionId,
      messages: persisted.context.history.filter(
        (message) => message.role === "user" || message.role === "assistant"
      ),
      latestInsights: persisted.latestInsights,
      updatedAt: persisted.updatedAt
    };
  }

  setTitle(title: string): void {
    const normalized = title.trim();

    if (!normalized) {
      return;
    }

    updateSession(this.sessionId, (current) => ({
      ...current,
      title: normalized,
      updatedAt: new Date().toISOString()
    }));
  }

  private readOrCreate(): PersistedChatSession {
    return this.runtimeState.getState();
  }
}

function loadPersistedChatSession(sessionId: string): PersistedChatSession | undefined {
  return readAllSessions()[sessionId];
}

export function listChatSessions(): ChatSessionListItem[] {
  ensureSession(DEFAULT_CHAT_SESSION_ID);
  const sessions = readAllSessions();

  return Object.entries(sessions)
    .map(([sessionId, session]) => ({
      sessionId,
      title: session.title ?? deriveSessionTitle(sessionId, session),
      updatedAt: session.updatedAt,
      messageCount: session.context.history.filter(
        (message) => message.role === "user" || message.role === "assistant"
      ).length
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createChatSession(sessionId?: string, title?: string): ChatSessionSnapshot {
  const resolvedSessionId = resolveSessionId(sessionId);
  const session = ensureSession(resolvedSessionId);

  if (title?.trim()) {
    updateSession(resolvedSessionId, (current) => ({
      ...current,
      title: title.trim(),
      updatedAt: new Date().toISOString()
    }));
  }

  return {
    sessionId: resolvedSessionId,
    messages: session.context.history.filter(
      (message) => message.role === "user" || message.role === "assistant"
    ),
    latestInsights: session.latestInsights,
    updatedAt: session.updatedAt
  };
}

export function renameChatSession(sessionId: string, title: string): ChatSessionSnapshot {
  if (sessionId === DEFAULT_CHAT_SESSION_ID) {
    throw new Error("The default main session cannot be renamed.");
  }

  const normalized = title.trim();

  if (!normalized) {
    throw new Error("Session title is required.");
  }

  const session = ensureSession(sessionId);

  updateSession(sessionId, (current) => ({
    ...current,
    title: normalized,
    updatedAt: new Date().toISOString()
  }));

  return {
    sessionId,
    messages: session.context.history.filter(
      (message) => message.role === "user" || message.role === "assistant"
    ),
    latestInsights: session.latestInsights,
    updatedAt: new Date().toISOString()
  };
}

export function deleteChatSession(sessionId: string): ChatSessionListItem[] {
  if (sessionId === DEFAULT_CHAT_SESSION_ID) {
    throw new Error("The default main session cannot be deleted.");
  }

  const sessions = readAllSessions();

  if (!(sessionId in sessions)) {
    return listChatSessions();
  }

  delete sessions[sessionId];
  writeAllSessions(sessions);

  return listChatSessions();
}

function ensureSession(sessionId: string): PersistedChatSession {
  const existing = loadPersistedChatSession(sessionId);
  if (existing) {
    return existing;
  }

  const created = createInitialSessionState(sessionId);

  updateSession(sessionId, () => created);
  return created;
}

function updateSession(
  sessionId: string,
  updater: (current: PersistedChatSession) => PersistedChatSession
): PersistedChatSession {
  const sessions = readAllSessions();
  const current =
    sessions[sessionId] ??
    ({
      context: createInitialRuntimeContext(sessionId),
      memories: [],
      timeline: [],
      latestInsights: null,
      updatedAt: new Date().toISOString(),
      title: sessionId === DEFAULT_CHAT_SESSION_ID ? "Main Companion Session" : undefined
    } satisfies PersistedChatSession);
  const next = updater(current);

  sessions[sessionId] = next;
  writeAllSessions(sessions);
  return next;
}

function readAllSessions(): PersistedChatSessions {
  if (!existsSync(SESSION_STORE_PATH)) {
    return {};
  }

  return JSON.parse(readFileSync(SESSION_STORE_PATH, "utf8")) as PersistedChatSessions;
}

function writeAllSessions(sessions: PersistedChatSessions): void {
  mkdirSync(dirname(SESSION_STORE_PATH), { recursive: true });
  writeFileSync(SESSION_STORE_PATH, JSON.stringify(sessions, null, 2));
}

function createInitialRuntimeContext(sessionId: string): RuntimeContext {
  return {
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
}

function createInitialSessionState(sessionId: string): PersistedChatSession {
  return {
    context: createInitialRuntimeContext(sessionId),
    memories: [],
    timeline: [],
    latestInsights: null,
    updatedAt: new Date().toISOString(),
    title: sessionId === DEFAULT_CHAT_SESSION_ID ? "Main Companion Session" : undefined
  };
}

function resolveSessionId(sessionId?: string): string {
  const trimmed = sessionId?.trim();

  if (trimmed) {
    return trimmed;
  }

  return `session-${Date.now()}`;
}

function deriveSessionTitle(sessionId: string, session: PersistedChatSession): string {
  const firstUserMessage = session.context.history.find((message) => message.role === "user");

  if (firstUserMessage?.content.trim()) {
    return firstUserMessage.content.trim().slice(0, 36);
  }

  if (sessionId === DEFAULT_CHAT_SESSION_ID) {
    return "Main Companion Session";
  }

  return sessionId;
}

function cloneContext(context: RuntimeContext): RuntimeContext {
  return JSON.parse(JSON.stringify(context)) as RuntimeContext;
}

class FileBackedSessionRepository
  implements SessionStateRepository<PersistedChatSession>
{
  load(sessionId: string): PersistedChatSession | undefined {
    return loadPersistedChatSession(sessionId);
  }

  save(sessionId: string, state: PersistedChatSession): void {
    updateSession(sessionId, () => state);
  }

  delete(sessionId: string): void {
    const sessions = readAllSessions();
    delete sessions[sessionId];
    writeAllSessions(sessions);
  }
}
