import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type ChatPersistenceBackend = "file" | "sqlite";

export interface ChatPersistenceConfig {
  backend: ChatPersistenceBackend;
}

export interface ChatPersistenceStatus extends ChatPersistenceConfig {
  availableBackends: ChatPersistenceBackend[];
  storageLabel: string;
}

const CONFIG_PATH = fileURLToPath(new URL("../../.waveary/chat-persistence.json", import.meta.url));
export const CHAT_SESSION_JSON_PATH = fileURLToPath(
  new URL("../../.waveary/chat-sessions.json", import.meta.url)
);
export const CHAT_SESSION_SQLITE_PATH = fileURLToPath(
  new URL("../../.waveary/chat-sessions.db", import.meta.url)
);
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
