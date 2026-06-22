import test from "node:test";
import assert from "node:assert/strict";

import type { Message } from "../domain/session.js";
import type { MemoryItem } from "../domain/memory.js";
import type { TimelineEvent } from "../domain/timeline.js";
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

test("selectContinuityThread keeps a weak timeline thread restrained during an emotional turn", () => {
  const latestUserMessage: Message = {
    id: "message-3",
    sessionId: "session-1",
    role: "user",
    content: "I feel anxious tonight and I do not want to sit in this alone.",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const timeline: TimelineEvent[] = [
    {
      id: "timeline-1",
      userId: "user-1",
      title: "Went sketching in the park",
      description: "The user spent a quiet afternoon sketching in the park last month.",
      eventType: "memory",
      eventTime: new Date().toISOString(),
      importance: 0.72,
      linkedMemoryIds: []
    }
  ];

  const selection = selectContinuityThread({
    latestUserMessage,
    relevantMemories: [],
    timeline
  });

  assert.equal(
    selection.primaryLine,
    "[timeline:memory] Went sketching in the park"
  );
  assert.match(
    selection.guidance,
    /do not force it unless it naturally matches the user's present concern/i
  );
});

test("selectContinuityThread prefers the more recent memory when relevance is otherwise tied", () => {
  const latestUserMessage: Message = {
    id: "message-4",
    sessionId: "session-1",
    role: "user",
    content: "I still care about continuity and I want it to feel steady.",
    timestamp: "2026-06-22T12:00:00.000Z",
    metadata: {}
  };

  const relevantMemories: MemoryItem[] = [
    createMemory(
      "memory-older",
      "fact",
      "The user cares about continuity and wants it to feel steady.",
      "2026-05-01T10:00:00.000Z",
      ["message-old"]
    ),
    createMemory(
      "memory-newer",
      "preference",
      "The user cares about continuity and wants it to feel steady.",
      "2026-06-21T10:00:00.000Z",
      ["message-new"]
    )
  ];

  const selection = selectContinuityThread({
    latestUserMessage,
    relevantMemories,
    timeline: []
  });

  assert.equal(
    selection.primaryLine,
    "[memory:preference] The user cares about continuity and wants it to feel steady."
  );
  assert.equal(selection.secondaryMemories[0]?.id, "memory-older");
});

test("selectContinuityThread prefers the memory tied to the more recent source turn when content and age are otherwise tied", () => {
  const messages: Message[] = [
    {
      id: "message-older-source",
      sessionId: "session-1",
      role: "user",
      content: "I want the companion to feel present in my life over time.",
      timestamp: "2026-06-22T11:40:00.000Z",
      metadata: {}
    },
    {
      id: "message-assistant-1",
      sessionId: "session-1",
      role: "assistant",
      content: "I hear that and I want to stay continuous with you.",
      timestamp: "2026-06-22T11:41:00.000Z",
      metadata: {}
    },
    {
      id: "message-newer-source",
      sessionId: "session-1",
      role: "user",
      content: "What matters most is that relationship growth keeps feeling real.",
      timestamp: "2026-06-22T11:55:00.000Z",
      metadata: {}
    },
    {
      id: "message-latest",
      sessionId: "session-1",
      role: "user",
      content: "I still want relationship growth to feel real and emotionally continuous.",
      timestamp: "2026-06-22T12:00:00.000Z",
      metadata: {}
    }
  ];

  const relevantMemories: MemoryItem[] = [
    createMemory(
      "memory-older-source",
      "fact",
      "The user wants relationship growth to feel real and emotionally continuous.",
      "2026-06-22T09:00:00.000Z",
      ["message-older-source"]
    ),
    createMemory(
      "memory-newer-source",
      "preference",
      "The user wants relationship growth to feel real and emotionally continuous.",
      "2026-06-22T09:00:00.000Z",
      ["message-newer-source"]
    )
  ];

  const selection = selectContinuityThread({
    latestUserMessage: messages[3],
    messageHistory: messages,
    relevantMemories,
    timeline: []
  });

  assert.equal(
    selection.primaryLine,
    "[memory:preference] The user wants relationship growth to feel real and emotionally continuous."
  );
  assert.equal(selection.secondaryMemories[0]?.id, "memory-older-source");
});

function createMemory(
  id: string,
  type: MemoryItem["type"],
  content: string,
  createdAt = new Date().toISOString(),
  sourceMessageIds = ["message-source"]
): MemoryItem {
  return {
    id,
    userId: "user-1",
    type,
    content,
    importance: 0.8,
    confidence: 0.8,
    sourceMessageIds,
    createdAt
  };
}
