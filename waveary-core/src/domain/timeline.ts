import type { Identifier } from "./common.js";

export interface TimelineEvent {
  id: Identifier;
  userId: Identifier;
  title: string;
  description: string;
  eventType: string;
  eventTime: string;
  importance: number;
  linkedMemoryIds: Identifier[];
}
