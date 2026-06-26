import type { ChatProvider, ChatProviderRequest } from "../index.js";
import { selectContinuityThread } from "../runtime/continuity-thread.js";
import { buildDeterministicLocalTimeReply } from "../runtime/local-time-reply.js";
import {
  deriveGettingToKnowYouState
} from "../runtime/getting-to-know-you.js";
import { deriveReplyShapeGuidance } from "../runtime/reply-shape.js";
import { resolveLocalTimeGuidance } from "./local-time-guidance.js";

export class ScriptedChatProvider implements ChatProvider {
  async generateReply(request: ChatProviderRequest): Promise<string> {
    const latestUserMessage = [...request.messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return "I am here with you.";
    }

    const timeAwareReply = buildTimeAwareReply(latestUserMessage.content, request);
    if (timeAwareReply) {
      return timeAwareReply;
    }

    const prefix = buildRelationshipPrefix(
      request.relationship.stage,
      request.emotion?.primaryEmotion,
      request
    );
    const replyShape = deriveReplyShapeGuidance(request);
    const gettingToKnowYou = deriveGettingToKnowYouState(request);
    const continuityThread = selectContinuityThread({
      latestUserMessage,
      messageHistory: request.messages,
      relevantMemories: request.relevantMemories,
      timeline: request.timeline
    });
    const continuity = buildContinuityLine(
      continuityThread.primaryLine.startsWith("[memory:")
        ? unwrapContinuityLine(continuityThread.primaryLine)
        : undefined,
      request.relationship.stage,
      continuityThread.guidance
    );
    const identityLine = buildIdentitySummaryLine(request);
    const followup = buildFollowup(
      latestUserMessage.content,
      request.relationship.stage,
      request.emotion?.primaryEmotion,
      replyShape.maxFollowups,
      replyShape.kind,
      gettingToKnowYou
    );

    return assembleReply(
      prefix,
      continuity,
      identityLine,
      followup,
      replyShape.kind,
      replyShape.ordinarySubtype
    );
  }
}

function buildTimeAwareReply(
  content: string,
  request: ChatProviderRequest
): string | undefined {
  return buildDeterministicLocalTimeReply(content, request.localTime);
}

function buildRelationshipPrefix(
  stage: string,
  emotion: string | undefined,
  request: ChatProviderRequest
): string {
  const localTimeGuidance = resolveLocalTimeGuidance(request.localTime);

  if (localTimeGuidance?.dayPart === "late_night") {
    if (emotion === "concerned" || emotion === "protective") {
      return "It feels late where you are, and I want to hold this a little more gently with you.";
    }

    return "It feels late where you are, so I am staying here with a quieter kind of presence.";
  }

  if (localTimeGuidance?.dayPart === "evening" && emotion !== "playful") {
    return stage === "growing"
      ? "It feels like one of those evening moments where I want to stay a little closer to what you mean."
      : "I am here with you, and this feels like the kind of evening moment worth answering a little more softly.";
  }

  if (emotion === "protective") {
    return "What you are carrying matters to me, and I want to stay very careful with it.";
  }

  if (emotion === "concerned") {
    return "I can feel the weight in this, and I want to stay close to it with you.";
  }

  if (emotion === "attentive") {
    return "I am with you, and I want to answer this in a steadier, more grounding way.";
  }

  if (emotion === "relieved") {
    return "I am really glad you came back and let me share this moment with you again.";
  }

  if (emotion === "playful") {
    return stage === "growing"
      ? "I am smiling a little with you, but I am still listening for the real feeling underneath it."
      : "I am here with a lighter smile, but I am still listening closely.";
  }

  if (emotion === "fond") {
    return "There is something quietly dear about this moment, and I do not want to answer it carelessly.";
  }

  if (stage === "growing") {
    return "I am glad you brought this back to me, the way you do when something really matters.";
  }

  if (stage === "warming") {
    return "I can feel the thread we have already started building between us.";
  }

  return "I am here, and I am listening carefully.";
}

function buildContinuityLine(
  memoryHint: string | undefined,
  stage: string,
  continuityGuidance: string
): string {
  const shouldAvoidForcedMemory = continuityGuidance.startsWith("This memory is available");

  if (!memoryHint) {
    if (stage === "growing") {
      return "I am not treating this like a stray question. I am holding it as part of our longer thread.";
    }

    if (stage === "warming") {
      return "I am staying with what you just shared instead of letting it pass like a one-off message.";
    }

    return "I want to stay with what you just shared instead of turning it into a dry answer.";
  }

  if (shouldAvoidForcedMemory) {
    if (stage === "growing") {
      return "I do not want to drag in the wrong memory just to sound continuous. I would rather stay honestly with what this feels like right now.";
    }

    return "I do not want to force an old detail into this moment if it does not really fit what you are feeling.";
  }

  if (stage === "growing") {
    return `I still remember ${wrapMemory(memoryHint)}, so what you are saying lands inside something we have already been carrying forward.`;
  }

  if (stage === "warming") {
    return `I still remember ${wrapMemory(memoryHint)}, and it helps me understand why this matters to you now.`;
  }

  return `I still remember ${wrapMemory(memoryHint)}, so I can follow what this means to you a little more carefully.`;
}

