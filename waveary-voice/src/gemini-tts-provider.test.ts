import assert from "node:assert/strict";
import { test } from "node:test";

import { GeminiTextToSpeechProvider } from "./gemini-tts-provider.js";

test("gemini tts provider posts generateContent audio request and returns inline audio", async () => {
  let capturedUrl = "";
  let capturedApiKey = "";
  let capturedBody = "";

  const provider = new GeminiTextToSpeechProvider({
    apiKey: "gemini-key",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-3.1-flash-tts-preview",
    voice: "Kore",
    qualityProfile: "gentle",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      const headers = init?.headers as Record<string, string>;
      capturedApiKey = String(headers["x-goog-api-key"] ?? "");
      capturedBody = String(init?.body);

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: "audio/wav",
                      data: Buffer.from("gemini-audio").toString("base64")
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
    }) as typeof fetch
  });

  const result = await provider.synthesize({
    text: "Stay with me a little longer.",
    locale: "en-US",
    relationshipStage: "growing",
    delivery: {
      style: "warm",
      pace: "slower",
      closeness: "close",
      expressiveness: "natural"
    }
  });

  assert.equal(
    capturedUrl,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent"
  );
  assert.equal(capturedApiKey, "gemini-key");
  assert.equal(result.provider, "gemini");
  assert.equal(result.mode, "audio");
  assert.equal(result.audio.mimeType, "audio/wav");
  assert.equal(
    Buffer.from(result.audio.base64, "base64").toString("utf8"),
    "gemini-audio"
  );

  const parsedBody = JSON.parse(capturedBody) as {
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
  assert.deepEqual(parsedBody.generationConfig.responseModalities, ["AUDIO"]);
  assert.equal(
    parsedBody.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,
    "Kore"
  );
  assert.match(parsedBody.contents[0]?.parts[0]?.text ?? "", /Read the following text exactly as written/i);
  assert.match(parsedBody.contents[0]?.parts[0]?.text ?? "", /Stay with me a little longer\./);
});

test("gemini tts provider surfaces upstream errors", async () => {
  const provider = new GeminiTextToSpeechProvider({
    apiKey: "gemini-key",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
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
    /Gemini TTS request failed with status 400/
  );
});
