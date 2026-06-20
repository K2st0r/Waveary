import type { EmotionState } from "../domain/emotion.js";
import type { MemoryItem } from "../domain/memory.js";
import type { RelationshipProfile } from "../domain/relationship.js";
import type { Message, PersonaProfile, Session, UserProfile } from "../domain/session.js";
import type { TimelineEvent } from "../domain/timeline.js";

export interface RuntimeContext {
  session: Session;
  user: UserProfile;
  persona: PersonaProfile;
  history: Message[];
}

export interface RuntimeTurnResult {
  reply: Message;
  recalledMemories: MemoryItem[];
  relationship: RelationshipProfile;
  emotion?: EmotionState;
  timeline: TimelineEvent[];
  storedMemories: MemoryItem[];
}
