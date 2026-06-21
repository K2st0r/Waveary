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

test("OpenAICompatibleChatProvider injects local time context into the instruction prompt", async () => {
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

  await provider.generateReply(
    createRequest({
      localTime: {
        iso: "2026-06-21T13:45:00.000Z",
        timeZone: "Asia/Shanghai",
        locale: "zh-CN"
      }
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };

  assert.match(body.messages[0]?.content ?? "", /Local current time for the user: 2026-06-21T13:45:00.000Z\./);
  assert.match(body.messages[0]?.content ?? "", /Local time zone: Asia\/Shanghai\./);
  assert.match(body.messages[0]?.content ?? "", /Local daypart: evening \(hour 21\)\./);
  assert.match(body.messages[0]?.content ?? "", /use this local time context directly/i);
});

test("OpenAICompatibleChatProvider strengthens companionship guidance in the instruction prompt", async () => {
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

  await provider.generateReply(
    createRequest({
      relationship: {
        userId: "user-1",
        stage: "growing",
        affinityScore: 0.68,
        trustScore: 0.62,
        stabilityScore: 0.71,
        lastUpdatedAt: new Date().toISOString()
      },
      emotion: {
        userId: "user-1",
        primaryEmotion: "protective",
        intensity: 0.81,
        confidence: 0.77,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString()
      },
      detectedUserEmotion: {
        userId: "user-1",
        primaryEmotion: "sadness",
        intensity: 0.74,
        confidence: 0.75,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString()
      }
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };
  const instruction = body.messages[0]?.content ?? "";

  assert.match(instruction, /Respond to the user's felt state first\./);
  assert.match(instruction, /Let relationship stage change distance and wording\./);
  assert.match(instruction, /Do not over-explain your memory process/i);
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

test("OpenAICompatibleChatProvider allows model listing without configuring a chat model", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "openai",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "gpt-4.1-mini" }]
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [{ id: "gpt-4.1-mini", provider: "openai" }]);
  await assert.rejects(
    provider.generateReply(createRequest()),
    /A model is required to generate replies/
  );
});

test("OpenAICompatibleChatProvider normalizes DeepSeek base URLs and uses system role for responses fallback", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "deepseek",
    apiKey: "test-key",
    baseURL: "https://api.deepseek.com/v1/",
    model: "deepseek-chat",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });

      if (String(url).endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }

      return new Response(JSON.stringify({ output_text: "deepseek fallback reply" }), {
        status: 200
      });
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "deepseek fallback reply");
  assert.deepEqual(
    recorded.map((entry) => entry.url),
    ["https://api.deepseek.com/chat/completions", "https://api.deepseek.com/responses"]
  );

  const fallbackBody = JSON.parse(String(recorded[1]?.init?.body)) as {
    model: string;
    input: Array<{ role: string; content: string }>;
  };

  assert.equal(fallbackBody.model, "deepseek-chat");
  assert.equal(fallbackBody.input[0]?.role, "system");
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

test("OpenAICompatibleChatProvider normalizes nested model containers and alternate metadata fields", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "volcengine-ark",
    apiKey: "test-key",
    baseURL: "https://example.com/api/v3",
    model: "placeholder-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          result: {
            data: [
              {
                model_id: "doubao-seed-1-6",
                displayName: "Doubao Seed 1.6",
                max_model_len: "262144"
              }
            ]
          }
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [
    {
      id: "doubao-seed-1-6",
      provider: "volcengine-ark",
      label: "Doubao Seed 1.6",
      contextWindow: 262144
    }
  ]);
});

test("OpenAICompatibleChatProvider extracts reply text from structured chat completion content blocks", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  {
                    type: "text",
                    text: {
                      value: "structured reply"
                    }
                  }
                ]
              }
            }
          ]
        }),
        { status: 200 }
      )
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "structured reply");
});

test("OpenAICompatibleChatProvider extracts reply text from responses content blocks with plain content fields", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url) => {
      if (String(url).endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }

      return new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  type: "text",
                  content: "fallback structured reply"
                }
              ]
            }
          ]
        }),
        { status: 200 }
      );
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "fallback structured reply");
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
  assert.deepEqual(resolveProviderPreset("deepseek"), {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com"
  });
});

function createRequest(overrides: Partial<ChatProviderRequest> = {}): ChatProviderRequest {
  const base: ChatProviderRequest = {
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

  return {
    ...base,
    ...overrides
  };
}
