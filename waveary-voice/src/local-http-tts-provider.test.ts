import assert from "node:assert/strict";
import test from "node:test";

import { LocalHttpTextToSpeechProvider } from "./local-http-tts-provider.js";

test("local http tts provider accepts normalized json audio payloads", async () => {
  const provider = new LocalHttpTextToSpeechProvider({
    baseURL: "http://127.0.0.1:9880/",
    endpointPath: "tts",
    engine: "gpt-sovits",
    voice: "youthful",
    speaker: "speaker-a",
    referenceVoiceId: "ref-voice-1",
    format: "wav",
    apiKey: "local-token",
    fetchFn: (async (input, init) => {
      assert.equal(String(input), "http://127.0.0.1:9880/tts");
      assert.equal(init?.method, "POST");
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer local-token"
      );

      const body = JSON.parse(String(init?.body)) as {
        text: string;
        locale: string;
        engine: string;
        voice: string;
        speaker: string;
        referenceVoiceId: string;
        format: string;
      };

      assert.equal(body.text, "你好，我在。");
      assert.equal(body.locale, "zh-CN");
      assert.equal(body.engine, "gpt-sovits");
      assert.equal(body.voice, "youthful");
      assert.equal(body.speaker, "speaker-a");
      assert.equal(body.referenceVoiceId, "ref-voice-1");
      assert.equal(body.format, "wav");

      return new Response(
        JSON.stringify({
          provider: "local-gpt-sovits",
          audio: {
            base64: Buffer.from("local-json-audio").toString("base64"),
            mimeType: "audio/wav"
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
    }) as typeof fetch
  });

  const result = await provider.synthesize({
    text: "你好，我在。",
    locale: "zh-CN"
  });

  assert.equal(result.provider, "local-gpt-sovits");
  assert.equal(result.mode, "audio");
  assert.equal(result.audio.mimeType, "audio/wav");
  assert.equal(
    Buffer.from(result.audio.base64, "base64").toString("utf8"),
    "local-json-audio"
  );
  assert.equal(result.metadata.model, "gpt-sovits-v2");
  assert.equal(result.metadata.voice, "speaker-a");
});

test("local http tts provider accepts raw audio responses", async () => {
  const provider = new LocalHttpTextToSpeechProvider({
    baseURL: "http://127.0.0.1:9880",
    engine: "cosyvoice",
    voice: "warm",
    format: "mp3",
    fetchFn: (async () =>
      new Response(Buffer.from("local-binary-audio"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg"
        }
      })) as typeof fetch
  });

  const result = await provider.synthesize({
    text: "Stay here for a bit."
  });

  assert.equal(result.provider, "local:cosyvoice");
  assert.equal(result.audio.mimeType, "audio/mpeg");
  assert.equal(
    Buffer.from(result.audio.base64, "base64").toString("utf8"),
    "local-binary-audio"
  );
  assert.equal(result.metadata.model, "cosyvoice");
  assert.equal(result.metadata.voice, "warm");
});
