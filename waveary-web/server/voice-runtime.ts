import type { EmotionState, RelationshipProfile } from "@waveary/core";
import {
  BrowserSpeechPlanner,
  DoubaoTextToSpeechProvider,
  LocalHttpTextToSpeechProvider,
  OpenAICompatibleTextToSpeechProvider,
  resolveVoicePreset,
  type VoiceOutputFormat,
  type VoiceQualityProfile
} from "@waveary/voice";
import { loadSavedProviderConfig } from "./provider-config.js";
import { loadSavedVoiceConfig } from "./voice-config.js";

export interface VoiceSpeakPlanRequest {
  text: string;
  locale?: string;
  relationship?: RelationshipProfile | null;
  emotion?: EmotionState;
  persona?: {
    tone?: string;
    voiceStyle?: string;
  };
  voiceConfig?: {
    model?: string;
    voice?: string;
    format?: VoiceOutputFormat;
    qualityProfile?: VoiceQualityProfile;
    providerMode?: "shared" | "dedicated";
    provider?: string;
    baseURL?: string;
    apiKey?: string;
    appId?: string;
    cluster?: string;
    endpointPath?: string;
    engine?: string;
    speaker?: string;
    referenceVoiceId?: string;
  };
}

const planner = new BrowserSpeechPlanner();

