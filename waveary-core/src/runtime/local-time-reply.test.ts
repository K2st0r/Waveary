import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDeterministicLocalTimeReply,
  isDirectLocalTimeQuestion
} from "./local-time-reply.js";

test("isDirectLocalTimeQuestion detects Chinese and English time/date questions", () => {
  assert.equal(isDirectLocalTimeQuestion("现在几点了？"), true);
  assert.equal(isDirectLocalTimeQuestion("今天星期几"), true);
  assert.equal(isDirectLocalTimeQuestion("你还是没法告诉我具体几点呢？"), true);
  assert.equal(isDirectLocalTimeQuestion("what time is it right now?"), true);
  assert.equal(isDirectLocalTimeQuestion("what day is it today"), true);
  assert.equal(isDirectLocalTimeQuestion("tell me something warm"), false);
});

test("buildDeterministicLocalTimeReply returns a direct Chinese local-time answer", () => {
  const reply = buildDeterministicLocalTimeReply("现在几点了？", {
    iso: "2026-06-22T13:30:00.000Z",
    timeZone: "Asia/Shanghai",
    locale: "zh-CN"
  });

  assert.ok(reply?.includes("本地时间是"));
  assert.ok(reply?.includes("2026"));
});

test("buildDeterministicLocalTimeReply also catches indirect Chinese time complaints", () => {
  const reply = buildDeterministicLocalTimeReply("你还是没法告诉我具体几点呢？", {
    iso: "2026-06-22T13:30:00.000Z",
    timeZone: "Asia/Shanghai",
    locale: "zh-CN"
  });

  assert.ok(reply?.includes("本地时间是"));
  assert.ok(!reply?.includes("没法告诉你"));
});
