import type { Identifier, Timestamp } from "./common.js";

export type EmotionSubject = "user" | "companion";
export type EmotionDecayHint = "fast" | "medium" | "slow";

export interface EmotionState {
  userId: Identifier;
  primaryEmotion: string;
  intensity: number;
  confidence: number;
  windowStart: Timestamp;
  windowEnd: Timestamp;
  subject?: EmotionSubject;
  modifiers?: string[];
  causes?: string[];
  lastUpdatedAt?: Timestamp;
  decayHint?: EmotionDecayHint;
  detectedUserEmotion?: string;
}
