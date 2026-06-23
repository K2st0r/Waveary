import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { Readable } from "node:stream";

const TEST_ROOT_DIR = mkdtempSync(join(tmpdir(), "waveary-web-provider-api-"));
const TEST_DATA_DIR = join(TEST_ROOT_DIR, "data");
process.env.WAVEARY_DATA_DIR = TEST_DATA_DIR;

const { createProviderApiMiddleware } = await import("./provider-api.js");
const {
  createDefaultChatPersistenceConfig,
  saveChatPersistenceConfig
} = await import("./chat-persistence-config.js");
const {
  closeManagedBrowserAutomation,
  setBrowserAutomationOverridesForTests
} = await import("./browser-automation.js");
const {
  createChatSession,
  DEFAULT_CHAT_SESSION_ID,
  importChatSession
} = await import("./chat-session-store.js");
const { setLocalActionExecutorForTests } = await import("./local-actions.js");
const { saveProviderConfig } = await import("./provider-config.js");
const { resetChatRuntimeSessions } = await import("./chat-runtime.js");
const { getDefaultVoiceConfig } = await import("./voice-config.js");

const originalFetch = globalThis.fetch;

after(async () => {
  globalThis.fetch = originalFetch;
  setLocalActionExecutorForTests(null);
  setBrowserAutomationOverridesForTests(null);

  try {
    await closeManagedBrowserAutomation();
    resetChatRuntimeSessions();
    resetTestDataDir();
    rmSync(TEST_ROOT_DIR, { recursive: true, force: true });
  } catch {
    // Ignore final cleanup timing issues on Windows.
  }
});

beforeEach(async () => {
  await closeManagedBrowserAutomation();
  resetChatRuntimeSessions();
  resetTestDataDir();
  globalThis.fetch = originalFetch;
  setLocalActionExecutorForTests(null);
  setBrowserAutomationOverridesForTests(null);
});

test("browser page route returns null when no managed page is open", async () => {
  const middleware = createProviderApiMiddleware();

  setBrowserAutomationOverridesForTests({
    async getPageInfo() {
      return null;
    }
  });

  const response = await invokeJsonRoute(middleware, "GET", "/api/browser/page");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.page, null);
});

test("voice speak route returns an emotion-aware browser speech plan", async () => {
  const middleware = createProviderApiMiddleware();
  const defaultVoiceConfig = getDefaultVoiceConfig();
  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "我在这儿，你慢慢说。",
    locale: "zh-CN",
    relationship: {
      stage: "growing",
      affinityScore: 0.78,
      trustScore: 0.74,
      stabilityScore: 0.68,
      lastUpdatedAt: "2026-06-22T12:00:00.000Z"
    },
    emotion: {
      userId: "user-web-1",
      primaryEmotion: "concerned",
      intensity: 0.82,
      confidence: 0.85,
      windowStart: "2026-06-22T11:59:00.000Z",
      windowEnd: "2026-06-22T12:00:00.000Z"
    },
    delivery: {
      style: "concerned",
      pace: "slower",
      closeness: "close",
      expressiveness: "restrained",
      voiceStyle: "companion-concerned"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "waveary-browser-speech-planner");
  assert.equal(response.body.plan.mode, "browser-speech");
  assert.equal(response.body.plan.lang, "zh-CN");
  assert.equal(response.body.plan.styleLabel, "concerned");
  assert.ok(response.body.plan.rate < 0.98);
  assert.equal(response.body.plan.voiceLabel, "companion-concerned");
  assert.ok(response.body.plan.preferredVoiceKeywords.includes("Mandarin"));
  assert.equal(defaultVoiceConfig.qualityProfile, "cinematic");
});

test("chat turn returns a structured companion delivery hint for downstream voice", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "我在，你慢慢说。"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "我有点难过，陪陪我"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.emotion.primaryEmotion, "concerned");
  assert.equal(response.body.delivery.style, "concerned");
  assert.equal(response.body.delivery.pace, "slower");
  assert.ok(typeof response.body.delivery.instruction === "string");
  assert.match(String(response.body.delivery.summary), /concerned\/slower\//);
});

test("voice speak route returns provider audio when a compatible provider tts path succeeds", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: "test-key",
    model: "gpt-4o-mini"
  });

  globalThis.fetch = (async (input) => {
    if (String(input) === "https://api.openai.com/v1/audio/speech") {
      return new Response(Buffer.from("voice-audio"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg"
        }
      });
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "Stay with me for a bit.",
    locale: "en-US",
    voiceConfig: {
      qualityProfile: "gentle",
      voice: "cedar"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "openai");
  assert.equal(response.body.mode, "audio");
  assert.equal(response.body.audio.mimeType, "audio/mpeg");
  assert.equal(response.body.metadata.voice, "cedar");
  assert.equal(response.body.metadata.qualityProfile, "gentle");
  assert.equal(
    Buffer.from(response.body.audio.base64, "base64").toString("utf8"),
    "voice-audio"
  );
});

test("voice config route returns saved config plus presets", async () => {
  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "GET", "/api/voice/config");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.config.qualityProfile, "cinematic");
  assert.equal(response.body.config.sttModel, "gpt-4o-mini-transcribe");
  assert.ok(Array.isArray(response.body.presets));
  assert.ok(response.body.presets.length >= 4);
  assert.equal(response.body.routing.mode, "shared");
  assert.equal(response.body.routing.target, "browser-fallback");
  assert.equal(response.body.routing.reasonCode, "shared-provider-missing");
});

test("voice provider presets route returns selectable voice vendors", async () => {
  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "GET", "/api/voice/presets");

  assert.equal(response.statusCode, 200);
  assert.ok(Array.isArray(response.body.presets));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "openai"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "siliconflow"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "dashscope"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "ark"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "gemini"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "gemini-micu"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "fish-audio"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "doubao"));
  assert.ok(response.body.presets.some((preset: { id: string }) => preset.id === "local"));
});

test("voice catalog route returns discovered models plus mapped voices for openai-compatible vendors", async () => {
  const middleware = createProviderApiMiddleware();

  globalThis.fetch = (async (input) => {
    if (String(input) === "https://api.openai.com/v1/models") {
      return new Response(
        JSON.stringify({
          data: [
            { id: "gpt-4o-mini-tts" },
            { id: "gpt-4o-audio-preview", name: "gpt-4o-audio-preview" }
          ]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: "voice-key"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.providerType, "openai-compatible");
  assert.equal(response.body.voiceFieldMode, "select");
  assert.ok(Array.isArray(response.body.models));
  assert.ok(response.body.models.some((model: { id: string }) => model.id === "gpt-4o-mini-tts"));
  assert.ok(Array.isArray(response.body.voices));
  assert.ok(response.body.voices.some((voice: { id: string }) => voice.id === "marin"));
});

test("voice catalog route returns input-mode catalogs for doubao and local providers", async () => {
  const middleware = createProviderApiMiddleware();

  const doubaoResponse = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "doubao"
  });
  const localResponse = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "local"
  });

  assert.equal(doubaoResponse.statusCode, 200);
  assert.equal(doubaoResponse.body.providerType, "doubao");
  assert.equal(doubaoResponse.body.voiceFieldMode, "input");
  assert.equal(
    doubaoResponse.body.defaultVoice,
    "zh_male_beijingxiaoye_emo_v2_mars_bigtts"
  );

  assert.equal(localResponse.statusCode, 200);
  assert.equal(localResponse.body.providerType, "local");
  assert.equal(localResponse.body.voiceFieldMode, "input");
  assert.equal(localResponse.body.defaultModel, "local-bridge");
});

test("voice catalog route returns static Gemini TTS models and voices", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    apiKey: "gemini-key"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.providerType, "gemini");
  assert.equal(response.body.voiceFieldMode, "select");
  assert.ok(
    response.body.models.some(
      (model: { id: string }) => model.id === "gemini-3.1-flash-tts-preview"
    )
  );
  assert.ok(
    response.body.voices.some((voice: { id: string }) => voice.id === "Kore")
  );
});

test("voice catalog route returns Micu-specific Gemini TTS model names for the Micu relay preset", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "gemini-micu",
    baseURL: "https://www.micuapi.ai/v1beta",
    apiKey: "micu-key"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.providerType, "gemini");
  assert.equal(response.body.defaultModel, "gemini-2.5-flash-tts-preview");
  assert.ok(
    response.body.models.some(
      (model: { id: string }) => model.id === "gemini-2.5-flash-tts-preview"
    )
  );
  assert.ok(
    response.body.models.some(
      (model: { id: string }) => model.id === "gemini-2.5-pro-tts-preview"
    )
  );
  assert.ok(
    response.body.models.every(
      (model: { id: string }) => model.id !== "gemini-3.1-flash-tts-preview"
    )
  );
});

