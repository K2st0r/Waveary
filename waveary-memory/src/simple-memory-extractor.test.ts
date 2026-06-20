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

test("SimpleMemoryExtractor emits a preference memory for substantial user input", async () => {
  const extractor = new SimpleMemoryExtractor();
  const message = createMessage("turn-1", "我喜欢一个能够记住过去并长期陪伴用户的系统。");
  const reply: Message = {
    id: "reply-1",
    sessionId: "session-1",
    role: "assistant",
    content: "我会记住这点。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const candidates = await extractor.extractCandidates(message, reply);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.type, "preference");
  assert.ok((candidates[0]?.importance ?? 0) >= 0.3);
});
