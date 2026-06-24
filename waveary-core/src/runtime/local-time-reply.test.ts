import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDeterministicLocalTimeReply,
  isDirectLocalTimeQuestion
} from "./local-time-reply.js";

test("isDirectLocalTimeQuestion detects Chinese and English time/date questions", () => {
  assert.equal(isDirectLocalTimeQuestion("\u73b0\u5728\u51e0\u70b9\u4e86\uff1f"), true);
  assert.equal(isDirectLocalTimeQuestion("\u4eca\u5929\u661f\u671f\u51e0\uff1f"), true);
  assert.equal(
    isDirectLocalTimeQuestion("\u4f60\u8fd8\u662f\u6ca1\u529e\u6cd5\u544a\u8bc9\u6211\u5177\u4f53\u51e0\u70b9\u5417\uff1f"),
    true
  );
  assert.equal(isDirectLocalTimeQuestion("what time is it right now?"), true);
  assert.equal(isDirectLocalTimeQuestion("what day is it today"), true);
  assert.equal(isDirectLocalTimeQuestion("tell me something warm"), false);
});

test("isDirectLocalTimeQuestion does not misread ordinary emotional turns that mention today", () => {
  assert.equal(isDirectLocalTimeQuestion("\u6211\u4eca\u5929\u6709\u4e9b\u4e0d\u5f00\u5fc3"), false);
  assert.equal(isDirectLocalTimeQuestion("\u4eca\u665a\u6709\u70b9\u60f3\u4f60"), false);
  assert.equal(isDirectLocalTimeQuestion("I feel off tonight"), false);
});

test("buildDeterministicLocalTimeReply returns a direct Chinese local-time answer", () => {
  const reply = buildDeterministicLocalTimeReply("\u73b0\u5728\u51e0\u70b9\u4e86\uff1f", {
    iso: "2026-06-22T13:30:00.000Z",
    timeZone: "Asia/Shanghai",
    locale: "zh-CN"
  });

  assert.ok(reply?.includes("\u672c\u5730\u65f6\u95f4\u662f"));
  assert.ok(reply?.includes("2026"));
});

test("buildDeterministicLocalTimeReply also catches indirect Chinese time complaints", () => {
  const reply = buildDeterministicLocalTimeReply(
    "\u4f60\u8fd8\u662f\u6ca1\u529e\u6cd5\u544a\u8bc9\u6211\u5177\u4f53\u51e0\u70b9\u5417\uff1f",
    {
      iso: "2026-06-22T13:30:00.000Z",
      timeZone: "Asia/Shanghai",
      locale: "zh-CN"
    }
  );

  assert.ok(reply?.includes("\u672c\u5730\u65f6\u95f4\u662f"));
  assert.ok(!reply?.includes("\u6ca1\u6cd5\u51c6\u786e\u544a\u8bc9\u4f60"));
});
