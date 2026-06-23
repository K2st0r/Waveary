import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";
import {
  resolveVoicePreset,
  resolveVoiceSpeed,
  type VoiceOutputFormat,
  type VoiceQualityProfile
} from "./voice-presets.js";

export interface FishAudioTextToSpeechProviderOptions {
  apiKey: string;
  baseURL: string;
  model?: string;
  referenceId?: string;
  format?: VoiceOutputFormat;
  qualityProfile?: VoiceQualityProfile;
  fetchFn?: typeof fetch;
}

interface FishAudioTextToSpeechBody {
  text: string;
  reference_id: string;
  format?: "wav" | "pcm" | "mp3" | "opus";
  temperature?: number;
  top_p?: number;
  prosody?: {
    speed?: number;
  };
  normalize?: boolean;
}

const DEFAULT_FISH_AUDIO_MODEL = "s2-pro";
const DEFAULT_FISH_AUDIO_FORMAT = "mp3";
const DEFAULT_FISH_AUDIO_TOP_P = 0.7;

export class FishAudioTextToSpeechProvider implements TextToSpeechProvider {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly referenceId: string;
  private readonly format: "wav" | "pcm" | "mp3" | "opus";
  private readonly qualityProfile: VoiceQualityProfile;
  private readonly fetchFn: typeof fetch;

  constructor(options: FishAudioTextToSpeechProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.model = normalizeFishAudioModel(options.model);
    this.referenceId = options.referenceId?.trim() || "";
    this.format = normalizeFishAudioFormat(options.format);
    this.qualityProfile = options.qualityProfile ?? "cinematic";
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("A Fish Audio API key is required for provider-backed TTS.");
    }

    if (!this.baseURL) {
      throw new Error("A Fish Audio base URL is required for provider-backed TTS.");
    }

    if (!this.referenceId) {
      throw new Error("A Fish Audio voice model ID is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const body = this.buildBody(request);
    let response: Response;

    try {
      response = await this.fetchFn(`${this.baseURL}/v1/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          model: this.model
        },
        body: JSON.stringify(body)
      });
    } catch (error) {
      throw new Error(buildFishAudioFetchFailureMessage("TTS", error), {
        cause: error
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      const suffix = errorBody ? ` Body: ${errorBody}` : "";
      throw new Error(`Fish Audio TTS request failed with status ${response.status}.${suffix}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    if (audioBuffer.length === 0) {
      throw new Error("Fish Audio TTS returned an empty audio payload.");
    }

    return {
      provider: "fish-audio",
      mode: "audio",
      audio: {
        mimeType: resolveMimeType(this.format),
        base64: audioBuffer.toString("base64")
      },
      metadata: {
        model: this.model,
        voice: this.referenceId,
        qualityProfile: this.qualityProfile
      }
    } satisfies AudioSpeechResult;
  }

  private buildBody(request: TextToSpeechRequest): FishAudioTextToSpeechBody {
    const speed = resolveVoiceSpeed(request, resolveVoicePreset(this.qualityProfile));
    const temperature = resolveTemperature(request);
    const body: FishAudioTextToSpeechBody = {
      text: request.text.trim(),
      reference_id: this.referenceId,
      normalize: true
    };

    if (this.format !== DEFAULT_FISH_AUDIO_FORMAT) {
      body.format = this.format;
    }

    if (speed !== 1) {
      body.prosody = {
        speed
      };
    }

    if (temperature !== 0.7) {
      body.temperature = temperature;
    }

    body.top_p = DEFAULT_FISH_AUDIO_TOP_P;
    return body;
  }
}

function normalizeFishAudioModel(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized === "s1" || normalized === "s2-pro" ? normalized : DEFAULT_FISH_AUDIO_MODEL;
}

function normalizeFishAudioFormat(
  value: VoiceOutputFormat | undefined
): "wav" | "pcm" | "mp3" | "opus" {
  if (value === "wav" || value === "pcm" || value === "mp3" || value === "opus") {
    return value;
  }

  return DEFAULT_FISH_AUDIO_FORMAT;
}

function resolveTemperature(request: TextToSpeechRequest): number {
  const intensity = request.emotion?.intensity ?? 0;
  const expressiveness = request.delivery?.expressiveness;
  const style = request.delivery?.style;
  let temperature = 0.7;

  if (expressiveness === "open") {
    temperature += 0.08;
  } else if (expressiveness === "restrained") {
    temperature -= 0.08;
  }

  if (style === "playful" || style === "bright") {
    temperature += 0.05;
  } else if (style === "quiet" || style === "concerned") {
    temperature -= 0.04;
  }

  temperature += Math.max(-0.05, Math.min(0.08, (intensity - 0.5) * 0.12));
  return Math.max(0.35, Math.min(0.9, Number(temperature.toFixed(2))));
}

function resolveMimeType(format: "wav" | "pcm" | "mp3" | "opus"): string {
  if (format === "wav") {
    return "audio/wav";
  }

  if (format === "pcm") {
    return "audio/pcm";
  }

  if (format === "opus") {
    return "audio/opus";
  }

  return "audio/mpeg";
}

function buildFishAudioFetchFailureMessage(
  operation: "TTS" | "STT" | "catalog",
  error: unknown
): string {
  const cause = extractErrorCause(error);
  const code = readErrorCode(cause);
  const causeMessage = readErrorMessage(cause);
  const details = [
    code ? `Code: ${code}.` : "",
    causeMessage ? `Cause: ${causeMessage}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (details) {
    return `Fish Audio ${operation} request could not reach the upstream service. ${details}`.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return `Fish Audio ${operation} request failed before a response was received. Cause: ${error.message.trim()}`;
  }

  return `Fish Audio ${operation} request failed before a response was received.`;
}

function extractErrorCause(error: unknown): unknown {
  if (error instanceof Error && "cause" in error) {
    return (error as Error & { cause?: unknown }).cause;
  }

  return undefined;
}

function readErrorCode(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code?: unknown }).code === "string"
  ) {
    return (value as { code: string }).code;
  }

  return null;
}

function readErrorMessage(value: unknown): string | null {
  if (value instanceof Error && value.message.trim()) {
    return value.message.trim();
  }

  return null;
}
