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
    const selected = memories
      .map((memory) => ({
        memory,
        score: this.sessionState.scoreMemory(memory, input)
      }))
      .filter(({ score }) => score >= 0.22)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map(({ memory }) => memory);

    if (selected.length === 0) {
      return [];
    }

    const selectedIds = new Set(selected.map((memory) => memory.id));
    const recalledAt = new Date().toISOString();

    this.sessionState.saveState((current) => ({
      ...current,
      memories: current.memories.map((memory) =>
        memory.userId === userId && selectedIds.has(memory.id)
          ? {
              ...memory,
              lastRecalledAt: recalledAt
            }
          : memory
      ),
      updatedAt: recalledAt
    }));

    return selected.map((memory) => ({
      ...memory,
      lastRecalledAt: recalledAt
    }));
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
  const normalizedInput = normalizeSearchText(input);
  const normalizedMemory = normalizeSearchText(memory.content);
  const tokens = extractSearchTokens(normalizedInput);
  const fragments = extractSearchFragments(normalizedInput);

  if (tokens.length === 0 && fragments.length === 0) {
    return 0;
  }

  const tokenHitRatio =
    tokens.length > 0
      ? tokens.filter((token) => normalizedMemory.includes(token)).length / tokens.length
      : 0;
  const fragmentHits = fragments.filter((fragment) => normalizedMemory.includes(fragment));
  const fragmentHitRatio =
    fragments.length > 0 ? fragmentHits.length / fragments.length : 0;
  const strongestFragmentRatio =
    fragmentHits.length > 0
      ? Math.max(...fragmentHits.map((fragment) => Math.min(1, fragment.length / 16)))
      : 0;
  const exactInputMatched =
    normalizedInput.length >= 8 && normalizedMemory.includes(normalizedInput);
  const exactInputBonus = exactInputMatched ? 0.35 : 0;
  const hasLexicalMatch =
    tokenHitRatio > 0 || fragmentHitRatio > 0 || strongestFragmentRatio > 0 || exactInputMatched;

  if (!hasLexicalMatch) {
    return 0;
  }

  const freshnessBoost = computeMemoryFreshnessBoost(memory);

  return (
    tokenHitRatio * 0.44 +
    fragmentHitRatio * 0.2 +
    strongestFragmentRatio * 0.18 +
    exactInputBonus +
    memory.importance * 0.11 +
    memory.confidence * 0.07 +
    freshnessBoost
  );
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function defaultDeriveRelationshipStage(currentStage: string, delta: RelationshipDelta): string {
  const score = delta.affinityDelta + delta.trustDelta;

  if (currentStage === "new" && score > 0.14) {
    return "warming";
  }

  if (
    currentStage === "warming" &&
    (score > 0.12 ||
      delta.reason === "user_extended_trust" ||
      delta.reason === "user_shared_vulnerability")
  ) {
    return "growing";
  }

  return currentStage;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearchTokens(value: string): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "that",
    "with",
    "this",
    "have",
    "your",
    "from",
    "just",
    "want",
    "like",
    "really",
    "about",
    "into"
  ]);
  const matches = value.match(/[\p{L}\p{N}]{2,}/gu) ?? [];

  return [...new Set(matches.filter((token) => !stopWords.has(token)))];
}

function extractSearchFragments(value: string): string[] {
  const fragments = new Set<string>();
  const normalized = value.trim();

  if (normalized.length >= 6) {
    fragments.add(normalized);
  }

  const hanMatches = normalized.match(/\p{Script=Han}+/gu) ?? [];
  for (const han of hanMatches) {
    if (han.length >= 2) {
      fragments.add(han);
    }

    for (let index = 0; index < han.length - 1; index += 1) {
      fragments.add(han.slice(index, index + 2));
    }
  }

  const phraseMatches = normalized.match(/[\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){1,5}/gu) ?? [];
  for (const phrase of phraseMatches) {
    if (phrase.length >= 6) {
      fragments.add(phrase);
    }
  }

  return [...fragments];
}

function computeMemoryFreshnessBoost(memory: MemoryItem): number {
  const reference = memory.lastRecalledAt ?? memory.createdAt;
  const timestamp = Date.parse(reference);

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  const ageDays = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));

  if (ageDays <= 3) {
    return 0.05;
  }

  if (ageDays <= 14) {
    return 0.03;
  }

  if (ageDays <= 45) {
    return 0.015;
  }

  return 0;
}
