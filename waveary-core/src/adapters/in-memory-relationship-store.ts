import type {
  RelationshipDelta,
  RelationshipProfile,
  RelationshipStore
} from "../index.js";

export class InMemoryRelationshipStore implements RelationshipStore {
  private readonly profiles = new Map<string, RelationshipProfile>();

  async getProfile(userId: string): Promise<RelationshipProfile> {
    const existing = this.profiles.get(userId);
    if (existing) {
      return existing;
    }

    const profile: RelationshipProfile = {
      userId,
      stage: "new",
      affinityScore: 0.2,
      trustScore: 0.2,
      stabilityScore: 0.5,
      lastUpdatedAt: new Date().toISOString()
    };
    this.profiles.set(userId, profile);
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

    this.profiles.set(userId, next);
    return next;
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function deriveStage(currentStage: string, delta: RelationshipDelta): string {
  const score = delta.affinityDelta + delta.trustDelta;

  if (currentStage === "new" && score >= 0.1) {
    return "warming";
  }

  if (currentStage === "warming" && score >= 0.14) {
    return "growing";
  }

  return currentStage;
}
