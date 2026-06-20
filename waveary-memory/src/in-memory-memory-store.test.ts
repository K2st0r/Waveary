import test from "node:test";
import assert from "node:assert/strict";

import type { Message } from "../../waveary-core/dist/index.js";
import { InMemoryMemoryStore } from "./in-memory-memory-store.js";

function createMessage(id: string, content: string): Message {
  return {
    id,
    sessionId: "session-1",
    role: "user",
    content,
    timestamp: new Date().toISOString(),
    metadata: {}
  };
}

test("InMemoryMemoryStore recalls the most relevant memories first", async () => {
  const store = new InMemoryMemoryStore();

  await store.saveMemories("user-1", createMessage("m1", "我喜欢长期记忆系统"), [
    {
      type: "preference",
      content: "我喜欢长期记忆系统",
      importance: 0.9,
      confidence: 0.8
    }
  ]);

  await store.saveMemories("user-1", createMessage("m2", "今天我在整理时间轴设计"), [
    {
      type: "life_event",
      content: "今天我在整理时间轴设计",
      importance: 0.6,
      confidence: 0.8
    }
  ]);

  const recalled = await store.recallRelevantMemories("user-1", "我想继续优化长期记忆");

  assert.equal(recalled.length, 2);
  assert.equal(recalled[0]?.content, "我喜欢长期记忆系统");
});
