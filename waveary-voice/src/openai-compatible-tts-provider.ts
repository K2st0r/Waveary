import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";
import {
  buildVoiceInstructionParts,
  resolveVoicePreset,
  resolveVoiceSpeed,
  type VoiceOutputFormat,
  type VoiceQualityProfile
} from "./voice-presets.js";

export interface OpenAICompatibleTextToSpeechProviderOptions {
  provider: string;
  apiKey: string;
  baseURL: string;
  model?: string;
  voice?: string;
  format?: VoiceOutputFormat;
  qualityProfile?: VoiceQualityProfile;
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
  private readonly format: VoiceOutputFormat;
  private readonly qualityProfile: VoiceQualityProfile;
  private readonly fetchFn: typeof fetch;

  constructor(options: OpenAICompatibleTextToSpeechProviderOptions) {
    const preset = resolveVoicePreset(options.qualityProfile);
    this.provider = options.provider;
    this.apiKey = options.apiKey.trim();
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.model = options.model?.trim() || preset.model;
    this.voice = options.voice?.trim() || preset.voice;
    this.format = options.format ?? preset.format;
    this.qualityProfile = preset.id;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("An API key is required for provider-backed TTS.");
    }

    if (!this.baseURL) {
      throw new Error("A base URL is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const body = buildSpeechBody(
      request,
      this.model,
      this.voice,
      this.format,
      this.qualityProfile
    );
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
        qualityProfile: this.qualityProfile,
        ...(body.instructions ? { instructions: body.instructions } : {})
      }
    } satisfies AudioSpeechResult;
  }
}

function buildSpeechBody(
  request: TextToSpeechRequest,
  model: string,
  voice: string,
  format: VoiceOutputFormat,
  qualityProfile: VoiceQualityProfile
): OpenAICompatibleTextToSpeechBody {
  const preset = resolveVoicePreset(qualityProfile);
  const body: OpenAICompatibleTextToSpeechBody = {
    model,
    input: request.text.trim(),
    voice
  };

  const speed = resolveVoiceSpeed(request, preset);
  const instructions = buildVoiceInstructionParts(request, preset).join(" ");

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

function resolveMimeType(format: VoiceOutputFormat): string {
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
