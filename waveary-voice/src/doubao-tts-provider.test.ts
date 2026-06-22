import assert from "node:assert/strict";
import { test } from "node:test";

import { DoubaoTextToSpeechProvider } from "./doubao-tts-provider.js";

test("doubao tts provider posts byte-style request and returns base64 audio", async () => {
  let capturedUrl = "";
  let capturedAuth = "";
  let capturedBody = "";

  const provider = new DoubaoTextToSpeechProvider({
    apiKey: "doubao-key",
    appId: "doubao-app",
    voiceType: "BV001_streaming",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      capturedAuth = String((init?.headers as Record<string, string>).Authorization);
      capturedBody = String(init?.body);

      return new Response(
        JSON.stringify({
          code: 3000,
          message: "Success",
          data: Buffer.from("doubao-audio").toString("base64")
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

  const result = await provider.synthesize({
    text: "你好，我在。",
    locale: "zh-CN",
    emotion: {
      primaryEmotion: "concerned",
      intensity: 0.7
    }
  });

  assert.equal(capturedUrl, "https://openspeech.bytedance.com/api/v1/tts");
  assert.equal(capturedAuth, "Bearer;doubao-key");
  assert.equal(result.provider, "doubao");
  assert.equal(result.mode, "audio");
  assert.equal(result.metadata.voice, "BV001_streaming");
  assert.equal(Buffer.from(result.audio.base64, "base64").toString("utf8"), "doubao-audio");

  const parsedBody = JSON.parse(capturedBody) as {
    app: { appid: string; token: string; cluster: string };
    audio: { voice_type: string; encoding: string; speed_ratio: number };
    request: { text: string; text_type: string; operation: string; reqid: string };
  };

  assert.equal(parsedBody.app.appid, "doubao-app");
  assert.equal(parsedBody.app.token, "access_token");
  assert.equal(parsedBody.app.cluster, "volcano_tts");
  assert.equal(parsedBody.audio.voice_type, "BV001_streaming");
  assert.equal(parsedBody.audio.encoding, "mp3");
  assert.equal(parsedBody.request.text, "你好，我在。");
  assert.equal(parsedBody.request.text_type, "plain");
  assert.equal(parsedBody.request.operation, "submit");
  assert.equal(typeof parsedBody.request.reqid, "string");
});
