import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface SavedProviderConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

const CONFIG_PATH = fileURLToPath(new URL("../../.waveary/provider-config.json", import.meta.url));

export function loadSavedProviderConfig(): SavedProviderConfig | undefined {
  if (!existsSync(CONFIG_PATH)) {
    return undefined;
  }

  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as SavedProviderConfig;
}

export function saveProviderConfig(config: SavedProviderConfig): SavedProviderConfig {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

  return config;
}
