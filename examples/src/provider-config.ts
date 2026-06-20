import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface SavedProviderConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

const CONFIG_PATH = resolve(process.cwd(), ".waveary", "provider-config.json");

export function getProviderConfigPath(): string {
  return CONFIG_PATH;
}

export function loadSavedProviderConfig(): SavedProviderConfig | undefined {
  if (!existsSync(CONFIG_PATH)) {
    return undefined;
  }

  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as SavedProviderConfig;
}

export function saveProviderConfig(config: SavedProviderConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
