import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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
  type PersistedSessionStateRecord,
  type SessionStateRepository
} from "@waveary/core";
import { SqliteSessionStateRepository as CoreSqliteSessionStateRepository } from "@waveary/core";
import {
  CHAT_SESSION_JSON_PATH,
  CHAT_SESSION_SQLITE_PATH,
  getChatPersistenceStatus,
  loadChatPersistenceConfig,
  saveChatPersistenceConfig,
  type ChatPersistenceBackend,
  type ChatPersistenceStatus
} from "./chat-persistence-config.js";

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

export const DEFAULT_CHAT_SESSION_ID = "waveary-main";

interface ChatSessionRepository extends SessionStateRepository<PersistedChatSession> {
  close?(): void;
}

export interface ChatPersistenceSwitchResult {
  persistence: ChatPersistenceStatus;
  importedSessionCount: number;
}

export class PersistentChatSessionState {
  private readonly runtimeState: RepositoryBackedSessionState<PersistedChatSession>;

  constructor(
    private readonly sessionId: string,
    repository: ChatSessionRepository = createChatSessionRepository()
  ) {
    this.runtimeState = new RepositoryBackedSessionState({
      sessionId,
      repository,
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

    withChatSessionRepository((repository) =>
      updateSession(
        this.sessionId,
        (current) => ({
          ...current,
          title: normalized,
          updatedAt: new Date().toISOString()
        }),
        repository
      )
    );
  }

  private readOrCreate(): PersistedChatSession {
    return this.runtimeState.getState();
  }
}

function loadPersistedChatSession(sessionId: string): PersistedChatSession | undefined {
  return withChatSessionRepository((repository) => repository.load(sessionId));
}

export function listChatSessions(): ChatSessionListItem[] {
  return withChatSessionRepository((repository) => {
    ensureSession(DEFAULT_CHAT_SESSION_ID, repository);
    const sessions = repository.list();

    return sessions
      .map(({ sessionId, state: session }) => ({
        sessionId,
        title: session.title ?? deriveSessionTitle(sessionId, session),
        updatedAt: session.updatedAt,
        messageCount: session.context.history.filter(
          (message) => message.role === "user" || message.role === "assistant"
        ).length
      }))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  });
}

export function createChatSession(sessionId?: string, title?: string): ChatSessionSnapshot {
  return withChatSessionRepository((repository) => {
    const resolvedSessionId = resolveSessionId(sessionId);
    const session = ensureSession(resolvedSessionId, repository);

    if (title?.trim()) {
      updateSession(
        resolvedSessionId,
        (current) => ({
          ...current,
          title: title.trim(),
          updatedAt: new Date().toISOString()
        }),
        repository
      );
    }

    return {
      sessionId: resolvedSessionId,
      messages: session.context.history.filter(
        (message) => message.role === "user" || message.role === "assistant"
      ),
      latestInsights: session.latestInsights,
      updatedAt: session.updatedAt
    };
  });
}

export function renameChatSession(sessionId: string, title: string): ChatSessionSnapshot {
  if (sessionId === DEFAULT_CHAT_SESSION_ID) {
    throw new Error("The default main session cannot be renamed.");
  }

  const normalized = title.trim();

  if (!normalized) {
    throw new Error("Session title is required.");
  }

  return withChatSessionRepository((repository) => {
    const session = ensureSession(sessionId, repository);

    updateSession(
      sessionId,
      (current) => ({
        ...current,
        title: normalized,
        updatedAt: new Date().toISOString()
      }),
      repository
    );

    return {
      sessionId,
      messages: session.context.history.filter(
        (message) => message.role === "user" || message.role === "assistant"
      ),
      latestInsights: session.latestInsights,
      updatedAt: new Date().toISOString()
    };
  });
}

export function deleteChatSession(sessionId: string): ChatSessionListItem[] {
  if (sessionId === DEFAULT_CHAT_SESSION_ID) {
    throw new Error("The default main session cannot be deleted.");
  }

  return withChatSessionRepository((repository) => {
    const sessions = repository.list();

    if (!sessions.some((session) => session.sessionId === sessionId)) {
      return listChatSessions();
    }

    repository.delete(sessionId);

    return listChatSessions();
  });
}

export function getCurrentChatPersistenceStatus(): ChatPersistenceStatus {
  return getChatPersistenceStatus();
}

export function switchChatPersistenceBackend(
  nextBackend: ChatPersistenceBackend
): ChatPersistenceSwitchResult {
  const currentBackend = loadChatPersistenceConfig().backend;

  if (currentBackend === nextBackend) {
    return {
      persistence: getChatPersistenceStatus(),
      importedSessionCount: 0
    };
  }

  const sourceRepository = createChatSessionRepository(currentBackend);
  const targetRepository = createChatSessionRepository(nextBackend);

  try {
    const sourceSessions = sourceRepository.list();
    const targetSessions = new Map(
      targetRepository.list().map((record) => [record.sessionId, record.state])
    );
    let importedSessionCount = 0;

    sourceSessions.forEach(({ sessionId, state }) => {
      const existingTargetState = targetSessions.get(sessionId);

      if (
        !existingTargetState ||
        existingTargetState.updatedAt.localeCompare(state.updatedAt) < 0
      ) {
        targetRepository.save(sessionId, state);
        importedSessionCount += 1;
      }
    });

    saveChatPersistenceConfig({ backend: nextBackend });

    withChatSessionRepository((repository) => {
      ensureSession(DEFAULT_CHAT_SESSION_ID, repository);
      return undefined;
    });

    return {
      persistence: getChatPersistenceStatus(),
      importedSessionCount
    };
  } finally {
    sourceRepository.close?.();
    targetRepository.close?.();
  }
}

function ensureSession(
  sessionId: string,
  repository: ChatSessionRepository = createChatSessionRepository()
): PersistedChatSession {
  const existing = repository.load(sessionId);
  if (existing) {
    return existing;
  }

  const created = createInitialSessionState(sessionId);

  updateSession(sessionId, () => created, repository);
  return created;
}

function updateSession(
  sessionId: string,
  updater: (current: PersistedChatSession) => PersistedChatSession,
  repository: ChatSessionRepository = createChatSessionRepository()
): PersistedChatSession {
  const current =
    repository.load(sessionId) ??
    ({
      context: createInitialRuntimeContext(sessionId),
      memories: [],
      timeline: [],
      latestInsights: null,
      updatedAt: new Date().toISOString(),
      title: sessionId === DEFAULT_CHAT_SESSION_ID ? "Main Companion Session" : undefined
    } satisfies PersistedChatSession);
  const next = updater(current);

  repository.save(sessionId, next);
  return next;
}

function readAllSessions(): PersistedChatSessions {
  if (!existsSync(CHAT_SESSION_JSON_PATH)) {
    return {};
  }

  return JSON.parse(readFileSync(CHAT_SESSION_JSON_PATH, "utf8")) as PersistedChatSessions;
}

function writeAllSessions(sessions: PersistedChatSessions): void {
  mkdirSync(dirname(CHAT_SESSION_JSON_PATH), { recursive: true });
  writeFileSync(CHAT_SESSION_JSON_PATH, JSON.stringify(sessions, null, 2));
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
    return readAllSessions()[sessionId];
  }

  save(sessionId: string, state: PersistedChatSession): void {
    const sessions = readAllSessions();
    sessions[sessionId] = state;
    writeAllSessions(sessions);
  }

  delete(sessionId: string): void {
    const sessions = readAllSessions();
    delete sessions[sessionId];
    writeAllSessions(sessions);
  }

  list(): PersistedSessionStateRecord<PersistedChatSession>[] {
    return Object.entries(readAllSessions()).map(([sessionId, state]) => ({
      sessionId,
      state
    }));
  }
}

class SqliteBackedChatSessionRepository
  implements ChatSessionRepository
{
  private readonly repository: CoreSqliteSessionStateRepository<PersistedChatSession>;

  constructor() {
    this.repository = new CoreSqliteSessionStateRepository<PersistedChatSession>({
      filename: CHAT_SESSION_SQLITE_PATH
    });
  }

  load(sessionId: string): PersistedChatSession | undefined {
    return this.repository.load(sessionId);
  }

  save(sessionId: string, state: PersistedChatSession): void {
    this.repository.save(sessionId, state);
  }

  delete(sessionId: string): void {
    this.repository.delete(sessionId);
  }

  list(): PersistedSessionStateRecord<PersistedChatSession>[] {
    return this.repository.list();
  }

  close(): void {
    this.repository.close();
  }
}

function createChatSessionRepository(
  backend: ChatPersistenceBackend = loadChatPersistenceConfig().backend
): ChatSessionRepository {
  return backend === "sqlite"
    ? new SqliteBackedChatSessionRepository()
    : new FileBackedSessionRepository();
}

function withChatSessionRepository<T>(
  runner: (repository: ChatSessionRepository) => T
): T {
  const repository = createChatSessionRepository();

  try {
    return runner(repository);
  } finally {
    repository.close?.();
  }
}
