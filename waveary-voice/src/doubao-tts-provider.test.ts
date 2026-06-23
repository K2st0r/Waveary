import assert from "node:assert/strict";
import { test } from "node:test";

import { DoubaoTextToSpeechProvider } from "./doubao-tts-provider.js";

test("doubao tts provider posts api v3 unidirectional request and returns base64 audio", async () => {
  let capturedUrl = "";
  let capturedApiKey = "";
  let capturedResourceId = "";
  let capturedRequestId = "";
  let capturedBody = "";
  const fullAudioBase64 = Buffer.from("doubao-audio").toString("base64");

  const provider = new DoubaoTextToSpeechProvider({
    apiKey: "doubao-key",
    voiceType: "zh_female_gaolengyujie_uranus_bigtts",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      const headers = init?.headers as Record<string, string>;
      capturedApiKey = String(headers["x-api-key"]);
      capturedResourceId = String(headers["X-Api-Resource-Id"]);
      capturedRequestId = String(headers["X-Api-Request-Id"]);
      capturedBody = String(init?.body);

      return new Response(
        [
          JSON.stringify({
            code: 0,
            message: "",
            data: fullAudioBase64.slice(0, 8)
          }),
          JSON.stringify({
            code: 0,
            message: "",
            data: fullAudioBase64.slice(8)
          }),
          JSON.stringify({
            code: 20000000,
            message: "OK",
            data: null
          })
        ].join("\n"),
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
    text: "hello doubao",
    locale: "zh-CN"
  });

  assert.equal(capturedUrl, "https://openspeech.bytedance.com/api/v3/tts/unidirectional");
  assert.equal(capturedApiKey, "doubao-key");
  assert.equal(capturedResourceId, "seed-tts-2.0");
  assert.match(capturedRequestId, /^[0-9a-f-]{36}$/i);
  assert.equal(result.provider, "doubao");
  assert.equal(result.mode, "audio");
  assert.equal(result.metadata.voice, "zh_female_gaolengyujie_uranus_bigtts");
  assert.equal(Buffer.from(result.audio.base64, "base64").toString("utf8"), "doubao-audio");

  const parsedBody = JSON.parse(capturedBody) as {
    user: {
      uid: string;
    };
    req_params: {
      text: string;
      speaker: string;
      additions: string;
      audio_params: {
        format: string;
        sample_rate: number;
      };
    };
  };

  assert.equal(parsedBody.req_params.text, "hello doubao");
  assert.equal(parsedBody.user.uid, "waveary-local-user");
  assert.equal(parsedBody.req_params.speaker, "zh_female_gaolengyujie_uranus_bigtts");
  assert.equal(parsedBody.req_params.audio_params.format, "mp3");
  assert.equal(parsedBody.req_params.audio_params.sample_rate, 24000);

  const additions = JSON.parse(parsedBody.req_params.additions) as {
    disable_markdown_filter: boolean;
    enable_language_detector: boolean;
    enable_latex_tn: boolean;
    disable_default_bit_rate: boolean;
  };

  assert.equal(additions.disable_markdown_filter, true);
  assert.equal(additions.enable_language_detector, true);
  assert.equal(additions.enable_latex_tn, true);
  assert.equal(additions.disable_default_bit_rate, true);
});
