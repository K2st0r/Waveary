import type {
  ChatProvider,
  ChatProviderRequest,
  ModelDescriptor,
  ModelDiscoveryProvider
} from "../providers/interfaces.js";

export interface OpenAICompatibleProviderOptions {
  provider: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  fetchFn?: typeof fetch;
}

interface OpenAICompatibleModelResponse {
  data?: Array<{
    id: string;
  }>;
}

interface OpenAICompatibleResponsePayload {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

interface OpenAICompatibleChatCompletionsPayload {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
}

export class OpenAICompatibleChatProvider implements ChatProvider, ModelDiscoveryProvider {
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: OpenAICompatibleProviderOptions) {
    const apiKey = options.apiKey ?? process.env.WAVEARY_API_KEY;
    const baseURL = options.baseURL ?? process.env.WAVEARY_BASE_URL;
    const model = options.model ?? process.env.WAVEARY_MODEL;

    if (!apiKey) {
      throw new Error("An API key is required for OpenAI-compatible providers.");
    }

    if (!baseURL) {
      throw new Error("A baseURL is required for OpenAI-compatible providers.");
    }

    if (!model) {
      throw new Error("A model is required for OpenAI-compatible providers.");
    }

    this.provider = options.provider;
    this.apiKey = apiKey;
    this.baseURL = baseURL.replace(/\/+$/, "");
    this.model = model;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async generateReply(request: ChatProviderRequest): Promise<string> {
    const chatCompletionsResponse = await this.fetchFn(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: buildDeveloperInstruction(request)
          },
          ...request.messages.map((message) => ({
            role: toCompatibleRole(message.role),
            content: message.content
          }))
        ]
      })
    });

    if (chatCompletionsResponse.ok) {
      const payload =
        (await chatCompletionsResponse.json()) as OpenAICompatibleChatCompletionsPayload;
      const text = extractChatCompletionsText(payload);

      if (!text) {
        throw new Error("Provider response did not include usable text output.");
      }

      return text;
    }

    if (chatCompletionsResponse.status !== 404 && chatCompletionsResponse.status !== 405) {
      throw await this.createProviderError(chatCompletionsResponse);
    }

    const response = await this.fetchFn(`${this.baseURL}/responses`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "developer",
            content: buildDeveloperInstruction(request)
          },
          ...request.messages.map((message) => ({
            role: toCompatibleRole(message.role),
            content: message.content
          }))
        ]
      })
    });

    if (!response.ok) {
      throw await this.createProviderError(response);
    }

    const payload = (await response.json()) as OpenAICompatibleResponsePayload;
    const text = extractResponseText(payload);

    if (!text) {
      throw new Error("Provider response did not include usable text output.");
    }

    return text;
  }

  async listModels(): Promise<ModelDescriptor[]> {
    const response = await this.fetchFn(`${this.baseURL}/models`, {
      method: "GET",
      headers: this.buildHeaders()
    });

    if (!response.ok) {
      throw new Error(`Model listing failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as OpenAICompatibleModelResponse;

    return (payload.data ?? []).map((model) => ({
      id: model.id,
      provider: this.provider
    }));
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
  }

  private async createProviderError(response: Response): Promise<Error> {
    const body = await response.text();
    const suffix = body ? ` Body: ${body}` : "";
    return new Error(`Provider request failed with status ${response.status}.${suffix}`);
  }
}

export interface ProviderPreset {
  id: string;
  label: string;
  baseURL: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1"
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1"
  },
  {
    id: "dashscope",
    label: "Alibaba DashScope",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  },
  {
    id: "volcengine-ark",
    label: "Volcengine Ark",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3"
  },
  {
    id: "siliconflow",
    label: "SiliconFlow",
    baseURL: "https://api.siliconflow.cn/v1"
  }
];

export function resolveProviderPreset(providerId: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((preset) => preset.id === providerId);
}

function buildDeveloperInstruction(request: ChatProviderRequest): string {
  const memoryBlock =
    request.relevantMemories.length > 0
      ? request.relevantMemories.map((memory, index) => `${index + 1}. ${memory.content}`).join("\n")
      : "None";
  const timelineBlock =
    request.timeline.length > 0
      ? request.timeline
          .map((event, index) => `${index + 1}. ${event.eventTime}: ${event.title}`)
          .join("\n")
      : "None";

  return [
    `You are ${request.persona.name}, a long-term digital life companion.`,
    `Tone: ${request.persona.tone}.`,
    `Relationship style: ${request.persona.relationshipStyle}.`,
    `User: ${request.user.displayName}.`,
    `Relationship stage: ${request.relationship.stage}.`,
    `Relevant memories:\n${memoryBlock}`,
    `Timeline context:\n${timelineBlock}`,
    request.emotion
      ? `Current detected emotion: ${request.emotion.primaryEmotion} (${request.emotion.intensity}).`
      : "Current detected emotion: unknown.",
    "Respond warmly, naturally, and with continuity. Keep memory and relationship in mind."
  ].join("\n\n");
}

function extractResponseText(payload: OpenAICompatibleResponsePayload): string | undefined {
  if (payload.output_text) {
    return payload.output_text;
  }

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text" || item.type === "text")
    ?.text;
}

function extractChatCompletionsText(
  payload: OpenAICompatibleChatCompletionsPayload
): string | undefined {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  return content?.find((item) => item.type === "output_text" || item.type === "text")?.text;
}

function toCompatibleRole(role: "system" | "user" | "assistant"): "system" | "developer" | "user" | "assistant" {
  if (role === "system") {
    return "system";
  }

  return role;
}