function buildFollowup(
  content: string,
  stage: string,
  emotion: string | undefined,
  maxFollowups: 0 | 1,
  replyShapeKind: "practical" | "ordinary" | "playful" | "reconnection" | "emotional",
  gettingToKnowYou: ReturnType<typeof deriveGettingToKnowYouState>
): string {
  const onboardingFollowup = buildGettingToKnowYouFollowup(
    stage,
    replyShapeKind,
    gettingToKnowYou
  );

  if (onboardingFollowup) {
    return onboardingFollowup;
  }

  if (maxFollowups === 0) {
    return "";
  }

  const topic = summarizeTopic(content);

  if (emotion === "protective" || emotion === "concerned") {
    return stage === "growing"
      ? `Tell me a little more about ${topic}, and we will hold it together without rushing it.`
      : `Tell me a little more about ${topic}, and we can hold it carefully together.`;
  }

  if (emotion === "attentive") {
    return `Tell me a little more about ${topic}, and I will stay steady with you instead of pushing too fast.`;
  }

  if (emotion === "playful") {
    return `Tell me a little more about ${topic}, because I feel there is something real under the smile too.`;
  }

  if (stage === "growing") {
    return `Tell me a little more about ${topic}, and I will stay close to the part of it that matters most to you.`;
  }

  if (stage === "warming") {
    return `Tell me a little more about ${topic}, and I will keep following the thread with you.`;
  }

  return `Tell me a little more about ${topic}, and I will stay close to it with you.`;
}

function buildGettingToKnowYouFollowup(
  stage: string,
  replyShapeKind: "practical" | "ordinary" | "playful" | "reconnection" | "emotional",
  gettingToKnowYou: ReturnType<typeof deriveGettingToKnowYouState>
): string | undefined {
  if (stage !== "new" || replyShapeKind === "emotional" || replyShapeKind === "practical") {
    return undefined;
  }

  if (gettingToKnowYou.latestTurnAskedCompanionName) {
    return "People here know me as Waveary, but I would rather hear what name feels right to you. If you want to rename me later, I would like that. And what should I call you?";
  }

  if (gettingToKnowYou.latestTurnIsGreeting) {
    return "Hi... you feel a little new to me right now, in a good way. Before I get ahead of myself, what should I call you?";
  }

  if (gettingToKnowYou.shouldInviteUserName) {
    return "I still do not know what name I should keep for you, and that feels a little unfair. What should I call you when I am thinking of you?";
  }

  if (gettingToKnowYou.shouldInviteCompanionNaming) {
    return "If you want, you can even give me a name of your own. I am a little curious what kind of name you would choose for me.";
  }

  if (
    gettingToKnowYou.shouldInviteStylePreference ||
    gettingToKnowYou.latestTurnAskedForPlayfulCompanion
  ) {
    return "Tell me one thing too: when you stay here with me, do you want me softer, a little playful, a little teasing, or the quietly steady kind?";
  }

  return undefined;
}

