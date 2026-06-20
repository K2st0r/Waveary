import type { Identifier, Timestamp } from "./common.js";

export interface EmotionState {
  userId: Identifier;
  primaryEmotion: string;
  intensity: number;
  confidence: number;
  windowStart: Timestamp;
  windowEnd: Timestamp;
}
