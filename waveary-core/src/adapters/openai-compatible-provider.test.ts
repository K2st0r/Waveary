import test from "node:test";
import assert from "node:assert/strict";

import type { ChatProviderRequest } from "../providers/interfaces.js";
import {
  OpenAICompatibleChatProvider,
  resolveProviderPreset
} from "./openai-compatible-provider.js";

test("OpenAICompatibleChatProvider prefers chat completions for broad provider compatibility", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "mock reply");
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.url, "https://example.com/v1/chat/completions");

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    model: string;
    messages: Array<{ role: string; content: string }>;
  };

  assert.equal(body.model, "test-model");
  assert.equal(body.messages[0]?.role, "system");
  assert.match(body.messages[0]?.content ?? "", /Relevant memories:/);
  assert.equal(body.messages[1]?.role, "user");
});

test("OpenAICompatibleChatProvider falls back to responses when chat completions is unavailable", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });

      if (String(url).endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }

      return new Response(JSON.stringify({ output_text: "fallback reply" }), { status: 200 });
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "fallback reply");
  assert.deepEqual(
    recorded.map((entry) => entry.url),
    ["https://example.com/v1/chat/completions", "https://example.com/v1/responses"]
  );

  const fallbackBody = JSON.parse(String(recorded[1]?.init?.body)) as {
    model: string;
    input: Array<{ role: string; content: string }>;
  };

  assert.equal(fallbackBody.model, "test-model");
  assert.equal(fallbackBody.input[0]?.role, "developer");
  assert.equal(fallbackBody.input[1]?.role, "user");
});

test("OpenAICompatibleChatProvider lists models from the provider key", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "dashscope",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "qwen-max" }, { id: "qwen-plus" }]
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [
    { id: "qwen-max", provider: "dashscope" },
    { id: "qwen-plus", provider: "dashscope" }
  ]);
});

test("OpenAICompatibleChatProvider normalizes broader model payload shapes", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "siliconflow",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          models: [
            "deepseek-chat",
            {
              name: "qwen-turbo",
              label: "Qwen Turbo",
              context_length: "131072"
            },
            {
              id: "qwen-turbo",
              display_name: "Duplicate Should Collapse"
            },
            {
              model: "glm-4.5-air",
              max_tokens: 65536
            },
            {
              unknown: "skip-me"
            }
          ]
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [
    { id: "deepseek-chat", provider: "siliconflow" },
    {
      id: "qwen-turbo",
      provider: "siliconflow",
      label: "Qwen Turbo",
      contextWindow: 131072
    },
    {
      id: "glm-4.5-air",
      provider: "siliconflow",
      contextWindow: 65536
    }
  ]);
});

test("OpenAICompatibleChatProvider surfaces upstream model listing errors", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "dashscope",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(JSON.stringify({ error: { message: "invalid api key" } }), {
        status: 401
      })
  });

  await assert.rejects(
    provider.listModels(),
    /Model listing failed with status 401\. Body: \{"error":\{"message":"invalid api key"\}\}/
  );
});

test("resolveProviderPreset returns configured domestic provider presets", () => {
  assert.deepEqual(resolveProviderPreset("dashscope"), {
    id: "dashscope",
    label: "Alibaba DashScope",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  });
  assert.deepEqual(resolveProviderPreset("volcengine-ark"), {
    id: "volcengine-ark",
    label: "Volcengine Ark",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3"
  });
});

function createRequest(): ChatProviderRequest {
  return {
    session: {
      id: "session-1",
      userId: "user-1",
      personaId: "persona-1",
      startedAt: new Date().toISOString(),
      channel: "text",
      state: "active"
    },
    user: {
      id: "user-1",
      displayName: "K2st0r",
      profileTraits: ["reflective"],
      preferences: ["continuity"]
    },
    persona: {
      id: "persona-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["attentive"],
      relationshipStyle: "supportive"
    },
    messages: [
      {
        id: "m1",
        sessionId: "session-1",
        role: "user",
        content: "Please remember that I care about long-term continuity.",
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ],
    relevantMemories: [
      {
        id: "memory-1",
        userId: "user-1",
        type: "fact",
        content: "The user cares about long-term continuity.",
        importance: 0.9,
        confidence: 0.8,
        sourceMessageIds: ["m1"],
        createdAt: new Date().toISOString()
      }
    ],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.5,
      trustScore: 0.4,
      stabilityScore: 0.6,
      lastUpdatedAt: new Date().toISOString()
    },
    timeline: [
      {
        id: "timeline-1",
        userId: "user-1",
        title: "Discussed continuity",
        description: "The user explained Waveary's long-term direction.",
        eventType: "fact",
        eventTime: new Date().toISOString(),
        importance: 0.7,
        linkedMemoryIds: ["memory-1"]
      }
    ],
    emotion: {
      userId: "user-1",
      primaryEmotion: "joy",
      intensity: 0.7,
      confidence: 0.6,
      windowStart: new Date().toISOString(),
      windowEnd: new Date().toISOString()
    }
  };
}
