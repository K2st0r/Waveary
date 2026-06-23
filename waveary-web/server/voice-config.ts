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
  sttModel: string;
  providerMode: "shared" | "dedicated";
  provider: string;
  baseURL: string;
  apiKey: string;
  resourceId: string;
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
  providerType: "openai-compatible" | "gemini" | "fish-audio" | "doubao" | "local";
  baseURL: string;
  voiceFieldMode?: "select" | "input";
  defaultModel?: string;
  defaultVoice?: string;
  notes?: string;
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
const OPENAI_COMPATIBLE_STT_DEFAULT_MODEL = "gpt-4o-mini-transcribe";
const DOUBAO_DEFAULT_BASE_URL = "https://openspeech.bytedance.com";
const DOUBAO_DEFAULT_RESOURCE_ID = "seed-tts-2.0";
const DOUBAO_DEFAULT_VOICE = "zh_female_gaolengyujie_uranus_bigtts";
const DOUBAO_VOICE_OPTIONS: readonly VoiceOptionDescriptor[] = [
  {
    id: "zh_female_gaolengyujie_uranus_bigtts",
    label: "Cool Yujie 2.0"
  },
  {
    id: "zh_female_qingxinnvsheng_uranus_bigtts",
    label: "Fresh Female 2.0"
  },
  {
    id: "zh_female_cancan_uranus_bigtts",
    label: "Zhixing Cancan 2.0"
  },
  {
    id: "zh_female_sajiaoxuemei_uranus_bigtts",
    label: "Playful Schoolmate 2.0"
  },
  {
    id: "zh_female_linjianvhai_uranus_bigtts",
    label: "Neighbor Girl 2.0"
  },
  {
    id: "zh_female_meilinvyou_uranus_bigtts",
    label: "Charming Girlfriend 2.0"
  },
  {
    id: "zh_male_dayi_uranus_bigtts",
    label: "Dayi 2.0"
  },
  {
    id: "zh_male_shaonianzixin_uranus_bigtts",
    label: "Young Zixin 2.0"
  },
  {
    id: "zh_male_ruyayichen_uranus_bigtts",
    label: "Ruya Yichen 2.0"
  },
  {
    id: "zh_male_aojiaobazong_uranus_bigtts",
    label: "Tsundere Boss 2.0"
  },
  {
    id: "zh_male_lanyinmianbao_uranus_bigtts",
    label: "Lazy Mianbao 2.0"
  },
  {
    id: "zh_male_sunwukong_uranus_bigtts",
    label: "Sun Wukong 2.0"
  }
];
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
    voiceFieldMode: "select",
    defaultModel: OPENAI_COMPATIBLE_TTS_DEFAULT_MODEL,
    defaultVoice: "marin",
    notes:
      "OpenAI can discover models through /models here, and the common built-in voice names stay selectable in the console."
  },
  {
    id: "openai-compatible",
    label: "Custom OpenAI-Compatible",
    provider: "openai-compatible",
    providerType: "openai-compatible",
    baseURL: "https://api.example.com/v1",
    voiceFieldMode: "input",
    notes:
      "Use this when your vendor exposes an OpenAI-style speech route but does not share OpenAI's built-in voice directory. Fetch models, then enter the vendor-specific voice or speaker ID manually."
  },
  {
    id: "siliconflow",
    label: "SiliconFlow Speech",
    provider: "openai-compatible",
    providerType: "openai-compatible",
    baseURL: "https://api.siliconflow.cn/v1",
    voiceFieldMode: "input",
    notes:
      "SiliconFlow can usually expose OpenAI-compatible model discovery, but voice naming remains vendor-specific. Enter the voice or speaker ID manually after choosing a model."
  },
  {
    id: "dashscope",
    label: "Alibaba DashScope Speech",
    provider: "openai-compatible",
    providerType: "openai-compatible",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    voiceFieldMode: "input",
    notes:
      "Use DashScope through its compatible endpoint. Models can be discovered when the key is valid, while voice IDs should be entered manually."
  },
  {
    id: "ark",
    label: "Volcengine Ark Speech",
    provider: "openai-compatible",
    providerType: "openai-compatible",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    voiceFieldMode: "input",
    notes:
      "Ark-style compatible speech routes can share the model-discovery flow, but voice naming differs by vendor and should be entered manually."
  },
  {
    id: "gemini",
    label: "Gemini TTS",
    provider: "gemini",
    providerType: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    voiceFieldMode: "select",
    defaultModel: "gemini-3.1-flash-tts-preview",
    defaultVoice: "Kore",
    notes:
      "Gemini TTS uses the Gemini generateContent audio path with prebuilt voice names. Model selection is kept to the supported Gemini TTS family, and voice selection uses Google's documented prebuilt voices."
  },
  {
    id: "gemini-micu",
    label: "Gemini TTS (Micu Relay)",
    provider: "gemini",
    providerType: "gemini",
    baseURL: "https://www.micuapi.ai/v1beta",
    voiceFieldMode: "select",
    defaultModel: "gemini-2.5-flash-tts-preview",
    defaultVoice: "Kore",
    notes:
      "Use this when Gemini TTS should route through Micu relay. Micu currently recognizes Gemini TTS model names such as gemini-2.5-flash-tts-preview and gemini-2.5-pro-tts-preview instead of the newer 3.1 preview alias."
  },
  {
    id: "fish-audio",
    label: "Fish Audio",
    provider: "fish-audio",
    providerType: "fish-audio",
    baseURL: "https://api.fish.audio",
    voiceFieldMode: "input",
    defaultModel: "s2-pro",
    notes:
      "Fish Audio uses /model for voice-model discovery and expects the selected voice model ID in the voice field. TTS and STT stay on Fish's own voice routes instead of the OpenAI-compatible speech path."
  },
  {
    id: "doubao",
    label: "Doubao TTS",
    provider: "doubao",
    providerType: "doubao",
    baseURL: DOUBAO_DEFAULT_BASE_URL,
    voiceFieldMode: "select",
    defaultModel: "doubao-tts",
    defaultVoice: DOUBAO_DEFAULT_VOICE,
    notes:
      "Doubao uses the OpenSpeech v3 route with an API key plus resource ID. Waveary exposes a curated built-in speaker list here instead of pretending there is a generic public /models voice directory."
  },
  {
    id: "local",
    label: "Local Voice Bridge",
    provider: "local",
    providerType: "local",
    baseURL: "http://127.0.0.1:9880",
    voiceFieldMode: "input",
    defaultModel: "local-bridge",
    notes:
      "Use this for GPT-SoVITS, CosyVoice bridges, or any local HTTP speech adapter. Keep model and speaker identifiers explicit and local-engine-specific."
  }
] as const;

