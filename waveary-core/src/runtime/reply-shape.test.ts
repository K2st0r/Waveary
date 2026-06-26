import test from "node:test";
import assert from "node:assert/strict";

import type { ChatProviderRequest } from "../providers/interfaces.js";
import {
  deriveReplyShapeGuidance,
  describeReplyShapeGuidance
} from "./reply-shape.js";

test("deriveReplyShapeGuidance marks emotional turns as emotion-first", () => {
  const guidance = deriveReplyShapeGuidance(
    createRequest("I feel anxious tonight and I really do not want to be alone with this.", {
      detectedUserEmotion: {
        userId: "user-1",
        primaryEmotion: "sadness",
        intensity: 0.82,
        confidence: 0.78,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString()
      }
    })
  );

  assert.equal(guidance.kind, "emotional");
  assert.equal(guidance.shouldLeadWithEmotion, true);
  assert.equal(guidance.maxFollowups, 1);
});

test("deriveReplyShapeGuidance keeps practical questions short", () => {
  const guidance = deriveReplyShapeGuidance(
    createRequest("What should we do next for the memory system?")
  );

  assert.equal(guidance.kind, "practical");
  assert.equal(guidance.targetLength, "short");
  assert.equal(guidance.allowParagraphExpansion, false);
});

test("deriveReplyShapeGuidance keeps low-intensity ordinary chat short and usually question-free", () => {
  const guidance = deriveReplyShapeGuidance(createRequest("Okay, I am home now."));

  assert.equal(guidance.kind, "ordinary");
  assert.equal(guidance.ordinarySubtype, "status_update");
  assert.equal(guidance.targetLength, "short");
  assert.equal(guidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance leaves non-status ordinary chat in the plain bucket", () => {
  const guidance = deriveReplyShapeGuidance(createRequest("That makes sense, I think."));

  assert.equal(guidance.kind, "ordinary");
  assert.equal(guidance.ordinarySubtype, "plain");
});

test("deriveReplyShapeGuidance catches softer emotional support requests earlier", () => {
  const guidance = deriveReplyShapeGuidance(
    createRequest("I am tired. I do not want advice, I just want someone here.")
  );

  assert.equal(guidance.kind, "emotional");
  assert.equal(guidance.shouldLeadWithEmotion, true);
});

test("describeReplyShapeGuidance includes cadence constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("I am back. Are you there?"))
  );

  assert.match(text, /Maximum natural follow-up questions: 1\./);
  assert.match(text, /Default reply length:/);
  assert.match(text, /Avoid polished essay cadence\./);
});

function createRequest(
  content: string,
  overrides: Partial<ChatProviderRequest> = {}
): ChatProviderRequest {
  const base: ChatProviderRequest = {
    session: {
      id: "session-1",
      userId: "user-1",
      personaId: "persona-1",
      startedAt: new Date().toISOString(),
      channel: "text",
      state: "active"
    },
    user: {
      id: "user-1",
      displayName: "User",
      profileTraits: ["reflective"],
      preferences: ["continuity"]
    },
    persona: {
      id: "persona-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["steady", "attentive"],
      relationshipStyle: "supportive"
    },
    messages: [
      {
        id: "m1",
        sessionId: "session-1",
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ],
    relevantMemories: [],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.5,
      trustScore: 0.45,
      stabilityScore: 0.55,
      lastUpdatedAt: new Date().toISOString()
    },
    timeline: []
  };

  return { ...base, ...overrides };
}
