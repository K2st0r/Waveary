import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getWavearyDataDir } from "./data-dir.js";

export type ChatPersistenceBackend = "file" | "sqlite";

export interface ChatPersistenceConfig {
  backend: ChatPersistenceBackend;
}

export interface ChatPersistenceStatus extends ChatPersistenceConfig {
  availableBackends: ChatPersistenceBackend[];
  storageLabel: string;
}

const DATA_DIR = getWavearyDataDir();
const CONFIG_PATH = join(DATA_DIR, "chat-persistence.json");
export const CHAT_SESSION_JSON_PATH = join(DATA_DIR, "chat-sessions.json");
export const CHAT_SESSION_SQLITE_PATH = join(DATA_DIR, "chat-sessions.db");
export const CHAT_PERSISTENCE_BACKENDS: ChatPersistenceBackend[] = ["file", "sqlite"];

export function loadChatPersistenceConfig(): ChatPersistenceConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { backend: "file" };
  }

  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as ChatPersistenceConfig;
}

export function saveChatPersistenceConfig(config: ChatPersistenceConfig): ChatPersistenceConfig {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return config;
}

export function getChatPersistenceStatus(): ChatPersistenceStatus {
  const config = loadChatPersistenceConfig();

  return {
    ...config,
    availableBackends: CHAT_PERSISTENCE_BACKENDS,
    storageLabel:
      config.backend === "sqlite" ? ".waveary/chat-sessions.db" : ".waveary/chat-sessions.json"
  };
}
