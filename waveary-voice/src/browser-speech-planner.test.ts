import assert from "node:assert/strict";
import { test } from "node:test";

import { buildBrowserSpeechPlan, BrowserSpeechPlanner } from "./index.js";

test("browser speech planner returns a softer slower plan for concerned Chinese turns", async () => {
  const provider = new BrowserSpeechPlanner();
  const result = await provider.synthesize({
    text: "我在这儿，慢慢和我说。",
    locale: "zh-CN",
    relationshipStage: "growing",
    emotion: {
      primaryEmotion: "concerned",
      intensity: 0.82
    }
  });

  assert.equal(result.provider, "waveary-browser-speech-planner");
  assert.equal(result.mode, "browser-speech");
  assert.ok("plan" in result);
  assert.equal(result.plan.mode, "browser-speech");
  assert.equal(result.plan.lang, "zh-CN");
  assert.equal(result.plan.styleLabel, "concerned");
  assert.ok(result.plan.rate < 0.98);
  assert.ok(result.plan.preferredVoiceKeywords.includes("Mandarin"));
});

test("browser speech plan brightens playful English turns", () => {
  const plan = buildBrowserSpeechPlan({
    text: "That sounds fun. Tell me more.",
    locale: "en-US",
    relationshipStage: "warming",
    emotion: {
      primaryEmotion: "playful",
      intensity: 0.7
    }
  });

  assert.equal(plan.lang, "en-US");
  assert.equal(plan.styleLabel, "bright");
  assert.ok(plan.pitch > 1.05);
  assert.ok(plan.rate > 1);
});

test("browser speech plan obeys explicit delivery hints", () => {
  const plan = buildBrowserSpeechPlan({
    text: "I'm here. Take your time.",
    locale: "en-US",
    relationshipStage: "warming",
    emotion: {
      primaryEmotion: "warm",
      intensity: 0.6
    },
    delivery: {
      style: "quiet",
      pace: "slower",
      closeness: "careful",
      expressiveness: "restrained",
      voiceStyle: "companion-quiet"
    }
  });

  assert.equal(plan.styleLabel, "quiet");
  assert.equal(plan.voiceLabel, "companion-quiet");
  assert.ok(plan.rate < 1);
  assert.ok(plan.volume < 0.92);
});
