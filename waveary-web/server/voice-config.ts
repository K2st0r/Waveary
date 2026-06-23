import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  VOICE_PRESETS,
  resolveVoicePreset,
  type VoiceOutputFormat,
  type VoiceQualityProfile
} from "@waveary/voice";
import type { ModelDescriptor } from "@waveary/core";

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

export interface VoiceProviderPreset {
  id: string;
  label: string;
  provider: string;
  providerType: "openai-compatible" | "doubao" | "local";
  baseURL: string;
  defaultModel?: string;
  defaultVoice?: string;
}

export interface VoiceOptionDescriptor {
  id: string;
  label: string;
}

export interface VoiceCatalogResponse {
  providerType: VoiceProviderPreset["providerType"];
  models: ModelDescriptor[];
  voices: VoiceOptionDescriptor[];
  voiceFieldMode: "select" | "input";
  defaultModel?: string;
  defaultVoice?: string;
  notes?: string;
}

const CONFIG_PATH = join(getWavearyDataDir(), "voice-config.json");
const OPENAI_COMPATIBLE_TTS_DEFAULT_MODEL = "gpt-4o-mini-tts";
const OPENAI_COMPATIBLE_VOICE_OPTIONS: readonly VoiceOptionDescriptor[] = [
  { id: "alloy", label: "alloy" },
  { id: "ash", label: "ash" },
  { id: "ballad", label: "ballad" },
  { id: "cedar", label: "cedar" },
  { id: "coral", label: "coral" },
  { id: "echo", label: "echo" },
  { id: "marin", label: "marin" },
  { id: "sage", label: "sage" },
  { id: "shimmer", label: "shimmer" },
  { id: "verse", label: "verse" }
];

const VOICE_PROVIDER_PRESETS: readonly VoiceProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI TTS",
    provider: "openai",
    providerType: "openai-compatible",
    baseURL: "https://api.openai.com/v1",
    defaultModel: OPENAI_COMPATIBLE_TTS_DEFAULT_MODEL,
    defaultVoice: "marin"
  },
  {
    id: "openai-compatible",
    label: "OpenAI-Compatible TTS",
    provider: "openai-compatible",
    providerType: "openai-compatible",
    baseURL: "https://api.example.com/v1",
    defaultModel: OPENAI_COMPATIBLE_TTS_DEFAULT_MODEL,
    defaultVoice: "alloy"
  },
  {
    id: "doubao",
    label: "Doubao TTS",
    provider: "doubao",
    providerType: "doubao",
    baseURL: "https://openspeech.bytedance.com/api/v1",
    defaultModel: "doubao-tts",
    defaultVoice: "BV001_streaming"
  },
  {
    id: "local",
    label: "Local Voice Bridge",
    provider: "local",
    providerType: "local",
    baseURL: "http://127.0.0.1:9880",
    defaultModel: "local-bridge"
  }
] as const;

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

export function listVoiceProviderPresets(): VoiceProviderPreset[] {
  return VOICE_PROVIDER_PRESETS.map((preset) => ({ ...preset }));
}

export function resolveVoiceProviderPreset(providerId: string): VoiceProviderPreset | undefined {
  return VOICE_PROVIDER_PRESETS.find((preset) => preset.id === providerId);
}

export function buildStaticVoiceCatalog(provider: string): VoiceCatalogResponse | null {
  const normalizedProvider = provider.trim().toLowerCase();

  if (normalizedProvider === "doubao") {
    return {
      providerType: "doubao",
      models: [{ id: "doubao-tts", provider: "doubao", label: "Doubao TTS" }],
      voices: [],
      voiceFieldMode: "input",
      defaultModel: "doubao-tts",
      defaultVoice: "BV001_streaming",
      notes:
        "Doubao does not currently use a single OpenAI-style voice-list route here. Enter the voice_type you want after testing it."
    };
  }

  if (normalizedProvider === "local") {
    return {
      providerType: "local",
      models: [{ id: "local-bridge", provider: "local", label: "Local bridge" }],
      voices: [],
      voiceFieldMode: "input",
      defaultModel: "local-bridge",
      notes:
        "Local bridges usually do not expose one shared voice-directory standard. Enter the local speaker or voice identifier directly."
    };
  }

  return {
    providerType: "openai-compatible",
    models: [],
    voices: OPENAI_COMPATIBLE_VOICE_OPTIONS.map((voice) => ({ ...voice })),
    voiceFieldMode: "select",
    defaultModel: OPENAI_COMPATIBLE_TTS_DEFAULT_MODEL,
    defaultVoice: "marin",
    notes:
      "Model discovery comes from the provider's /models route. Voice names are mapped locally because OpenAI-compatible vendors do not expose one universal voice-list endpoint."
  };
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
