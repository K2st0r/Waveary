import test from "node:test";
import assert from "node:assert/strict";

import type { ChatProviderRequest } from "../providers/interfaces.js";
import {
  deriveGettingToKnowYouState,
  describeGettingToKnowYouGuidance
} from "./getting-to-know-you.js";

test("deriveGettingToKnowYouState keeps early names and desired vibe from conversation history", () => {
  const state = deriveGettingToKnowYouState(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "You can call me Aki, and if you want, I am going to call you Echo.",
          timestamp: new Date().toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "user",
          content: "I want you to feel playful, a little teasing, but still caring with me.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ]
    })
  );

  assert.equal(state.userPreferredName, "Aki");
  assert.equal(state.companionAssignedName, "Echo");
  assert.deepEqual(state.desiredStyleDescriptors, ["playful", "teasing", "caring"]);
  assert.equal(state.shouldInviteUserName, false);
  assert.equal(state.shouldInviteCompanionNaming, false);
  assert.equal(state.shouldInviteStylePreference, false);
});

test("deriveGettingToKnowYouState notices when the user is still asking who the companion is", () => {
  const state = deriveGettingToKnowYouState(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "What should I call you?",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.equal(state.latestTurnAskedCompanionName, true);
  assert.equal(state.shouldInviteUserName, true);
  assert.equal(state.shouldInviteCompanionNaming, true);
  assert.equal(state.shouldInviteStylePreference, true);
});

test("describeGettingToKnowYouGuidance keeps new-stage discovery natural and bounded", () => {
  const guidance = describeGettingToKnowYouGuidance(
    {
      desiredStyleDescriptors: [],
      latestTurnAskedCompanionName: true,
      latestTurnAskedForPlayfulCompanion: false,
      shouldInviteUserName: true,
      shouldInviteCompanionNaming: true,
      shouldInviteStylePreference: true
    },
    "new",
    "ordinary"
  );

  assert.match(guidance, /answer lightly/i);
  assert.match(guidance, /what you should call them in return/i);
});

function createRequest(overrides: Partial<ChatProviderRequest> = {}): ChatProviderRequest {
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
      displayName: "K2st0r",
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
        id: "m-default",
        sessionId: "session-1",
        role: "user",
        content: "I want this to feel natural over time.",
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ],
    relevantMemories: [],
    relationship: {
      userId: "user-1",
      stage: "new",
      affinityScore: 0.18,
      trustScore: 0.15,
      stabilityScore: 0.22,
      lastUpdatedAt: new Date().toISOString()
    },
    timeline: []
  };

  return {
    ...base,
    ...overrides
  };
}
