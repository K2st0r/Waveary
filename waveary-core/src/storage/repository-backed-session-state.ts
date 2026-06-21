import type {
  EmotionState,
  EmotionStore,
  MemoryCandidate,
  MemoryItem,
  MemoryStore,
  Message,
  ProactiveCarePolicy,
  ProactiveCareState,
  RelationshipDelta,
  RelationshipProfile,
  RelationshipStore,
  RuntimeContext,
  TimelineEvent,
  TimelineStore
} from "../index.js";
import {
  createDefaultProactiveCarePolicy,
  createDefaultProactiveCareState,
  resolveProactiveCarePolicy,
  resolveProactiveCareState
} from "../index.js";
import type { PersistedSessionState, SessionStateRepository } from "./session-state.js";

export interface RepositoryBackedSessionStateDependencies<
  TState extends PersistedSessionState = PersistedSessionState
> {
  sessionId: string;
  repository: SessionStateRepository<TState>;
  createInitialState: (sessionId: string) => TState;
  scoreMemoryMatch?: (memory: MemoryItem, input: string) => number;
  deriveRelationshipStage?: (currentStage: string, delta: RelationshipDelta) => string;
}

export class RepositoryBackedSessionState<TState extends PersistedSessionState = PersistedSessionState> {
  private readonly emotionStore: EmotionStore;
  private readonly memoryStore: MemoryStore;
  private readonly relationshipStore: RelationshipStore;
  private readonly timelineStore: TimelineStore;

  constructor(private readonly deps: RepositoryBackedSessionStateDependencies<TState>) {
    this.emotionStore = new RepositoryBackedEmotionStore(this);
    this.memoryStore = new RepositoryBackedMemoryStore(this);
    this.relationshipStore = new RepositoryBackedRelationshipStore(this);
    this.timelineStore = new RepositoryBackedTimelineStore(this);
  }

  getContext(): RuntimeContext {
    return cloneContext(this.readOrCreate().context);
  }

  getMemoryStore(): MemoryStore {
    return this.memoryStore;
  }

  getEmotionStore(): EmotionStore {
    return this.emotionStore;
  }

  getRelationshipStore(): RelationshipStore {
    return this.relationshipStore;
  }

  getTimelineStore(): TimelineStore {
    return this.timelineStore;
  }

  saveContext(context: RuntimeContext): TState {
    return this.saveState((current) => ({
      ...current,
      context: cloneContext(context),
      updatedAt: new Date().toISOString()
    }));
  }

  getState(): TState {
    return cloneState(this.readOrCreate());
  }

  getProactiveCarePolicy(): ProactiveCarePolicy {
    const state = this.getState();
    return resolveProactiveCarePolicy(
      state.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()
    );
  }

  saveProactiveCarePolicy(policyPatch: Partial<ProactiveCarePolicy>): ProactiveCarePolicy {
    let nextPolicy = createDefaultProactiveCarePolicy();

    this.saveState((current) => {
      nextPolicy = resolveProactiveCarePolicy({
        ...(current.proactiveCarePolicy ?? createDefaultProactiveCarePolicy()),
        ...policyPatch
      });

      return {
        ...current,
        proactiveCarePolicy: nextPolicy,
        updatedAt: new Date().toISOString()
      };
    });

    return nextPolicy;
  }

  getProactiveCareState(): ProactiveCareState {
    const state = this.getState();
    return resolveProactiveCareState(
      state.proactiveCareState ?? createDefaultProactiveCareState()
    );
  }

  saveProactiveCareState(statePatch: Partial<ProactiveCareState>): ProactiveCareState {
    let nextState = createDefaultProactiveCareState();

    this.saveState((current) => {
      nextState = resolveProactiveCareState({
        ...(current.proactiveCareState ?? createDefaultProactiveCareState()),
        ...statePatch
      });

      return {
        ...current,
        proactiveCareState: nextState,
        updatedAt: new Date().toISOString()
      };
    });

    return nextState;
  }

  saveState(updater: (current: TState) => TState): TState {
    const current = this.readOrCreate();
    const next = updater(current);
    this.deps.repository.save(this.deps.sessionId, next);
    return next;
  }

  scoreMemory(memory: MemoryItem, input: string): number {
    return this.deps.scoreMemoryMatch
      ? this.deps.scoreMemoryMatch(memory, input)
      : defaultScoreMemoryMatch(memory, input);
  }

