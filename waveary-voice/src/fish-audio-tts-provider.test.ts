import assert from "node:assert/strict";
import { test } from "node:test";

import { FishAudioTextToSpeechProvider } from "./fish-audio-tts-provider.js";

test("fish audio tts provider posts model header and reference id", async () => {
  let capturedUrl = "";
  let capturedAuth = "";
  let capturedModelHeader = "";
  let capturedBody = "";

  const provider = new FishAudioTextToSpeechProvider({
    apiKey: "fish-key",
    baseURL: "https://api.fish.audio",
    model: "s2-pro",
    referenceId: "voice-model-123",
    format: "mp3",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      const headers = init?.headers as Record<string, string> | undefined;
      capturedAuth = String(headers?.Authorization ?? "");
      capturedModelHeader = String(headers?.model ?? "");
      capturedBody = String(init?.body);

      return new Response(Buffer.from("fish-audio"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg"
        }
      });
    }) as typeof fetch
  });

  const result = await provider.synthesize({
    text: "Stay here with me.",
    locale: "en-US",
    delivery: {
      style: "concerned",
      pace: "slower",
      expressiveness: "restrained"
    },
    emotion: {
      primaryEmotion: "concerned",
      intensity: 0.82
    }
  });

  assert.equal(capturedUrl, "https://api.fish.audio/v1/tts");
  assert.equal(capturedAuth, "Bearer fish-key");
  assert.equal(capturedModelHeader, "s2-pro");
  assert.equal(result.provider, "fish-audio");
  assert.equal(result.mode, "audio");
  assert.equal(Buffer.from(result.audio.base64, "base64").toString("utf8"), "fish-audio");

  const parsedBody = JSON.parse(capturedBody) as Record<string, unknown>;
  assert.equal(parsedBody.text, "Stay here with me.");
  assert.equal(parsedBody.reference_id, "voice-model-123");
  assert.equal(parsedBody.top_p, 0.7);
});

test("fish audio tts provider surfaces upstream errors", async () => {
  const provider = new FishAudioTextToSpeechProvider({
    apiKey: "fish-key",
    baseURL: "https://api.fish.audio",
    referenceId: "voice-model-123",
    fetchFn: (async () =>
      new Response(JSON.stringify({ status: 402, message: "payment required" }), {
        status: 402,
        headers: {
          "Content-Type": "application/json"
        }
      })) as typeof fetch
  });

  await assert.rejects(
    provider.synthesize({
      text: "test"
    }),
    /Fish Audio TTS request failed with status 402/
  );
});

test("fish audio tts provider surfaces network timeout details", async () => {
  const provider = new FishAudioTextToSpeechProvider({
    apiKey: "fish-key",
    baseURL: "https://api.fish.audio",
    referenceId: "voice-model-123",
    fetchFn: (async () => {
      throw new TypeError("fetch failed", {
        cause: Object.assign(new Error("Connect Timeout Error"), {
          code: "UND_ERR_CONNECT_TIMEOUT"
        })
      });
    }) as typeof fetch
  });

  await assert.rejects(
    provider.synthesize({
      text: "test"
    }),
    /Fish Audio TTS request could not reach the upstream service\. Code: UND_ERR_CONNECT_TIMEOUT\. Cause: Connect Timeout Error/
  );
});
