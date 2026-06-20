import test from "node:test";
import assert from "node:assert/strict";

import type { ChatProviderRequest } from "../providers/interfaces.js";
import {
  OpenAICompatibleChatProvider,
  resolveProviderPreset
} from "./openai-compatible-provider.js";

test("OpenAICompatibleChatProvider maps runtime context into a compatible responses request", async () => {
  const recorded: { url?: string; init: RequestInit | undefined } = { init: undefined };
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.url = String(url);
      recorded.init = init;
      return new Response(JSON.stringify({ output_text: "mock reply" }), { status: 200 });
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "mock reply");
  assert.equal(recorded.url, "https://example.com/v1/responses");

  const body = JSON.parse(String(recorded.init?.body)) as {
    model: string;
    input: Array<{ role: string; content: string }>;
  };

  assert.equal(body.model, "test-model");
  assert.equal(body.input[0]?.role, "developer");
  assert.match(body.input[0]?.content ?? "", /Relevant memories:/);
  assert.equal(body.input[1]?.role, "user");
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
