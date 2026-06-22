import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";

export interface OpenAICompatibleTextToSpeechProviderOptions {
  provider: string;
  apiKey: string;
  baseURL: string;
  model?: string;
  voice?: string;
  format?: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm";
  fetchFn?: typeof fetch;
}

interface OpenAICompatibleTextToSpeechBody {
  model: string;
  input: string;
  voice: string;
  response_format?: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm";
  speed?: number;
  instructions?: string;
}

export class OpenAICompatibleTextToSpeechProvider implements TextToSpeechProvider {
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly voice: string;
  private readonly format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm";
  private readonly fetchFn: typeof fetch;

  constructor(options: OpenAICompatibleTextToSpeechProviderOptions) {
    this.provider = options.provider;
    this.apiKey = options.apiKey.trim();
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.model = options.model?.trim() || "gpt-4o-mini-tts";
    this.voice = options.voice?.trim() || "alloy";
    this.format = options.format ?? "mp3";
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("An API key is required for provider-backed TTS.");
    }

    if (!this.baseURL) {
      throw new Error("A base URL is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const body = buildSpeechBody(request, this.model, this.voice, this.format);
    const response = await this.fetchFn(`${this.baseURL}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const suffix = errorBody ? ` Body: ${errorBody}` : "";
      throw new Error(`TTS request failed with status ${response.status}.${suffix}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    if (audioBuffer.length === 0) {
      throw new Error("TTS provider returned an empty audio payload.");
    }

    return {
      provider: this.provider,
      mode: "audio",
      audio: {
        mimeType: resolveMimeType(this.format),
        base64: audioBuffer.toString("base64")
      },
      metadata: {
        model: this.model,
        voice: this.voice,
        ...(body.instructions ? { instructions: body.instructions } : {})
      }
    } satisfies AudioSpeechResult;
  }
}

function buildSpeechBody(
  request: TextToSpeechRequest,
  model: string,
  voice: string,
  format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"
): OpenAICompatibleTextToSpeechBody {
  const body: OpenAICompatibleTextToSpeechBody = {
    model,
    input: request.text.trim(),
    voice
  };

  const speed = resolveSpeechSpeed(request);
  const instructions = buildSpeechInstructions(request);

  if (format !== "mp3") {
    body.response_format = format;
  }

  if (speed !== 1) {
    body.speed = speed;
  }

  if (instructions) {
    body.instructions = instructions;
  }

  return body;
}

function resolveSpeechSpeed(request: TextToSpeechRequest): number {
  const emotion = request.emotion?.primaryEmotion?.toLowerCase() ?? "";
  const intensity = clamp(request.emotion?.intensity ?? 0.55, 0, 1);
  const relationshipStage = request.relationshipStage?.toLowerCase() ?? "new";
  let speed = 1;

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

  return Number(clamp(speed, 0.78, 1.18).toFixed(2));
}

function buildSpeechInstructions(request: TextToSpeechRequest): string | undefined {
  const emotion = request.emotion?.primaryEmotion?.toLowerCase() ?? "calm";
  const relationshipStage = request.relationshipStage?.toLowerCase() ?? "new";
  const tone = request.personaTone?.trim();
  const voiceStyle = request.personaVoiceStyle?.trim();
  const styleParts = [
    "Sound like a warm, emotionally present companion.",
    describeEmotionStyle(emotion),
    describeRelationshipStyle(relationshipStage),
    tone ? `Overall persona tone: ${tone}.` : null,
    voiceStyle ? `Preferred voice style: ${voiceStyle}.` : null,
    "Keep the pacing natural and human, with subtle softness instead of announcer energy."
  ].filter((part): part is string => Boolean(part));

  return styleParts.length > 0 ? styleParts.join(" ") : undefined;
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

function resolveMimeType(format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"): string {
  if (format === "wav") {
    return "audio/wav";
  }

  if (format === "opus") {
    return "audio/opus";
  }

  if (format === "aac") {
    return "audio/aac";
  }

  if (format === "flac") {
    return "audio/flac";
  }

  if (format === "pcm") {
    return "audio/pcm";
  }

  return "audio/mpeg";
}
