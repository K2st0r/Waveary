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
  CHAT_PERSISTENCE_BACKENDS,
  CHAT_SESSION_JSON_PATH,
  CHAT_SESSION_SQLITE_PATH,
  createDefaultChatPersistenceConfig,
  getChatPersistenceStorageLabel,
  loadChatPersistenceConfig,
  saveChatPersistenceConfig,
  type ChatPersistenceBackendStatus,
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
  memoryArchive: Array<{
    id: string;
    type: MemoryItem["type"];
    content: string;
    importance: number;
    createdAt: string;
  }>;
  relationship: RelationshipProfile | null;
  timelineEvents: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    eventTime: string;
    importance: number;
  }>;
  updatedAt: string;
}

export interface ChatSessionListItem {
  sessionId: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface ExportedChatSession {
  exportedAt: string;
  sessionId: string;
  title: string;
  snapshot: ChatSessionSnapshot;
}

export interface ImportChatSessionResult {
  session: ChatSessionSnapshot;
  exportedAt: string;
  importedFromSessionId: string;
  importedTitle: string;
}

export class ChatSessionImportValidationError extends Error {
  constructor(
    message: string,
    readonly details: string[]
  ) {
    super(message);
    this.name = "ChatSessionImportValidationError";
  }
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
  private readonly repository: ChatSessionRepository;

  constructor(
    private readonly sessionId: string,
    repository: ChatSessionRepository = createChatSessionRepository()
  ) {
    this.repository = repository;
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
      memoryArchive: persisted.memories.map((memory) => ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        importance: memory.importance,
        createdAt: memory.createdAt
      })),
      relationship: persisted.relationship ?? null,
      timelineEvents: persisted.timeline.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.eventType,
        eventTime: event.eventTime,
        importance: event.importance
      })),
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

  close(): void {
    this.repository.close?.();
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
      memoryArchive: session.memories.map((memory) => ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        importance: memory.importance,
        createdAt: memory.createdAt
      })),
      relationship: session.relationship ?? null,
      timelineEvents: session.timeline.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.eventType,
        eventTime: event.eventTime,
        importance: event.importance
      })),
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
      memoryArchive: session.memories.map((memory) => ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        importance: memory.importance,
        createdAt: memory.createdAt
      })),
      relationship: session.relationship ?? null,
      timelineEvents: session.timeline.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.eventType,
        eventTime: event.eventTime,
        importance: event.importance
      })),
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

export function resetChatSession(sessionId: string): ChatSessionSnapshot {
  return withChatSessionRepository((repository) => {
    const previous = repository.load(sessionId);
    const initialState = createInitialSessionState(sessionId);
    const nextState: PersistedChatSession = previous?.title
      ? {
          ...initialState,
          title: previous.title,
          updatedAt: new Date().toISOString()
        }
      : {
          ...initialState,
          updatedAt: new Date().toISOString()
        };

    repository.save(sessionId, nextState);

    return {
      sessionId,
      messages: [],
      latestInsights: null,
      memoryArchive: [],
      relationship: null,
      timelineEvents: [],
      updatedAt: new Date().toISOString()
    };
  });
}

export function exportChatSession(sessionId: string): ExportedChatSession {
  return withChatSessionRepository((repository) => {
    const session = ensureSession(sessionId, repository);
    const title = session.title ?? deriveSessionTitle(sessionId, session);

    return {
      exportedAt: new Date().toISOString(),
      sessionId,
      title,
      snapshot: {
        sessionId,
        messages: session.context.history.filter(
          (message) => message.role === "user" || message.role === "assistant"
        ),
        latestInsights: session.latestInsights,
        memoryArchive: session.memories.map((memory) => ({
          id: memory.id,
          type: memory.type,
          content: memory.content,
          importance: memory.importance,
          createdAt: memory.createdAt
        })),
        relationship: session.relationship ?? null,
        timelineEvents: session.timeline.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.eventType,
          eventTime: event.eventTime,
          importance: event.importance
        })),
        updatedAt: session.updatedAt
      }
    };
  });
}

