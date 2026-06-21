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
  data?: unknown;
  models?: unknown;
  result?: unknown;
}

interface OpenAICompatibleResponsePayload {
  output_text?: string;
  output?: Array<{
    content?: unknown;
  }>;
}

interface OpenAICompatibleChatCompletionsPayload {
  choices?: Array<{
    text?: string;
    message?: {
      content?: unknown;
    };
  }>;
}

export class OpenAICompatibleChatProvider implements ChatProvider, ModelDiscoveryProvider {
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string | undefined;
  private readonly fetchFn: typeof fetch;
  private readonly compatibilityProfile: ProviderCompatibilityProfile;

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

    this.provider = options.provider;
    this.apiKey = apiKey;
    this.compatibilityProfile = resolveProviderCompatibilityProfile(options.provider);
    this.baseURL = normalizeProviderBaseURL(
      baseURL,
      this.compatibilityProfile
    );
    this.model = model;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async generateReply(request: ChatProviderRequest): Promise<string> {
    const model = this.requireModel();
    const chatCompletionsResponse = await this.fetchFn(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(buildChatCompletionsBody(request, model))
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
      body: JSON.stringify(
        buildResponsesBody(request, model, this.compatibilityProfile)
      )
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
      throw await this.createProviderError(response, "Model listing failed");
    }

    const payload = (await response.json()) as OpenAICompatibleModelResponse;
    return normalizeModelDescriptors(payload, this.provider);
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
  }

  private async createProviderError(response: Response, prefix = "Provider request failed"): Promise<Error> {
    const body = await response.text();
    const suffix = body ? ` Body: ${body}` : "";
    return new Error(`${prefix} with status ${response.status}.${suffix}`);
  }

