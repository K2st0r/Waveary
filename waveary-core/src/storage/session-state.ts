import type { MemoryItem } from "../domain/memory.js";
import type { RelationshipProfile } from "../domain/relationship.js";
import type { TimelineEvent } from "../domain/timeline.js";
import type { RuntimeContext } from "../runtime/types.js";

export interface PersistedSessionState {
  context: RuntimeContext;
  memories: MemoryItem[];
  relationship?: RelationshipProfile;
  timeline: TimelineEvent[];
  updatedAt: string;
}

export interface PersistedSessionStateRecord<
  TState extends PersistedSessionState = PersistedSessionState
> {
  sessionId: string;
  state: TState;
}

export interface SessionStateRepository<TState extends PersistedSessionState = PersistedSessionState> {
  load(sessionId: string): TState | undefined;
  save(sessionId: string, state: TState): void;
  delete(sessionId: string): void;
  list(): PersistedSessionStateRecord<TState>[];
}
