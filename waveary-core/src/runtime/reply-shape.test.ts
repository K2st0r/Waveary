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

test("deriveReplyShapeGuidance treats lightly hedged micro-updates as soft updates", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("maybe a bit later"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u53ef\u80fd\u665a\u70b9"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "soft_update");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "soft_update");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats quiet plan confirmations as soft updates", () => {
  const guidance = deriveReplyShapeGuidance(
    createRequest("I think I'll head back soon.")
  );

  assert.equal(guidance.kind, "ordinary");
  assert.equal(guidance.ordinarySubtype, "soft_update");
  assert.equal(guidance.targetLength, "short");
});

test("deriveReplyShapeGuidance treats small apology repair messages as delay-repair updates", () => {
  const englishGuidance = deriveReplyShapeGuidance(
    createRequest("sorry for the late reply")
  );
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u56de\u665a\u4e86"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "delay_repair");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "delay_repair");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats small tone-softener messages as tone-repair updates", () => {
  const englishGuidance = deriveReplyShapeGuidance(
    createRequest("didn't mean to sound harsh")
  );
  const chineseGuidance = deriveReplyShapeGuidance(
    createRequest("\u4e0d\u662f\u6545\u610f\u51f6\u4f60\u7684")
  );

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "tone_repair");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "tone_repair");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats light self-conscious softeners as their own ordinary subtype", () => {
  const englishGuidance = deriveReplyShapeGuidance(
    createRequest("hope that didn't sound weird")
  );
  const chineseGuidance = deriveReplyShapeGuidance(
    createRequest("\u521a\u521a\u53ef\u80fd\u8bf4\u5f97\u6709\u70b9\u602a")
  );

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "self_conscious_softener");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "self_conscious_softener");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats gentle reassurance closers as reassurance-close updates", () => {
  const englishGuidance = deriveReplyShapeGuidance(
    createRequest("get some rest then")
  );
  const chineseGuidance = deriveReplyShapeGuidance(
    createRequest("\u65e9\u70b9\u4f11\u606f\u5427")
  );

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "reassurance_close");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "reassurance_close");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats light check-back nudges as their own ordinary subtype", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("you there?"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u8fd8\u9192\u7740\u5417"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "check_back");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "check_back");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance keeps sleep-check nudges in the check-back bucket", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("you asleep?"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u7761\u4e86\u5417"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "check_back");
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "check_back");
});

test("deriveReplyShapeGuidance treats light affectionate catch-up lines as their own ordinary subtype", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("just thought of you"));
  const chineseGuidance = deriveReplyShapeGuidance(
    createRequest("\u521a\u521a\u60f3\u5230\u4f60\u4e86")
  );

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "catch_up");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "catch_up");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance keeps simple miss-you lines in the catch-up bucket", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("miss you"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u60f3\u4f60\u4e86"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "catch_up");
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "catch_up");
});

test("deriveReplyShapeGuidance treats good-night lines as reassurance-close updates", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("good night"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u665a\u5b89"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "reassurance_close");
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "reassurance_close");
});

test("deriveReplyShapeGuidance treats micro acknowledgments as their own short ordinary subtype", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("got it"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("嗯嗯"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "micro_ack");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "micro_ack");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats softer acknowledgment endings as micro acknowledgments", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("okay then"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u597d\u5594"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "micro_ack");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "micro_ack");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats deferential low-stakes closers as micro acknowledgments", () => {
  const englishGuidance = deriveReplyShapeGuidance(createRequest("we can do that then"));
  const chineseGuidance = deriveReplyShapeGuidance(createRequest("\u90a3\u884c\u5427"));

  assert.equal(englishGuidance.kind, "ordinary");
  assert.equal(englishGuidance.ordinarySubtype, "micro_ack");
  assert.equal(englishGuidance.maxFollowups, 0);
  assert.equal(chineseGuidance.kind, "ordinary");
  assert.equal(chineseGuidance.ordinarySubtype, "micro_ack");
  assert.equal(chineseGuidance.maxFollowups, 0);
});

test("deriveReplyShapeGuidance treats quick arrival and transit texts as status updates", () => {
  const transitGuidance = deriveReplyShapeGuidance(createRequest("I'm on my way."));
  const arrivalGuidance = deriveReplyShapeGuidance(createRequest("我到了。"));

  assert.equal(transitGuidance.kind, "ordinary");
  assert.equal(transitGuidance.ordinarySubtype, "status_update");
  assert.equal(arrivalGuidance.kind, "ordinary");
  assert.equal(arrivalGuidance.ordinarySubtype, "status_update");
});

test("deriveReplyShapeGuidance keeps plain I'm back in the status-update bucket", () => {
  const guidance = deriveReplyShapeGuidance(createRequest("I'm back."));

  assert.equal(guidance.kind, "ordinary");
  assert.equal(guidance.ordinarySubtype, "status_update");
  assert.equal(guidance.maxFollowups, 0);
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

test("describeReplyShapeGuidance includes micro-ack constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("\u884c\u5440"))
  );

  assert.match(
    text,
    /For tiny confirmations or soft acknowledgments, prefer one very short human reply and usually stop there\./
  );
});

test("describeReplyShapeGuidance includes soft-update constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("that should be fine for tonight"))
  );

  assert.match(
    text,
    /For lightly hedged updates or quiet plan confirmations, answer like a quick human text back\./
  );
});

test("describeReplyShapeGuidance includes more affectionate check-back constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("still up?"))
  );

  assert.match(text, /quietly affectionate or a little glad they reached for you/i);
});

test("describeReplyShapeGuidance includes more affectionate return-update constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("I'm back."))
  );

  assert.match(text, /softly glad to have them here/i);
});

test("describeReplyShapeGuidance includes delay-repair constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("just saw this"))
  );

  assert.match(
    text,
    /For small apology or delayed-reply repair messages, answer like a real person resuming the thread\./
  );
});

test("describeReplyShapeGuidance includes tone-repair constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("sorry if that came off a bit cold"))
  );

  assert.match(
    text,
    /For small tone-repair or soft apology messages, let the repair land with one brief warm reply\./
  );
});

test("describeReplyShapeGuidance includes self-conscious-softener constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("not sure if that came out right"))
  );

  assert.match(
    text,
    /For light self-conscious softeners, answer briefly and warmly\./
  );
});

test("describeReplyShapeGuidance includes reassurance-close constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("don't overthink it tonight"))
  );

  assert.match(
    text,
    /For gentle reassurance or soft rest-style closers, answer with a brief warm receipt\./
  );
});

test("describeReplyShapeGuidance includes check-back constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("still up?"))
  );

  assert.match(
    text,
    /For light check-back nudges, answer with a brief warm presence signal\./
  );
});

test("describeReplyShapeGuidance includes catch-up constraints", () => {
  const text = describeReplyShapeGuidance(
    deriveReplyShapeGuidance(createRequest("missed you a little"))
  );

  assert.match(
    text,
    /For light affectionate catch-up or thinking-of-you openers, answer with one brief warm reconnection line\./
  );
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
