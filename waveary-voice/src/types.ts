export interface VoiceEmotionHint {
  primaryEmotion?: string;
  intensity?: number;
  modifiers?: string[];
}

export interface VoiceDeliveryHint {
  style?: "soft" | "warm" | "concerned" | "quiet" | "bright" | "playful" | "steady";
  pace?: "slower" | "steady" | "lighter";
  closeness?: "careful" | "present" | "close";
  expressiveness?: "restrained" | "natural" | "open";
  voiceStyle?: string;
  instruction?: string;
  summary?: string;
}

export interface TextToSpeechRequest {
  text: string;
  locale?: string;
  relationshipStage?: string;
  personaTone?: string;
  personaVoiceStyle?: string;
  emotion?: VoiceEmotionHint;
  delivery?: VoiceDeliveryHint;
}

export interface BrowserSpeechPlan {
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
}

export interface AudioSpeechResult {
  provider: string;
  mode: "audio";
  audio: {
    mimeType: string;
    base64: string;
  };
  metadata: {
    model: string;
    voice: string;
    qualityProfile?: string;
    instructions?: string;
  };
}

export interface BrowserSpeechResult {
  provider: "waveary-browser-speech-planner";
  mode: "browser-speech";
  plan: BrowserSpeechPlan;
}

export type TextToSpeechResult = AudioSpeechResult | BrowserSpeechResult;

export interface TextToSpeechProvider {
  synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
}
