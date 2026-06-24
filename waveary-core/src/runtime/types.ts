import type { EmotionState } from "../domain/emotion.js";
import type { IdentitySummary } from "../domain/identity.js";
import type { MemoryItem } from "../domain/memory.js";
import type {
  ProactiveCareDecision,
  ProactiveCarePolicy,
  ProactiveCareState
} from "../domain/proactive-care.js";
import type { RelationshipProfile } from "../domain/relationship.js";
import type { Message, PersonaProfile, Session, UserProfile } from "../domain/session.js";
import type { TimelineEvent } from "../domain/timeline.js";
import type { LocalTimeContext } from "../providers/interfaces.js";

export interface RuntimeContext {
  session: Session;
  user: UserProfile;
  persona: PersonaProfile;
  history: Message[];
}

export interface RuntimeTurnResult {
  reply: Message;
  recalledMemories: MemoryItem[];
  identitySummary?: IdentitySummary;
  relationship: RelationshipProfile;
  emotion?: EmotionState;
  timeline: TimelineEvent[];
  storedMemories: MemoryItem[];
}

export interface RuntimeProactiveCareOptions {
  policy?: Partial<ProactiveCarePolicy>;
  state?: Partial<ProactiveCareState>;
  now?: string;
}

export type RuntimeProactiveCareResult = ProactiveCareDecision;

export interface RuntimeTurnOptions {
  localTime?: LocalTimeContext;
}
