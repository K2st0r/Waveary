import test from "node:test";
import assert from "node:assert/strict";

import {
  SimpleProactiveCareEngine,
  createDefaultProactiveCarePolicy,
  createDefaultProactiveCareState,
  type EmotionState,
  type Message,
  type RelationshipProfile
} from "../index.js";

const engine = new SimpleProactiveCareEngine();

test("SimpleProactiveCareEngine declines when policy is disabled", async () => {
  const decision = await engine.evaluate(createInput({ policy: { enabled: false } }));

  assert.equal(decision.shouldReachOut, false);
  assert.deepEqual(decision.reasons, ["policy_disabled"]);
});

test("SimpleProactiveCareEngine respects quiet hours before any other trigger", async () => {
  const decision = await engine.evaluate(
    createInput({
      now: "2026-06-21T16:30:00.000Z",
      policy: {
        enabled: true,
        quietHoursStart: "23:00",
        quietHoursEnd: "08:00"
      },
      relationship: {
        stage: "warming"
      },
      history: [
        userMessage("I was away for a while.", "2026-06-19T06:00:00.000Z")
      ]
    })
  );

  assert.equal(decision.shouldReachOut, false);
  assert.deepEqual(decision.reasons, ["quiet_hours_active"]);
});

test("SimpleProactiveCareEngine recommends absence outreach after a long gap", async () => {
  const decision = await engine.evaluate(
    createInput({
      now: "2026-06-21T10:30:00.000Z",
      policy: {
        enabled: true
      },
      relationship: {
        stage: "warming"
      },
      history: [userMessage("Talk later.", "2026-06-19T22:00:00.000Z")]
    })
  );

  assert.equal(decision.shouldReachOut, true);
  assert.equal(decision.intent, "absence_reachout");
  assert.equal(decision.urgency, "medium");
});

test("SimpleProactiveCareEngine escalates to stress follow-up when concern and sadness persist", async () => {
  const decision = await engine.evaluate(
    createInput({
      now: "2026-06-21T10:30:00.000Z",
      policy: {
        enabled: true
      },
      relationship: {
        stage: "growing"
      },
      history: [userMessage("I still feel sad and stressed today.", "2026-06-21T02:00:00.000Z")],
      emotion: {
        primaryEmotion: "concerned",
        detectedUserEmotion: "sadness"
      }
    })
  );

  assert.equal(decision.shouldReachOut, true);
  assert.equal(decision.intent, "stress_followup");
  assert.equal(decision.urgency, "high");
});

test("SimpleProactiveCareEngine can suggest meal care within daytime rhythm", async () => {
  const decision = await engine.evaluate(
    createInput({
      now: "2026-06-21T04:30:00.000Z",
      policy: {
        enabled: true
      },
      relationship: {
        stage: "warming"
      },
      history: [userMessage("I need to finish some work first.", "2026-06-20T20:00:00.000Z")]
    })
  );

  assert.equal(decision.shouldReachOut, true);
  assert.equal(decision.intent, "meal_care");
  assert.equal(decision.urgency, "low");
});

test("SimpleProactiveCareEngine suppresses care when the relationship is still new", async () => {
  const decision = await engine.evaluate(
    createInput({
      now: "2026-06-21T10:30:00.000Z",
      policy: {
        enabled: true
      },
      relationship: {
        stage: "new"
      },
      history: [userMessage("I have been away.", "2026-06-19T22:00:00.000Z")]
    })
  );

  assert.equal(decision.shouldReachOut, false);
  assert.deepEqual(decision.reasons, ["relationship_not_ready"]);
});

function createInput(overrides?: {
  now?: string;
  history?: Message[];
  relationship?: Partial<RelationshipProfile>;
  emotion?: Partial<EmotionState>;
  policy?: Partial<ReturnType<typeof createDefaultProactiveCarePolicy>>;
}) {
  const baseInput = {
    userId: "user-1",
    now: overrides?.now ?? "2026-06-21T10:30:00.000Z",
    history: overrides?.history ?? [userMessage("I am here.", "2026-06-21T07:00:00.000Z")],
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.48,
      trustScore: 0.46,
      stabilityScore: 0.58,
      lastUpdatedAt: "2026-06-21T00:00:00.000Z",
      ...overrides?.relationship
    },
    timeline: [],
    policy: {
      ...createDefaultProactiveCarePolicy(),
      enabled: true,
      ...overrides?.policy
    },
    careState: createDefaultProactiveCareState()
  };

  if (!overrides?.emotion) {
    return baseInput;
  }

  const emotion: EmotionState = {
    userId: "user-1",
    subject: "companion",
    primaryEmotion: "warm",
    intensity: 0.6,
    confidence: 0.7,
    windowStart: "2026-06-21T00:00:00.000Z",
    windowEnd: "2026-06-21T00:00:00.000Z",
    ...overrides.emotion
  };

  return {
    ...baseInput,
    emotion
  };
}

function userMessage(content: string, timestamp: string): Message {
  return {
    id: `message-${timestamp}`,
    sessionId: "session-1",
    role: "user",
    content,
    timestamp,
    metadata: {}
  };
}