export function getDefaultVoiceConfig(): SavedVoiceConfig {
  const preset = resolveVoicePreset("cinematic");

  return {
    model: preset.model,
    voice: preset.voice,
    format: preset.format,
    qualityProfile: preset.id,
    sttModel: OPENAI_COMPATIBLE_STT_DEFAULT_MODEL,
    providerMode: "shared",
    provider: "",
    baseURL: "",
    apiKey: "",
    resourceId: DOUBAO_DEFAULT_RESOURCE_ID,
    cluster: "",
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

export function buildStaticVoiceCatalog(providerOrPreset: string): VoiceCatalogResponse | null {
  const normalizedInput = providerOrPreset.trim().toLowerCase();
  const matchedPreset =
    VOICE_PROVIDER_PRESETS.find((preset) => preset.id === normalizedInput) ??
    VOICE_PROVIDER_PRESETS.find((preset) => preset.provider === normalizedInput);
  const providerType = matchedPreset?.providerType ?? "openai-compatible";
  const voiceFieldMode = matchedPreset?.voiceFieldMode ?? "input";

  if (providerType === "doubao") {
    return {
      providerType: "doubao",
      models: [{ id: "doubao-tts", provider: "doubao", label: "Doubao TTS" }],
      voices: DOUBAO_VOICE_OPTIONS.map((voice) => ({ ...voice })),
      voiceFieldMode: "select",
      defaultModel: "doubao-tts",
      defaultVoice: DOUBAO_DEFAULT_VOICE,
      notes:
        matchedPreset?.notes ??
        "Doubao does not expose a generic OpenAI-style voice-list route here. Waveary ships a curated speaker set for quick selection while the real route still runs through resource ID plus speaker ID."
    };
  }

  if (providerType === "fish-audio") {
    return {
      providerType: "fish-audio",
      models: [],
      voices: [],
      voiceFieldMode: "input",
      defaultModel: "s2-pro",
      notes:
        matchedPreset?.notes ??
        "Fish Audio discovers reusable voice models through /model. Fetch the catalog, then enter the chosen Fish voice model ID in the voice field."
    };
  }

  if (providerType === "gemini") {
    const usesMicuRelay = matchedPreset?.id === "gemini-micu";
    return {
      providerType: "gemini",
      models: usesMicuRelay
        ? [
            {
              id: "gemini-2.5-flash-tts-preview",
              provider: "gemini",
              label: "Gemini 2.5 Flash TTS Preview"
            },
            {
              id: "gemini-2.5-pro-tts-preview",
              provider: "gemini",
              label: "Gemini 2.5 Pro TTS Preview"
            }
          ]
        : [
            {
              id: "gemini-3.1-flash-tts-preview",
              provider: "gemini",
              label: "Gemini 3.1 Flash TTS Preview"
            },
            {
              id: "gemini-2.5-flash-preview-tts",
              provider: "gemini",
              label: "Gemini 2.5 Flash Preview TTS"
            },
            {
              id: "gemini-2.5-pro-preview-tts",
              provider: "gemini",
              label: "Gemini 2.5 Pro Preview TTS"
            }
          ],
      voices: [
        { id: "Zephyr", label: "Zephyr" },
        { id: "Puck", label: "Puck" },
        { id: "Charon", label: "Charon" },
        { id: "Kore", label: "Kore" },
        { id: "Fenrir", label: "Fenrir" },
        { id: "Leda", label: "Leda" },
        { id: "Orus", label: "Orus" },
        { id: "Aoede", label: "Aoede" },
        { id: "Callirrhoe", label: "Callirrhoe" },
        { id: "Autonoe", label: "Autonoe" },
        { id: "Enceladus", label: "Enceladus" },
        { id: "Iapetus", label: "Iapetus" },
        { id: "Umbriel", label: "Umbriel" },
        { id: "Algieba", label: "Algieba" },
        { id: "Despina", label: "Despina" },
        { id: "Erinome", label: "Erinome" },
        { id: "Algenib", label: "Algenib" },
        { id: "Rasalgethi", label: "Rasalgethi" },
        { id: "Laomedeia", label: "Laomedeia" },
        { id: "Achernar", label: "Achernar" },
        { id: "Alnilam", label: "Alnilam" },
        { id: "Schedar", label: "Schedar" },
        { id: "Gacrux", label: "Gacrux" },
        { id: "Pulcherrima", label: "Pulcherrima" },
        { id: "Achird", label: "Achird" },
        { id: "Zubenelgenubi", label: "Zubenelgenubi" },
        { id: "Vindemiatrix", label: "Vindemiatrix" },
        { id: "Sadachbia", label: "Sadachbia" },
        { id: "Sadaltager", label: "Sadaltager" },
        { id: "Sulafat", label: "Sulafat" }
      ],
      voiceFieldMode: "select",
      defaultModel: usesMicuRelay
        ? "gemini-2.5-flash-tts-preview"
        : "gemini-3.1-flash-tts-preview",
      defaultVoice: "Kore",
      notes:
        matchedPreset?.notes ??
        "Gemini TTS uses Google's documented prebuilt voice list. Choose a supported Gemini TTS model and a prebuilt voice name here."
    };
  }

  if (providerType === "local") {
    return {
      providerType: "local",
      models: [{ id: "local-bridge", provider: "local", label: "Local bridge" }],
      voices: [],
      voiceFieldMode: "input",
      defaultModel: "local-bridge",
      notes:
        matchedPreset?.notes ??
        "Local bridges usually do not expose one shared voice-directory standard. Enter the local speaker or voice identifier directly."
    };
  }

  return {
    providerType: "openai-compatible",
    models: [],
    voices:
      voiceFieldMode === "select"
        ? OPENAI_COMPATIBLE_VOICE_OPTIONS.map((voice) => ({ ...voice }))
        : [],
    voiceFieldMode,
    defaultModel: OPENAI_COMPATIBLE_TTS_DEFAULT_MODEL,
    ...(voiceFieldMode === "select" ? { defaultVoice: matchedPreset?.defaultVoice ?? "marin" } : {}),
    notes:
      matchedPreset?.notes ??
      (voiceFieldMode === "select"
        ? "Model discovery comes from the provider's /models route. Voice names are mapped locally because OpenAI-compatible vendors do not expose one universal voice-list endpoint."
        : "Model discovery comes from the provider's /models route. Enter the vendor-specific voice, speaker, or role ID manually after choosing a model.")
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
  const sttModel = config.sttModel?.trim() || OPENAI_COMPATIBLE_STT_DEFAULT_MODEL;
  const hasExplicitModel = Object.prototype.hasOwnProperty.call(config, "model");
  const hasExplicitVoice = Object.prototype.hasOwnProperty.call(config, "voice");
  const hasExplicitResourceId = Object.prototype.hasOwnProperty.call(config, "resourceId");
  const hasExplicitLegacyAppId = Object.prototype.hasOwnProperty.call(config, "appId");
  const model = hasExplicitModel ? (config.model?.trim() ?? "") : preset.model;
  const voice = hasExplicitVoice ? (config.voice?.trim() ?? "") : preset.voice;
  const providerMode =
    config.providerMode === "dedicated" || config.providerMode === "shared"
      ? config.providerMode
      : fallback.providerMode;
  const provider = config.provider?.trim() || "";
  const baseURL = config.baseURL?.trim() || "";
  const apiKey = config.apiKey?.trim() || "";
  const legacyAppId =
    typeof (config as Partial<SavedVoiceConfig> & { appId?: unknown }).appId === "string"
      ? (config as Partial<SavedVoiceConfig> & { appId?: string }).appId?.trim() || ""
      : "";
  const resourceId =
    hasExplicitResourceId
      ? (config.resourceId?.trim() ?? "")
      : hasExplicitLegacyAppId
        ? legacyAppId
        : DOUBAO_DEFAULT_RESOURCE_ID;
  const cluster = config.cluster?.trim() || "";
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

  const normalizedBaseURL =
    provider === "doubao" ? normalizeDoubaoBaseURL(baseURL) : baseURL;
  const normalizedResourceId =
    provider === "doubao"
      ? normalizeDoubaoResourceId(resourceId, apiKey)
      : resourceId;
  const normalizedVoice =
    provider === "doubao" ? normalizeDoubaoVoice(voice) : voice;

  return {
    model,
    voice: normalizedVoice,
    format,
    qualityProfile: preset.id,
    sttModel,
    providerMode,
    provider,
    baseURL: normalizedBaseURL,
    apiKey,
    resourceId: normalizedResourceId,
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

function normalizeDoubaoBaseURL(value: string): string {
  if (!value) {
    return DOUBAO_DEFAULT_BASE_URL;
  }

  return value.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "") || DOUBAO_DEFAULT_BASE_URL;
}

function normalizeDoubaoResourceId(resourceId: string, apiKey: string): string {
  if (!resourceId) {
    return "";
  }

  if (apiKey && resourceId === apiKey) {
    return DOUBAO_DEFAULT_RESOURCE_ID;
  }

  if (resourceId === "volc.service_type.10029") {
    return DOUBAO_DEFAULT_RESOURCE_ID;
  }

  return resourceId;
}

function normalizeDoubaoVoice(value: string): string {
  if (
    !value ||
    value === "BV001_streaming" ||
    value === "zh_male_beijingxiaoye_emo_v2_mars_bigtts"
  ) {
    return DOUBAO_DEFAULT_VOICE;
  }

  return value;
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
