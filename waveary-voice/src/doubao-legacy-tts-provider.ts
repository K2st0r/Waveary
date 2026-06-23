import { randomUUID } from "node:crypto";

import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";

export interface DoubaoLegacyTextToSpeechProviderOptions {
  accessToken: string;
  appId: string;
  voiceType: string;
  cluster?: string;
  host?: string;
  fetchFn?: typeof fetch;
}

interface DoubaoLegacySubmitRequest {
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
      speed_ratio: number;
      volume_ratio: number;
      pitch_ratio: number;
  };
  request: {
    reqid: string;
    text: string;
    text_type: "plain";
    operation: "query";
  };
}

interface DoubaoLegacySubmitResponse {
  code?: number;
  message?: string;
  data?: string;
}

const DEFAULT_CLUSTER = "volcano_tts";
const DEFAULT_HOST = "https://openspeech.bytedance.com";

export class DoubaoLegacyTextToSpeechProvider implements TextToSpeechProvider {
  private readonly accessToken: string;
  private readonly appId: string;
  private readonly voiceType: string;
  private readonly cluster: string;
  private readonly host: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: DoubaoLegacyTextToSpeechProviderOptions) {
    this.accessToken = options.accessToken.trim();
    this.appId = options.appId.trim();
    this.voiceType = options.voiceType.trim();
    this.cluster = options.cluster?.trim() || DEFAULT_CLUSTER;
    this.host = options.host?.replace(/\/+$/, "") || DEFAULT_HOST;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.accessToken) {
      throw new Error("A Doubao legacy access token is required for provider-backed TTS.");
    }

    if (!this.appId) {
      throw new Error("A Doubao legacy app ID is required for provider-backed TTS.");
    }

    if (!this.voiceType) {
      throw new Error("A Doubao legacy voice type is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const endpoint = `${this.host}/api/v1/tts`;
    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer;${this.accessToken}`
      },
      body: JSON.stringify(
        buildSubmitBody(request, this.appId, this.accessToken, this.cluster, this.voiceType)
      )
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Doubao legacy TTS request failed with status ${response.status}. Body: ${rawText}`
      );
    }

    const parsed = JSON.parse(rawText) as DoubaoLegacySubmitResponse;

    if (parsed.code !== undefined && parsed.code !== 3000) {
      throw new Error(
        `Doubao legacy TTS returned code ${String(parsed.code)}.${parsed.message ? ` ${parsed.message}` : ""}`
      );
    }

    if (!parsed.data) {
      throw new Error("Doubao legacy TTS response did not include audio data.");
    }

    return {
      provider: "doubao-legacy",
      mode: "audio",
      audio: {
        mimeType: "audio/mpeg",
        base64: parsed.data
      },
      metadata: {
        model: "doubao-legacy-tts",
        voice: this.voiceType
      }
    } satisfies AudioSpeechResult;
  }
}

function buildSubmitBody(
  request: TextToSpeechRequest,
  appId: string,
  accessToken: string,
  cluster: string,
  voiceType: string
): DoubaoLegacySubmitRequest {
  return {
    app: {
      appid: appId,
      token: accessToken,
      cluster
    },
    user: {
      uid: "waveary-local-user"
    },
    audio: {
      voice_type: voiceType,
      encoding: "mp3",
      speed_ratio: resolveSpeedRatio(request),
      volume_ratio: 1,
      pitch_ratio: 1
    },
    request: {
      reqid: randomUUID(),
      text: request.text.trim(),
      text_type: "plain",
      operation: "query"
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
