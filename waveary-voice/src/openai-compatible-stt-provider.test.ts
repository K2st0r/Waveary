import assert from "node:assert/strict";
import { test } from "node:test";

import { OpenAICompatibleSpeechToTextProvider } from "./openai-compatible-stt-provider.js";

test("openai-compatible stt provider posts multipart audio and returns transcript text", async () => {
  let capturedUrl = "";
  let capturedAuth = "";
  let capturedBodyEntries: Record<string, string> | null = null;
  let capturedFileInfo: { name: string; type: string } | null = null;

  const provider = new OpenAICompatibleSpeechToTextProvider({
    provider: "openai",
    apiKey: "test-key",
    baseURL: "https://api.openai.com/v1",
    fetchFn: (async (input, init) => {
      capturedUrl = String(input);
      capturedAuth = String((init?.headers as Record<string, string>).Authorization);
      const body = init?.body as FormData;
      capturedBodyEntries = {
        model: String(body.get("model")),
        response_format: String(body.get("response_format")),
        language: String(body.get("language")),
        prompt: String(body.get("prompt"))
      };
      const file = body.get("file");
      capturedFileInfo =
        file && typeof file === "object" && "name" in file && "type" in file
          ? {
              name: String((file as { name: unknown }).name),
              type: String((file as { type: unknown }).type)
            }
          : null;

      return new Response(
        JSON.stringify({
          text: "I heard you clearly.",
          language: "en"
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
      mimeType: "audio/webm",
      fileName: "voice.webm"
    },
    locale: "en-US",
    prompt: "Companion conversation."
  });

  assert.equal(capturedUrl, "https://api.openai.com/v1/audio/transcriptions");
  assert.equal(capturedAuth, "Bearer test-key");
  assert.deepEqual(capturedBodyEntries, {
    model: "gpt-4o-mini-transcribe",
    response_format: "json",
    language: "en",
    prompt: "Companion conversation."
  });
  assert.deepEqual(capturedFileInfo, {
    name: "voice.webm",
    type: "audio/webm"
  });

  assert.equal(result.provider, "openai");
  assert.equal(result.text, "I heard you clearly.");
  assert.equal(result.metadata?.model, "gpt-4o-mini-transcribe");
  assert.equal(result.metadata?.language, "en");
});

test("openai-compatible stt provider surfaces upstream errors", async () => {
  const provider = new OpenAICompatibleSpeechToTextProvider({
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
    provider.transcribe({
      audio: {
        base64: Buffer.from("fake-audio").toString("base64"),
        mimeType: "audio/webm"
      }
    }),
    /STT request failed with status 400/
  );
});
