import type { Identifier, Timestamp } from "./common.js";

export type MemoryType =
  | "fact"
  | "preference"
  | "relationship"
  | "life_event"
  | "reflection";

export interface MemoryItem {
  id: Identifier;
  userId: Identifier;
  type: MemoryType;
  content: string;
  importance: number;
  confidence: number;
  sourceMessageIds: Identifier[];
  createdAt: Timestamp;
  lastRecalledAt?: Timestamp;
}

export interface MemoryCandidate {
  type: MemoryType;
  content: string;
  importance: number;
  confidence: number;
}
