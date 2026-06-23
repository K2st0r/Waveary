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
  appId: string;
  cluster: string;
  endpointPath: string;
  engine: string;
  speaker: string;
  referenceVoiceId: string;
  textLanguage: string;
  promptLanguage: string;
  referenceTranscript: string;
  stylePrompt: string;
  styleStrength: number | null;
  temperature: number | null;
  topP: number | null;
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
    apiKey: "",
    appId: "",
    cluster: "volcano_tts",
    endpointPath: "/tts",
    engine: "generic",
    speaker: "",
    referenceVoiceId: "",
    textLanguage: "",
    promptLanguage: "",
    referenceTranscript: "",
    stylePrompt: "",
    styleStrength: null,
    temperature: null,
    topP: null
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
  const appId = config.appId?.trim() || "";
  const cluster = config.cluster?.trim() || "volcano_tts";
  const endpointPath = normalizeEndpointPath(config.endpointPath);
  const engine = config.engine?.trim() || "generic";
  const speaker = config.speaker?.trim() || "";
  const referenceVoiceId = config.referenceVoiceId?.trim() || "";
  const textLanguage = config.textLanguage?.trim() || "";
  const promptLanguage = config.promptLanguage?.trim() || "";
  const referenceTranscript = config.referenceTranscript?.trim() || "";
  const stylePrompt = config.stylePrompt?.trim() || "";
  const styleStrength = normalizeOptionalNumber(config.styleStrength);
  const temperature = normalizeOptionalNumber(config.temperature);
  const topP = normalizeOptionalNumber(config.topP);

  return {
    model,
    voice,
    format,
    qualityProfile: preset.id,
    providerMode,
    provider,
    baseURL,
    apiKey,
    appId,
    cluster,
    endpointPath,
    engine,
    speaker,
    referenceVoiceId,
    textLanguage,
    promptLanguage,
    referenceTranscript,
    stylePrompt,
    styleStrength,
    temperature,
    topP
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

function normalizeEndpointPath(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "/tts";
  }

  const normalized = value.trim();
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function normalizeOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