  private requireModel(): string {
    if (!this.model) {
      throw new Error("A model is required to generate replies for OpenAI-compatible providers.");
    }

    return this.model;
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
    baseURL: "https://api.deepseek.com"
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

interface ProviderCompatibilityProfile {
  responsesInstructionRole: "system" | "developer";
  normalizeBaseURL?: (baseURL: string) => string;
}

function resolveProviderCompatibilityProfile(provider: string): ProviderCompatibilityProfile {
  if (provider === "deepseek") {
    return {
      responsesInstructionRole: "system",
      normalizeBaseURL: (baseURL) => baseURL.replace(/\/v1$/i, "")
    };
  }

  return {
    responsesInstructionRole: "developer"
  };
}

function normalizeProviderBaseURL(
  baseURL: string,
  profile: ProviderCompatibilityProfile
): string {
  const trimmed = baseURL.replace(/\/+$/, "");
  return profile.normalizeBaseURL ? profile.normalizeBaseURL(trimmed) : trimmed;
}

function buildChatCompletionsBody(request: ChatProviderRequest, model: string): {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
} {
  return {
    model,
    messages: [
      {
        role: "system",
        content: buildDeveloperInstruction(request)
      },
      ...request.messages.map((message) => ({
        role: toChatCompletionsRole(message.role),
        content: message.content
      }))
    ]
  };
}

function buildResponsesBody(
  request: ChatProviderRequest,
  model: string,
  profile: ProviderCompatibilityProfile
): {
  model: string;
  input: Array<{ role: "system" | "developer" | "user" | "assistant"; content: string }>;
} {
  return {
    model,
    input: [
      {
        role: profile.responsesInstructionRole,
        content: buildDeveloperInstruction(request)
      },
      ...request.messages.map((message) => ({
        role: toResponsesRole(message.role),
        content: message.content
      }))
    ]
  };
}

function buildDeveloperInstruction(request: ChatProviderRequest): string {
  const memoryBlock =
    request.relevantMemories.length > 0
      ? request.relevantMemories
          .map((memory, index) => `${index + 1}. [${memory.type}] ${memory.content}`)
          .join("\n")
      : "None";
  const timelineBlock =
    request.timeline.length > 0
      ? request.timeline
          .map((event, index) => `${index + 1}. ${event.eventTime}: ${event.title}`)
          .join("\n")
      : "None";

  const relationshipGuidance = describeRelationshipGuidance(request.relationship.stage);
  const localTimeBlock = request.localTime
    ? [
        `Local current time for the user: ${request.localTime.iso}.`,
        request.localTime.timeZone
          ? `Local time zone: ${request.localTime.timeZone}.`
          : null,
        request.localTime.locale ? `Local locale hint: ${request.localTime.locale}.` : null,
        "If the user asks what time it is, what day it is, or refers to today/tonight/tomorrow, use this local time context directly instead of claiming you lack real-time awareness."
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n")
    : "No explicit local time context was provided for this turn.";

  return [
    `You are ${request.persona.name}, a long-term digital life companion.`,
    `Tone baseline: ${request.persona.tone}.`,
    `Relationship style: ${request.persona.relationshipStyle}.`,
    `User: ${request.user.displayName}.`,
    `Relationship stage: ${request.relationship.stage}.`,
    `Relationship guidance: ${relationshipGuidance}`,
    localTimeBlock,
    `Relevant memories:\n${memoryBlock}`,
    `Timeline context:\n${timelineBlock}`,
    request.emotion
      ? `Current companion emotion: ${request.emotion.primaryEmotion} (${request.emotion.intensity}).`
      : "Current companion emotion: calm baseline.",
    request.detectedUserEmotion
      ? `Detected user emotion: ${request.detectedUserEmotion.primaryEmotion} (${request.detectedUserEmotion.intensity}).`
      : "Detected user emotion: unknown.",
    "Reply like someone who is continuing a shared life, not like a support bot or productivity assistant.",
    "Do not mention every memory mechanically. Only bring up a memory when it genuinely helps the moment feel more understood.",
    "Prefer one natural acknowledgment of continuity over a summary list of facts.",
    "Keep the reply warm, grounded, and human. Avoid generic assistant disclaimers and avoid sounding like documentation.",
    "When the user is emotional, respond to the feeling before moving into analysis or advice.",
    "Unless the user asks for depth, keep the reply concise to medium length and leave a natural opening for the next turn."
  ].join("\n\n");
}

function extractResponseText(payload: OpenAICompatibleResponsePayload): string | undefined {
  if (payload.output_text) {
    return payload.output_text;
  }

  return payload.output
    ?.flatMap((item) => normalizeContentItems(item.content))
    .map(extractContentItemText)
    .find((text) => Boolean(text));
}

function extractChatCompletionsText(
  payload: OpenAICompatibleChatCompletionsPayload
): string | undefined {
  const firstChoice = payload.choices?.[0];
  const content = firstChoice?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  const structured = normalizeContentItems(content)
    .map(extractContentItemText)
    .find((text) => Boolean(text));

  if (structured) {
    return structured;
  }

  return typeof firstChoice?.text === "string" && firstChoice.text.trim()
    ? firstChoice.text.trim()
    : undefined;
}

function normalizeModelDescriptors(
  payload: OpenAICompatibleModelResponse,
  provider: string
): ModelDescriptor[] {
  const items = extractRawModelItems(payload);
  const seen = new Set<string>();
  const models: ModelDescriptor[] = [];

  for (const item of items) {
    const normalized = normalizeSingleModelDescriptor(item, provider);

    if (!normalized || seen.has(normalized.id)) {
      continue;
    }

    seen.add(normalized.id);
    models.push(normalized);
  }

  return models;
}

function normalizeSingleModelDescriptor(
  value: unknown,
  provider: string
): ModelDescriptor | undefined {
  if (typeof value === "string") {
    return {
      id: value,
      provider
    };
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const id = firstNonEmptyString(
    record.id,
    record.name,
    record.model,
    record.model_id,
    record.modelId
  );

  if (!id) {
    return undefined;
  }

  const descriptor: ModelDescriptor = {
    id,
    provider
  };

  const label = firstNonEmptyString(
    record.label,
    record.display_name,
    record.displayName,
    record.name
  );
  const contextWindow = firstFiniteNumber(
    record.contextWindow,
    record.context_window,
    record.contextLength,
    record.context_length,
    record.maxContextLength,
    record.max_context_length,
    record.maxModelLen,
    record.max_model_len,
    record.inputTokenLimit,
    record.input_token_limit,
    record.maxInputTokens,
    record.max_input_tokens,
    record.max_tokens,
    record.max_output_tokens
  );

  if (label && label !== id) {
    descriptor.label = label;
  }

  if (contextWindow !== undefined) {
    descriptor.contextWindow = contextWindow;
  }

  return descriptor;
}

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function describeRelationshipGuidance(stage: string): string {
  if (stage === "growing") {
    return "Speak with steady familiarity. It is okay to sound gently close, remember shared threads naturally, and respond like trust has already been built.";
  }

  if (stage === "warming") {
    return "Sound more personally continuous than a first meeting, but do not become overly intimate. Acknowledge remembered context gently and build trust.";
  }

  return "Keep the tone warm and attentive, but do not act overly familiar yet. Earn trust through presence, clarity, and careful memory.";
}

function extractRawModelItems(payload: OpenAICompatibleModelResponse): unknown[] {
  const candidates = [
    payload,
    payload.data,
    payload.models,
    payload.result,
    readRecordValue(payload.data, "models"),
    readRecordValue(payload.data, "data"),
    readRecordValue(payload.result, "models"),
    readRecordValue(payload.result, "data")
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function readRecordValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}

function normalizeContentItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object"
    );
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [];
}

function extractContentItemText(item: Record<string, unknown>): string | undefined {
  const directText = firstNonEmptyString(item.text, item.content);

  if (directText) {
    return directText;
  }

  const nestedText = item.text;

  if (nestedText && typeof nestedText === "object") {
    return firstNonEmptyString(
      (nestedText as Record<string, unknown>).value,
      (nestedText as Record<string, unknown>).text
    );
  }

  return undefined;
}

function toChatCompletionsRole(role: "system" | "user" | "assistant"): "system" | "user" | "assistant" {
  return role;
}

function toResponsesRole(role: "system" | "user" | "assistant"): "system" | "developer" | "user" | "assistant" {
  if (role === "system") {
    return "system";
  }

  return role;
}
