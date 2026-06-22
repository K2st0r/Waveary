import type { EmotionState, RelationshipProfile } from "@waveary/core";
import { BrowserSpeechPlanner } from "@waveary/voice";

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

  return planner.synthesize({
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
  });
}
