import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  EmotionState,
  MemoryItem,
  Message,
  ProactiveCarePolicy,
  ProactiveCareState,
  RelationshipProfile,
  RuntimeContext,
  TimelineEvent
} from "@waveary/core";
import {
  RepositoryBackedSessionState,
  createDefaultProactiveCarePolicy,
  createDefaultProactiveCareState,
  resolveProactiveCarePolicy,
  resolveProactiveCareState,
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
import type { PendingLocalAction } from "./local-actions.js";
import type { CompanionDeliveryHint } from "./companion-delivery.js";

export interface ChatReplyPayload {
  reply: string;
  relationship: RelationshipProfile;
  emotion?: EmotionState;
  delivery?: CompanionDeliveryHint;
  recalledMemories: string[];
  storedMemories: string[];
  pendingLocalAction?: PendingLocalAction | null;
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
  proactiveCarePolicy: ProactiveCarePolicy;
  proactiveCareState: ProactiveCareState;
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

export interface UpdateChatProactiveCareResult {
  session: ChatSessionSnapshot;
  sessions: ChatSessionListItem[];
  defaultSessionId: string;
  persistence: ChatPersistenceStatus;
}

export interface ExportedChatSession {
  schemaVersion?: string;
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
export const CHAT_SESSION_SCHEMA_VERSION = "waveary-session@1";
const IMPORTED_MESSAGE_ROLES = new Set(["user", "assistant"]);

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

  getEmotionStore() {
    return this.runtimeState.getEmotionStore();
  }

  getRelationshipStore() {
    return this.runtimeState.getRelationshipStore();
  }

  getTimelineStore() {
    return this.runtimeState.getTimelineStore();
  }

  getProactiveCarePolicy(): ProactiveCarePolicy {
    return this.runtimeState.getProactiveCarePolicy();
  }

  getProactiveCareState(): ProactiveCareState {
    return this.runtimeState.getProactiveCareState();
  }

  getLatestInsights(): ChatReplyPayload | null {
    return this.runtimeState.getState().latestInsights;
  }

  saveProactiveCareSettings(input: {
    policy?: Partial<ProactiveCarePolicy>;
    state?: Partial<ProactiveCareState>;
  }): {
    policy: ProactiveCarePolicy;
    state: ProactiveCareState;
  } {
    const policy = input.policy
      ? this.runtimeState.saveProactiveCarePolicy(input.policy)
      : this.runtimeState.getProactiveCarePolicy();
    const state = input.state
      ? this.runtimeState.saveProactiveCareState(input.state)
      : this.runtimeState.getProactiveCareState();

    return { policy, state };
  }

  saveTurn(context: RuntimeContext, latestInsights: ChatReplyPayload): void {
    this.runtimeState.saveState((current) => ({
      ...current,
      context: cloneContext(context),
      latestInsights,
      updatedAt: new Date().toISOString()
    }));
  }

  replaceLatestInsights(latestInsights: ChatReplyPayload | null): void {
    this.runtimeState.saveState((current) => ({
      ...current,
      latestInsights,
      updatedAt: new Date().toISOString()
    }));
  }

  recordLocalActionResolution(input: {
    pendingAction: PendingLocalAction;
    resolution: "executed" | "dismissed";
    note: string;
  }): void {
    const timestamp = new Date().toISOString();

    this.runtimeState.saveState((current) => {
      const context = cloneContext(current.context);
      context.history = [
        ...context.history,
        {
          id: `assistant-local-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sessionId: context.session.id,
          role: "assistant",
          content: input.note,
          timestamp,
          metadata: {
            source: "local-action",
            localActionId: input.pendingAction.id,
            localActionKind: input.pendingAction.kind,
            localActionTarget: input.pendingAction.target,
            localActionTargetLabel: input.pendingAction.targetLabel,
            localActionStatus: input.resolution
          }
        }
      ];

      return {
        ...current,
        context,
        latestInsights: current.latestInsights
          ? {
              ...current.latestInsights,
              pendingLocalAction: null
            }
          : null,
        updatedAt: timestamp
      };
    });
  }

  clearUnansweredProactiveReachouts(): ProactiveCareState {
    const currentState = this.runtimeState.getProactiveCareState();

    if (currentState.unansweredReachoutCount <= 0) {
      return currentState;
    }

    return this.runtimeState.saveProactiveCareState({
      unansweredReachoutCount: 0
    });
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
      proactiveCarePolicy: resolveProactiveCarePolicy(
        persisted.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
      ),
      proactiveCareState: resolveProactiveCareState(
        persisted.proactiveCareState ?? createDefaultProactiveCareState()
      ),
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
      proactiveCarePolicy: resolveProactiveCarePolicy(
        session.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
      ),
      proactiveCareState: resolveProactiveCareState(
        session.proactiveCareState ?? createDefaultProactiveCareState()
      ),
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
      proactiveCarePolicy: resolveProactiveCarePolicy(
        session.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
      ),
      proactiveCareState: resolveProactiveCareState(
        session.proactiveCareState ?? createDefaultProactiveCareState()
      ),
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
      proactiveCarePolicy: resolveProactiveCarePolicy(
        nextState.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
      ),
      proactiveCareState: resolveProactiveCareState(
        nextState.proactiveCareState ?? createDefaultProactiveCareState()
      ),
      memoryArchive: [],
      relationship: null,
      timelineEvents: [],
      updatedAt: new Date().toISOString()
    };
  });
}

export function resetAllChatSessions(): {
  session: ChatSessionSnapshot;
  sessions: ChatSessionListItem[];
  defaultSessionId: string;
  persistence: ChatPersistenceStatus;
  resetSessionCount: number;
} {
  return withChatSessionRepository((repository) => {
    const existingSessions = repository.list();
    const resetSessionCount = existingSessions.length;

    for (const { sessionId } of existingSessions) {
      repository.delete(sessionId);
    }

    saveChatPersistenceConfig(createDefaultChatPersistenceConfig());

    ensureSession(DEFAULT_CHAT_SESSION_ID, repository);

    const session = {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      messages: [],
      latestInsights: null,
      proactiveCarePolicy: createDefaultProactiveCarePolicy(),
      proactiveCareState: createDefaultProactiveCareState(),
      memoryArchive: [],
      relationship: null,
      timelineEvents: [],
      updatedAt: new Date().toISOString()
    } satisfies ChatSessionSnapshot;

    return {
      session,
      sessions: listChatSessions(),
      defaultSessionId: DEFAULT_CHAT_SESSION_ID,
      persistence: getCurrentChatPersistenceStatus(),
      resetSessionCount
    };
  });
}

export function exportChatSession(sessionId: string): ExportedChatSession {
  return withChatSessionRepository((repository) => {
    const session = ensureSession(sessionId, repository);
    const title = session.title ?? deriveSessionTitle(sessionId, session);

    return {
      schemaVersion: CHAT_SESSION_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      sessionId,
      title,
      snapshot: {
        sessionId,
        messages: session.context.history.filter(
          (message) => message.role === "user" || message.role === "assistant"
        ),
        latestInsights: session.latestInsights,
        proactiveCarePolicy: resolveProactiveCarePolicy(
          session.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
        ),
        proactiveCareState: resolveProactiveCareState(
          session.proactiveCareState ?? createDefaultProactiveCareState()
        ),
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
      proactiveCarePolicy: resolveProactiveCarePolicy(
        snapshot.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
      ),
      proactiveCareState: resolveProactiveCareState(
        snapshot.proactiveCareState ?? createDefaultProactiveCareState()
      ),
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
        proactiveCarePolicy: resolveProactiveCarePolicy(
          importedState.proactiveCarePolicy ??
            snapshot.proactiveCarePolicy ??
            createDefaultProactiveCarePolicy()
        ),
        proactiveCareState: resolveProactiveCareState(
          importedState.proactiveCareState ??
            snapshot.proactiveCareState ??
            createDefaultProactiveCareState()
        ),
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

export function updateChatSessionProactiveCare(
  sessionId: string,
  input: {
    policy?: Partial<ProactiveCarePolicy>;
    state?: Partial<ProactiveCareState>;
  }
): UpdateChatProactiveCareResult {
  const persistentState = new PersistentChatSessionState(sessionId);

  try {
    persistentState.saveProactiveCareSettings(input);

    return {
      session: persistentState.getSnapshot() ?? createChatSession(sessionId),
      sessions: listChatSessions(),
      defaultSessionId: DEFAULT_CHAT_SESSION_ID,
      persistence: getCurrentChatPersistenceStatus()
    };
  } finally {
    persistentState.close();
  }
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
      relationshipStyle: "supportive",
      speakingStyle: "natural, concise, like a real person texting with care",
      emotionalStyle: "gentle, emotionally aware, and sincere without overacting",
      humorStyle: "soft and occasional",
      conversationLengthPreference: "brief",
      followUpStyle: "gentle",
      boundaries: [
        "Do not overwhelm the user with long monologues during ordinary chat",
        "Stay caring and real without sounding theatrical"
      ]
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
    proactiveCarePolicy: createDefaultProactiveCarePolicy(),
    proactiveCareState: createDefaultProactiveCareState(),
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
  const snapshotSessionId =
    exported.snapshot && typeof exported.snapshot === "object" && typeof exported.snapshot.sessionId === "string"
      ? exported.snapshot.sessionId
      : null;
  const snapshotUpdatedAt =
    exported.snapshot && typeof exported.snapshot === "object" && typeof exported.snapshot.updatedAt === "string"
      ? exported.snapshot.updatedAt
      : null;

  if (!exported || typeof exported !== "object") {
    throw new ChatSessionImportValidationError("A valid exported session package is required.", [
      "The import payload must be a JSON object."
    ]);
  }

  if (
    exported.schemaVersion !== undefined &&
    exported.schemaVersion !== CHAT_SESSION_SCHEMA_VERSION
  ) {
    details.push(
      `Unsupported \`schemaVersion\` "${String(exported.schemaVersion)}". Supported version: \`${CHAT_SESSION_SCHEMA_VERSION}\`.`
    );
  }

  if (!exported.sessionId?.trim()) {
    details.push("Missing `sessionId`.");
  }

  if (!exported.exportedAt?.trim()) {
    details.push("Missing `exportedAt`.");
  } else if (!isIsoTimestamp(exported.exportedAt)) {
    details.push("`exportedAt` must be a valid ISO timestamp.");
  }

  if (!exported.title?.trim()) {
    details.push("Missing `title`.");
  }

  if (!exported.snapshot || typeof exported.snapshot !== "object") {
    details.push("Missing `snapshot` object.");
  }

  if (exported.snapshot?.sessionId && typeof exported.snapshot.sessionId !== "string") {
    details.push("`snapshot.sessionId` must be a string.");
  } else if (
    typeof exported.sessionId === "string" &&
    exported.sessionId.trim() &&
    typeof exported.snapshot?.sessionId === "string" &&
    exported.snapshot.sessionId.trim() &&
    exported.sessionId !== exported.snapshot.sessionId
  ) {
    details.push("`sessionId` must match `snapshot.sessionId`.");
  }

  if (!exported.snapshot?.updatedAt) {
    details.push("Missing `snapshot.updatedAt`.");
  } else if (typeof exported.snapshot.updatedAt !== "string") {
    details.push("`snapshot.updatedAt` must be a string.");
  } else if (!isIsoTimestamp(exported.snapshot.updatedAt)) {
    details.push("`snapshot.updatedAt` must be a valid ISO timestamp.");
  }

  if (exported.snapshot?.latestInsights === undefined) {
    details.push("Missing `snapshot.latestInsights`.");
  } else if (
    exported.snapshot.latestInsights !== null &&
    !isRecord(exported.snapshot.latestInsights)
  ) {
    details.push("`snapshot.latestInsights` must be an object or null.");
  } else if (isRecord(exported.snapshot.latestInsights)) {
    validateLatestInsights(exported.snapshot.latestInsights, details);
  }

  if (exported.snapshot?.relationship === undefined) {
    details.push("Missing `snapshot.relationship`.");
  } else if (
    exported.snapshot.relationship !== null &&
    !isRecord(exported.snapshot.relationship)
  ) {
    details.push("`snapshot.relationship` must be an object or null.");
  } else if (isRecord(exported.snapshot.relationship)) {
    validateRelationshipSnapshot(exported.snapshot.relationship, "snapshot.relationship", details);
  }

  if (
    exported.snapshot?.proactiveCarePolicy !== undefined &&
    exported.snapshot.proactiveCarePolicy !== null
  ) {
    if (!isRecord(exported.snapshot.proactiveCarePolicy)) {
      details.push("`snapshot.proactiveCarePolicy` must be an object if present.");
    } else {
      validateProactiveCarePolicySnapshot(
        exported.snapshot.proactiveCarePolicy,
        "snapshot.proactiveCarePolicy",
        details
      );
    }
  }

  if (
    exported.snapshot?.proactiveCareState !== undefined &&
    exported.snapshot.proactiveCareState !== null
  ) {
    if (!isRecord(exported.snapshot.proactiveCareState)) {
      details.push("`snapshot.proactiveCareState` must be an object if present.");
    } else {
      validateProactiveCareStateSnapshot(
        exported.snapshot.proactiveCareState,
        "snapshot.proactiveCareState",
        details
      );
    }
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
      } else if (!IMPORTED_MESSAGE_ROLES.has(message.role)) {
        details.push(
          `Message ${index + 1} has unsupported \`role\` "${String(message.role)}". Supported roles: \`user\`, \`assistant\`.`
        );
      }

      if (typeof message.content !== "string") {
        details.push(`Message ${index + 1} is missing a string \`content\`.`);
      }

      if (
        snapshotSessionId &&
        "sessionId" in message &&
        typeof message.sessionId === "string" &&
        message.sessionId !== snapshotSessionId
      ) {
        details.push(
          `Message ${index + 1} \`sessionId\` must match \`snapshot.sessionId\`.`
        );
      }

      if (
        "createdAt" in message &&
        typeof message.createdAt === "string" &&
        snapshotUpdatedAt &&
        isIsoTimestamp(message.createdAt) &&
        isIsoTimestamp(snapshotUpdatedAt) &&
        Date.parse(message.createdAt) > Date.parse(snapshotUpdatedAt)
      ) {
        details.push(
          `Message ${index + 1} \`createdAt\` cannot be later than \`snapshot.updatedAt\`.`
        );
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

      if (typeof memory.type !== "string") {
        details.push(`Memory item ${index + 1} is missing a string \`type\`.`);
      }

      if (typeof memory.content !== "string") {
        details.push(`Memory item ${index + 1} is missing a string \`content\`.`);
      }

      if (!isFiniteNumber(memory.importance)) {
        details.push(`Memory item ${index + 1} is missing a numeric \`importance\`.`);
      } else if (!isUnitInterval(memory.importance)) {
        details.push(`Memory item ${index + 1} \`importance\` must be between 0 and 1.`);
      }

      if (typeof memory.createdAt !== "string") {
        details.push(`Memory item ${index + 1} is missing a string \`createdAt\`.`);
      } else if (!isIsoTimestamp(memory.createdAt)) {
        details.push(`Memory item ${index + 1} \`createdAt\` must be a valid ISO timestamp.`);
      } else if (
        snapshotUpdatedAt &&
        isIsoTimestamp(snapshotUpdatedAt) &&
        Date.parse(memory.createdAt) > Date.parse(snapshotUpdatedAt)
      ) {
        details.push(
          `Memory item ${index + 1} \`createdAt\` cannot be later than \`snapshot.updatedAt\`.`
        );
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

      if (typeof event.description !== "string") {
        details.push(`Timeline event ${index + 1} is missing a string \`description\`.`);
      }

      if (typeof event.type !== "string") {
        details.push(`Timeline event ${index + 1} is missing a string \`type\`.`);
      }

      if (typeof event.eventTime !== "string") {
        details.push(`Timeline event ${index + 1} is missing a string \`eventTime\`.`);
      } else if (!isIsoTimestamp(event.eventTime)) {
        details.push(`Timeline event ${index + 1} \`eventTime\` must be a valid ISO timestamp.`);
      } else if (
        snapshotUpdatedAt &&
        isIsoTimestamp(snapshotUpdatedAt) &&
        Date.parse(event.eventTime) > Date.parse(snapshotUpdatedAt)
      ) {
        details.push(
          `Timeline event ${index + 1} \`eventTime\` cannot be later than \`snapshot.updatedAt\`.`
        );
      }

      if (!isFiniteNumber(event.importance)) {
        details.push(`Timeline event ${index + 1} is missing a numeric \`importance\`.`);
      } else if (!isUnitInterval(event.importance)) {
        details.push(`Timeline event ${index + 1} \`importance\` must be between 0 and 1.`);
      }
    });
  }

  validateExportedSessionSemantics(exported, details);

  if (details.length > 0) {
    throw new ChatSessionImportValidationError(
      "Exported session package failed validation.",
      details
    );
  }
}

function validateLatestInsights(
  latestInsights: Record<string, unknown>,
  details: string[]
): void {
  if (typeof latestInsights.reply !== "string") {
    details.push("`snapshot.latestInsights.reply` must be a string.");
  }

  if (!isRecord(latestInsights.relationship)) {
    details.push("`snapshot.latestInsights.relationship` must be an object.");
  } else {
    validateRelationshipSnapshot(
      latestInsights.relationship,
      "snapshot.latestInsights.relationship",
      details
    );
  }

  if (!Array.isArray(latestInsights.recalledMemories)) {
    details.push("`snapshot.latestInsights.recalledMemories` must be an array.");
  } else {
    latestInsights.recalledMemories.forEach((memory, index) => {
      if (typeof memory !== "string") {
        details.push(
          `Recalled memory ${index + 1} in \`snapshot.latestInsights.recalledMemories\` must be a string.`
        );
      }
    });
  }

  if (!Array.isArray(latestInsights.storedMemories)) {
    details.push("`snapshot.latestInsights.storedMemories` must be an array.");
  } else {
    latestInsights.storedMemories.forEach((memory, index) => {
      if (typeof memory !== "string") {
        details.push(
          `Stored memory ${index + 1} in \`snapshot.latestInsights.storedMemories\` must be a string.`
        );
      }
    });
  }

  if (!Array.isArray(latestInsights.timeline)) {
    details.push("`snapshot.latestInsights.timeline` must be an array.");
  } else {
    latestInsights.timeline.forEach((event, index) => {
      if (!isRecord(event)) {
        details.push(`Latest insight timeline entry ${index + 1} must be an object.`);
        return;
      }

      if (typeof event.title !== "string") {
        details.push(`Latest insight timeline entry ${index + 1} is missing a string \`title\`.`);
      }

      if (typeof event.type !== "string") {
        details.push(`Latest insight timeline entry ${index + 1} is missing a string \`type\`.`);
      }

      if (typeof event.eventTime !== "string") {
        details.push(`Latest insight timeline entry ${index + 1} is missing a string \`eventTime\`.`);
      } else if (!isIsoTimestamp(event.eventTime)) {
        details.push(`Latest insight timeline entry ${index + 1} \`eventTime\` must be a valid ISO timestamp.`);
      }
    });
  }

  if (latestInsights.emotion !== undefined) {
    if (!isRecord(latestInsights.emotion)) {
      details.push("`snapshot.latestInsights.emotion` must be an object if present.");
    } else {
      if (typeof latestInsights.emotion.primaryEmotion !== "string") {
        details.push("`snapshot.latestInsights.emotion.primaryEmotion` must be a string.");
      }

      if (!isFiniteNumber(latestInsights.emotion.intensity)) {
        details.push("`snapshot.latestInsights.emotion.intensity` must be a number.");
      } else if (!isUnitInterval(latestInsights.emotion.intensity)) {
        details.push("`snapshot.latestInsights.emotion.intensity` must be between 0 and 1.");
      }
    }
  }
}

function validateExportedSessionSemantics(
  exported: ExportedChatSession,
  details: string[]
): void {
  if (!isIsoTimestamp(exported.exportedAt) || !isIsoTimestamp(exported.snapshot.updatedAt)) {
    return;
  }

  const snapshotUpdatedAt = Date.parse(exported.snapshot.updatedAt);
  const exportedAt = Date.parse(exported.exportedAt);

  if (snapshotUpdatedAt > exportedAt) {
    details.push("`snapshot.updatedAt` cannot be later than `exportedAt`.");
  }

  let previousMessageCreatedAt: number | null = null;
  const seenMessageIds = new Set<string>();

  exported.snapshot.messages.forEach((message, index) => {
    if (
      "createdAt" in message &&
      typeof message.createdAt === "string" &&
      isIsoTimestamp(message.createdAt)
    ) {
      const createdAt = Date.parse(message.createdAt);

      if (previousMessageCreatedAt !== null && createdAt < previousMessageCreatedAt) {
        details.push(
          `Message ${index + 1} \`createdAt\` cannot be earlier than the previous message timestamp.`
        );
      }

      previousMessageCreatedAt = createdAt;
    }

    if ("id" in message && typeof message.id === "string" && message.id.trim()) {
      if (seenMessageIds.has(message.id)) {
        details.push(`Message ${index + 1} \`id\` duplicates an earlier message ID.`);
      } else {
        seenMessageIds.add(message.id);
      }
    }
  });

  let previousTimelineEventTime: number | null = null;
  const seenMemoryIds = new Set<string>();
  const seenTimelineEventIds = new Set<string>();
  const snapshotMemoryContents = new Set<string>();
  const snapshotTimelineEventKeys = new Set<string>();

  exported.snapshot.timelineEvents.forEach((event, index) => {
    if (typeof event.eventTime === "string" && isIsoTimestamp(event.eventTime)) {
      const eventTime = Date.parse(event.eventTime);

      if (previousTimelineEventTime !== null && eventTime < previousTimelineEventTime) {
        details.push(
          `Timeline event ${index + 1} \`eventTime\` cannot be earlier than the previous timeline event.`
        );
      }

      previousTimelineEventTime = eventTime;
    }

    if (typeof event.id === "string" && event.id.trim()) {
      if (seenTimelineEventIds.has(event.id)) {
        details.push(`Timeline event ${index + 1} \`id\` duplicates an earlier timeline event ID.`);
      } else {
        seenTimelineEventIds.add(event.id);
      }
    }

    if (
      typeof event.title === "string" &&
      typeof event.type === "string" &&
      typeof event.eventTime === "string" &&
      isIsoTimestamp(event.eventTime)
    ) {
      snapshotTimelineEventKeys.add(
        buildTimelineSemanticKey(event.title, event.type, event.eventTime)
      );
    }
  });

  exported.snapshot.memoryArchive.forEach((memory, index) => {
    if (typeof memory.id === "string" && memory.id.trim()) {
      if (seenMemoryIds.has(memory.id)) {
        details.push(`Memory item ${index + 1} \`id\` duplicates an earlier memory item ID.`);
      } else {
        seenMemoryIds.add(memory.id);
      }
    }

    if (typeof memory.content === "string") {
      snapshotMemoryContents.add(memory.content);
    }
  });

  if (exported.snapshot.relationship && isRecord(exported.snapshot.relationship)) {
    const relationshipLastUpdatedAt = exported.snapshot.relationship.lastUpdatedAt;

    if (
      typeof relationshipLastUpdatedAt === "string" &&
      isIsoTimestamp(relationshipLastUpdatedAt) &&
      Date.parse(relationshipLastUpdatedAt) > snapshotUpdatedAt
    ) {
      details.push("`snapshot.relationship.lastUpdatedAt` cannot be later than `snapshot.updatedAt`.");
    }
  }

  if (exported.snapshot.latestInsights && isRecord(exported.snapshot.latestInsights)) {
    const relationship = exported.snapshot.latestInsights.relationship;

    if (
      exported.snapshot.relationship &&
      isRecord(exported.snapshot.relationship) &&
      isRecord(relationship) &&
      !relationshipsSemanticallyMatch(exported.snapshot.relationship, relationship)
    ) {
      details.push(
        "`snapshot.latestInsights.relationship` must match `snapshot.relationship` for stage, scores, and `lastUpdatedAt`."
      );
    }

    if (
      isRecord(relationship) &&
      typeof relationship.lastUpdatedAt === "string" &&
      isIsoTimestamp(relationship.lastUpdatedAt) &&
      Date.parse(relationship.lastUpdatedAt) > snapshotUpdatedAt
    ) {
      details.push(
        "`snapshot.latestInsights.relationship.lastUpdatedAt` cannot be later than `snapshot.updatedAt`."
      );
    }

    if (Array.isArray(exported.snapshot.latestInsights.recalledMemories)) {
      exported.snapshot.latestInsights.recalledMemories.forEach((memory, index) => {
        if (
          typeof memory === "string" &&
          !snapshotMemoryContents.has(memory)
        ) {
          details.push(
            `Recalled memory ${index + 1} in \`snapshot.latestInsights.recalledMemories\` must match a memory item in \`snapshot.memoryArchive\`.`
          );
        }
      });
    }

    if (Array.isArray(exported.snapshot.latestInsights.storedMemories)) {
      exported.snapshot.latestInsights.storedMemories.forEach((memory, index) => {
        if (
          typeof memory === "string" &&
          !snapshotMemoryContents.has(memory)
        ) {
          details.push(
            `Stored memory ${index + 1} in \`snapshot.latestInsights.storedMemories\` must match a memory item in \`snapshot.memoryArchive\`.`
          );
        }
      });
    }

    if (Array.isArray(exported.snapshot.latestInsights.timeline)) {
      let previousLatestInsightTimelineTime: number | null = null;

      exported.snapshot.latestInsights.timeline.forEach((event, index) => {
        if (
          isRecord(event) &&
          typeof event.eventTime === "string" &&
          isIsoTimestamp(event.eventTime) &&
          Date.parse(event.eventTime) > snapshotUpdatedAt
        ) {
          details.push(
            `Latest insight timeline entry ${index + 1} \`eventTime\` cannot be later than \`snapshot.updatedAt\`.`
          );
        }

        if (
          isRecord(event) &&
          typeof event.title === "string" &&
          typeof event.type === "string" &&
          typeof event.eventTime === "string" &&
          isIsoTimestamp(event.eventTime) &&
          !snapshotTimelineEventKeys.has(
            buildTimelineSemanticKey(event.title, event.type, event.eventTime)
          )
        ) {
          details.push(
            `Latest insight timeline entry ${index + 1} must match an event in \`snapshot.timelineEvents\`.`
          );
        }

        if (
          isRecord(event) &&
          typeof event.eventTime === "string" &&
          isIsoTimestamp(event.eventTime)
        ) {
          const eventTime = Date.parse(event.eventTime);

          if (
            previousLatestInsightTimelineTime !== null &&
            eventTime < previousLatestInsightTimelineTime
          ) {
            details.push(
              `Latest insight timeline entry ${index + 1} \`eventTime\` cannot be earlier than the previous latest insight timeline entry.`
            );
          }

          previousLatestInsightTimelineTime = eventTime;
        }
      });
    }
  }
}

function buildTimelineSemanticKey(title: string, type: string, eventTime: string): string {
  return `${title}\u0000${type}\u0000${eventTime}`;
}

function relationshipsSemanticallyMatch(
  snapshotRelationship: Record<string, unknown>,
  latestInsightsRelationship: Record<string, unknown>
): boolean {
  return (
    snapshotRelationship.stage === latestInsightsRelationship.stage &&
    snapshotRelationship.affinityScore === latestInsightsRelationship.affinityScore &&
    snapshotRelationship.trustScore === latestInsightsRelationship.trustScore &&
    snapshotRelationship.stabilityScore === latestInsightsRelationship.stabilityScore &&
    snapshotRelationship.lastUpdatedAt === latestInsightsRelationship.lastUpdatedAt
  );
}

function validateRelationshipSnapshot(
  relationship: Record<string, unknown>,
  fieldPath: string,
  details: string[]
): void {
  if (typeof relationship.stage !== "string") {
    details.push(`\`${fieldPath}.stage\` must be a string.`);
  }

  if (!isFiniteNumber(relationship.affinityScore)) {
    details.push(`\`${fieldPath}.affinityScore\` must be a number.`);
  } else if (!isUnitInterval(relationship.affinityScore)) {
    details.push(`\`${fieldPath}.affinityScore\` must be between 0 and 1.`);
  }

  if (!isFiniteNumber(relationship.trustScore)) {
    details.push(`\`${fieldPath}.trustScore\` must be a number.`);
  } else if (!isUnitInterval(relationship.trustScore)) {
    details.push(`\`${fieldPath}.trustScore\` must be between 0 and 1.`);
  }

  if (!isFiniteNumber(relationship.stabilityScore)) {
    details.push(`\`${fieldPath}.stabilityScore\` must be a number.`);
  } else if (!isUnitInterval(relationship.stabilityScore)) {
    details.push(`\`${fieldPath}.stabilityScore\` must be between 0 and 1.`);
  }

  if (typeof relationship.lastUpdatedAt !== "string") {
    details.push(`\`${fieldPath}.lastUpdatedAt\` must be a string.`);
  } else if (!isIsoTimestamp(relationship.lastUpdatedAt)) {
    details.push(`\`${fieldPath}.lastUpdatedAt\` must be a valid ISO timestamp.`);
  }
}

function validateProactiveCarePolicySnapshot(
  policy: Record<string, unknown>,
  fieldPath: string,
  details: string[]
): void {
  if (typeof policy.enabled !== "boolean") {
    details.push(`\`${fieldPath}.enabled\` must be a boolean.`);
  }

  if (
    policy.quietHoursStart !== undefined &&
    typeof policy.quietHoursStart !== "string"
  ) {
    details.push(`\`${fieldPath}.quietHoursStart\` must be a string if present.`);
  }

  if (
    policy.quietHoursEnd !== undefined &&
    typeof policy.quietHoursEnd !== "string"
  ) {
    details.push(`\`${fieldPath}.quietHoursEnd\` must be a string if present.`);
  }

  if (!isFiniteNumber(policy.maxDailyReachouts)) {
    details.push(`\`${fieldPath}.maxDailyReachouts\` must be a number.`);
  } else if (policy.maxDailyReachouts < 0) {
    details.push(`\`${fieldPath}.maxDailyReachouts\` must be 0 or greater.`);
  }

  if (typeof policy.allowMealCare !== "boolean") {
    details.push(`\`${fieldPath}.allowMealCare\` must be a boolean.`);
  }

  if (typeof policy.allowSleepCare !== "boolean") {
    details.push(`\`${fieldPath}.allowSleepCare\` must be a boolean.`);
  }

  if (typeof policy.allowAbsenceCheckins !== "boolean") {
    details.push(`\`${fieldPath}.allowAbsenceCheckins\` must be a boolean.`);
  }
}

function validateProactiveCareStateSnapshot(
  state: Record<string, unknown>,
  fieldPath: string,
  details: string[]
): void {
  if (!isFiniteNumber(state.dailyReachoutsSent)) {
    details.push(`\`${fieldPath}.dailyReachoutsSent\` must be a number.`);
  } else if (state.dailyReachoutsSent < 0) {
    details.push(`\`${fieldPath}.dailyReachoutsSent\` must be 0 or greater.`);
  }

  if (!isFiniteNumber(state.unansweredReachoutCount)) {
    details.push(`\`${fieldPath}.unansweredReachoutCount\` must be a number.`);
  } else if (state.unansweredReachoutCount < 0) {
    details.push(`\`${fieldPath}.unansweredReachoutCount\` must be 0 or greater.`);
  }

  if (state.lastReachOutAt !== undefined) {
    if (typeof state.lastReachOutAt !== "string") {
      details.push(`\`${fieldPath}.lastReachOutAt\` must be a string if present.`);
    } else if (!isIsoTimestamp(state.lastReachOutAt)) {
      details.push(`\`${fieldPath}.lastReachOutAt\` must be a valid ISO timestamp if present.`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isUnitInterval(value: number): boolean {
  return value >= 0 && value <= 1;
}

function isIsoTimestamp(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return new Date(parsed).toISOString() === trimmed;
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
