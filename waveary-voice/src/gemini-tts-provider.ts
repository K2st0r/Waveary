import type {
  AudioSpeechResult,
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResult
} from "./types.js";
import { buildVoiceInstructionParts, resolveVoicePreset, type VoiceQualityProfile } from "./voice-presets.js";

export interface GeminiTextToSpeechProviderOptions {
  apiKey: string;
  baseURL: string;
  model?: string;
  voice?: string;
  qualityProfile?: VoiceQualityProfile;
  fetchFn?: typeof fetch;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
}

interface GeminiGenerateContentBody {
  contents: Array<{
    role: "user";
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    responseModalities: ["AUDIO"];
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: string;
        };
      };
    };
  };
}

const DEFAULT_GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
const DEFAULT_GEMINI_VOICE = "Kore";

export class GeminiTextToSpeechProvider implements TextToSpeechProvider {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly voice: string;
  private readonly qualityProfile: VoiceQualityProfile;
  private readonly fetchFn: typeof fetch;

  constructor(options: GeminiTextToSpeechProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.model = options.model?.trim() || DEFAULT_GEMINI_TTS_MODEL;
    this.voice = options.voice?.trim() || DEFAULT_GEMINI_VOICE;
    this.qualityProfile = resolveVoicePreset(options.qualityProfile).id;
    this.fetchFn = options.fetchFn ?? fetch;

    if (!this.apiKey) {
      throw new Error("A Gemini API key is required for provider-backed TTS.");
    }

    if (!this.baseURL) {
      throw new Error("A Gemini base URL is required for provider-backed TTS.");
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const body = buildGeminiSpeechBody(request, this.voice, this.qualityProfile);
    const response = await this.fetchFn(
      `${this.baseURL}/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const suffix = errorBody ? ` Body: ${errorBody}` : "";
      throw new Error(`Gemini TTS request failed with status ${response.status}.${suffix}`);
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const inlineData = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
    const audioBase64 = inlineData?.data?.trim();
    const mimeType = inlineData?.mimeType?.trim() || "audio/wav";

    if (!audioBase64) {
      throw new Error("Gemini TTS returned no inline audio payload.");
    }

    return {
      provider: "gemini",
      mode: "audio",
      audio: {
        mimeType,
        base64: audioBase64
      },
      metadata: {
        model: this.model,
        voice: this.voice,
        qualityProfile: this.qualityProfile,
        instructions: body.contents[0]?.parts[0]?.text ?? ""
      }
    } satisfies AudioSpeechResult;
  }
}

function buildGeminiSpeechBody(
  request: TextToSpeechRequest,
  voice: string,
  qualityProfile: VoiceQualityProfile
): GeminiGenerateContentBody {
  const preset = resolveVoicePreset(qualityProfile);
  const styleParts = buildVoiceInstructionParts(request, preset);
  const prompt = [
    "Read the following text exactly as written.",
    ...styleParts,
    `Text: ${request.text.trim()}`
  ].join(" ");

  return {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice
          }
        }
      }
    }
  };
}