  deriveRelationshipStage(currentStage: string, delta: RelationshipDelta): string {
    return this.deps.deriveRelationshipStage
      ? this.deps.deriveRelationshipStage(currentStage, delta)
      : defaultDeriveRelationshipStage(currentStage, delta);
  }

  private readOrCreate(): TState {
    const existing = this.deps.repository.load(this.deps.sessionId);
    if (existing) {
      return existing;
    }

    const created = this.deps.createInitialState(this.deps.sessionId);
    this.deps.repository.save(this.deps.sessionId, created);
    return created;
  }
}

class RepositoryBackedMemoryStore implements MemoryStore {
  constructor(private readonly sessionState: RepositoryBackedSessionState) {}

  async recallRelevantMemories(userId: string, input: string): Promise<MemoryItem[]> {
    const state = this.sessionState.getState();
    const memories = state.memories.filter((memory) => memory.userId === userId);

    return [...memories]
      .sort(
        (left, right) => this.sessionState.scoreMemory(right, input) - this.sessionState.scoreMemory(left, input)
      )
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

    this.sessionState.saveState((current) => ({
      ...current,
      memories: [...current.memories, ...created],
      updatedAt: new Date().toISOString()
    }));

    return created;
  }
}

class RepositoryBackedEmotionStore implements EmotionStore {
  constructor(private readonly sessionState: RepositoryBackedSessionState) {}

  async getState(userId: string): Promise<EmotionState | undefined> {
    const state = this.sessionState.getState();

    if (!state.emotion || state.emotion.userId !== userId) {
      return undefined;
    }

    return state.emotion;
  }

  async saveState(userId: string, emotion: EmotionState): Promise<EmotionState> {
    const next = {
      ...emotion,
      userId
    };

    this.sessionState.saveState((current) => ({
      ...current,
      emotion: next,
      updatedAt: new Date().toISOString()
    }));

    return next;
  }
}

class RepositoryBackedRelationshipStore implements RelationshipStore {
  constructor(private readonly sessionState: RepositoryBackedSessionState) {}

  async getProfile(userId: string): Promise<RelationshipProfile> {
    const state = this.sessionState.getState();
    if (state.relationship) {
      return state.relationship;
    }

    const profile: RelationshipProfile = {
      userId,
      stage: "new",
      affinityScore: 0.2,
      trustScore: 0.2,
      stabilityScore: 0.5,
      lastUpdatedAt: new Date().toISOString()
    };

    this.sessionState.saveState((current) => ({
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
      stage: this.sessionState.deriveRelationshipStage(current.stage, delta),
      lastUpdatedAt: new Date().toISOString()
    };

    this.sessionState.saveState((state) => ({
      ...state,
      relationship: next,
      updatedAt: new Date().toISOString()
    }));

    return next;
  }
}

class RepositoryBackedTimelineStore implements TimelineStore {
  constructor(private readonly sessionState: RepositoryBackedSessionState) {}

  async getRelevantEvents(userId: string): Promise<TimelineEvent[]> {
    const state = this.sessionState.getState();
    return [...state.timeline.filter((event) => event.userId === userId)].slice(-5);
  }

  async appendEvents(userId: string, events: TimelineEvent[]): Promise<TimelineEvent[]> {
    if (events.length === 0) {
      return this.getRelevantEvents(userId);
    }

    let nextTimeline: TimelineEvent[] = [];

    this.sessionState.saveState((state) => {
      nextTimeline = [...state.timeline, ...events];

      return {
        ...state,
        timeline: nextTimeline,
        updatedAt: new Date().toISOString()
      };
    });

    return [...nextTimeline.filter((event) => event.userId === userId)].slice(-10);
  }
}

function cloneContext(context: RuntimeContext): RuntimeContext {
  return JSON.parse(JSON.stringify(context)) as RuntimeContext;
}

function cloneState<TState extends PersistedSessionState>(state: TState): TState {
  return JSON.parse(JSON.stringify(state)) as TState;
}

function defaultScoreMemoryMatch(memory: MemoryItem, input: string): number {
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

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function defaultDeriveRelationshipStage(currentStage: string, delta: RelationshipDelta): string {
  const score = delta.affinityDelta + delta.trustDelta;

  if (score > 0.15) {
    return currentStage === "new" ? "warming" : "growing";
  }

  return currentStage;
}