test("voice catalog route returns fish audio voice models from fish model api", async () => {
  const middleware = createProviderApiMiddleware();

  globalThis.fetch = (async (input, init) => {
    if (String(input) === "https://api.fish.audio/model?self=false&page_size=20&page_number=1") {
      assert.equal(String((init?.headers as Record<string, string>).Authorization), "Bearer fish-key");
      return new Response(
        JSON.stringify({
          total: 2,
          items: [
            { _id: "fish-voice-1", title: "Warm Narrator" },
            { _id: "fish-voice-2", title: "Soft Companion" }
          ]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "fish-audio",
    baseURL: "https://api.fish.audio",
    apiKey: "fish-key"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.providerType, "fish-audio");
  assert.equal(response.body.voiceFieldMode, "input");
  assert.ok(Array.isArray(response.body.models));
  assert.ok(response.body.models.some((model: { id: string }) => model.id === "fish-voice-1"));
  assert.ok(response.body.models.some((model: { label: string }) => model.label === "Soft Companion"));
});

test("voice catalog route surfaces fish audio network timeout details", async () => {
  const middleware = createProviderApiMiddleware();

  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed", {
      cause: Object.assign(new Error("Connect Timeout Error"), {
        code: "UND_ERR_CONNECT_TIMEOUT"
      })
    });
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "fish-audio",
    baseURL: "https://api.fish.audio",
    apiKey: "fish-key"
  });

  assert.equal(response.statusCode, 400);
  assert.match(
    response.body.error,
    /Fish Audio catalog request could not reach the upstream service\. Code: UND_ERR_CONNECT_TIMEOUT\. Cause: Connect Timeout Error/
  );
});

test("voice catalog route keeps manual voice entry for compatible vendors without shared voice directories", async () => {
  const middleware = createProviderApiMiddleware();

  globalThis.fetch = (async (input) => {
    if (String(input) === "https://api.siliconflow.cn/v1/models") {
      return new Response(
        JSON.stringify({
          data: [{ id: "FunAudioLLM/CosyVoice2-0.5B" }]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/catalog", {
    provider: "siliconflow",
    baseURL: "https://api.siliconflow.cn/v1",
    apiKey: "voice-key"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.providerType, "openai-compatible");
  assert.equal(response.body.voiceFieldMode, "input");
  assert.ok(Array.isArray(response.body.models));
  assert.ok(response.body.models.some((model: { id: string }) => model.id === "FunAudioLLM/CosyVoice2-0.5B"));
  assert.equal(response.body.voices.length, 0);
});

test("voice config route persists a selected preset", async () => {
  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    qualityProfile: "gentle",
    model: "gpt-4o-mini-tts",
    sttModel: "whisper-1",
    voice: "cedar",
    format: "mp3"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.config.qualityProfile, "gentle");
  assert.equal(response.body.config.voice, "cedar");
  assert.equal(response.body.config.model, "gpt-4o-mini-tts");
  assert.equal(response.body.config.sttModel, "whisper-1");
  assert.equal(response.body.routing.mode, "shared");
});

test("voice config route auto-normalizes legacy saved doubao fields to the v3 contract", async () => {
  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "doubao",
    baseURL: "https://openspeech.bytedance.com/api/v1",
    apiKey: "doubao-key",
    voice: "BV001_streaming",
    appId: "doubao-key",
    model: "doubao-tts",
    qualityProfile: "gentle",
    format: "mp3"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.config.baseURL, "https://openspeech.bytedance.com");
  assert.equal(response.body.config.resourceId, "volc.service_type.10029");
  assert.equal(
    response.body.config.voice,
    "zh_male_beijingxiaoye_emo_v2_mars_bigtts"
  );
  assert.equal(response.body.routing.reasonCode, "dedicated-doubao-ready");
});

test("voice transcribe route returns transcript text for compatible providers", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: "chat-key",
    model: "gpt-4o-mini"
  });

  globalThis.fetch = (async (input, init) => {
    if (String(input) === "https://api.openai.com/v1/audio/transcriptions") {
      const body = init?.body;
      assert.ok(body instanceof FormData);
      assert.equal(body.get("model"), "gpt-4o-mini-transcribe");
      assert.equal(body.get("language"), "zh");
      assert.equal(body.get("prompt"), "Companion live conversation.");

      return new Response(
        JSON.stringify({
          text: "我在，继续说吧。",
          language: "zh"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/transcribe", {
    locale: "zh-CN",
    prompt: "Companion live conversation.",
    audio: {
      base64: Buffer.from("fake-audio").toString("base64"),
      mimeType: "audio/webm",
      fileName: "voice.webm"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "openai");
  assert.equal(response.body.text, "我在，继续说吧。");
  assert.equal(response.body.metadata.model, "gpt-4o-mini-transcribe");
  assert.equal(response.body.metadata.language, "zh");
  assert.equal(response.body.routing.reasonCode, "shared-provider-ready");
});

test("voice transcribe route rejects unsupported provider-backed stt families for now", async () => {
  const middleware = createProviderApiMiddleware();

  await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "doubao",
    apiKey: "doubao-key",
    resourceId: "volc.service_type.10029",
    voice: "zh_male_beijingxiaoye_emo_v2_mars_bigtts",
    model: "doubao-tts",
    qualityProfile: "cinematic",
    format: "mp3"
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/transcribe", {
    audio: {
      base64: Buffer.from("fake-audio").toString("base64"),
      mimeType: "audio/webm"
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(
    response.body.error,
    "Provider-backed STT is not implemented for this voice provider yet."
  );
});

test("voice transcribe route supports dedicated fish audio stt config", async () => {
  const middleware = createProviderApiMiddleware();

  await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "fish-audio",
    baseURL: "https://api.fish.audio",
    apiKey: "fish-key",
    model: "s2-pro",
    sttModel: "fish-sense-1",
    voice: "fish-voice-1",
    qualityProfile: "cinematic",
    format: "mp3"
  });

  globalThis.fetch = (async (input, init) => {
    if (String(input) === "https://api.fish.audio/v1/asr") {
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.Authorization, "Bearer fish-key");
      const body = JSON.parse(String(init?.body)) as {
        audio: string;
        language: string;
        ignore_timestamps: boolean;
      };
      assert.equal(body.language, "zh");
      assert.equal(body.ignore_timestamps, true);
      assert.equal(body.audio, Buffer.from("fake-audio").toString("base64"));

      return new Response(
        JSON.stringify({
          text: "我在，继续说。",
          duration: 1.6,
          segments: []
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/transcribe", {
    locale: "zh-CN",
    audio: {
      base64: Buffer.from("fake-audio").toString("base64"),
      mimeType: "audio/webm"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "fish-audio");
  assert.equal(response.body.text, "我在，继续说。");
  assert.equal(response.body.metadata.model, "fish-sense-1");
  assert.equal(response.body.routing.reasonCode, "dedicated-fish-audio-ready");
});

test("voice speak route supports dedicated fish audio tts config", async () => {
  const middleware = createProviderApiMiddleware();

  await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "fish-audio",
    baseURL: "https://api.fish.audio",
    apiKey: "fish-key",
    model: "s2-pro",
    voice: "fish-voice-1",
    qualityProfile: "gentle",
    format: "mp3"
  });

  globalThis.fetch = (async (input, init) => {
    if (String(input) === "https://api.fish.audio/v1/tts") {
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.Authorization, "Bearer fish-key");
      assert.equal(headers.model, "s2-pro");
      const body = JSON.parse(String(init?.body)) as {
        text: string;
        reference_id: string;
      };
      assert.equal(body.text, "Stay with me.");
      assert.equal(body.reference_id, "fish-voice-1");

      return new Response(Buffer.from("fish-voice-audio"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg"
        }
      });
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "Stay with me.",
    locale: "en-US"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "fish-audio");
  assert.equal(response.body.routing.reasonCode, "dedicated-fish-audio-ready");
  assert.equal(
    Buffer.from(response.body.audio.base64, "base64").toString("utf8"),
    "fish-voice-audio"
  );
});

test("voice speak route supports dedicated gemini tts config", async () => {
  const middleware = createProviderApiMiddleware();

  await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    apiKey: "gemini-key",
    model: "gemini-3.1-flash-tts-preview",
    voice: "Kore",
    qualityProfile: "gentle",
    format: "mp3"
  });

  globalThis.fetch = (async (input, init) => {
    if (
      String(input) ===
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent"
    ) {
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers["x-goog-api-key"], "gemini-key");
      const body = JSON.parse(String(init?.body)) as {
        contents: Array<{ parts: Array<{ text: string }> }>;
        generationConfig: {
          responseModalities: string[];
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: string;
              };
            };
          };
        };
      };
      assert.equal(
        body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,
        "Kore"
      );
      assert.deepEqual(body.generationConfig.responseModalities, ["AUDIO"]);

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: "audio/wav",
                      data: Buffer.from("gemini-voice-audio").toString("base64")
                    }
                  }
                ]
              }
            }
          ]
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "Stay with me.",
    locale: "en-US"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "gemini");
  assert.equal(response.body.routing.reasonCode, "dedicated-gemini-ready");
  assert.equal(
    Buffer.from(response.body.audio.base64, "base64").toString("utf8"),
    "gemini-voice-audio"
  );
});

test("voice config route preserves explicit empty model and voice when switching dedicated provider presets", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "openai-compatible",
    baseURL: "https://api.example.com/v1",
    apiKey: "voice-key",
    qualityProfile: "cinematic",
    model: "",
    voice: ""
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.config.providerMode, "dedicated");
  assert.equal(response.body.config.provider, "openai-compatible");
  assert.equal(response.body.config.model, "");
  assert.equal(response.body.config.voice, "");
});

test("voice speak route prefers dedicated voice provider config when present", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "deepseek",
    baseURL: "https://api.deepseek.com/v1",
    apiKey: "chat-key",
    model: "deepseek-chat"
  });

  globalThis.fetch = (async (input) => {
    if (String(input) === "https://api.openai.com/v1/audio/speech") {
      return new Response(Buffer.from("dedicated-voice-audio"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg"
        }
      });
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: "voice-key",
    qualityProfile: "cinematic",
    model: "gpt-4o-mini-tts",
    voice: "marin",
    format: "mp3"
  });

  assert.equal(response.statusCode, 200);

  const speakResponse = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "Stay here.",
    locale: "en-US"
  });

  assert.equal(speakResponse.statusCode, 200);
  assert.equal(speakResponse.body.provider, "openai");
  assert.equal(speakResponse.body.routing.target, "provider-audio");
  assert.equal(speakResponse.body.routing.reasonCode, "dedicated-compatible-ready");
  assert.equal(speakResponse.body.routing.attemptedProviderAudio, true);
  assert.equal(
    Buffer.from(speakResponse.body.audio.base64, "base64").toString("utf8"),
    "dedicated-voice-audio"
  );
});

