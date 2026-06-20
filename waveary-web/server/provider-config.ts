import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getWavearyDataDir } from "./data-dir.js";

export interface SavedProviderConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

const CONFIG_PATH = join(getWavearyDataDir(), "provider-config.json");

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
