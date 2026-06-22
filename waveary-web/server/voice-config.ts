import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  VOICE_PRESETS,
  resolveVoicePreset,
  type VoiceOutputFormat,
  type VoiceQualityProfile
} from "@waveary/voice";

import { getWavearyDataDir } from "./data-dir.js";

export interface SavedVoiceConfig {
  model: string;
  voice: string;
  format: VoiceOutputFormat;
  qualityProfile: VoiceQualityProfile;
  providerMode: "shared" | "dedicated";
  provider: string;
  baseURL: string;
  apiKey: string;
}

const CONFIG_PATH = join(getWavearyDataDir(), "voice-config.json");

export function getDefaultVoiceConfig(): SavedVoiceConfig {
  const preset = resolveVoicePreset("cinematic");

  return {
    model: preset.model,
    voice: preset.voice,
    format: preset.format,
    qualityProfile: preset.id,
    providerMode: "shared",
    provider: "",
    baseURL: "",
    apiKey: ""
  };
}

export function listVoicePresets() {
  return VOICE_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    model: preset.model,
    voice: preset.voice,
    format: preset.format
  }));
}

export function loadSavedVoiceConfig(): SavedVoiceConfig {
  if (!existsSync(CONFIG_PATH)) {
    return getDefaultVoiceConfig();
  }

  const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<SavedVoiceConfig>;
  return normalizeVoiceConfig(parsed);
}

export function saveVoiceConfig(config: Partial<SavedVoiceConfig>): SavedVoiceConfig {
  const normalized = normalizeVoiceConfig(config);
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2));

  return normalized;
}

function normalizeVoiceConfig(config: Partial<SavedVoiceConfig>): SavedVoiceConfig {
  const fallback = getDefaultVoiceConfig();
  const preset = resolveVoicePreset(config.qualityProfile ?? fallback.qualityProfile);
  const format = isVoiceFormat(config.format) ? config.format : preset.format;
  const model = config.model?.trim() || preset.model;
  const voice = config.voice?.trim() || preset.voice;
  const providerMode =
    config.providerMode === "dedicated" || config.providerMode === "shared"
      ? config.providerMode
      : fallback.providerMode;
  const provider = config.provider?.trim() || "";
  const baseURL = config.baseURL?.trim() || "";
  const apiKey = config.apiKey?.trim() || "";

  return {
    model,
    voice,
    format,
    qualityProfile: preset.id,
    providerMode,
    provider,
    baseURL,
    apiKey
  };
}

function isVoiceFormat(value: unknown): value is VoiceOutputFormat {
  return (
    value === "mp3" ||
    value === "wav" ||
    value === "opus" ||
    value === "aac" ||
    value === "flac" ||
    value === "pcm"
  );
}
