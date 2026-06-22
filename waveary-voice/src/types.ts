export interface VoiceEmotionHint {
  primaryEmotion?: string;
  intensity?: number;
  modifiers?: string[];
}

export interface TextToSpeechRequest {
  text: string;
  locale?: string;
  relationshipStage?: string;
  personaTone?: string;
  personaVoiceStyle?: string;
  emotion?: VoiceEmotionHint;
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

export interface TextToSpeechResult {
  provider: "waveary-browser-speech-planner";
  plan: BrowserSpeechPlan;
}

export interface TextToSpeechProvider {
  synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
}