test("voice speak route supports dedicated doubao tts config", async () => {
  const middleware = createProviderApiMiddleware();

  globalThis.fetch = (async (input, init) => {
    if (String(input) === "https://openspeech.bytedance.com/api/v3/tts/unidirectional") {
      const headers = init?.headers as Record<string, string>;
      const body = init?.body
        ? (JSON.parse(String(init.body)) as {
            req_params: {
              text: string;
              speaker: string;
              additions: string;
              audio_params: { format: string; sample_rate: number };
            };
          })
        : null;

      assert.equal(headers["x-api-key"], "doubao-key");
      assert.equal(headers["X-Api-Resource-Id"], "volc.service_type.10029");
      assert.equal(body?.req_params.text, "你好，我在。");
      assert.equal(
        body?.req_params.speaker,
        "zh_male_beijingxiaoye_emo_v2_mars_bigtts"
      );
      assert.equal(body?.req_params.audio_params.format, "mp3");
      assert.equal(body?.req_params.audio_params.sample_rate, 24000);

      return new Response(
        JSON.stringify({
          code: 0,
          message: "Success",
          data: Buffer.from("doubao-voice-audio").toString("base64")
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "doubao",
    apiKey: "doubao-key",
    resourceId: "volc.service_type.10029",
    voice: "zh_male_beijingxiaoye_emo_v2_mars_bigtts",
    model: "doubao-tts",
    qualityProfile: "cinematic",
    format: "mp3"
  });

  assert.equal(response.statusCode, 200);

  const speakResponse = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "你好，我在。",
    locale: "zh-CN"
  });

  assert.equal(speakResponse.statusCode, 200);
  assert.equal(speakResponse.body.provider, "doubao");
  assert.equal(speakResponse.body.routing.target, "provider-audio");
  assert.equal(speakResponse.body.routing.reasonCode, "dedicated-doubao-ready");
  assert.equal(
    Buffer.from(speakResponse.body.audio.base64, "base64").toString("utf8"),
    "doubao-voice-audio"
  );
});

test("voice speak route supports dedicated local self-hosted tts config", async () => {
  const middleware = createProviderApiMiddleware();

  globalThis.fetch = (async (input, init) => {
    if (String(input) === "http://127.0.0.1:9880/tts") {
      const body = init?.body
        ? (JSON.parse(String(init.body)) as {
            text: string;
            locale: string;
            engine: string;
            voice: string;
            speaker: string;
            referenceVoiceId: string;
            textLanguage: string;
            promptLanguage: string;
            referenceTranscript: string;
            stylePrompt: string;
            styleStrength: number;
            temperature: number;
            topP: number;
            delivery: {
              style: string;
              summary: string;
            };
            format: string;
          })
        : null;

      assert.equal(body?.text, "你好，我在。");
      assert.equal(body?.locale, "zh-CN");
      assert.equal(body?.engine, "gpt-sovits");
      assert.equal(body?.voice, "warm-youth");
      assert.equal(body?.speaker, "speaker-a");
      assert.equal(body?.referenceVoiceId, "ref-voice-1");
      assert.equal(body?.textLanguage, "zh");
      assert.equal(body?.promptLanguage, "zh");
      assert.equal(body?.referenceTranscript, "陪着你慢慢说。");
      assert.equal(body?.stylePrompt, "soft diary warmth");
      assert.equal(body?.styleStrength, 0.68);
      assert.equal(body?.temperature, 0.42);
      assert.equal(body?.topP, 0.8);
      assert.equal(body?.delivery.style, "warm");
      assert.equal(body?.delivery.summary, "Stay near and gentle.");
      assert.equal(body?.format, "mp3");

      return new Response(
        JSON.stringify({
          provider: "local-gpt-sovits",
          audio: {
            base64: Buffer.from("local-self-hosted-audio").toString("base64"),
            mimeType: "audio/mpeg"
          },
          metadata: {
            model: "gpt-sovits-v2",
            voice: "speaker-a"
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "local",
    baseURL: "http://127.0.0.1:9880",
    endpointPath: "/tts",
    engine: "gpt-sovits",
    apiKey: "",
    speaker: "speaker-a",
    referenceVoiceId: "ref-voice-1",
    textLanguage: "zh",
    promptLanguage: "zh",
    referenceTranscript: "陪着你慢慢说。",
    stylePrompt: "soft diary warmth",
    styleStrength: 0.68,
    temperature: 0.42,
    topP: 0.8,
    voice: "warm-youth",
    model: "local-bridge",
    qualityProfile: "gentle",
    format: "mp3"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.config.provider, "local");
  assert.equal(response.body.config.endpointPath, "/tts");
  assert.equal(response.body.config.engine, "gpt-sovits");
  assert.equal(response.body.config.speaker, "speaker-a");
  assert.equal(response.body.config.referenceVoiceId, "ref-voice-1");

  const speakResponse = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "你好，我在。",
    locale: "zh-CN",
    delivery: {
      style: "warm",
      summary: "Stay near and gentle."
    }
  });

  assert.equal(speakResponse.statusCode, 200);
  assert.equal(speakResponse.body.provider, "local-gpt-sovits");
  assert.equal(speakResponse.body.routing.target, "provider-audio");
  assert.equal(speakResponse.body.routing.reasonCode, "dedicated-local-ready");
  assert.equal(
    Buffer.from(speakResponse.body.audio.base64, "base64").toString("utf8"),
    "local-self-hosted-audio"
  );
  assert.equal(speakResponse.body.metadata.model, "gpt-sovits-v2");
  assert.equal(speakResponse.body.metadata.voice, "speaker-a");
});

test("voice config route reports missing doubao resource id before playback", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "doubao",
    apiKey: "doubao-key",
    resourceId: "",
    voice: "zh_male_beijingxiaoye_emo_v2_mars_bigtts",
    model: "doubao-tts",
    qualityProfile: "cinematic",
    format: "mp3"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.routing.target, "browser-fallback");
  assert.equal(response.body.routing.reasonCode, "dedicated-doubao-missing-resource-id");
  assert.deepEqual(response.body.routing.missingFields, ["resourceId"]);
});

test("voice speak route surfaces fallback reason when dedicated provider request fails", async () => {
  const middleware = createProviderApiMiddleware();

  await invokeJsonRoute(middleware, "POST", "/api/voice/config", {
    providerMode: "dedicated",
    provider: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: "voice-key",
    qualityProfile: "cinematic",
    model: "gpt-4o-mini-tts",
    voice: "marin",
    format: "mp3"
  });

  globalThis.fetch = (async (input) => {
    if (String(input) === "https://api.openai.com/v1/audio/speech") {
      return new Response("forbidden", {
        status: 403,
        headers: {
          "Content-Type": "text/plain"
        }
      });
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`);
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/voice/speak", {
    text: "Stay with me.",
    locale: "en-US"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "waveary-browser-speech-planner");
  assert.equal(response.body.mode, "browser-speech");
  assert.equal(response.body.routing.target, "browser-fallback");
  assert.equal(response.body.routing.reasonCode, "dedicated-compatible-ready");
  assert.equal(response.body.routing.attemptedProviderAudio, true);
  assert.match(String(response.body.routing.fallbackReason), /status 403/i);
});

test("browser extract-text route returns bounded page text", async () => {
  const middleware = createProviderApiMiddleware();

  setBrowserAutomationOverridesForTests({
    async extractPageText(options) {
      assert.equal(options?.maxChars, 80);
      return {
        page: {
          url: "https://example.com/notes",
          title: "Notes"
        },
        text: "first paragraph\n\nsecond paragraph",
        truncated: false,
        extractedAt: "2026-06-22T08:00:00.000Z"
      };
    }
  });

  const response = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/browser/extract-text",
    { maxChars: 80 }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.page.url, "https://example.com/notes");
  assert.equal(response.body.page.title, "Notes");
  assert.equal(response.body.text, "first paragraph\n\nsecond paragraph");
  assert.equal(response.body.truncated, false);
  assert.equal(response.body.extractedAt, "2026-06-22T08:00:00.000Z");
});

test("browser search-text route returns snippets from the current page", async () => {
  const middleware = createProviderApiMiddleware();

  setBrowserAutomationOverridesForTests({
    async searchPageText(query, options) {
      assert.equal(query, "memory");
      assert.equal(options?.maxSnippets, 3);
      assert.equal(options?.snippetRadius, 60);

      return {
        page: {
          url: "https://example.com/waveary",
          title: "Waveary"
        },
        query,
        totalMatches: 2,
        snippets: [
          "...Memory comes before model...",
          "...relationship grows through remembered moments..."
        ],
        searchedAt: "2026-06-22T08:10:00.000Z"
      };
    }
  });

  const response = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/browser/search-text",
    {
      query: "memory",
      maxSnippets: 3,
      snippetRadius: 60
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.page.url, "https://example.com/waveary");
  assert.equal(response.body.query, "memory");
  assert.equal(response.body.totalMatches, 2);
  assert.deepEqual(response.body.snippets, [
    "...Memory comes before model...",
    "...relationship grows through remembered moments..."
  ]);
  assert.equal(response.body.searchedAt, "2026-06-22T08:10:00.000Z");
});

test("browser clickable-elements route returns visible click targets", async () => {
  const middleware = createProviderApiMiddleware();

  setBrowserAutomationOverridesForTests({
    async listClickableElements(options) {
      assert.equal(options?.maxElements, 6);
      return {
        page: {
          url: "https://example.com/actions",
          title: "Actions"
        },
        elements: [
          {
            text: "Start here",
            tagName: "a",
            href: "https://example.com/start"
          },
          {
            text: "Continue",
            tagName: "button",
            role: "button"
          }
        ],
        scannedAt: "2026-06-22T08:20:00.000Z"
      };
    }
  });

  const response = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/browser/clickable-elements",
    { maxElements: 6 }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.page.url, "https://example.com/actions");
  assert.equal(response.body.elements.length, 2);
  assert.deepEqual(response.body.elements[0], {
    text: "Start here",
    tagName: "a",
    href: "https://example.com/start"
  });
  assert.deepEqual(response.body.elements[1], {
    text: "Continue",
    tagName: "button",
    role: "button"
  });
  assert.equal(response.body.scannedAt, "2026-06-22T08:20:00.000Z");
});

test("browser click-text route clicks a matching visible element by text", async () => {
  const middleware = createProviderApiMiddleware();

  setBrowserAutomationOverridesForTests({
    async clickByText(text, options) {
      assert.equal(text, "Continue");
      assert.equal(options?.exact, true);
      assert.equal(options?.timeoutMs, 2000);

      return {
        page: {
          url: "https://example.com/after-click",
          title: "After Click"
        },
        matchedText: "Continue",
        exact: true,
        clickedAt: "2026-06-22T08:25:00.000Z"
      };
    }
  });

  const response = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/browser/click-text",
    {
      text: "Continue",
      exact: true,
      timeoutMs: 2000
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.page.url, "https://example.com/after-click");
  assert.equal(response.body.matchedText, "Continue");
  assert.equal(response.body.exact, true);
  assert.equal(response.body.clickedAt, "2026-06-22T08:25:00.000Z");
});

test("chat turn proposes a pending local action for explicit open requests", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "I can prepare that action for you."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "open bilibili"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reply, "I can prepare that action for you.");
  assert.equal(response.body.pendingLocalAction.kind, "open_url");
  assert.equal(response.body.pendingLocalAction.target, "https://www.bilibili.com/");
});

test("chat turn recognizes Chinese bilibili aliases as local open actions", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Let me handle that for you."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "打开哔哩哔哩"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.pendingLocalAction.kind, "open_url");
  assert.equal(response.body.pendingLocalAction.targetLabel, "Bilibili");
  assert.equal(response.body.pendingLocalAction.target, "https://www.bilibili.com/");
});

test("chat turn auto-executes local actions in full-access mode and returns an execution-consistent reply", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "I cannot directly open apps or websites for you."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  setLocalActionExecutorForTests(async (action: { targetLabel: string }) => ({
    status: "executed",
    message: `Opened ${action.targetLabel}.`
  }));

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "open bilibili",
    localActionPermission: "allow",
    locale: "en"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(
    response.body.reply,
    "I opened Bilibili for you. If you want, I can stay with you and help with the next step too."
  );
  assert.equal(response.body.pendingLocalAction, null);

  const sessionResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(sessionResponse.statusCode, 200);
  assert.equal(sessionResponse.body.session.messages.length, 2);
  assert.equal(sessionResponse.body.session.messages[0]?.content, "open bilibili");
  assert.equal(
    sessionResponse.body.session.messages[1]?.content,
    "I opened Bilibili for you. If you want, I can stay with you and help with the next step too."
  );
  assert.equal(sessionResponse.body.session.latestInsights.pendingLocalAction, null);
  assert.equal(
    sessionResponse.body.session.latestInsights.reply,
    "I opened Bilibili for you. If you want, I can stay with you and help with the next step too."
  );
});

test("chat turn follows up inside Bilibili and opens a matching video for 看 + keyword requests", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "I can help with that."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  let openedUrls: string[] = [];

  setBrowserAutomationOverridesForTests({
    async getPageInfo() {
      return {
        url: "https://www.bilibili.com/",
        title: "Bilibili"
      };
    },
    async openPage(url) {
      openedUrls.push(url);
      return {
        status: "opened",
        url,
        title: "Bilibili Search"
      };
    },
    async openFirstVisibleLink(options) {
      assert.equal(options?.hrefIncludes, "/video/");
      return {
        page: {
          url: "https://www.bilibili.com/video/BV1test",
          title: "CSGO Major Highlights"
        },
        matchedText: "CSGO Major Highlights",
        href: "https://www.bilibili.com/video/BV1test",
        openedAt: "2026-06-22T11:00:00.000Z"
      };
    }
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "看csgo",
    localActionPermission: "allow",
    locale: "zh"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.pendingLocalAction, null);
  assert.equal(
    openedUrls[0],
    "https://search.bilibili.com/all?keyword=csgo"
  );
  assert.match(
    response.body.reply,
    /我已经替你在 Bilibili 里顺着“csgo”找了一个视频，并打开了「CSGO Major Highlights」/
  );
});

test("chat turn proposes a pending browser read action for current-page reading requests", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Let me line that up for you."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "read this page"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reply, "Let me line that up for you.");
  assert.equal(response.body.pendingLocalAction.kind, "browser_extract_text");
  assert.equal(response.body.pendingLocalAction.target, "__current_page__");
});

test("chat turn auto-executes browser search actions in full-access mode with grounded page feedback", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "I cannot inspect the page directly."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  setBrowserAutomationOverridesForTests({
    async searchPageText(query, options) {
      assert.equal(query, "memory");
      assert.equal(options?.maxSnippets, 3);

      return {
        page: {
          url: "https://example.com/waveary",
          title: "Waveary"
        },
        query,
        totalMatches: 2,
        snippets: [
          "...Memory comes before model...",
          "...every memory deserves an echo..."
        ],
        searchedAt: "2026-06-22T09:10:00.000Z"
      };
    }
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "search this page for memory",
    localActionPermission: "allow",
    locale: "en"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.pendingLocalAction, null);
  assert.match(
    response.body.reply,
    /I searched "Waveary" for "memory" and found 2 visible matches\./
  );

  const sessionResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(sessionResponse.statusCode, 200);
  assert.equal(sessionResponse.body.session.messages.length, 2);
  assert.match(
    sessionResponse.body.session.messages[1]?.content,
    /The clearest ones right now are/
  );
});

test("local action execution route blocks denied permissions and succeeds after approval", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Action prepared."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  setLocalActionExecutorForTests(async (action: { targetLabel: string }) => ({
    status: "executed",
    message: `Opened ${action.targetLabel}.`
  }));

  const turnResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "open github"
  });

  assert.equal(turnResponse.statusCode, 200);

  const deniedResponse = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/chat/local-action/execute",
    {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      actionId: turnResponse.body.pendingLocalAction.id,
      permission: "deny",
      approved: true
    }
  );

  assert.equal(deniedResponse.statusCode, 400);
  assert.equal(
    deniedResponse.body.error,
    "Local action execution is denied by the current permission setting."
  );

  const approvedResponse = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/chat/local-action/execute",
    {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      actionId: turnResponse.body.pendingLocalAction.id,
      permission: "ask",
      approved: true,
      locale: "en"
    }
  );

  assert.equal(approvedResponse.statusCode, 200);
  assert.equal(approvedResponse.body.result.status, "executed");
  assert.equal(approvedResponse.body.result.message, "Opened GitHub.");
  assert.equal(approvedResponse.body.session.latestInsights.pendingLocalAction, null);
  assert.equal(approvedResponse.body.session.messages.length, 3);
  assert.equal(
    approvedResponse.body.session.messages[2]?.content,
    "I opened GitHub for you. If you want, I can stay with you and help with the next step too."
  );
});

test("local action execution route records browser clickable-list notes after approval", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Action prepared."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  setBrowserAutomationOverridesForTests({
    async listClickableElements(options) {
      assert.equal(options?.maxElements, 8);
      return {
        page: {
          url: "https://example.com/actions",
          title: "Actions"
        },
        elements: [
          {
            text: "Start here",
            tagName: "a",
            href: "https://example.com/start"
          },
          {
            text: "Continue",
            tagName: "button",
            role: "button"
          }
        ],
        scannedAt: "2026-06-22T10:00:00.000Z"
      };
    }
  });

  const turnResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "what can i click on this page"
  });

  assert.equal(turnResponse.statusCode, 200);
  assert.equal(turnResponse.body.pendingLocalAction.kind, "browser_list_clickable");

  const approvedResponse = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/chat/local-action/execute",
    {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      actionId: turnResponse.body.pendingLocalAction.id,
      permission: "ask",
      approved: true,
      locale: "en"
    }
  );

  assert.equal(approvedResponse.statusCode, 200);
  assert.equal(
    approvedResponse.body.result.message,
    "Checked clickable items on the current page."
  );
  assert.equal(approvedResponse.body.session.latestInsights.pendingLocalAction, null);
  assert.match(
    approvedResponse.body.session.messages[2]?.content,
    /The clearest clickable options right now are/
  );
});

test("local action dismiss route clears the pending action and records a chat-visible audit note", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Action prepared."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const turnResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "open github"
  });

  assert.equal(turnResponse.statusCode, 200);

  const dismissResponse = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/chat/local-action/dismiss",
    {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      actionId: turnResponse.body.pendingLocalAction.id,
      locale: "en"
    }
  );

  assert.equal(dismissResponse.statusCode, 200);
  assert.equal(dismissResponse.body.result.status, "dismissed");
  assert.equal(
    dismissResponse.body.result.message,
    "Dismissed the pending local action."
  );
  assert.equal(dismissResponse.body.session.latestInsights.pendingLocalAction, null);
  assert.equal(dismissResponse.body.session.messages.length, 3);
  assert.equal(
    dismissResponse.body.session.messages[2]?.content,
    "I did not open GitHub this time. Ask me again when you want it, and I will stay right here."
  );
});

test("chat persistence route returns rich backend status after switching to sqlite", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-alpha", "Alpha Session");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/persistence", {
    backend: "sqlite"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.importedSessionCount, 2);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "sqlite");
  assert.equal(response.body.persistence.lastSync.fromBackend, "file");
  assert.equal(response.body.persistence.lastSync.toBackend, "sqlite");
  assert.equal(response.body.persistence.lastSync.synchronizedSessionCount, 2);
  assert.equal(response.body.sessions.length, 2);
  assert.deepEqual(
    response.body.sessions.map((session: { sessionId: string }) => session.sessionId).sort(),
    [DEFAULT_CHAT_SESSION_ID, "session-alpha"].sort()
  );

  const sqliteStatus = response.body.persistence.backendDetails.find(
    (detail: { backend: string }) => detail.backend === "sqlite"
  );
  const fileStatus = response.body.persistence.backendDetails.find(
    (detail: { backend: string }) => detail.backend === "file"
  );

  assert.ok(sqliteStatus);
  assert.ok(fileStatus);
  assert.equal(sqliteStatus.syncState, "active");
  assert.equal(fileStatus.syncState, "in-sync");
  assert.equal(fileStatus.differingSessionCount, 0);
});

test("chat persistence route resets runtime cache before the next turn", async () => {
  const fetchCalls: Array<{ url: string; model: string }> = [];

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) as { model?: string } : {};
    fetchCalls.push({
      url,
      model: body.model ?? "unknown"
    });

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: `reply:${body.model ?? "unknown"}`
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }) as typeof fetch;

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  const middleware = createProviderApiMiddleware();

  const firstTurn = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "first turn"
  });

  assert.equal(firstTurn.statusCode, 200);
  assert.equal(firstTurn.body.reply, "reply:model-a");

  saveProviderConfig({
    provider: "provider-b",
    baseURL: "https://provider-b.example/v1",
    apiKey: "key-b",
    model: "model-b"
  });

  const switchResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/persistence", {
    backend: "sqlite"
  });

  assert.equal(switchResponse.statusCode, 200);
  assert.equal(switchResponse.body.persistence.backend, "sqlite");

  const secondTurn = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "second turn"
  });

  assert.equal(secondTurn.statusCode, 200);
  assert.equal(secondTurn.body.reply, "reply:model-b");
  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0]?.url, "https://provider-a.example/v1/chat/completions");
  assert.equal(fetchCalls[0]?.model, "model-a");
  assert.equal(fetchCalls[1]?.url, "https://provider-b.example/v1/chat/completions");
  assert.equal(fetchCalls[1]?.model, "model-b");
});

test("chat sessions route lists sessions with default session and persistence status", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-alpha", "Alpha Session");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "GET", "/api/chat/sessions");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "file");
  assert.equal(response.body.sessions.length, 2);
  assert.deepEqual(
    response.body.sessions.map((session: { sessionId: string }) => session.sessionId).sort(),
    [DEFAULT_CHAT_SESSION_ID, "session-alpha"].sort()
  );
});

test("chat session route returns the requested persisted snapshot", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "remembered reply"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "Please remember this route-level session test."
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.session.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.session.messages.length, 2);
  assert.equal(response.body.session.messages[0]?.content, "Please remember this route-level session test.");
  assert.equal(response.body.session.messages[1]?.content, "remembered reply");
  assert.equal(response.body.session.memoryArchive.length, 1);
  assert.equal(
    response.body.session.memoryArchive[0]?.content,
    "Please remember this route-level session test"
  );
  assert.equal(response.body.session.relationship.stage, "new");
  assert.equal(response.body.session.relationship.affinityScore, 0.256);
  assert.equal(response.body.session.relationship.trustScore, 0.25);
  assert.equal(response.body.session.proactiveCarePolicy.enabled, true);
  assert.equal(response.body.session.proactiveCarePolicy.maxDailyReachouts, 2);
  assert.equal(response.body.session.proactiveCareState.dailyReachoutsSent, 0);
  assert.equal(response.body.session.proactiveCareState.unansweredReachoutCount, 0);
  assert.equal(response.body.session.timelineEvents.length, 1);
  assert.equal(
    response.body.session.timelineEvents[0]?.description,
    "Please remember this route-level session test."
  );
});

test("chat turn route forwards permissioned local time context to the provider request", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  let recordedInstruction = "";
  globalThis.fetch = (async (_input, init) => {
    const body = init?.body ? (JSON.parse(String(init.body)) as {
      messages?: Array<{ role?: string; content?: string }>;
    }) : {};
    recordedInstruction =
      body.messages?.find((message) => message.role === "system")?.content ?? "";

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "time-aware reply"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }) as typeof fetch;

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "What time is it right now?",
    timeContext: {
      localTimeIso: "2026-06-21T21:30:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "zh-CN"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.match(
    response.body.reply,
    /(05:30|5:30|2026年6月22日)/i
  );
  assert.equal(recordedInstruction, "");
});

test("chat proactive settings route persists proactive policy and state for later evaluation", async () => {
  const middleware = createProviderApiMiddleware();

  const settingsResponse = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/chat/proactive/settings",
    {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      policy: {
        enabled: true,
        quietHoursStart: "00:00",
        quietHoursEnd: "06:00",
        maxDailyReachouts: 3,
        allowAbsenceCheckins: true
      },
      state: {
        dailyReachoutsSent: 1,
        unansweredReachoutCount: 2,
        lastReachOutAt: "2026-06-20T08:00:00.000Z"
      }
    }
  );

  assert.equal(settingsResponse.statusCode, 200);
  assert.equal(settingsResponse.body.session.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(settingsResponse.body.session.proactiveCarePolicy.enabled, true);
  assert.equal(settingsResponse.body.session.proactiveCarePolicy.maxDailyReachouts, 3);
  assert.equal(settingsResponse.body.session.proactiveCareState.dailyReachoutsSent, 1);
  assert.equal(settingsResponse.body.session.proactiveCareState.unansweredReachoutCount, 2);
  assert.equal(
    settingsResponse.body.session.proactiveCareState.lastReachOutAt,
    "2026-06-20T08:00:00.000Z"
  );

  const evaluateResponse = await invokeJsonRoute(
    middleware,
    "POST",
    "/api/chat/proactive/evaluate",
    {
      sessionId: DEFAULT_CHAT_SESSION_ID,
      now: "2026-06-21T12:00:00.000Z"
    }
  );

  assert.equal(evaluateResponse.statusCode, 200);
  assert.equal(evaluateResponse.body.session.proactiveCarePolicy.enabled, true);
  assert.equal(evaluateResponse.body.session.proactiveCareState.dailyReachoutsSent, 1);
  assert.equal(evaluateResponse.body.decision.shouldReachOut, false);
  assert.equal(evaluateResponse.body.draft.deliveryKind, "wait");
  assert.equal(evaluateResponse.body.draft.tone, "hold");
  assert.match(
    evaluateResponse.body.draft.suggestedMessage,
    /Waiting is the better move right now|褰撳墠鏇撮€傚悎绛夊緟/
  );
  assert.equal(
    evaluateResponse.body.decision.reasons.includes("awaiting_user_response"),
    true
  );

  const sessionResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(sessionResponse.statusCode, 200);
  assert.equal(sessionResponse.body.session.proactiveCarePolicy.enabled, true);
  assert.equal(sessionResponse.body.session.proactiveCareState.dailyReachoutsSent, 1);
  assert.equal(sessionResponse.body.session.proactiveCareState.unansweredReachoutCount, 2);
});

test("chat proactive evaluation route returns a read-only decision without requiring provider config", async () => {
  const imported = importChatSession({
    schemaVersion: "waveary-session@1",
    exportedAt: "2026-06-21T12:00:00.000Z",
    sessionId: "session-proactive-source",
    title: "Proactive Evaluation Session",
    snapshot: {
      sessionId: "session-proactive-source",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "I have been under a lot of stress lately.",
          sessionId: "session-proactive-source",
          timestamp: "2026-06-19T20:00:00.000Z",
          metadata: {}
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "I am here with you.",
          sessionId: "session-proactive-source",
          timestamp: "2026-06-19T20:01:00.000Z",
          metadata: {}
        }
      ],
      latestInsights: null,
      proactiveCarePolicy: {
        enabled: true,
        quietHoursStart: "23:00",
        quietHoursEnd: "08:00",
        maxDailyReachouts: 2,
        allowMealCare: true,
        allowSleepCare: true,
        allowAbsenceCheckins: true
      },
      proactiveCareState: {
        dailyReachoutsSent: 0,
        unansweredReachoutCount: 0
      },
      memoryArchive: [],
      relationship: {
        userId: "user-web-1",
        stage: "warming",
        affinityScore: 0.48,
        trustScore: 0.46,
        stabilityScore: 0.58,
        lastUpdatedAt: "2026-06-19T20:01:00.000Z"
      },
      timelineEvents: [],
      updatedAt: "2026-06-21T11:00:00.000Z"
    }
  });

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/proactive/evaluate", {
    sessionId: imported.session.sessionId,
    now: "2026-06-21T10:30:00.000Z",
    timeContext: {
      localTimeIso: "2026-06-21T10:30:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "zh-CN"
    },
    policy: {
      enabled: true
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.session.sessionId, imported.session.sessionId);
  assert.equal(response.body.decision.shouldReachOut, true);
  assert.equal(response.body.decision.intent, "absence_reachout");
  assert.equal(response.body.decision.urgency, "medium");
  assert.equal(response.body.draft.tone, "warm");
  assert.match(response.body.draft.suggestedMessage, /(check in|tonight|today|晚上|今天)/i);
  assert.equal(response.body.decision.reasons.includes("long_absence_gap"), true);
  assert.equal(response.body.session.proactiveCarePolicy.enabled, true);
  assert.equal(response.body.session.proactiveCareState.dailyReachoutsSent, 0);
});

test("chat proactive settings route can record a delivered reachout that suppresses the next evaluation", async () => {
  const imported = importChatSession({
    schemaVersion: "waveary-session@1",
    exportedAt: "2026-06-21T12:00:00.000Z",
    sessionId: "session-proactive-delivery-source",
    title: "Delivered Reachout Session",
    snapshot: {
      sessionId: "session-proactive-delivery-source",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "I have been feeling off lately.",
          sessionId: "session-proactive-delivery-source",
          timestamp: "2026-06-19T20:00:00.000Z",
          metadata: {}
        }
      ],
      latestInsights: null,
      proactiveCarePolicy: {
        enabled: true,
        quietHoursStart: "23:00",
        quietHoursEnd: "08:00",
        maxDailyReachouts: 2,
        allowMealCare: true,
        allowSleepCare: true,
        allowAbsenceCheckins: true
      },
      proactiveCareState: {
        dailyReachoutsSent: 0,
        unansweredReachoutCount: 0
      },
      memoryArchive: [],
      relationship: {
        userId: "user-web-1",
        stage: "warming",
        affinityScore: 0.48,
        trustScore: 0.46,
        stabilityScore: 0.58,
        lastUpdatedAt: "2026-06-19T20:01:00.000Z"
      },
      timelineEvents: [],
      updatedAt: "2026-06-21T11:00:00.000Z"
    }
  });

  const middleware = createProviderApiMiddleware();
  const firstEvaluation = await invokeJsonRoute(middleware, "POST", "/api/chat/proactive/evaluate", {
    sessionId: imported.session.sessionId,
    now: "2026-06-21T10:30:00.000Z"
  });

  assert.equal(firstEvaluation.statusCode, 200);
  assert.equal(firstEvaluation.body.decision.shouldReachOut, true);

  const deliveryRecord = await invokeJsonRoute(middleware, "POST", "/api/chat/proactive/settings", {
    sessionId: imported.session.sessionId,
    state: {
      dailyReachoutsSent: 1,
      unansweredReachoutCount: 1,
      lastReachOutAt: "2026-06-21T10:30:00.000Z"
    }
  });

  assert.equal(deliveryRecord.statusCode, 200);
  assert.equal(deliveryRecord.body.session.proactiveCareState.dailyReachoutsSent, 1);
  assert.equal(deliveryRecord.body.session.proactiveCareState.unansweredReachoutCount, 1);
  assert.equal(
    deliveryRecord.body.session.proactiveCareState.lastReachOutAt,
    "2026-06-21T10:30:00.000Z"
  );

  const secondEvaluation = await invokeJsonRoute(middleware, "POST", "/api/chat/proactive/evaluate", {
    sessionId: imported.session.sessionId,
    now: "2026-06-21T11:00:00.000Z"
  });

  assert.equal(secondEvaluation.statusCode, 200);
  assert.equal(secondEvaluation.body.decision.shouldReachOut, false);
  assert.equal(
    secondEvaluation.body.decision.reasons.includes("awaiting_user_response"),
    true
  );
});

test("chat turn clears unanswered proactive reachouts after the user replies", async () => {
  const imported = importChatSession({
    schemaVersion: "waveary-session@1",
    exportedAt: "2026-06-21T12:00:00.000Z",
    sessionId: "session-proactive-reply-source",
    title: "Reply Reset Session",
    snapshot: {
      sessionId: "session-proactive-reply-source",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "I was having a rough day.",
          sessionId: "session-proactive-reply-source",
          timestamp: "2026-06-19T20:00:00.000Z",
          metadata: {}
        }
      ],
      latestInsights: null,
      proactiveCarePolicy: {
        enabled: true,
        quietHoursStart: "23:00",
        quietHoursEnd: "08:00",
        maxDailyReachouts: 3,
        allowMealCare: true,
        allowSleepCare: true,
        allowAbsenceCheckins: true
      },
      proactiveCareState: {
        dailyReachoutsSent: 1,
        unansweredReachoutCount: 1,
        lastReachOutAt: "2026-06-21T10:30:00.000Z"
      },
      memoryArchive: [],
      relationship: {
        userId: "user-web-1",
        stage: "warming",
        affinityScore: 0.48,
        trustScore: 0.46,
        stabilityScore: 0.58,
        lastUpdatedAt: "2026-06-19T20:01:00.000Z"
      },
      timelineEvents: [],
      updatedAt: "2026-06-21T11:00:00.000Z"
    }
  });

  const middleware = createProviderApiMiddleware();
  const blockedEvaluation = await invokeJsonRoute(middleware, "POST", "/api/chat/proactive/evaluate", {
    sessionId: imported.session.sessionId,
    now: "2026-06-21T11:00:00.000Z"
  });

  assert.equal(blockedEvaluation.statusCode, 200);
  assert.equal(blockedEvaluation.body.decision.shouldReachOut, false);
  assert.equal(
    blockedEvaluation.body.decision.reasons.includes("awaiting_user_response"),
    true
  );

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "I am glad you replied."
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const turnResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: imported.session.sessionId,
    message: "I am here now."
  });

  assert.equal(turnResponse.statusCode, 200);

  const sessionResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: imported.session.sessionId
  });

  assert.equal(sessionResponse.statusCode, 200);
  assert.equal(sessionResponse.body.session.proactiveCareState.dailyReachoutsSent, 1);
  assert.equal(sessionResponse.body.session.proactiveCareState.unansweredReachoutCount, 0);
  assert.equal(
    sessionResponse.body.session.proactiveCareState.lastReachOutAt,
    "2026-06-21T10:30:00.000Z"
  );

  const reopenedEvaluation = await invokeJsonRoute(middleware, "POST", "/api/chat/proactive/evaluate", {
    sessionId: imported.session.sessionId,
    now: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  });

  assert.equal(reopenedEvaluation.statusCode, 200);
  assert.equal(
    reopenedEvaluation.body.decision.reasons.includes("awaiting_user_response"),
    false
  );
  assert.equal(reopenedEvaluation.body.decision.shouldReachOut, true);
});

test("chat session export route returns a structured export package for the active session", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "export reply"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "Please export this session memory package."
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/export", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.exported.schemaVersion, "waveary-session@1");
  assert.equal(response.body.exported.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.exported.title, "Main Companion Session");
  assert.equal(response.body.exported.snapshot.messages.length, 2);
  assert.equal(response.body.exported.snapshot.memoryArchive.length, 1);
  assert.equal(response.body.exported.snapshot.timelineEvents.length, 1);
  assert.equal(response.body.exported.snapshot.proactiveCarePolicy.enabled, true);
  assert.equal(response.body.exported.snapshot.proactiveCareState.dailyReachoutsSent, 0);
  assert.equal(
    response.body.exported.snapshot.memoryArchive[0]?.content,
    "Please export this session memory package"
  );
});

test("chat session import route restores an exported package as a new session", async () => {
  const middleware = createProviderApiMiddleware();

  const exported = {
    schemaVersion: "waveary-session@1",
    exportedAt: "2026-06-20T00:00:00.000Z",
    sessionId: "session-original",
    title: "Imported Reflection Session",
    snapshot: {
      sessionId: "session-original",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "I want to preserve this imported reflection.",
          sessionId: "session-original"
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "This session is now ready to be imported.",
          sessionId: "session-original"
        }
      ],
      latestInsights: null,
      proactiveCarePolicy: {
        enabled: true,
        quietHoursStart: "22:30",
        quietHoursEnd: "07:30",
        maxDailyReachouts: 4,
        allowMealCare: true,
        allowSleepCare: false,
        allowAbsenceCheckins: true
      },
      proactiveCareState: {
        dailyReachoutsSent: 2,
        unansweredReachoutCount: 1,
        lastReachOutAt: "2026-06-20T00:00:00.000Z"
      },
      memoryArchive: [
        {
          id: "memory-1",
          type: "reflection",
          content: "I want to preserve this imported reflection.",
          importance: 0.7,
          createdAt: "2026-06-20T00:00:00.000Z"
        }
      ],
      relationship: {
        stage: "growing",
        affinityScore: 0.55,
        trustScore: 0.51,
        stabilityScore: 0.62,
        lastUpdatedAt: "2026-06-20T00:00:00.000Z"
      },
      timelineEvents: [
        {
          id: "timeline-1",
          title: "Imported reflection",
          description: "I want to preserve this imported reflection.",
          type: "reflection",
          eventTime: "2026-06-20T00:00:00.000Z",
          importance: 0.7
        }
      ],
      updatedAt: "2026-06-20T00:00:00.000Z"
    }
  };

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported,
    title: "Recovered Session"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.imported.importedFromSessionId, "session-original");
  assert.equal(response.body.imported.importedTitle, "Recovered Session");
  assert.notEqual(response.body.imported.session.sessionId, "session-original");
  assert.equal(response.body.imported.session.messages.length, 2);
  assert.equal(response.body.imported.session.proactiveCarePolicy.enabled, true);
  assert.equal(response.body.imported.session.proactiveCarePolicy.allowSleepCare, false);
  assert.equal(response.body.imported.session.proactiveCareState.dailyReachoutsSent, 2);
  assert.equal(
    response.body.imported.session.proactiveCareState.lastReachOutAt,
    "2026-06-20T00:00:00.000Z"
  );
  assert.equal(response.body.imported.session.memoryArchive.length, 1);
  assert.equal(response.body.imported.session.timelineEvents.length, 1);
  assert.equal(
    response.body.sessions.some((session: { title: string }) => session.title === "Recovered Session"),
    true
  );
});

test("chat session import route returns validation details for malformed packages", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      exportedAt: "",
      title: "",
      snapshot: {
        latestInsights: undefined,
        proactiveCarePolicy: {
          enabled: "yes",
          quietHoursStart: 2300,
          maxDailyReachouts: -1,
          allowMealCare: "sometimes"
        },
        proactiveCareState: {
          dailyReachoutsSent: -2,
          unansweredReachoutCount: "many",
          lastReachOutAt: "later"
        },
        relationship: undefined,
        messages: [{}],
        memoryArchive: [{}],
        timelineEvents: [{}]
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "Missing `sessionId`.",
    "Missing `exportedAt`.",
    "Missing `title`.",
    "Missing `snapshot.updatedAt`.",
    "Missing `snapshot.latestInsights`.",
    "Missing `snapshot.relationship`.",
    "`snapshot.proactiveCarePolicy.enabled` must be a boolean.",
    "`snapshot.proactiveCarePolicy.quietHoursStart` must be a string if present.",
    "`snapshot.proactiveCarePolicy.maxDailyReachouts` must be 0 or greater.",
    "`snapshot.proactiveCarePolicy.allowMealCare` must be a boolean.",
    "`snapshot.proactiveCarePolicy.allowSleepCare` must be a boolean.",
    "`snapshot.proactiveCarePolicy.allowAbsenceCheckins` must be a boolean.",
    "`snapshot.proactiveCareState.dailyReachoutsSent` must be 0 or greater.",
    "`snapshot.proactiveCareState.unansweredReachoutCount` must be a number.",
    "`snapshot.proactiveCareState.lastReachOutAt` must be a valid ISO timestamp if present.",
    "Message 1 is missing a string `role`.",
    "Message 1 is missing a string `content`.",
    "Memory item 1 is missing a string `type`.",
    "Memory item 1 is missing a string `content`.",
    "Memory item 1 is missing a numeric `importance`.",
    "Memory item 1 is missing a string `createdAt`.",
    "Timeline event 1 is missing a string `title`.",
    "Timeline event 1 is missing a string `description`.",
    "Timeline event 1 is missing a string `type`.",
    "Timeline event 1 is missing a string `eventTime`.",
    "Timeline event 1 is missing a numeric `importance`."
  ]);
});

test("chat session import route accepts legacy packages without schemaVersion", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      exportedAt: "2026-06-20T00:00:00.000Z",
      sessionId: "legacy-session",
      title: "Legacy Session",
      snapshot: {
        sessionId: "legacy-session",
        messages: [
          {
            id: "user-1",
            role: "user",
            content: "This package was exported before schema versions existed.",
            sessionId: "legacy-session"
          }
        ],
        latestInsights: null,
        memoryArchive: [],
        relationship: null,
        timelineEvents: [],
        updatedAt: "2026-06-20T00:00:00.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.imported.importedFromSessionId, "legacy-session");
  assert.equal(response.body.imported.session.messages.length, 1);
});

test("chat session import route rejects unsupported schema versions", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@2",
      exportedAt: "2026-06-20T00:00:00.000Z",
      sessionId: "future-session",
      title: "Future Session",
      snapshot: {
        sessionId: "future-session",
        messages: [],
        latestInsights: null,
        memoryArchive: [],
        relationship: null,
        timelineEvents: [],
        updatedAt: "2026-06-20T00:00:00.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "Unsupported `schemaVersion` \"waveary-session@2\". Supported version: `waveary-session@1`."
  ]);
});

test("chat session import route rejects malformed relationship and latest insights payloads", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@1",
      exportedAt: "2026-06-20T00:00:00.000Z",
      sessionId: "broken-signals",
      title: "Broken Signals",
      snapshot: {
        sessionId: "broken-signals",
        messages: [],
        latestInsights: {
          reply: 123,
          relationship: {
            stage: 7,
            affinityScore: "high",
            trustScore: null,
            stabilityScore: "steady"
          },
          recalledMemories: [42],
          storedMemories: [true],
          timeline: [{}],
          emotion: {
            primaryEmotion: 8,
            intensity: "strong"
          }
        },
        memoryArchive: [],
        relationship: {
          stage: 7,
          affinityScore: "high",
          trustScore: null,
          stabilityScore: "steady"
        },
        timelineEvents: [],
        updatedAt: "2026-06-20T00:00:00.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "`snapshot.latestInsights.reply` must be a string.",
    "`snapshot.latestInsights.relationship.stage` must be a string.",
    "`snapshot.latestInsights.relationship.affinityScore` must be a number.",
    "`snapshot.latestInsights.relationship.trustScore` must be a number.",
    "`snapshot.latestInsights.relationship.stabilityScore` must be a number.",
    "`snapshot.latestInsights.relationship.lastUpdatedAt` must be a string.",
    "Recalled memory 1 in `snapshot.latestInsights.recalledMemories` must be a string.",
    "Stored memory 1 in `snapshot.latestInsights.storedMemories` must be a string.",
    "Latest insight timeline entry 1 is missing a string `title`.",
    "Latest insight timeline entry 1 is missing a string `type`.",
    "Latest insight timeline entry 1 is missing a string `eventTime`.",
    "`snapshot.latestInsights.emotion.primaryEmotion` must be a string.",
    "`snapshot.latestInsights.emotion.intensity` must be a number.",
    "`snapshot.relationship.stage` must be a string.",
    "`snapshot.relationship.affinityScore` must be a number.",
    "`snapshot.relationship.trustScore` must be a number.",
    "`snapshot.relationship.stabilityScore` must be a number.",
    "`snapshot.relationship.lastUpdatedAt` must be a string."
  ]);
});

test("chat session import route rejects invalid timestamps, roles, and score ranges", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@1",
      exportedAt: "not-a-time",
      sessionId: "bad-values",
      title: "Bad Values",
      snapshot: {
        sessionId: "bad-values",
        messages: [
          {
            id: "system-1",
            role: "system",
            content: "unsupported role",
            sessionId: "bad-values"
          }
        ],
        latestInsights: {
          reply: "still here",
          relationship: {
            stage: "growing",
            affinityScore: 1.5,
            trustScore: -0.1,
            stabilityScore: 2,
            lastUpdatedAt: "yesterday"
          },
          recalledMemories: [],
          storedMemories: [],
          timeline: [
            {
              title: "Bad timeline time",
              type: "reflection",
              eventTime: "soon"
            }
          ],
          emotion: {
            primaryEmotion: "calm",
            intensity: 1.2
          }
        },
        memoryArchive: [
          {
            id: "memory-1",
            type: "reflection",
            content: "bad importance",
            importance: 1.4,
            createdAt: "later"
          }
        ],
        relationship: {
          stage: "growing",
          affinityScore: 1.1,
          trustScore: -0.4,
          stabilityScore: 5,
          lastUpdatedAt: "tomorrow"
        },
        timelineEvents: [
          {
            id: "timeline-1",
            title: "Bad score",
            description: "Bad score and time",
            type: "reflection",
            eventTime: "eventually",
            importance: -1
          }
        ],
        updatedAt: "invalid-updated-at"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "`exportedAt` must be a valid ISO timestamp.",
    "`snapshot.updatedAt` must be a valid ISO timestamp.",
    "`snapshot.latestInsights.relationship.affinityScore` must be between 0 and 1.",
    "`snapshot.latestInsights.relationship.trustScore` must be between 0 and 1.",
    "`snapshot.latestInsights.relationship.stabilityScore` must be between 0 and 1.",
    "`snapshot.latestInsights.relationship.lastUpdatedAt` must be a valid ISO timestamp.",
    "Latest insight timeline entry 1 `eventTime` must be a valid ISO timestamp.",
    "`snapshot.latestInsights.emotion.intensity` must be between 0 and 1.",
    "`snapshot.relationship.affinityScore` must be between 0 and 1.",
    "`snapshot.relationship.trustScore` must be between 0 and 1.",
    "`snapshot.relationship.stabilityScore` must be between 0 and 1.",
    "`snapshot.relationship.lastUpdatedAt` must be a valid ISO timestamp.",
    "Message 1 has unsupported `role` \"system\". Supported roles: `user`, `assistant`.",
    "Memory item 1 `importance` must be between 0 and 1.",
    "Memory item 1 `createdAt` must be a valid ISO timestamp.",
    "Timeline event 1 `eventTime` must be a valid ISO timestamp.",
    "Timeline event 1 `importance` must be between 0 and 1."
  ]);
});

test("chat session import route rejects semantically inconsistent session packages", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@1",
      exportedAt: "2026-06-20T00:00:05.000Z",
      sessionId: "outer-session",
      title: "Inconsistent Session",
      snapshot: {
        sessionId: "inner-session",
        messages: [
          {
            id: "user-0",
            role: "user",
            content: "Earlier message in the array.",
            sessionId: "inner-session",
            createdAt: "2026-06-20T00:00:09.000Z"
          },
          {
            id: "user-1",
            role: "user",
            content: "Mismatched session id on message.",
            sessionId: "wrong-message-session",
            createdAt: "2026-06-20T00:00:11.000Z"
          },
          {
            id: "assistant-2",
            role: "assistant",
            content: "This timestamp goes backwards.",
            sessionId: "inner-session",
            createdAt: "2026-06-20T00:00:08.000Z"
          },
          {
            id: "user-1",
            role: "user",
            content: "Duplicate message identity.",
            sessionId: "inner-session",
            createdAt: "2026-06-20T00:00:09.600Z"
          }
        ],
        latestInsights: {
          reply: "reply",
          relationship: {
            stage: "growing",
            affinityScore: 0.5,
            trustScore: 0.5,
            stabilityScore: 0.5,
            lastUpdatedAt: "2026-06-20T00:00:12.000Z"
          },
          recalledMemories: [
            "Duplicate memory identity.",
            "Insight-only recalled memory."
          ],
          storedMemories: [
            "Late memory",
            "Insight-only stored memory."
          ],
          timeline: [
            {
              title: "Later timeline event first",
              type: "reflection",
              eventTime: "2026-06-20T00:00:09.700Z"
            },
            {
              title: "Late timeline event",
              type: "reflection",
              eventTime: "2026-06-20T00:00:16.000Z"
            },
            {
              title: "Out of order timeline event",
              type: "reflection",
              eventTime: "2026-06-20T00:00:09.300Z"
            },
            {
              title: "Insight-only event",
              type: "reflection",
              eventTime: "2026-06-20T00:00:09.250Z"
            }
          ]
        },
        memoryArchive: [
          {
            id: "memory-1",
            type: "reflection",
            content: "Late memory",
            importance: 0.7,
            createdAt: "2026-06-20T00:00:14.000Z"
          },
          {
            id: "memory-1",
            type: "reflection",
            content: "Duplicate memory identity.",
            importance: 0.6,
            createdAt: "2026-06-20T00:00:09.100Z"
          }
        ],
        relationship: {
          stage: "growing",
          affinityScore: 0.55,
          trustScore: 0.52,
          stabilityScore: 0.61,
          lastUpdatedAt: "2026-06-20T00:00:15.000Z"
        },
        timelineEvents: [
          {
            id: "timeline-0",
            title: "Later timeline event first",
            description: "Comes before a smaller timestamp.",
            type: "reflection",
            eventTime: "2026-06-20T00:00:09.700Z",
            importance: 0.6
          },
          {
            id: "timeline-1",
            title: "Late timeline event",
            description: "Occurs after snapshot update.",
            type: "reflection",
            eventTime: "2026-06-20T00:00:16.000Z",
            importance: 0.6
          },
          {
            id: "timeline-2",
            title: "Out of order timeline event",
            description: "Earlier than the previous event.",
            type: "reflection",
            eventTime: "2026-06-20T00:00:09.300Z",
            importance: 0.6
          },
          {
            id: "timeline-1",
            title: "Duplicate timeline identity",
            description: "Reuses an earlier event id.",
            type: "reflection",
            eventTime: "2026-06-20T00:00:09.400Z",
            importance: 0.6
          }
        ],
        updatedAt: "2026-06-20T00:00:10.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "`sessionId` must match `snapshot.sessionId`.",
    "Message 2 `sessionId` must match `snapshot.sessionId`.",
    "Message 2 `createdAt` cannot be later than `snapshot.updatedAt`.",
    "Memory item 1 `createdAt` cannot be later than `snapshot.updatedAt`.",
    "Timeline event 2 `eventTime` cannot be later than `snapshot.updatedAt`.",
    "`snapshot.updatedAt` cannot be later than `exportedAt`.",
    "Message 3 `createdAt` cannot be earlier than the previous message timestamp.",
    "Message 4 `id` duplicates an earlier message ID.",
    "Timeline event 3 `eventTime` cannot be earlier than the previous timeline event.",
    "Timeline event 4 `id` duplicates an earlier timeline event ID.",
    "Memory item 2 `id` duplicates an earlier memory item ID.",
    "`snapshot.relationship.lastUpdatedAt` cannot be later than `snapshot.updatedAt`.",
    "`snapshot.latestInsights.relationship` must match `snapshot.relationship` for stage, scores, and `lastUpdatedAt`.",
    "`snapshot.latestInsights.relationship.lastUpdatedAt` cannot be later than `snapshot.updatedAt`.",
    "Recalled memory 2 in `snapshot.latestInsights.recalledMemories` must match a memory item in `snapshot.memoryArchive`.",
    "Stored memory 2 in `snapshot.latestInsights.storedMemories` must match a memory item in `snapshot.memoryArchive`.",
    "Latest insight timeline entry 2 `eventTime` cannot be later than `snapshot.updatedAt`.",
    "Latest insight timeline entry 3 `eventTime` cannot be earlier than the previous latest insight timeline entry.",
    "Latest insight timeline entry 4 must match an event in `snapshot.timelineEvents`.",
    "Latest insight timeline entry 4 `eventTime` cannot be earlier than the previous latest insight timeline entry."
  ]);
});

test("chat session format route returns import safety guidance and sample package", async () => {
  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "GET", "/api/chat/session/format");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reference.currentSchemaVersion, "waveary-session@1");
  assert.equal(response.body.reference.importMode, "new-session-only");
  assert.equal(response.body.reference.docs.formatPath, "docs/session-file-format.md");
  assert.equal(response.body.reference.docs.samplePath, "docs/examples/session-export.sample.json");
  assert.deepEqual(response.body.reference.topLevelFields, [
    "schemaVersion",
    "exportedAt",
    "sessionId",
    "title",
    "snapshot"
  ]);
  assert.equal(response.body.reference.sample.schemaVersion, "waveary-session@1");
  assert.deepEqual(response.body.reference.requiredSnapshotCollections, [
    "messages",
    "memoryArchive",
    "timelineEvents"
  ]);
  assert.equal(response.body.reference.sample.sessionId, "waveary-main");
  assert.equal(response.body.reference.sample.title, "Main Companion Session");
  assert.equal(response.body.reference.sample.snapshot.messages.length, 2);
});

test("chat session rename route updates non-default sessions and keeps persistence payload", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-rename", "Before Rename");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/rename", {
    sessionId: "session-rename",
    title: "After Rename"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "file");
  assert.equal(response.body.session.sessionId, "session-rename");
  assert.equal(
    response.body.sessions.find((session: { sessionId: string }) => session.sessionId === "session-rename")?.title,
    "After Rename"
  );
});

test("chat session rename route rejects the default session", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/rename", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    title: "Should Fail"
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "The default main session cannot be renamed.");
});

test("chat session delete route removes optional sessions and preserves the default session", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-delete", "Delete Me");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/delete", {
    sessionId: "session-delete"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "file");
  assert.deepEqual(
    response.body.sessions.map((session: { sessionId: string }) => session.sessionId),
    [DEFAULT_CHAT_SESSION_ID]
  );
});

test("chat session delete route rejects deleting the default session", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/delete", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "The default main session cannot be deleted.");
});

test("chat session reset route clears the active session while preserving it in the session list", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "reset me"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "Please create some history before reset."
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/reset", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.session.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.session.messages.length, 0);
  assert.equal(response.body.session.latestInsights, null);
  assert.equal(response.body.session.memoryArchive.length, 0);
  assert.equal(response.body.session.relationship, null);
  assert.equal(response.body.session.timelineEvents.length, 0);
  assert.equal(
    response.body.sessions.some((session: { sessionId: string }) => session.sessionId === DEFAULT_CHAT_SESSION_ID),
    true
  );

  const restored = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(restored.statusCode, 200);
  assert.equal(restored.body.session.messages.length, 0);
  assert.equal(restored.body.session.latestInsights, null);
  assert.equal(restored.body.session.memoryArchive.length, 0);
  assert.equal(restored.body.session.relationship, null);
  assert.equal(restored.body.session.timelineEvents.length, 0);
});

test("provider models route returns normalized provider models for the browser flow", async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        models: [
          "deepseek-chat",
          {
            name: "qwen-turbo",
            display_name: "Qwen Turbo",
            context_length: 131072
          },
          {
            id: "qwen-turbo",
            label: "Duplicate"
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/provider/models", {
    provider: "dashscope",
    baseURL: "https://provider.example/v1",
    apiKey: "test-key"
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.models, [
    { id: "deepseek-chat", provider: "dashscope" },
    {
      id: "qwen-turbo",
      provider: "dashscope",
      label: "Qwen Turbo",
      contextWindow: 131072
    }
  ]);
});

async function invokeJsonRoute(
  middleware: ReturnType<typeof createProviderApiMiddleware>,
  method: string,
  url: string,
  payload?: unknown
): Promise<{ statusCode: number; body: any }> {
  const request = createJsonRequest(method, url, payload);
  const response = createResponseCapture();

  await middleware(request, response.serverResponse, (error?: unknown) => {
    if (error) {
      throw error;
    }
  });

  return {
    statusCode: response.serverResponse.statusCode,
    body: response.getBody() ? (JSON.parse(response.getBody()) as any) : {}
  };
}

function createJsonRequest(
  method: string,
  url: string,
  payload?: unknown
): IncomingMessage {
  const rawBody = payload === undefined ? "" : JSON.stringify(payload);
  const request = Readable.from(rawBody ? [rawBody] : []) as Readable & Partial<IncomingMessage>;

  request.method = method;
  request.url = url;
  request.headers = {
    "content-type": "application/json"
  };

  return request as IncomingMessage;
}

function createResponseCapture(): {
  serverResponse: ServerResponse;
  getBody: () => string;
} {
  const capture = {
    body: ""
  };

  const response = {
    statusCode: 200,
    setHeader() {
      return this;
    },
    end(chunk?: string | Buffer) {
      if (chunk) {
        capture.body += chunk.toString();
      }

      return this;
    }
  } as Partial<ServerResponse>;

  return {
    serverResponse: response as unknown as ServerResponse,
    getBody: () => capture.body
  };
}

function resetTestDataDir(): void {
  mkdirSync(TEST_DATA_DIR, { recursive: true });
  rmSync(join(TEST_DATA_DIR, "chat-sessions.json"), { force: true });
  rmSync(join(TEST_DATA_DIR, "chat-sessions.db"), { force: true });
  rmSync(join(TEST_DATA_DIR, "chat-persistence.json"), { force: true });
  rmSync(join(TEST_DATA_DIR, "provider-config.json"), { force: true });
  rmSync(join(TEST_DATA_DIR, "voice-config.json"), { force: true });
  saveChatPersistenceConfig(createDefaultChatPersistenceConfig());
}


