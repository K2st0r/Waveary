import type { Identifier, Timestamp } from "./common.js";

export interface VoiceSession {
  id: Identifier;
  sessionId: Identifier;
  mode: "tts" | "stt" | "duplex";
  state: "idle" | "listening" | "speaking" | "paused";
  startedAt: Timestamp;
  lastActivityAt: Timestamp;
}

export interface SpeechInput {
  sessionId: Identifier;
  transcript?: string;
  audioFormat?: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
}

export interface VoicePlaybackPlan {
  mode: "audio" | "browser-speech";
  lang?: string;
  voiceLabel?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeechOutput {
  sessionId: Identifier;
  text: string;
  audioFormat?: string;
  audioBase64?: string;
  estimatedDurationMs?: number;
  playbackPlan?: VoicePlaybackPlan;
  generatedAt: Timestamp;
}
