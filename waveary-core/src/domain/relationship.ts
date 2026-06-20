import type { Identifier, Timestamp } from "./common.js";

export interface RelationshipProfile {
  userId: Identifier;
  stage: string;
  affinityScore: number;
  trustScore: number;
  stabilityScore: number;
  lastUpdatedAt: Timestamp;
}

export interface RelationshipDelta {
  affinityDelta: number;
  trustDelta: number;
  stabilityDelta: number;
  reason: string;
}
