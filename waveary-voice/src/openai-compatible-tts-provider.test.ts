import assert from "node:assert/strict";
import { test } from "node:test";

import { OpenAICompatibleTextToSpeechProvider } from "./openai-compatible-tts-provider.js";

test("openai-compatible tts provider posts audio speech and returns base64 audio", async () => {
  let capturedUrl = "";
  let capturedBody = "";
  let capturedAuth = "";

  const provider = new OpenAICompatibleTextToSpeechProvider({
    provider: "openai",
    apiKey: "test-key",
    baseURL: "https://api.openai.com/v1",
    qualityProfile: "gentle",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      capturedAuth = String((init?.headers as Record<string, string>).Authorization);
      capturedBody = String(init?.body);

      return new Response(Buffer.from("fake-audio"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg"
        }
      });
    }) as typeof fetch
  });

  const result = await provider.synthesize({
    text: "Stay here with me for a little while.",
    locale: "en-US",
    relationshipStage: "growing",
    personaTone: "warm_companion",
    delivery: {
      style: "concerned",
      pace: "slower",
      closeness: "close",
      expressiveness: "restrained",
      instruction: "Speak with quiet reassurance and stay emotionally close."
    },
    emotion: {
      primaryEmotion: "concerned",
      intensity: 0.8
    }
  });

  assert.equal(capturedUrl, "https://api.openai.com/v1/audio/speech");
  assert.equal(capturedAuth, "Bearer test-key");
  assert.equal(result.mode, "audio");
  assert.equal(result.audio.mimeType, "audio/mpeg");
  assert.equal(Buffer.from(result.audio.base64, "base64").toString("utf8"), "fake-audio");

  const parsedBody = JSON.parse(capturedBody) as Record<string, unknown>;
  assert.equal(parsedBody.model, "gpt-4o-mini-tts");
  assert.equal(parsedBody.voice, "cedar");
  assert.equal(parsedBody.input, "Stay here with me for a little while.");
  assert.equal(typeof parsedBody.instructions, "string");
  assert.equal(typeof parsedBody.speed, "number");
  assert.equal(result.metadata.qualityProfile, "gentle");
  assert.match(String(parsedBody.instructions), /real human companion/i);
  assert.match(String(parsedBody.instructions), /quiet reassurance/i);
  assert.ok(Number(parsedBody.speed) < 1);
});

test("openai-compatible tts provider surfaces upstream errors", async () => {
  const provider = new OpenAICompatibleTextToSpeechProvider({
    provider: "openai",
    apiKey: "test-key",
    baseURL: "https://api.openai.com/v1",
    fetchFn: (async () =>
      new Response(JSON.stringify({ error: { message: "bad request" } }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      })) as typeof fetch
  });

  await assert.rejects(
    provider.synthesize({
      text: "test"
    }),
    /TTS request failed with status 400/
  );
});
