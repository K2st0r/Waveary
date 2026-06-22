import type { TextToSpeechRequest } from "./types.js";

export type VoiceOutputFormat = "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm";
export type VoiceQualityProfile = "cinematic" | "gentle" | "bright" | "steady";

export interface VoicePreset {
  id: VoiceQualityProfile;
  label: string;
  description: string;
  model: string;
  voice: string;
  format: VoiceOutputFormat;
  instructionSeed: string;
  speedBias: number;
}

const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";

export const VOICE_PRESETS: readonly VoicePreset[] = [
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Closest, fuller, more emotionally present delivery.",
    model: DEFAULT_TTS_MODEL,
    voice: "marin",
    format: "mp3",
    instructionSeed:
      "Sound intimate, natural, and emotionally grounded, like a real person speaking nearby.",
    speedBias: -0.03
  },
  {
    id: "gentle",
    label: "Gentle",
    description: "Soft, caring, slower companionship tone.",
    model: DEFAULT_TTS_MODEL,
    voice: "cedar",
    format: "mp3",
    instructionSeed:
      "Sound soft, warm, and reassuring, with a little extra gentleness in pauses and endings.",
    speedBias: -0.06
  },
  {
    id: "bright",
    label: "Bright",
    description: "Lighter, more youthful and lively expression.",
    model: DEFAULT_TTS_MODEL,
    voice: "alloy",
    format: "mp3",
    instructionSeed:
      "Sound lively and human, slightly brighter and lighter without becoming synthetic or sales-like.",
    speedBias: 0.04
  },
  {
    id: "steady",
    label: "Steady",
    description: "Balanced, restrained, reliable everyday voice.",
    model: DEFAULT_TTS_MODEL,
    voice: "sage",
    format: "mp3",
    instructionSeed:
      "Sound calm, natural, and stable, with restrained warmth and no exaggerated performance.",
    speedBias: 0
  }
] as const;

const VOICE_PRESET_MAP = new Map(VOICE_PRESETS.map((preset) => [preset.id, preset]));

export function resolveVoicePreset(profile?: string | null): VoicePreset {
  if (profile) {
    const matched = VOICE_PRESET_MAP.get(profile as VoiceQualityProfile);

    if (matched) {
      return matched;
    }
  }

  return VOICE_PRESET_MAP.get("cinematic") as VoicePreset;
}

export function buildVoiceInstructionParts(
  request: TextToSpeechRequest,
  preset: VoicePreset
): string[] {
  const emotion = request.emotion?.primaryEmotion?.toLowerCase() ?? "calm";
  const relationshipStage = request.relationshipStage?.toLowerCase() ?? "new";
  const tone = request.personaTone?.trim();
  const voiceStyle = request.personaVoiceStyle?.trim();

  return [
    "Sound like a real human companion, not a voice assistant or announcer.",
    preset.instructionSeed,
    describeEmotionStyle(emotion),
    describeRelationshipStyle(relationshipStage),
    tone ? `Overall persona tone: ${tone}.` : null,
    voiceStyle ? `Preferred voice style: ${voiceStyle}.` : null,
    "Use natural pauses, soft breaths, and gentle variation in emphasis where it fits the sentence.",
    "Avoid sounding theatrical, robotic, overly polished, or overly cheerful."
  ].filter((part): part is string => Boolean(part));
}

export function resolveVoiceSpeed(
  request: TextToSpeechRequest,
  preset: VoicePreset
): number {
  const emotion = request.emotion?.primaryEmotion?.toLowerCase() ?? "";
  const intensity = clamp(request.emotion?.intensity ?? 0.55, 0, 1);
  const relationshipStage = request.relationshipStage?.toLowerCase() ?? "new";
  let speed = 1 + preset.speedBias;

  if (includesAny(emotion, ["concerned", "protective", "sad", "quiet", "longing"])) {
    speed -= 0.12 + intensity * 0.08;
  } else if (includesAny(emotion, ["playful", "happy", "joyful"])) {
    speed += 0.05 + intensity * 0.06;
  } else if (includesAny(emotion, ["warm", "fond", "relieved"])) {
    speed -= 0.02;
  }

  if (relationshipStage === "growing") {
    speed -= 0.02;
  } else if (relationshipStage === "new") {
    speed -= 0.01;
  }

  return Number(clamp(speed, 0.76, 1.18).toFixed(2));
}

function describeEmotionStyle(emotion: string): string {
  if (includesAny(emotion, ["concerned", "protective", "attentive"])) {
    return "Speak gently, a little slower, with reassuring concern.";
  }

  if (includesAny(emotion, ["sad", "hurt", "quiet", "longing"])) {
    return "Speak softly and quietly, carrying tenderness without sounding flat.";
  }

  if (includesAny(emotion, ["playful", "happy", "joyful"])) {
    return "Let the voice feel a bit brighter and lighter while staying caring.";
  }

  if (includesAny(emotion, ["warm", "fond", "relieved"])) {
    return "Let the voice feel warm, close, and softly reassuring.";
  }

  return "Keep the delivery calm, soft, and grounded.";
}

function describeRelationshipStyle(relationshipStage: string): string {
  if (relationshipStage === "growing") {
    return "The relationship is already growing, so it can sound softly familiar and settled.";
  }

  if (relationshipStage === "warming") {
    return "The relationship is warming, so it should sound personal but still restrained.";
  }

  return "The relationship is still new, so keep the tone warm without sounding overly intimate.";
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
