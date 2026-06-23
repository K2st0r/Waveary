import type { EmotionState, RelationshipProfile } from "@waveary/core";
import {
  BrowserSpeechPlanner,
  DoubaoTextToSpeechProvider,
  FishAudioTextToSpeechProvider,
  LocalHttpTextToSpeechProvider,
  OpenAICompatibleTextToSpeechProvider,
  resolveVoicePreset,
  type VoiceOutputFormat,
  type VoiceQualityProfile
} from "@waveary/voice";
import type { CompanionDeliveryHint } from "./companion-delivery.js";
import { loadSavedProviderConfig } from "./provider-config.js";
import { loadSavedVoiceConfig } from "./voice-config.js";
import {
  buildVoiceRoutingDiagnostic,
  type ResolvedVoiceRoutingConfig,
  type VoiceRoutingDiagnostic
} from "./voice-routing-diagnostics.js";

export interface VoiceSpeakPlanRequest {
  text: string;
  locale?: string;
  relationship?: RelationshipProfile | null;
  emotion?: EmotionState;
  persona?: {
    tone?: string;
    voiceStyle?: string;
  };
  delivery?: CompanionDeliveryHint;
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
    textLanguage?: string;
    promptLanguage?: string;
    referenceTranscript?: string;
    stylePrompt?: string;
    styleStrength?: number | null;
    temperature?: number | null;
    topP?: number | null;
  };
}

const planner = new BrowserSpeechPlanner();

export interface VoiceSpeakResultWithDiagnostics {
  provider: string;
  mode: "browser-speech" | "audio";
  plan?: {
    mode: "browser-speech";
    lang: string;
    voiceLabel: string;
    styleLabel: string;
    rate: number;
    pitch: number;
    volume: number;
    preDelayMs: number;
    postDelayMs: number;
    preferredVoiceKeywords: string[];
  };
  audio?: {
    mimeType: string;
    base64: string;
  };
  metadata?: {
    model: string;
    voice: string;
    qualityProfile?: string;
    instructions?: string;
  };
  routing: VoiceRoutingDiagnostic & {
    attemptedProviderAudio: boolean;
    fallbackReason?: string;
  };
}

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
    ...(input.delivery ? { delivery: input.delivery } : {}),
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
  const resolvedVoiceConfig: ResolvedVoiceRoutingConfig = {
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
      "",
    textLanguage:
      requestedVoiceConfig?.textLanguage?.trim() || savedVoiceConfig.textLanguage || "",
    promptLanguage:
      requestedVoiceConfig?.promptLanguage?.trim() || savedVoiceConfig.promptLanguage || "",
    referenceTranscript:
      requestedVoiceConfig?.referenceTranscript?.trim() ||
      savedVoiceConfig.referenceTranscript ||
      "",
    stylePrompt:
      requestedVoiceConfig?.stylePrompt?.trim() || savedVoiceConfig.stylePrompt || "",
    styleStrength:
      typeof requestedVoiceConfig?.styleStrength === "number"
        ? requestedVoiceConfig.styleStrength
        : savedVoiceConfig.styleStrength,
    temperature:
      typeof requestedVoiceConfig?.temperature === "number"
        ? requestedVoiceConfig.temperature
        : savedVoiceConfig.temperature,
    topP:
      typeof requestedVoiceConfig?.topP === "number"
        ? requestedVoiceConfig.topP
        : savedVoiceConfig.topP
  };

  const routingDiagnostic = buildVoiceRoutingDiagnostic(resolvedVoiceConfig, savedProvider);
  const providerBackedVoiceConfig = routingDiagnostic.providerBackedConfig;

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
          ...(providerBackedVoiceConfig.cluster
            ? { cluster: providerBackedVoiceConfig.cluster }
            : {})
        });

        const result = await ttsProvider.synthesize(request);
        return {
          ...result,
          routing: {
            ...routingDiagnostic,
            attemptedProviderAudio: true
          }
        } satisfies VoiceSpeakResultWithDiagnostics;
      }

      if (providerBackedVoiceConfig.provider === "fish-audio") {
        const ttsProvider = new FishAudioTextToSpeechProvider({
          apiKey: providerBackedVoiceConfig.apiKey,
          baseURL: providerBackedVoiceConfig.baseURL,
          model: resolvedVoiceConfig.model,
          referenceId: resolvedVoiceConfig.voice,
          format: resolvedVoiceConfig.format,
          qualityProfile: resolvedVoiceConfig.qualityProfile
        });

        const result = await ttsProvider.synthesize(request);
        return {
          ...result,
          routing: {
            ...routingDiagnostic,
            attemptedProviderAudio: true
          }
        } satisfies VoiceSpeakResultWithDiagnostics;
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
          ...(providerBackedVoiceConfig.textLanguage
            ? { textLanguage: providerBackedVoiceConfig.textLanguage }
            : {}),
          ...(providerBackedVoiceConfig.promptLanguage
            ? { promptLanguage: providerBackedVoiceConfig.promptLanguage }
            : {}),
          ...(providerBackedVoiceConfig.referenceTranscript
            ? { referenceTranscript: providerBackedVoiceConfig.referenceTranscript }
            : {}),
          ...(providerBackedVoiceConfig.stylePrompt
            ? { stylePrompt: providerBackedVoiceConfig.stylePrompt }
            : {}),
          ...(providerBackedVoiceConfig.styleStrength !== null &&
          providerBackedVoiceConfig.styleStrength !== undefined
            ? { styleStrength: providerBackedVoiceConfig.styleStrength }
            : {}),
          ...(providerBackedVoiceConfig.temperature !== null &&
          providerBackedVoiceConfig.temperature !== undefined
            ? { temperature: providerBackedVoiceConfig.temperature }
            : {}),
          ...(providerBackedVoiceConfig.topP !== null &&
          providerBackedVoiceConfig.topP !== undefined
            ? { topP: providerBackedVoiceConfig.topP }
            : {}),
          format: resolvedVoiceConfig.format,
          ...(providerBackedVoiceConfig.apiKey
            ? { apiKey: providerBackedVoiceConfig.apiKey }
            : {})
        });

        const result = await ttsProvider.synthesize(request);
        return {
          ...result,
          routing: {
            ...routingDiagnostic,
            attemptedProviderAudio: true
          }
        } satisfies VoiceSpeakResultWithDiagnostics;
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

      const result = await ttsProvider.synthesize(request);
      return {
        ...result,
        routing: {
          ...routingDiagnostic,
          attemptedProviderAudio: true
        }
      } satisfies VoiceSpeakResultWithDiagnostics;
    } catch (error) {
      // Keep voice usable by falling back to browser speech planning if the provider
      // does not expose a compatible TTS endpoint or the current key lacks access.
      const planResult = await planner.synthesize(request);
      return {
        ...planResult,
        routing: {
          ...routingDiagnostic,
          target: "browser-fallback",
          attemptedProviderAudio: true,
          fallbackReason:
            error instanceof Error ? error.message : "Provider-backed voice request failed."
        }
      } satisfies VoiceSpeakResultWithDiagnostics;
    }
  }

  const planResult = await planner.synthesize(request);
  return {
    ...planResult,
    routing: {
      ...routingDiagnostic,
      attemptedProviderAudio: false
    }
  } satisfies VoiceSpeakResultWithDiagnostics;
}
