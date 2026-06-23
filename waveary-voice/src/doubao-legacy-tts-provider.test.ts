import assert from "node:assert/strict";
import { test } from "node:test";

import { DoubaoLegacyTextToSpeechProvider } from "./doubao-legacy-tts-provider.js";

test("doubao legacy tts provider posts api v1 request and returns base64 audio", async () => {
  let capturedUrl = "";
  let capturedAuthorization = "";
  let capturedBody = "";

  const provider = new DoubaoLegacyTextToSpeechProvider({
    accessToken: "legacy-token",
    appId: "3086540171",
    voiceType: "multi_female_shuangkuaisisi_moon_bigtts",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      const headers = init?.headers as Record<string, string>;
      capturedAuthorization = String(headers.Authorization);
      capturedBody = String(init?.body);

      return new Response(
        JSON.stringify({
          code: 3000,
          message: "Success",
          data: Buffer.from("legacy-doubao-audio").toString("base64")
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
    text: "hello legacy doubao",
    locale: "zh-CN"
  });

  assert.equal(capturedUrl, "https://openspeech.bytedance.com/api/v1/tts");
  assert.equal(capturedAuthorization, "Bearer;legacy-token");
  assert.equal(result.provider, "doubao-legacy");
  assert.equal(result.mode, "audio");
  assert.equal(result.metadata.voice, "multi_female_shuangkuaisisi_moon_bigtts");
  assert.equal(
    Buffer.from(result.audio.base64, "base64").toString("utf8"),
    "legacy-doubao-audio"
  );

  const parsedBody = JSON.parse(capturedBody) as {
    app: {
      appid: string;
      token: string;
      cluster: string;
    };
    user: {
      uid: string;
    };
    audio: {
      voice_type: string;
      encoding: string;
      speed_ratio: number;
      volume_ratio: number;
      pitch_ratio: number;
    };
    request: {
      reqid: string;
      text: string;
      text_type: string;
      operation: string;
    };
  };

  assert.equal(parsedBody.app.appid, "3086540171");
  assert.equal(parsedBody.app.token, "legacy-token");
  assert.equal(parsedBody.app.cluster, "volcano_tts");
  assert.equal(parsedBody.user.uid, "waveary-local-user");
  assert.equal(parsedBody.audio.voice_type, "multi_female_shuangkuaisisi_moon_bigtts");
  assert.equal(parsedBody.audio.encoding, "mp3");
  assert.equal(parsedBody.audio.volume_ratio, 1);
  assert.equal(parsedBody.audio.pitch_ratio, 1);
  assert.equal(parsedBody.request.text, "hello legacy doubao");
  assert.equal(parsedBody.request.text_type, "plain");
  assert.equal(parsedBody.request.operation, "query");
  assert.match(parsedBody.request.reqid, /^[0-9a-f-]{36}$/i);
});
