import test from "node:test";
import assert from "node:assert/strict";

import type { Message } from "../../waveary-core/dist/index.js";
import { SimpleMemoryExtractor } from "./simple-memory-extractor.js";

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

test("SimpleMemoryExtractor condenses substantial preference input into a recall-friendly memory", async () => {
  const extractor = new SimpleMemoryExtractor();
  const message = createMessage(
    "turn-1",
    "我希望 Waveary 记住真正重要的事情，而不是每次都像第一次认识我一样重新开始。"
  );
  const reply: Message = {
    id: "reply-1",
    sessionId: "session-1",
    role: "assistant",
    content: "我会把这件事留在心里。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const candidates = await extractor.extractCandidates(message, reply);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.type, "reflection");
  assert.equal(candidates[0]?.content, "我希望 Waveary 记住真正重要的事情");
  assert.ok((candidates[0]?.importance ?? 0) >= 0.45);
});

test("SimpleMemoryExtractor ignores short low-signal user input", async () => {
  const extractor = new SimpleMemoryExtractor();
  const message = createMessage("turn-2", "好的，那就继续。");
  const reply: Message = {
    id: "reply-2",
    sessionId: "session-1",
    role: "assistant",
    content: "我在。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const candidates = await extractor.extractCandidates(message, reply);

  assert.deepEqual(candidates, []);
});
