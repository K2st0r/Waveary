import type { EmotionState, RelationshipProfile } from "@waveary/core";
import {
  BrowserSpeechPlanner,
  OpenAICompatibleTextToSpeechProvider
} from "@waveary/voice";
import { loadSavedProviderConfig } from "./provider-config.js";

export interface VoiceSpeakPlanRequest {
  text: string;
  locale?: string;
  relationship?: RelationshipProfile | null;
  emotion?: EmotionState;
  persona?: {
    tone?: string;
    voiceStyle?: string;
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

  if (savedProvider) {
    try {
      const ttsProvider = new OpenAICompatibleTextToSpeechProvider({
        provider: savedProvider.provider,
        apiKey: savedProvider.apiKey,
        baseURL: savedProvider.baseURL
      });

      return await ttsProvider.synthesize(request);
    } catch {
      // Keep voice usable by falling back to browser speech planning if the provider
      // does not expose a compatible TTS endpoint or the current key lacks access.
    }
  }

  return planner.synthesize(request);
}
