import type {
  SpeechToTextProvider,
  SpeechToTextRequest,
  SpeechToTextResult
} from "./types.js";

export interface OpenAICompatibleSpeechToTextProviderOptions {
  provider: string;
  apiKey: string;
  baseURL: string;
  model?: string;
  fetchFn?: typeof fetch;
}

const DEFAULT_OPENAI_COMPATIBLE_STT_MODEL = "gpt-4o-mini-transcribe";

export class OpenAICompatibleSpeechToTextProvider implements SpeechToTextProvider {
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: OpenAICompatibleSpeechToTextProviderOptions) {
    this.provider = options.provider;
    this.apiKey = options.apiKey.trim();
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.model = options.model?.trim() || DEFAULT_OPENAI_COMPATIBLE_STT_MODEL;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("An API key is required for provider-backed STT.");
    }

    if (!this.baseURL) {
      throw new Error("A base URL is required for provider-backed STT.");
    }
  }

  async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const audioBuffer = Buffer.from(request.audio.base64, "base64");

    if (audioBuffer.length === 0) {
      throw new Error("Speech audio payload is empty.");
    }

    const formData = new FormData();
    formData.set("model", this.model);
    formData.set(
      "file",
      new File([audioBuffer], request.audio.fileName?.trim() || "waveary-input.webm", {
        type: request.audio.mimeType
      })
    );
    formData.set("response_format", "json");

    if (request.language?.trim()) {
      formData.set("language", request.language.trim());
    } else if (request.locale?.trim()) {
      const normalizedLanguage = normalizeLanguageFromLocale(request.locale);

      if (normalizedLanguage) {
        formData.set("language", normalizedLanguage);
      }
    }

    if (request.prompt?.trim()) {
      formData.set("prompt", request.prompt.trim());
    }

    const response = await this.fetchFn(`${this.baseURL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const suffix = errorBody ? ` Body: ${errorBody}` : "";
      throw new Error(`STT request failed with status ${response.status}.${suffix}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const text = resolveTranscriptText(payload);

    if (!text) {
      throw new Error("STT provider returned no transcript text.");
    }

    return {
      provider: this.provider,
      text,
      metadata: buildSpeechToTextMetadata(this.model, resolveLanguage(payload, request))
    };
  }
}

function normalizeLanguageFromLocale(locale: string): string | null {
  const normalized = locale.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const [language] = normalized.split("-");
  return language?.trim() || null;
}

function resolveTranscriptText(payload: Record<string, unknown>): string {
  const candidateKeys = ["text", "transcript"];

  for (const key of candidateKeys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function resolveLanguage(
  payload: Record<string, unknown>,
  request: SpeechToTextRequest
): string | undefined {
  if (typeof payload.language === "string" && payload.language.trim()) {
    return payload.language.trim();
  }

  if (request.language?.trim()) {
    return request.language.trim();
  }

  if (request.locale?.trim()) {
    return normalizeLanguageFromLocale(request.locale) ?? undefined;
  }

  return undefined;
}

function buildSpeechToTextMetadata(model: string, language?: string): {
  model?: string;
  language?: string;
} {
  return {
    model,
    ...(language ? { language } : {})
  };
}
