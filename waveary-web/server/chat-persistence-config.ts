import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getWavearyDataDir } from "./data-dir.js";

export type ChatPersistenceBackend = "file" | "sqlite";

export type ChatPersistenceSyncState =
  | "active"
  | "in-sync"
  | "behind"
  | "ahead"
  | "diverged";

export interface ChatPersistenceSyncMetadata {
  fromBackend: ChatPersistenceBackend | null;
  toBackend: ChatPersistenceBackend | null;
  switchedAt: string | null;
  synchronizedSessionCount: number;
}

export interface ChatPersistenceConfig {
  backend: ChatPersistenceBackend;
  lastSync: ChatPersistenceSyncMetadata;
}

export interface ChatPersistenceBackendStatus {
  backend: ChatPersistenceBackend;
  storageLabel: string;
  exists: boolean;
  sessionCount: number;
  latestUpdatedAt: string | null;
  syncState: ChatPersistenceSyncState;
  differingSessionCount: number;
}

export interface ChatPersistenceStatus extends ChatPersistenceConfig {
  availableBackends: ChatPersistenceBackend[];
  storageLabel: string;
  backendDetails: ChatPersistenceBackendStatus[];
}

const DATA_DIR = getWavearyDataDir();
const CONFIG_PATH = join(DATA_DIR, "chat-persistence.json");
export const CHAT_SESSION_JSON_PATH = join(DATA_DIR, "chat-sessions.json");
export const CHAT_SESSION_SQLITE_PATH = join(DATA_DIR, "chat-sessions.db");
export const CHAT_PERSISTENCE_BACKENDS: ChatPersistenceBackend[] = ["file", "sqlite"];

export function createDefaultChatPersistenceConfig(): ChatPersistenceConfig {
  return {
    backend: "file",
    lastSync: {
      fromBackend: null,
      toBackend: null,
      switchedAt: null,
      synchronizedSessionCount: 0
    }
  };
}

export function loadChatPersistenceConfig(): ChatPersistenceConfig {
  if (!existsSync(CONFIG_PATH)) {
    return createDefaultChatPersistenceConfig();
  }

  const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<ChatPersistenceConfig>;
  const defaults = createDefaultChatPersistenceConfig();

  return {
    backend: parsed.backend === "sqlite" ? "sqlite" : defaults.backend,
    lastSync: {
      fromBackend:
        parsed.lastSync?.fromBackend === "file" || parsed.lastSync?.fromBackend === "sqlite"
          ? parsed.lastSync.fromBackend
          : defaults.lastSync.fromBackend,
      toBackend:
        parsed.lastSync?.toBackend === "file" || parsed.lastSync?.toBackend === "sqlite"
          ? parsed.lastSync.toBackend
          : defaults.lastSync.toBackend,
      switchedAt: parsed.lastSync?.switchedAt ?? defaults.lastSync.switchedAt,
      synchronizedSessionCount:
        typeof parsed.lastSync?.synchronizedSessionCount === "number"
          ? parsed.lastSync.synchronizedSessionCount
          : defaults.lastSync.synchronizedSessionCount
    }
  };
}

export function saveChatPersistenceConfig(config: ChatPersistenceConfig): ChatPersistenceConfig {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return config;
}

export function getChatPersistenceStorageLabel(backend: ChatPersistenceBackend): string {
  return backend === "sqlite" ? ".waveary/chat-sessions.db" : ".waveary/chat-sessions.json";
}
