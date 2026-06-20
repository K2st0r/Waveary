import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  EmotionState,
  MemoryCandidate,
  MemoryItem,
  MemoryStore,
  Message,
  RelationshipDelta,
  RelationshipProfile,
  RelationshipStore,
  RuntimeContext,
  TimelineEvent,
  TimelineStore
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

interface PersistedChatSession {
  context: RuntimeContext;
  memories: MemoryItem[];
  relationship?: RelationshipProfile;
  timeline: TimelineEvent[];
  latestInsights: ChatReplyPayload | null;
  updatedAt: string;
  title?: string;
}

type PersistedChatSessions = Record<string, PersistedChatSession>;

const SESSION_STORE_PATH = fileURLToPath(new URL("../../.waveary/chat-sessions.json", import.meta.url));
export const DEFAULT_CHAT_SESSION_ID = "waveary-main";

export class PersistentChatSessionState {
  private readonly memoryStore: MemoryStore;
  private readonly relationshipStore: RelationshipStore;
  private readonly timelineStore: TimelineStore;

  constructor(private readonly sessionId: string) {
    this.memoryStore = new FileBackedMemoryStore(this.sessionId);
    this.relationshipStore = new FileBackedRelationshipStore(this.sessionId);
    this.timelineStore = new FileBackedTimelineStore(this.sessionId);
  }

  getContext(): RuntimeContext {
    return cloneContext(this.readOrCreate().context);
  }

  getMemoryStore(): MemoryStore {
    return this.memoryStore;
  }

  getRelationshipStore(): RelationshipStore {
    return this.relationshipStore;
  }

  getTimelineStore(): TimelineStore {
    return this.timelineStore;
  }

  saveTurn(context: RuntimeContext, latestInsights: ChatReplyPayload): void {
    updateSession(this.sessionId, (current) => ({
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
    return ensureSession(this.sessionId);
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

function ensureSession(sessionId: string): PersistedChatSession {
  const existing = loadPersistedChatSession(sessionId);
  if (existing) {
    return existing;
  }

  const created: PersistedChatSession = {
    context: createInitialRuntimeContext(sessionId),
    memories: [],
    timeline: [],
    latestInsights: null,
    updatedAt: new Date().toISOString(),
    title: sessionId === DEFAULT_CHAT_SESSION_ID ? "Main Companion Session" : undefined
  };

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

function scoreMemoryMatch(memory: MemoryItem, input: string): number {
  const tokens = input
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return 0;
  }

  const normalizedContent = memory.content.toLowerCase();
  const hitCount = tokens.filter((token) => normalizedContent.includes(token)).length;
  return hitCount / tokens.length + memory.importance * 0.25;
}

class FileBackedMemoryStore implements MemoryStore {
  constructor(private readonly sessionId: string) {}

  async recallRelevantMemories(userId: string, input: string): Promise<MemoryItem[]> {
    const persisted = ensureSession(this.sessionId);
    const memories = persisted.memories.filter((memory) => memory.userId === userId);

    return [...memories]
      .sort((left, right) => scoreMemoryMatch(right, input) - scoreMemoryMatch(left, input))
      .slice(0, 5);
  }

  async saveMemories(
    userId: string,
    sourceMessage: Message,
    candidates: MemoryCandidate[]
  ): Promise<MemoryItem[]> {
    if (candidates.length === 0) {
      return [];
    }

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

    updateSession(this.sessionId, (current) => ({
      ...current,
      memories: [...current.memories, ...created],
      updatedAt: new Date().toISOString()
    }));

    return created;
  }
}

class FileBackedRelationshipStore implements RelationshipStore {
  constructor(private readonly sessionId: string) {}

  async getProfile(userId: string): Promise<RelationshipProfile> {
    const persisted = ensureSession(this.sessionId);
    if (persisted.relationship) {
      return persisted.relationship;
    }

    const profile: RelationshipProfile = {
      userId,
      stage: "new",
      affinityScore: 0.2,
      trustScore: 0.2,
      stabilityScore: 0.5,
      lastUpdatedAt: new Date().toISOString()
    };

    updateSession(this.sessionId, (current) => ({
      ...current,
      relationship: profile,
      updatedAt: new Date().toISOString()
    }));

    return profile;
  }

  async applyDelta(userId: string, delta: RelationshipDelta): Promise<RelationshipProfile> {
    const current = await this.getProfile(userId);
    const next: RelationshipProfile = {
      ...current,
      affinityScore: clamp(current.affinityScore + delta.affinityDelta),
      trustScore: clamp(current.trustScore + delta.trustDelta),
      stabilityScore: clamp(current.stabilityScore + delta.stabilityDelta),
      stage: deriveStage(current.stage, delta),
      lastUpdatedAt: new Date().toISOString()
    };

    updateSession(this.sessionId, (persisted) => ({
      ...persisted,
      relationship: next,
      updatedAt: new Date().toISOString()
    }));

    return next;
  }
}

class FileBackedTimelineStore implements TimelineStore {
  constructor(private readonly sessionId: string) {}

  async getRelevantEvents(userId: string): Promise<TimelineEvent[]> {
    const persisted = ensureSession(this.sessionId);
    return [...persisted.timeline.filter((event) => event.userId === userId)].slice(-5);
  }

  async appendEvents(userId: string, events: TimelineEvent[]): Promise<TimelineEvent[]> {
    if (events.length === 0) {
      return this.getRelevantEvents(userId);
    }

    let nextTimeline: TimelineEvent[] = [];

    updateSession(this.sessionId, (persisted) => {
      nextTimeline = [...persisted.timeline, ...events];

      return {
        ...persisted,
        timeline: nextTimeline,
        updatedAt: new Date().toISOString()
      };
    });

    return [...nextTimeline.filter((event) => event.userId === userId)].slice(-10);
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function deriveStage(currentStage: string, delta: RelationshipDelta): string {
  const score = delta.affinityDelta + delta.trustDelta;

  if (score > 0.15) {
    return currentStage === "new" ? "warming" : "growing";
  }

  return currentStage;
}
