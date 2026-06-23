import type { SavedProviderConfig } from "./provider-config.js";
import type { SavedVoiceConfig } from "./voice-config.js";

export interface ResolvedVoiceRoutingConfig {
  model: string;
  voice: string;
  format: SavedVoiceConfig["format"];
  qualityProfile: SavedVoiceConfig["qualityProfile"];
  providerMode: SavedVoiceConfig["providerMode"];
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

export interface VoiceRoutingDiagnostic {
  mode: "shared" | "dedicated";
  target: "provider-audio" | "browser-fallback";
  providerType: "shared-chat-provider" | "openai-compatible" | "doubao" | "local" | "unknown";
  providerLabel: string;
  ready: boolean;
  reasonCode:
    | "shared-provider-ready"
    | "shared-provider-missing"
    | "dedicated-compatible-ready"
    | "dedicated-compatible-missing-base-url"
    | "dedicated-compatible-missing-api-key"
    | "dedicated-doubao-ready"
    | "dedicated-doubao-missing-api-key"
    | "dedicated-doubao-missing-app-id"
    | "dedicated-local-ready"
    | "dedicated-local-missing-base-url"
    | "dedicated-provider-missing"
    | "dedicated-provider-unknown";
  summary: string;
  missingFields: Array<"provider" | "baseURL" | "apiKey" | "appId">;
  providerBackedConfig:
    | {
        provider: string;
        baseURL: string;
        apiKey: string;
        appId?: string;
        cluster?: string;
        endpointPath?: string;
        engine?: string;
        speaker?: string;
        referenceVoiceId?: string;
        textLanguage?: string;
        promptLanguage?: string;
        referenceTranscript?: string;
        stylePrompt?: string;
        styleStrength?: number | null;
        temperature?: number | null;
        topP?: number | null;
      }
    | null;
}

export function buildVoiceRoutingDiagnostic(
  resolvedVoiceConfig: ResolvedVoiceRoutingConfig,
  savedProvider?: SavedProviderConfig
): VoiceRoutingDiagnostic {
  if (resolvedVoiceConfig.providerMode === "shared") {
    if (savedProvider?.provider && savedProvider.baseURL && savedProvider.apiKey) {
      return {
        mode: "shared",
        target: "provider-audio",
        providerType: "shared-chat-provider",
        providerLabel: savedProvider.provider,
        ready: true,
        reasonCode: "shared-provider-ready",
        summary: "Shared voice can attempt provider-backed audio through the saved chat provider.",
        missingFields: [],
        providerBackedConfig: {
          provider: savedProvider.provider,
          baseURL: savedProvider.baseURL,
          apiKey: savedProvider.apiKey
        }
      };
    }

    return {
      mode: "shared",
      target: "browser-fallback",
      providerType: "shared-chat-provider",
      providerLabel: savedProvider?.provider || "shared",
      ready: false,
      reasonCode: "shared-provider-missing",
      summary:
        "Shared voice has no saved chat provider route with provider, base URL, and API key, so browser speech is the only available path.",
      missingFields: [
        ...(savedProvider?.provider ? [] : (["provider"] as const)),
        ...(savedProvider?.baseURL ? [] : (["baseURL"] as const)),
        ...(savedProvider?.apiKey ? [] : (["apiKey"] as const))
      ],
      providerBackedConfig: null
    };
  }

  const provider = resolvedVoiceConfig.provider.trim().toLowerCase();

  if (!provider) {
    return {
      mode: "dedicated",
      target: "browser-fallback",
      providerType: "unknown",
      providerLabel: "dedicated",
      ready: false,
      reasonCode: "dedicated-provider-missing",
      summary:
        "Dedicated voice mode is enabled, but no dedicated provider is selected yet, so playback will fall back to browser speech.",
      missingFields: ["provider"],
      providerBackedConfig: null
    };
  }

  if (provider === "doubao") {
    const missingFields: Array<"provider" | "baseURL" | "apiKey" | "appId"> = [];

    if (!resolvedVoiceConfig.apiKey) {
      missingFields.push("apiKey");
    }

    if (!resolvedVoiceConfig.appId) {
      missingFields.push("appId");
    }

    if (missingFields.length === 0) {
      return {
        mode: "dedicated",
        target: "provider-audio",
        providerType: "doubao",
        providerLabel: "doubao",
        ready: true,
        reasonCode: "dedicated-doubao-ready",
        summary:
          "Dedicated Doubao voice has the required API key and app ID, so provider-backed audio can be attempted.",
        missingFields: [],
        providerBackedConfig: {
          provider,
          baseURL: resolvedVoiceConfig.baseURL,
          apiKey: resolvedVoiceConfig.apiKey,
          appId: resolvedVoiceConfig.appId,
          cluster: resolvedVoiceConfig.cluster
        }
      };
    }

    return {
      mode: "dedicated",
      target: "browser-fallback",
      providerType: "doubao",
      providerLabel: "doubao",
      ready: false,
      reasonCode: missingFields.includes("appId")
        ? "dedicated-doubao-missing-app-id"
        : "dedicated-doubao-missing-api-key",
      summary:
        missingFields.includes("appId")
          ? "Dedicated Doubao voice is missing app ID, so it cannot reach provider-backed audio and will fall back to browser speech."
          : "Dedicated Doubao voice is missing API key, so it cannot reach provider-backed audio and will fall back to browser speech.",
      missingFields,
      providerBackedConfig: null
    };
  }

  if (provider === "local") {
    if (resolvedVoiceConfig.baseURL) {
      return {
        mode: "dedicated",
        target: "provider-audio",
        providerType: "local",
        providerLabel: "local",
        ready: true,
        reasonCode: "dedicated-local-ready",
        summary:
          "Dedicated local voice has a bridge base URL, so Waveary can attempt provider-backed audio through the self-hosted route.",
        missingFields: [],
        providerBackedConfig: {
          provider,
          baseURL: resolvedVoiceConfig.baseURL,
          apiKey: resolvedVoiceConfig.apiKey,
          endpointPath: resolvedVoiceConfig.endpointPath,
          engine: resolvedVoiceConfig.engine,
          speaker: resolvedVoiceConfig.speaker,
          referenceVoiceId: resolvedVoiceConfig.referenceVoiceId,
          textLanguage: resolvedVoiceConfig.textLanguage,
          promptLanguage: resolvedVoiceConfig.promptLanguage,
          referenceTranscript: resolvedVoiceConfig.referenceTranscript,
          stylePrompt: resolvedVoiceConfig.stylePrompt,
          styleStrength: resolvedVoiceConfig.styleStrength,
          temperature: resolvedVoiceConfig.temperature,
          topP: resolvedVoiceConfig.topP
        }
      };
    }

    return {
      mode: "dedicated",
      target: "browser-fallback",
      providerType: "local",
      providerLabel: "local",
      ready: false,
      reasonCode: "dedicated-local-missing-base-url",
      summary:
        "Dedicated local voice is missing the bridge base URL, so Waveary cannot call the self-hosted route and will fall back to browser speech.",
      missingFields: ["baseURL"],
      providerBackedConfig: null
    };
  }

  if (provider === "openai-compatible" || resolvedVoiceConfig.baseURL) {
    const missingFields: Array<"provider" | "baseURL" | "apiKey" | "appId"> = [];

    if (!resolvedVoiceConfig.baseURL) {
      missingFields.push("baseURL");
    }

    if (!resolvedVoiceConfig.apiKey) {
      missingFields.push("apiKey");
    }

    if (missingFields.length === 0) {
      return {
        mode: "dedicated",
        target: "provider-audio",
        providerType: "openai-compatible",
        providerLabel: provider,
        ready: true,
        reasonCode: "dedicated-compatible-ready",
        summary:
          "Dedicated compatible voice has base URL and API key, so provider-backed audio can be attempted through the speech endpoint.",
        missingFields: [],
        providerBackedConfig: {
          provider,
          baseURL: resolvedVoiceConfig.baseURL,
          apiKey: resolvedVoiceConfig.apiKey
        }
      };
    }

    return {
      mode: "dedicated",
      target: "browser-fallback",
      providerType: "openai-compatible",
      providerLabel: provider,
      ready: false,
      reasonCode: missingFields.includes("baseURL")
        ? "dedicated-compatible-missing-base-url"
        : "dedicated-compatible-missing-api-key",
      summary:
        missingFields.includes("baseURL")
          ? "Dedicated compatible voice is missing base URL, so provider-backed audio cannot be attempted and browser speech will be used instead."
          : "Dedicated compatible voice is missing API key, so provider-backed audio cannot be attempted and browser speech will be used instead.",
      missingFields,
      providerBackedConfig: null
    };
  }

  return {
    mode: "dedicated",
    target: "browser-fallback",
    providerType: "unknown",
    providerLabel: provider,
    ready: false,
    reasonCode: "dedicated-provider-unknown",
    summary:
      "Dedicated voice is pointing at an unknown provider family, so Waveary cannot build a provider-backed route and will fall back to browser speech.",
    missingFields: [],
    providerBackedConfig: null
  };
}
