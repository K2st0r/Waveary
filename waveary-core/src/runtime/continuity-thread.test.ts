import test from "node:test";
import assert from "node:assert/strict";

import type { Message } from "../domain/session.js";
import type { MemoryItem } from "../domain/memory.js";
import { selectContinuityThread, summarizeCurrentTurnFocus } from "./continuity-thread.js";

test("selectContinuityThread prefers a strong matching memory as the primary thread", () => {
  const latestUserMessage: Message = {
    id: "message-1",
    sessionId: "session-1",
    role: "user",
    content: "I still want Waveary to remain a long-term digital life companion framework.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const relevantMemories: MemoryItem[] = [
    createMemory(
      "memory-1",
      "fact",
      "The user wants Waveary to remain a long-term digital life companion framework."
    ),
    createMemory("memory-2", "preference", "The user likes cloudy afternoons and sketching.")
  ];

  const selection = selectContinuityThread({
    latestUserMessage,
    relevantMemories,
    timeline: []
  });

  assert.equal(
    selection.primaryLine,
    "[memory:fact] The user wants Waveary to remain a long-term digital life companion framework."
  );
  assert.match(selection.guidance, /Use at most one natural reference/);
  assert.equal(selection.secondaryMemories.length, 1);
  assert.equal(summarizeCurrentTurnFocus(latestUserMessage.content).startsWith("I still want Waveary"), true);
});

test("selectContinuityThread avoids forcing a weak memory into an emotional turn", () => {
  const latestUserMessage: Message = {
    id: "message-2",
    sessionId: "session-1",
    role: "user",
    content: "I feel anxious tonight and I do not want to be alone with it.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const relevantMemories: MemoryItem[] = [
    createMemory(
      "memory-1",
      "preference",
      "The user likes cloudy afternoons and sketching on weekends."
    )
  ];

  const selection = selectContinuityThread({
    latestUserMessage,
    relevantMemories,
    timeline: []
  });

  assert.equal(
    selection.primaryLine,
    "[memory:preference] The user likes cloudy afternoons and sketching on weekends."
  );
  assert.match(selection.guidance, /only use it if the current turn clearly connects/i);
  assert.equal(selection.secondaryMemories.length, 0);
});

function createMemory(
  id: string,
  type: MemoryItem["type"],
  content: string
): MemoryItem {
  return {
    id,
    userId: "user-1",
    type,
    content,
    importance: 0.8,
    confidence: 0.8,
    sourceMessageIds: ["message-source"],
    createdAt: new Date().toISOString()
  };
}