export async function planChatSpeech(input: VoiceSpeakPlanRequest) {
  const trimmed = input.text.trim();

  if (!trimmed) {
    throw new Error("Voice text is required.");
  }

  const request = {
    text: trimmed,
    ...(input.locale ? { locale: input.locale } : {}),
    ...(input.relationship?.stage
      ? { relationshipStage: input.relationship.stage }
      : {}),
    ...(input.persona?.tone ? { personaTone: input.persona.tone } : {}),
    ...(input.persona?.voiceStyle
      ? { personaVoiceStyle: input.persona.voiceStyle }
      : {}),
    ...(input.emotion
      ? {
          emotion: {
            primaryEmotion: input.emotion.primaryEmotion,
            intensity: input.emotion.intensity,
            ...(input.emotion.modifiers ? { modifiers: input.emotion.modifiers } : {})
          }
        }
      : {})
  };
  const savedProvider = loadSavedProviderConfig();
  const savedVoiceConfig = loadSavedVoiceConfig();
  const requestedVoiceConfig = input.voiceConfig;
  const resolvedPreset = resolveVoicePreset(
    requestedVoiceConfig?.qualityProfile ?? savedVoiceConfig.qualityProfile
  );
  const resolvedVoiceConfig = {
    model:
      requestedVoiceConfig?.model?.trim() ||
      savedVoiceConfig.model ||
      resolvedPreset.model,
    voice:
      requestedVoiceConfig?.voice?.trim() ||
      savedVoiceConfig.voice ||
      resolvedPreset.voice,
    format:
      requestedVoiceConfig?.format ??
      savedVoiceConfig.format ??
      resolvedPreset.format,
    qualityProfile: resolvedPreset.id,
    providerMode:
      requestedVoiceConfig?.providerMode === "dedicated" ||
      requestedVoiceConfig?.providerMode === "shared"
        ? requestedVoiceConfig.providerMode
        : savedVoiceConfig.providerMode,
    provider:
      requestedVoiceConfig?.provider?.trim() ||
      savedVoiceConfig.provider ||
      savedProvider?.provider ||
      "",
    baseURL:
      requestedVoiceConfig?.baseURL?.trim() ||
      savedVoiceConfig.baseURL ||
      savedProvider?.baseURL ||
      "",
    apiKey:
      requestedVoiceConfig?.apiKey?.trim() ||
      savedVoiceConfig.apiKey ||
      (savedVoiceConfig.providerMode !== "dedicated" ? savedProvider?.apiKey || "" : ""),
    appId: requestedVoiceConfig?.appId?.trim() || savedVoiceConfig.appId || "",
    cluster: requestedVoiceConfig?.cluster?.trim() || savedVoiceConfig.cluster || "volcano_tts",
    endpointPath:
      requestedVoiceConfig?.endpointPath?.trim() ||
      savedVoiceConfig.endpointPath ||
      "/tts",
    engine: requestedVoiceConfig?.engine?.trim() || savedVoiceConfig.engine || "generic",
    speaker: requestedVoiceConfig?.speaker?.trim() || savedVoiceConfig.speaker || "",
    referenceVoiceId:
      requestedVoiceConfig?.referenceVoiceId?.trim() ||
      savedVoiceConfig.referenceVoiceId ||
      ""
  };

  const providerBackedVoiceConfig =
    resolvedVoiceConfig.providerMode === "dedicated"
      ? resolvedVoiceConfig.provider &&
        (resolvedVoiceConfig.provider === "doubao"
          ? resolvedVoiceConfig.apiKey && resolvedVoiceConfig.appId
          : resolvedVoiceConfig.provider === "local"
            ? resolvedVoiceConfig.baseURL
            : resolvedVoiceConfig.baseURL && resolvedVoiceConfig.apiKey)
        ? {
            provider: resolvedVoiceConfig.provider,
            baseURL: resolvedVoiceConfig.baseURL,
            apiKey: resolvedVoiceConfig.apiKey,
            appId: resolvedVoiceConfig.appId,
            cluster: resolvedVoiceConfig.cluster,
            endpointPath: resolvedVoiceConfig.endpointPath,
            engine: resolvedVoiceConfig.engine,
            speaker: resolvedVoiceConfig.speaker,
            referenceVoiceId: resolvedVoiceConfig.referenceVoiceId
          }
        : null
      : savedProvider
        ? {
            provider: savedProvider.provider,
            baseURL: savedProvider.baseURL,
            apiKey: savedProvider.apiKey
          }
        : null;

  if (providerBackedVoiceConfig) {
    try {
      if (providerBackedVoiceConfig.provider === "doubao") {
        const appId = providerBackedVoiceConfig.appId;

        if (!appId) {
          throw new Error("Doubao voice config requires an appId.");
        }

        const ttsProvider = new DoubaoTextToSpeechProvider({
          apiKey: providerBackedVoiceConfig.apiKey,
          appId,
          voiceType: resolvedVoiceConfig.voice,
          cluster: providerBackedVoiceConfig.cluster
        });

        return await ttsProvider.synthesize(request);
      }

      if (providerBackedVoiceConfig.provider === "local") {
        const ttsProvider = new LocalHttpTextToSpeechProvider({
          baseURL: providerBackedVoiceConfig.baseURL,
          ...(providerBackedVoiceConfig.endpointPath
            ? { endpointPath: providerBackedVoiceConfig.endpointPath }
            : {}),
          ...(providerBackedVoiceConfig.engine
            ? { engine: providerBackedVoiceConfig.engine }
            : {}),
          voice: resolvedVoiceConfig.voice,
          ...(providerBackedVoiceConfig.speaker
            ? { speaker: providerBackedVoiceConfig.speaker }
            : {}),
          ...(providerBackedVoiceConfig.referenceVoiceId
            ? { referenceVoiceId: providerBackedVoiceConfig.referenceVoiceId }
            : {}),
          format: resolvedVoiceConfig.format,
          ...(providerBackedVoiceConfig.apiKey
            ? { apiKey: providerBackedVoiceConfig.apiKey }
            : {})
        });

        return await ttsProvider.synthesize(request);
      }

      const ttsProvider = new OpenAICompatibleTextToSpeechProvider({
        provider: providerBackedVoiceConfig.provider,
        apiKey: providerBackedVoiceConfig.apiKey,
        baseURL: providerBackedVoiceConfig.baseURL,
        model: resolvedVoiceConfig.model,
        voice: resolvedVoiceConfig.voice,
        format: resolvedVoiceConfig.format,
        qualityProfile: resolvedVoiceConfig.qualityProfile
      });

      return await ttsProvider.synthesize(request);
    } catch {
      // Keep voice usable by falling back to browser speech planning if the provider
      // does not expose a compatible TTS endpoint or the current key lacks access.
    }
  }

  return planner.synthesize(request);
}
