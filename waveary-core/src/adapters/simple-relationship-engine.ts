import type { Message, RelationshipDelta, RelationshipEngine, RelationshipProfile } from "../index.js";

export class SimpleRelationshipEngine implements RelationshipEngine {
  async evaluateDelta(
    message: Message,
    _reply: Message,
    current: RelationshipProfile
  ): Promise<RelationshipDelta> {
    const content = message.content.trim();
    const positive = content.length >= 20 ? 0.08 : 0.03;

    return {
      affinityDelta: positive,
      trustDelta: current.trustScore < 0.7 ? positive * 0.75 : positive * 0.25,
      stabilityDelta: 0.02,
      reason: "user_shared_context"
    };
  }
}
