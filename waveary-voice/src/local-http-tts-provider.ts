import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";
import type { VoiceOutputFormat } from "./voice-presets.js";

export interface LocalHttpTextToSpeechProviderOptions {
  baseURL: string;
  endpointPath?: string;
  engine?: string;
  voice?: string;
  speaker?: string;
  referenceVoiceId?: string;
  format?: VoiceOutputFormat;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

interface LocalHttpTextToSpeechBody {
  text: string;
  locale?: string;
  relationshipStage?: string;
  personaTone?: string;
  personaVoiceStyle?: string;
  emotion?: TextToSpeechRequest["emotion"];
  engine?: string;
  voice?: string;
  speaker?: string;
  referenceVoiceId?: string;
  format?: VoiceOutputFormat;
}

interface LocalHttpJsonAudioResponse {
  provider?: string;
  mimeType?: string;
  audioBase64?: string;
  base64Audio?: string;
  data?: string;
  audio?: {
    base64?: string;
    mimeType?: string;
  };
  metadata?: {
    model?: string;
    voice?: string;
  };
}

const DEFAULT_ENDPOINT_PATH = "/tts";

export class LocalHttpTextToSpeechProvider implements TextToSpeechProvider {
  private readonly baseURL: string;
  private readonly endpointPath: string;
  private readonly engine: string;
  private readonly voice: string;
  private readonly speaker: string;
  private readonly referenceVoiceId: string;
  private readonly format: VoiceOutputFormat;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: LocalHttpTextToSpeechProviderOptions) {
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.endpointPath = normalizeEndpointPath(options.endpointPath);
    this.engine = options.engine?.trim() || "generic";
    this.voice = options.voice?.trim() || "";
    this.speaker = options.speaker?.trim() || "";
    this.referenceVoiceId = options.referenceVoiceId?.trim() || "";
    this.format = options.format ?? "mp3";
    this.apiKey = options.apiKey?.trim() || "";
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.baseURL) {
      throw new Error("A local voice base URL is required for self-hosted TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const response = await this.fetchFn(`${this.baseURL}${this.endpointPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify(this.buildBody(request))
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const suffix = errorBody ? ` Body: ${errorBody}` : "";
      throw new Error(`Local TTS request failed with status ${response.status}.${suffix}`);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";

    if (contentType.includes("application/json")) {
      return this.readJsonAudioResponse(await response.text());
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    if (audioBuffer.length === 0) {
      throw new Error("Local TTS bridge returned an empty audio payload.");
    }

    return {
      provider: `local:${this.engine}`,
      mode: "audio",
      audio: {
        mimeType: contentType || resolveMimeType(this.format),
        base64: audioBuffer.toString("base64")
      },
      metadata: {
        model: this.engine,
        voice: this.resolveMetadataVoice()
      }
    } satisfies AudioSpeechResult;
  }

  private buildBody(request: TextToSpeechRequest): LocalHttpTextToSpeechBody {
    return {
      text: request.text.trim(),
      ...(request.locale ? { locale: request.locale } : {}),
      ...(request.relationshipStage ? { relationshipStage: request.relationshipStage } : {}),
      ...(request.personaTone ? { personaTone: request.personaTone } : {}),
      ...(request.personaVoiceStyle ? { personaVoiceStyle: request.personaVoiceStyle } : {}),
      ...(request.emotion ? { emotion: request.emotion } : {}),
      engine: this.engine,
      ...(this.voice ? { voice: this.voice } : {}),
      ...(this.speaker ? { speaker: this.speaker } : {}),
      ...(this.referenceVoiceId ? { referenceVoiceId: this.referenceVoiceId } : {}),
      format: this.format
    };
  }

  private readJsonAudioResponse(rawText: string): AudioSpeechResult {
    const parsed = JSON.parse(rawText) as LocalHttpJsonAudioResponse;
    const base64 =
      parsed.audio?.base64?.trim() ||
      parsed.audioBase64?.trim() ||
      parsed.base64Audio?.trim() ||
      parsed.data?.trim() ||
      "";

    if (!base64) {
      throw new Error("Local TTS bridge JSON response did not include audio data.");
    }

    return {
      provider: parsed.provider?.trim() || `local:${this.engine}`,
      mode: "audio",
      audio: {
        mimeType:
          parsed.audio?.mimeType?.trim() ||
          parsed.mimeType?.trim() ||
          resolveMimeType(this.format),
        base64
      },
      metadata: {
        model: parsed.metadata?.model?.trim() || this.engine,
        voice: parsed.metadata?.voice?.trim() || this.resolveMetadataVoice()
      }
    } satisfies AudioSpeechResult;
  }

  private resolveMetadataVoice(): string {
    return this.voice || this.speaker || this.referenceVoiceId || "default";
  }
}

function normalizeEndpointPath(value?: string): string {
  const normalized = value?.trim() || DEFAULT_ENDPOINT_PATH;
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
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
