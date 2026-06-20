import type { EmotionState } from "../domain/emotion.js";
import type { MemoryCandidate, MemoryItem } from "../domain/memory.js";
import type { RelationshipDelta, RelationshipProfile } from "../domain/relationship.js";
import type { Message, PersonaProfile, Session, UserProfile } from "../domain/session.js";
import type { TimelineEvent } from "../domain/timeline.js";

export interface ChatProviderRequest {
  session: Session;
  user: UserProfile;
  persona: PersonaProfile;
  messages: Message[];
  relevantMemories: MemoryItem[];
  relationship: RelationshipProfile;
  emotion?: EmotionState;
  timeline: TimelineEvent[];
}

export interface ChatProvider {
  generateReply(request: ChatProviderRequest): Promise<string>;
}

export interface ModelDescriptor {
  id: string;
  provider: string;
  label?: string;
  contextWindow?: number;
}

export interface ModelDiscoveryProvider {
  listModels(): Promise<ModelDescriptor[]>;
}

export interface EmotionAnalyzer {
  analyze(message: Message): Promise<EmotionState | undefined>;
}

export interface MemoryStore {
  recallRelevantMemories(userId: string, input: string): Promise<MemoryItem[]>;
  saveMemories(userId: string, sourceMessage: Message, candidates: MemoryCandidate[]): Promise<MemoryItem[]>;
}

export interface MemoryExtractor {
  extractCandidates(message: Message, reply: Message): Promise<MemoryCandidate[]>;
}

export interface RelationshipStore {
  getProfile(userId: string): Promise<RelationshipProfile>;
  applyDelta(userId: string, delta: RelationshipDelta): Promise<RelationshipProfile>;
}

export interface RelationshipEngine {
  evaluateDelta(message: Message, reply: Message, current: RelationshipProfile): Promise<RelationshipDelta>;
}

export interface TimelineStore {
  getRelevantEvents(userId: string): Promise<TimelineEvent[]>;
  appendEvents(userId: string, events: TimelineEvent[]): Promise<TimelineEvent[]>;
}

export interface TimelineEngine {
  deriveEvents(message: Message, reply: Message, memories: MemoryItem[]): Promise<TimelineEvent[]>;
}
