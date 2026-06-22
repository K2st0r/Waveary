import type {
  BrowserSpeechPlan,
  TextToSpeechRequest,
  TextToSpeechResult,
  TextToSpeechProvider
} from "./types.js";

export class BrowserSpeechPlanner implements TextToSpeechProvider {
  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    return {
      provider: "waveary-browser-speech-planner",
      mode: "browser-speech",
      plan: buildBrowserSpeechPlan(request)
    };
  }
}

export function buildBrowserSpeechPlan(request: TextToSpeechRequest): BrowserSpeechPlan {
  const locale = normalizeLocale(request.locale);
  const emotion = request.emotion?.primaryEmotion?.toLowerCase() ?? "calm";
  const intensity = clamp(request.emotion?.intensity ?? 0.55, 0, 1);
  const relationshipStage = request.relationshipStage?.toLowerCase() ?? "new";

  const basePlan = locale.startsWith("zh")
    ? createChineseBasePlan()
    : createEnglishBasePlan();

  const emotionAdjusted = applyEmotionTuning(basePlan, emotion, intensity);
  return applyRelationshipTuning(emotionAdjusted, relationshipStage, request.personaVoiceStyle);
}

function createChineseBasePlan(): BrowserSpeechPlan {
  return {
    mode: "browser-speech",
    lang: "zh-CN",
    voiceLabel: "Waveary CN Companion",
    styleLabel: "soft",
    rate: 0.98,
    pitch: 1.02,
    volume: 0.92,
    preDelayMs: 80,
    postDelayMs: 120,
    preferredVoiceKeywords: ["Xiaoxiao", "Xiaochen", "Yunxi", "Chinese", "Mandarin", "Microsoft"]
  };
}

function createEnglishBasePlan(): BrowserSpeechPlan {
  return {
    mode: "browser-speech",
    lang: "en-US",
    voiceLabel: "Waveary EN Companion",
    styleLabel: "soft",
    rate: 1,
    pitch: 1.01,
    volume: 0.92,
    preDelayMs: 60,
    postDelayMs: 120,
    preferredVoiceKeywords: ["Aria", "Jenny", "Emma", "Sonia", "Google", "Microsoft"]
  };
}

function applyEmotionTuning(
  plan: BrowserSpeechPlan,
  emotion: string,
  intensity: number
): BrowserSpeechPlan {
  const tuned = { ...plan };

  if (matchesEmotion(emotion, ["playful", "happy", "joyful"])) {
    tuned.styleLabel = "bright";
    tuned.rate = clamp(tuned.rate + 0.04 + intensity * 0.06, 0.85, 1.16);
    tuned.pitch = clamp(tuned.pitch + 0.05 + intensity * 0.08, 0.82, 1.2);
    tuned.volume = clamp(tuned.volume + 0.02, 0.7, 1);
    return tuned;
  }

  if (matchesEmotion(emotion, ["warm", "fond", "relieved"])) {
    tuned.styleLabel = "warm";
    tuned.rate = clamp(tuned.rate - 0.01 + intensity * 0.03, 0.85, 1.16);
    tuned.pitch = clamp(tuned.pitch + 0.02 + intensity * 0.05, 0.82, 1.2);
    return tuned;
  }

  if (matchesEmotion(emotion, ["concerned", "protective", "attentive"])) {
    tuned.styleLabel = "concerned";
    tuned.rate = clamp(tuned.rate - 0.07 - intensity * 0.05, 0.85, 1.16);
    tuned.pitch = clamp(tuned.pitch - 0.03 + intensity * 0.02, 0.82, 1.2);
    tuned.volume = clamp(tuned.volume - 0.03, 0.7, 1);
    tuned.preDelayMs += 60;
    return tuned;
  }

  if (matchesEmotion(emotion, ["sad", "hurt", "quiet", "longing"])) {
    tuned.styleLabel = "quiet";
    tuned.rate = clamp(tuned.rate - 0.09 - intensity * 0.06, 0.85, 1.16);
    tuned.pitch = clamp(tuned.pitch - 0.06, 0.82, 1.2);
    tuned.volume = clamp(tuned.volume - 0.05, 0.7, 1);
    tuned.preDelayMs += 90;
    tuned.postDelayMs += 40;
    return tuned;
  }

  return tuned;
}

function applyRelationshipTuning(
  plan: BrowserSpeechPlan,
  relationshipStage: string,
  personaVoiceStyle?: string
): BrowserSpeechPlan {
  const tuned = { ...plan };

  if (relationshipStage === "growing") {
    tuned.rate = clamp(tuned.rate - 0.01, 0.85, 1.16);
    tuned.pitch = clamp(tuned.pitch + 0.01, 0.82, 1.2);
    tuned.volume = clamp(tuned.volume + 0.01, 0.7, 1);
  } else if (relationshipStage === "new") {
    tuned.rate = clamp(tuned.rate - 0.01, 0.85, 1.16);
    tuned.volume = clamp(tuned.volume - 0.02, 0.7, 1);
  }

  if (personaVoiceStyle?.trim()) {
    tuned.voiceLabel = personaVoiceStyle.trim();
  }

  return tuned;
}

function matchesEmotion(emotion: string, candidates: string[]): boolean {
  return candidates.some((candidate) => emotion.includes(candidate));
}

function normalizeLocale(locale: string | undefined): string {
  const normalized = locale?.trim().toLowerCase();

  if (!normalized) {
    return "en-US";
  }

  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }

  return "en-US";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