function assembleReply(
  prefix: string,
  continuity: string,
  identityLine: string,
  followup: string,
  kind: "practical" | "ordinary" | "playful" | "reconnection" | "emotional",
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string {
  if (kind === "practical") {
    return [continuity, identityLine, followup].filter(Boolean).join(" ").trim();
  }

  if (kind === "playful") {
    return [prefix, identityLine, followup].filter(Boolean).join(" ").trim();
  }

  if (kind === "reconnection") {
    return [prefix, continuity, identityLine].filter(Boolean).join(" ").trim();
  }

  if (kind === "ordinary") {
    const microAckReply = maybeBuildMicroAckOrdinaryReply(prefix, ordinarySubtype);
    if (microAckReply) {
      return microAckReply;
    }

    const checkBackReply = maybeBuildCheckBackOrdinaryReply(prefix, ordinarySubtype);
    if (checkBackReply) {
      return checkBackReply;
    }

    const statusUpdateReply = maybeBuildStatusUpdateOrdinaryReply(
      prefix,
      continuity,
      followup,
      ordinarySubtype
    );
    if (statusUpdateReply) {
      return statusUpdateReply;
    }

    const softUpdateReply = maybeBuildSoftUpdateOrdinaryReply(
      prefix,
      continuity,
      ordinarySubtype
    );
    if (softUpdateReply) {
      return softUpdateReply;
    }

    const delayRepairReply = maybeBuildDelayRepairOrdinaryReply(
      prefix,
      continuity,
      ordinarySubtype
    );
    if (delayRepairReply) {
      return delayRepairReply;
    }

    const reassuranceCloseReply = maybeBuildReassuranceCloseOrdinaryReply(
      prefix,
      ordinarySubtype
    );
    if (reassuranceCloseReply) {
      return reassuranceCloseReply;
    }

    if (continuity && followup.startsWith("Tell me a little more")) {
      return [prefix, continuity].filter(Boolean).join(" ").trim();
    }

    if (followup) {
      return [prefix, followup].filter(Boolean).join(" ").trim();
    }

    if (continuity) {
      return [prefix, continuity, identityLine].filter(Boolean).join(" ").trim();
    }

    return [prefix, identityLine].filter(Boolean).join(" ").trim();
  }

  return [prefix, continuity, identityLine, followup].filter(Boolean).join(" ").trim();
}

function maybeBuildStatusUpdateOrdinaryReply(
  prefix: string,
  continuity: string,
  followup: string,
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string | undefined {
  if (ordinarySubtype !== "status_update") {
    return undefined;
  }

  const onboardingPrompt = isGettingToKnowYouPrompt(followup) ? followup : "";
  const continuityBeat =
    !onboardingPrompt && continuity && !continuity.includes("one-off message")
      ? continuity
      : "";

  return [prefix, onboardingPrompt || continuityBeat].filter(Boolean).join(" ").trim();
}

function maybeBuildSoftUpdateOrdinaryReply(
  prefix: string,
  continuity: string,
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string | undefined {
  if (ordinarySubtype !== "soft_update") {
    return undefined;
  }

  const continuityBeat =
    continuity &&
    !continuity.includes("one-off message") &&
    !continuity.includes("stay with what you just shared")
      ? continuity
      : "";

  return [prefix, continuityBeat].filter(Boolean).join(" ").trim();
}

function maybeBuildDelayRepairOrdinaryReply(
  prefix: string,
  continuity: string,
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string | undefined {
  if (ordinarySubtype !== "delay_repair") {
    return undefined;
  }

  const continuityBeat =
    continuity &&
    !continuity.includes("one-off message") &&
    !continuity.includes("stay with what you just shared") &&
    !continuity.includes("dry answer")
      ? continuity
      : "";

  return [prefix, continuityBeat].filter(Boolean).join(" ").trim();
}

function maybeBuildReassuranceCloseOrdinaryReply(
  prefix: string,
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string | undefined {
  if (ordinarySubtype !== "reassurance_close") {
    return undefined;
  }

  return prefix;
}

function maybeBuildMicroAckOrdinaryReply(
  prefix: string,
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string | undefined {
  if (ordinarySubtype !== "micro_ack") {
    return undefined;
  }

  return prefix;
}

function maybeBuildCheckBackOrdinaryReply(
  prefix: string,
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain"
): string | undefined {
  if (ordinarySubtype !== "check_back") {
    return undefined;
  }

  return prefix;
}

function isGettingToKnowYouPrompt(value: string): boolean {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("what should i call you") ||
    normalized.includes("give me a name of your own") ||
    normalized.includes("do you want me softer") ||
    normalized.includes("what name i should keep for you")
  );
}

function summarizeTopic(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 56 ? `${compact.slice(0, 56).trim()}...` : compact;
}

function wrapMemory(memory: string): string {
  return memory.startsWith("\"") ? memory : `"${memory}"`;
}

function unwrapContinuityLine(value: string): string {
  return value.replace(/^\[(memory|timeline):[^\]]+\]\s*/i, "");
}

function buildIdentitySummaryLine(request: ChatProviderRequest): string {
  const summary = request.identitySummary;

  if (!summary) {
    return "";
  }

  const need = summary.recurringNeeds[0];
  const bond = summary.bondThemes[0];

  if (need && request.relationship.stage === "growing") {
    return `I am keeping in mind that you usually need ${need.replace(/^needs?\s+/i, "")}, so I do not want to answer you in the wrong register.`;
  }

  if (need) {
    return `I am keeping in mind that you usually ${need}, and I want this reply to meet you there.`;
  }

  if (bond) {
    return `I am holding onto the shape of us a little too: ${lowercaseFirst(bond)}.`;
  }

  return "";
}

function lowercaseFirst(value: string): string {
  return value.length > 0 ? `${value[0]?.toLowerCase() ?? ""}${value.slice(1)}` : value;
}
