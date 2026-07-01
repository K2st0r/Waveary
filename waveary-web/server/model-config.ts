import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getWavearyDataDir } from "./data-dir.js";

export type ModelCapabilitySurface = "speech" | "vision" | "image" | "video";

export interface CapabilityProviderConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

export interface SavedModelCapabilityConfig {
  speech: CapabilityProviderConfig;
  vision: CapabilityProviderConfig;
  image: CapabilityProviderConfig;
  video: CapabilityProviderConfig;
}

const CONFIG_PATH = join(getWavearyDataDir(), "model-config.json");

export function createEmptyCapabilityProviderConfig(): CapabilityProviderConfig {
  return {
    provider: "",
    baseURL: "",
    apiKey: "",
    model: ""
  };
}

export function getDefaultModelCapabilityConfig(): SavedModelCapabilityConfig {
  return {
    speech: createEmptyCapabilityProviderConfig(),
    vision: createEmptyCapabilityProviderConfig(),
    image: createEmptyCapabilityProviderConfig(),
    video: createEmptyCapabilityProviderConfig()
  };
}

export function loadSavedModelCapabilityConfig(): SavedModelCapabilityConfig {
  if (!existsSync(CONFIG_PATH)) {
    return getDefaultModelCapabilityConfig();
  }

  const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<SavedModelCapabilityConfig>;
  return normalizeSavedModelCapabilityConfig(parsed);
}

export function saveModelCapabilityConfig(
  surface: ModelCapabilitySurface,
  config: Partial<CapabilityProviderConfig>
): SavedModelCapabilityConfig {
  const current = loadSavedModelCapabilityConfig();
  const next: SavedModelCapabilityConfig = {
    ...current,
    [surface]: normalizeCapabilityProviderConfig(config)
  };

  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));

  return next;
}

function normalizeSavedModelCapabilityConfig(
  value: Partial<SavedModelCapabilityConfig>
): SavedModelCapabilityConfig {
  const fallback = getDefaultModelCapabilityConfig();

  return {
    speech: normalizeCapabilityProviderConfig(value.speech ?? fallback.speech),
    vision: normalizeCapabilityProviderConfig(value.vision ?? fallback.vision),
    image: normalizeCapabilityProviderConfig(value.image ?? fallback.image),
    video: normalizeCapabilityProviderConfig(value.video ?? fallback.video)
  };
}

function normalizeCapabilityProviderConfig(
  value: Partial<CapabilityProviderConfig>
): CapabilityProviderConfig {
  return {
    provider: value.provider?.trim() ?? "",
    baseURL: value.baseURL?.trim() ?? "",
    apiKey: value.apiKey?.trim() ?? "",
    model: value.model?.trim() ?? ""
  };
}
