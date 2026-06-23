import type {
  SpeechToTextProvider,
  SpeechToTextRequest,
  SpeechToTextResult
} from "./types.js";

export interface FishAudioSpeechToTextProviderOptions {
  apiKey: string;
  baseURL: string;
  model?: string;
  fetchFn?: typeof fetch;
}

interface FishAudioSpeechToTextBody {
  audio: string;
  language?: string;
  ignore_timestamps?: boolean;
}

interface FishAudioSpeechToTextResponse {
  text?: string;
  duration?: number;
  segments?: Array<{
    text?: string;
    start?: number;
    end?: number;
  }>;
}

const DEFAULT_FISH_AUDIO_STT_MODEL = "fish-audio-asr";

export class FishAudioSpeechToTextProvider implements SpeechToTextProvider {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: FishAudioSpeechToTextProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.model = options.model?.trim() || DEFAULT_FISH_AUDIO_STT_MODEL;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("A Fish Audio API key is required for provider-backed STT.");
    }

    if (!this.baseURL) {
      throw new Error("A Fish Audio base URL is required for provider-backed STT.");
    }
  }

  async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const audio = request.audio.base64.trim();

    if (!audio) {
      throw new Error("Speech audio payload is empty.");
    }

    const body: FishAudioSpeechToTextBody = {
      audio,
      ignore_timestamps: true
    };
    const normalizedLanguage = resolveLanguage(request);

    if (normalizedLanguage) {
      body.language = normalizedLanguage;
    }

    let response: Response;

    try {
      response = await this.fetchFn(`${this.baseURL}/v1/asr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });
    } catch (error) {
      throw new Error(buildFishAudioFetchFailureMessage("STT", error), {
        cause: error
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      const suffix = errorBody ? ` Body: ${errorBody}` : "";
      throw new Error(`Fish Audio STT request failed with status ${response.status}.${suffix}`);
    }

    const payload = (await response.json()) as FishAudioSpeechToTextResponse;
    const text = payload.text?.trim();

    if (!text) {
      throw new Error("Fish Audio STT returned no transcript text.");
    }

    return {
      provider: "fish-audio",
      text,
      metadata: {
        model: this.model,
        ...(normalizedLanguage ? { language: normalizedLanguage } : {})
      }
    };
  }
}

function resolveLanguage(request: SpeechToTextRequest): string | undefined {
  if (request.language?.trim()) {
    return request.language.trim().toLowerCase();
  }

  const normalizedLocale = request.locale?.trim().toLowerCase();

  if (!normalizedLocale) {
    return undefined;
  }

  const [language] = normalizedLocale.split("-");
  return language?.trim() || undefined;
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
