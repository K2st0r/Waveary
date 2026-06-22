import { randomUUID } from "node:crypto";

import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";

export interface DoubaoTextToSpeechProviderOptions {
  apiKey: string;
  appId: string;
  voiceType: string;
  cluster?: string;
  host?: string;
  fetchFn?: typeof fetch;
}

interface DoubaoSubmitRequest {
  app: {
    appid: string;
    token: string;
    cluster: string;
  };
  user: {
    uid: string;
  };
  audio: {
    voice_type: string;
    encoding: "mp3";
    speed_ratio?: number;
    volume_ratio?: number;
  };
  request: {
    reqid: string;
    text: string;
    text_type: "plain";
    operation: "submit";
  };
}

interface DoubaoSubmitResponse {
  code?: number;
  message?: string;
  data?: string;
}

const DEFAULT_CLUSTER = "volcano_tts";
const DEFAULT_HOST = "https://openspeech.bytedance.com";

export class DoubaoTextToSpeechProvider implements TextToSpeechProvider {
  private readonly apiKey: string;
  private readonly appId: string;
  private readonly voiceType: string;
  private readonly cluster: string;
  private readonly host: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: DoubaoTextToSpeechProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.appId = options.appId.trim();
    this.voiceType = options.voiceType.trim();
    this.cluster = options.cluster?.trim() || DEFAULT_CLUSTER;
    this.host = options.host?.replace(/\/+$/, "") || DEFAULT_HOST;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("A Doubao API key is required for provider-backed TTS.");
    }

    if (!this.appId) {
      throw new Error("A Doubao appId is required for provider-backed TTS.");
    }

    if (!this.voiceType) {
      throw new Error("A Doubao voice type is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const endpoint = `${this.host}/api/v1/tts`;
    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer;${this.apiKey}`
      },
      body: JSON.stringify(buildSubmitBody(request, this.appId, this.cluster, this.voiceType))
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`Doubao TTS request failed with status ${response.status}. Body: ${rawText}`);
    }

    const parsed = JSON.parse(rawText) as DoubaoSubmitResponse;

    if (parsed.code !== undefined && parsed.code !== 3000) {
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

function buildSubmitBody(
  request: TextToSpeechRequest,
  appId: string,
  cluster: string,
  voiceType: string
): DoubaoSubmitRequest {
  return {
    app: {
      appid: appId,
      token: "access_token",
      cluster
    },
    user: {
      uid: "waveary-user"
    },
    audio: {
      voice_type: voiceType,
      encoding: "mp3",
      speed_ratio: resolveSpeedRatio(request),
      volume_ratio: 1
    },
    request: {
      reqid: randomUUID(),
      text: request.text.trim(),
      text_type: "plain",
      operation: "submit"
    }
  };
}

function resolveSpeedRatio(request: TextToSpeechRequest): number {
  const emotion = request.emotion?.primaryEmotion?.toLowerCase() ?? "";

  if (emotion.includes("sad") || emotion.includes("concerned") || emotion.includes("quiet")) {
    return 0.92;
  }

  if (emotion.includes("playful") || emotion.includes("happy")) {
    return 1.04;
  }

  return 1;
}
