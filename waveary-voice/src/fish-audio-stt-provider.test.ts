import assert from "node:assert/strict";
import { test } from "node:test";

import { FishAudioSpeechToTextProvider } from "./fish-audio-stt-provider.js";

test("fish audio stt provider posts base64 audio json and returns transcript", async () => {
  let capturedUrl = "";
  let capturedAuth = "";
  let capturedBody = "";

  const provider = new FishAudioSpeechToTextProvider({
    apiKey: "fish-key",
    baseURL: "https://api.fish.audio",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      const headers = init?.headers as Record<string, string> | undefined;
      capturedAuth = String(headers?.Authorization ?? "");
      capturedBody = String(init?.body);

      return new Response(
        JSON.stringify({
          text: "I heard you clearly.",
          duration: 1.4,
          segments: []
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }) as typeof fetch
  });

  const result = await provider.transcribe({
    audio: {
      base64: Buffer.from("fake-audio").toString("base64"),
      mimeType: "audio/webm"
    },
    locale: "en-US"
  });

  assert.equal(capturedUrl, "https://api.fish.audio/v1/asr");
  assert.equal(capturedAuth, "Bearer fish-key");
  const parsedBody = JSON.parse(capturedBody) as Record<string, unknown>;
  assert.equal(parsedBody.audio, Buffer.from("fake-audio").toString("base64"));
  assert.equal(parsedBody.language, "en");
  assert.equal(parsedBody.ignore_timestamps, true);
  assert.equal(result.provider, "fish-audio");
  assert.equal(result.text, "I heard you clearly.");
  assert.equal(result.metadata?.model, "fish-audio-asr");
  assert.equal(result.metadata?.language, "en");
});

test("fish audio stt provider surfaces upstream errors", async () => {
  const provider = new FishAudioSpeechToTextProvider({
    apiKey: "fish-key",
    baseURL: "https://api.fish.audio",
    fetchFn: (async () =>
      new Response(JSON.stringify({ status: 401, message: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      })) as typeof fetch
  });

  await assert.rejects(
    provider.transcribe({
      audio: {
        base64: Buffer.from("fake-audio").toString("base64"),
        mimeType: "audio/webm"
      }
    }),
    /Fish Audio STT request failed with status 401/
  );
});
