import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";

export interface DoubaoTextToSpeechProviderOptions {
  apiKey: string;
  voiceType: string;
  resourceId?: string;
  host?: string;
  fetchFn?: typeof fetch;
}

interface DoubaoUnidirectionalRequest {
  user: {
    uid: string;
  };
  req_params: {
    text: string;
    speaker: string;
    additions: string;
    audio_params: {
      format: "mp3";
      sample_rate: number;
    };
  };
}

interface DoubaoUnidirectionalResponse {
  reqid?: string;
  code?: number;
  message?: string;
  data?: string;
}

const DEFAULT_HOST = "https://openspeech.bytedance.com";
const DEFAULT_RESOURCE_ID = "volc.service_type.10029";
const DEFAULT_SAMPLE_RATE = 24000;

export class DoubaoTextToSpeechProvider implements TextToSpeechProvider {
  private readonly apiKey: string;
  private readonly voiceType: string;
  private readonly resourceId: string;
  private readonly host: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: DoubaoTextToSpeechProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.voiceType = options.voiceType.trim();
    this.resourceId = options.resourceId?.trim() || DEFAULT_RESOURCE_ID;
    this.host = options.host?.replace(/\/+$/, "") || DEFAULT_HOST;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("A Doubao API key is required for provider-backed TTS.");
    }

    if (!this.voiceType) {
      throw new Error("A Doubao voice type is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const endpoint = `${this.host}/api/v3/tts/unidirectional`;
    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "X-Api-Resource-Id": this.resourceId,
        "X-Api-Request-Id": crypto.randomUUID(),
        Connection: "keep-alive"
      },
      body: JSON.stringify(buildRequestBody(request, this.voiceType))
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`Doubao TTS request failed with status ${response.status}. Body: ${rawText}`);
    }

    const parsed = JSON.parse(rawText) as DoubaoUnidirectionalResponse;

    if (parsed.code !== undefined && parsed.code !== 0) {
      throw new Error(
        `Doubao TTS returned code ${String(parsed.code)}.${parsed.message ? ` ${parsed.message}` : ""}`
      );
    }

    if (!parsed.data) {
      throw new Error("Doubao TTS response did not include audio data.");
    }

    return {
      provider: "doubao",
      mode: "audio",
      audio: {
        mimeType: "audio/mpeg",
        base64: parsed.data
      },
      metadata: {
        model: "doubao-tts",
        voice: this.voiceType
      }
    } satisfies AudioSpeechResult;
  }
}

function buildRequestBody(
  request: TextToSpeechRequest,
  voiceType: string
): DoubaoUnidirectionalRequest {
  return {
    user: {
      uid: "waveary-local-user"
    },
    req_params: {
      text: request.text.trim(),
      speaker: voiceType,
      additions: JSON.stringify({
        disable_markdown_filter: true,
        enable_language_detector: true,
        enable_latex_tn: true,
        disable_default_bit_rate: true,
        max_length_to_filter_parenthesis: 0,
        cache_config: {
          text_type: 1,
          use_cache: true
        }
      }),
      audio_params: {
        format: "mp3",
        sample_rate: DEFAULT_SAMPLE_RATE
      }
    }
  };
}
