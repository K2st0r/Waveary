import type { Identifier, Timestamp } from "./common.js";

export interface IdentitySummary {
  userId: Identifier;
  userSelfConcept: string[];
  bondThemes: string[];
  recurringNeeds: string[];
  emotionalPatterns: string[];
  companionStance: string[];
  summaryText: string;
  lastUpdatedAt: Timestamp;
}