export function importChatSession(
  exported: ExportedChatSession,
  titleOverride?: string
): ImportChatSessionResult {
  validateExportedChatSession(exported);

  return withChatSessionRepository((repository) => {
    const importedSessionId = resolveSessionId();
    const importedTitle = (titleOverride?.trim() || exported.title.trim() || "Imported Session").slice(0, 120);
    const snapshot = exported.snapshot;
    const now = new Date().toISOString();

    const importedState: PersistedChatSession = {
      context: {
        session: {
          ...createInitialRuntimeContext(importedSessionId).session,
          id: importedSessionId
        },
        user: createInitialRuntimeContext(importedSessionId).user,
        persona: createInitialRuntimeContext(importedSessionId).persona,
        history: snapshot.messages.map((message) => ({
          ...message,
          sessionId: importedSessionId
        }))
      },
      memories: snapshot.memoryArchive.map((memory) => ({
        id: memory.id,
        userId: "user-web-1",
        type: memory.type,
        content: memory.content,
        importance: memory.importance,
        confidence: 0.8,
        sourceMessageIds: [],
        createdAt: memory.createdAt
      })),
      timeline: snapshot.timelineEvents.map((event) => ({
        id: event.id,
        userId: "user-web-1",
        title: event.title,
        description: event.description,
        eventType: event.type,
        eventTime: event.eventTime,
        importance: event.importance,
        linkedMemoryIds: []
      })),
      latestInsights: snapshot.latestInsights,
      title: importedTitle,
      updatedAt: now
    };

    if (snapshot.relationship) {
      importedState.relationship = {
        ...snapshot.relationship,
        userId: "user-web-1"
      };
    }

    repository.save(importedSessionId, importedState);

    return {
      session: {
        sessionId: importedSessionId,
        messages: importedState.context.history.filter(
          (message) => message.role === "user" || message.role === "assistant"
        ),
        latestInsights: importedState.latestInsights,
        memoryArchive: snapshot.memoryArchive,
        relationship: snapshot.relationship,
        timelineEvents: snapshot.timelineEvents,
        updatedAt: importedState.updatedAt
      },
      exportedAt: exported.exportedAt,
      importedFromSessionId: exported.sessionId,
      importedTitle
    };
  });
}

export function getCurrentChatPersistenceStatus(): ChatPersistenceStatus {
  return buildChatPersistenceStatus(loadChatPersistenceConfig());
}

