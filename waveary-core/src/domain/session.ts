import type { Channel, Identifier, MessageRole, Timestamp } from "./common.js";

export interface UserProfile {
  id: Identifier;
  displayName: string;
  profileTraits: string[];
  preferences: string[];
  lifeContext?: string;
}

export interface PersonaProfile {
  id: Identifier;
  name: string;
  tone: string;
  personaTraits: string[];
  relationshipStyle: string;
  voiceStyle?: string;
}

export interface Session {
  id: Identifier;
  userId: Identifier;
  personaId: Identifier;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  channel: Channel;
  state: "active" | "paused" | "ended";
}

export interface Message {
  id: Identifier;
  sessionId: Identifier;
  role: MessageRole;
  content: string;
  timestamp: Timestamp;
  metadata: Record<string, string>;
}