export function switchChatPersistenceBackend(
  nextBackend: ChatPersistenceBackend
): ChatPersistenceSwitchResult {
  const currentBackend = loadChatPersistenceConfig().backend;

  if (currentBackend === nextBackend) {
    return {
      persistence: buildChatPersistenceStatus(loadChatPersistenceConfig()),
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

    saveChatPersistenceConfig({
      backend: nextBackend,
      lastSync: {
        fromBackend: currentBackend,
        toBackend: nextBackend,
        switchedAt: new Date().toISOString(),
        synchronizedSessionCount: importedSessionCount
      }
    });

    withChatSessionRepository((repository) => {
      ensureSession(DEFAULT_CHAT_SESSION_ID, repository);
      return undefined;
    });

    return {
      persistence: buildChatPersistenceStatus(loadChatPersistenceConfig()),
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
    repository.load(sessionId) ?? createInitialSessionState(sessionId);
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
  const baseState: PersistedChatSession = {
    context: createInitialRuntimeContext(sessionId),
    memories: [],
    timeline: [],
    latestInsights: null,
    updatedAt: new Date().toISOString()
  };

  if (sessionId === DEFAULT_CHAT_SESSION_ID) {
    return {
      ...baseState,
      title: "Main Companion Session"
    };
  }

  return baseState;
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

function validateExportedChatSession(exported: ExportedChatSession): void {
  const details: string[] = [];

  if (!exported || typeof exported !== "object") {
    throw new ChatSessionImportValidationError("A valid exported session package is required.", [
      "The import payload must be a JSON object."
    ]);
  }

  if (!exported.sessionId?.trim()) {
    details.push("Missing `sessionId`.");
  }

  if (!exported.title?.trim()) {
    details.push("Missing `title`.");
  }

  if (!exported.snapshot || typeof exported.snapshot !== "object") {
    details.push("Missing `snapshot` object.");
  }

  if (exported.snapshot?.sessionId && typeof exported.snapshot.sessionId !== "string") {
    details.push("`snapshot.sessionId` must be a string.");
  }

  if (exported.snapshot?.updatedAt && typeof exported.snapshot.updatedAt !== "string") {
    details.push("`snapshot.updatedAt` must be a string.");
  }

  if (!Array.isArray(exported.snapshot.messages)) {
    details.push("`snapshot.messages` must be an array.");
  } else {
    exported.snapshot.messages.forEach((message, index) => {
      if (!message || typeof message !== "object") {
        details.push(`Message ${index + 1} must be an object.`);
        return;
      }

      if (typeof message.role !== "string") {
        details.push(`Message ${index + 1} is missing a string \`role\`.`);
      }

      if (typeof message.content !== "string") {
        details.push(`Message ${index + 1} is missing a string \`content\`.`);
      }
    });
  }

  if (!Array.isArray(exported.snapshot.memoryArchive)) {
    details.push("`snapshot.memoryArchive` must be an array.");
  } else {
    exported.snapshot.memoryArchive.forEach((memory, index) => {
      if (!memory || typeof memory !== "object") {
        details.push(`Memory item ${index + 1} must be an object.`);
        return;
      }

      if (typeof memory.content !== "string") {
        details.push(`Memory item ${index + 1} is missing a string \`content\`.`);
      }
    });
  }

  if (!Array.isArray(exported.snapshot.timelineEvents)) {
    details.push("`snapshot.timelineEvents` must be an array.");
  } else {
    exported.snapshot.timelineEvents.forEach((event, index) => {
      if (!event || typeof event !== "object") {
        details.push(`Timeline event ${index + 1} must be an object.`);
        return;
      }

      if (typeof event.title !== "string") {
        details.push(`Timeline event ${index + 1} is missing a string \`title\`.`);
      }
    });
  }

  if (details.length > 0) {
    throw new ChatSessionImportValidationError(
      "Exported session package failed validation.",
      details
    );
  }
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

function buildChatPersistenceStatus(config: ReturnType<typeof loadChatPersistenceConfig>): ChatPersistenceStatus {
  const backendRecords = new Map(
    CHAT_PERSISTENCE_BACKENDS.map((backend) => [backend, loadSessionRecordsForBackend(backend)])
  );
  const activeRecords = backendRecords.get(config.backend) ?? [];

  return {
    ...config,
    availableBackends: CHAT_PERSISTENCE_BACKENDS,
    storageLabel: getChatPersistenceStorageLabel(config.backend),
    backendDetails: CHAT_PERSISTENCE_BACKENDS.map((backend) =>
      buildBackendStatus(backend, backendRecords.get(backend) ?? [], activeRecords, config.backend)
    )
  };
}

function buildBackendStatus(
  backend: ChatPersistenceBackend,
  backendRecords: PersistedSessionStateRecord<PersistedChatSession>[],
  activeRecords: PersistedSessionStateRecord<PersistedChatSession>[],
  activeBackend: ChatPersistenceBackend
): ChatPersistenceBackendStatus {
  const recordMap = new Map(backendRecords.map((record) => [record.sessionId, record.state]));
  const activeMap = new Map(activeRecords.map((record) => [record.sessionId, record.state]));
  const differingSessionIds = new Set<string>();
  const latestUpdatedAt =
    backendRecords.reduce<string | null>((latest, record) => {
      if (!latest || latest.localeCompare(record.state.updatedAt) < 0) {
        return record.state.updatedAt;
      }

      return latest;
    }, null);
  let hasAhead = false;
  let hasBehind = false;

  for (const [sessionId, activeState] of activeMap) {
    const candidate = recordMap.get(sessionId);

    if (!candidate) {
      differingSessionIds.add(sessionId);
      hasBehind = true;
      continue;
    }

    const comparison = candidate.updatedAt.localeCompare(activeState.updatedAt);
    if (comparison < 0) {
      differingSessionIds.add(sessionId);
      hasBehind = true;
    } else if (comparison > 0) {
      differingSessionIds.add(sessionId);
      hasAhead = true;
    }
  }

  for (const sessionId of recordMap.keys()) {
    if (!activeMap.has(sessionId)) {
      differingSessionIds.add(sessionId);
      hasAhead = true;
    }
  }

  return {
    backend,
    storageLabel: getChatPersistenceStorageLabel(backend),
    exists: backend === "sqlite" ? existsSync(CHAT_SESSION_SQLITE_PATH) : existsSync(CHAT_SESSION_JSON_PATH),
    sessionCount: backendRecords.length,
    latestUpdatedAt,
    syncState:
      backend === activeBackend
        ? "active"
        : hasAhead && hasBehind
          ? "diverged"
          : hasBehind
            ? "behind"
            : hasAhead
              ? "ahead"
              : "in-sync",
    differingSessionCount: differingSessionIds.size
  };
}

function loadSessionRecordsForBackend(
  backend: ChatPersistenceBackend
): PersistedSessionStateRecord<PersistedChatSession>[] {
  const repository = createChatSessionRepository(backend);

  try {
    return repository.list();
  } finally {
    repository.close?.();
  }
}
