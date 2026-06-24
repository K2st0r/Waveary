import type { ChatProvider, ChatProviderRequest } from "../index.js";
import { selectContinuityThread } from "../runtime/continuity-thread.js";
import { buildDeterministicLocalTimeReply } from "../runtime/local-time-reply.js";
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
    const followup = buildFollowup(
      latestUserMessage.content,
      request.relationship.stage,
      request.emotion?.primaryEmotion,
      replyShape.maxFollowups
    );

    return assembleReply(prefix, continuity, followup, replyShape.kind);
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
  maxFollowups: 0 | 1
): string {
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

function assembleReply(
  prefix: string,
  continuity: string,
  followup: string,
  kind: "practical" | "ordinary" | "playful" | "reconnection" | "emotional"
): string {
  if (kind === "practical") {
    return [continuity, followup].filter(Boolean).join(" ").trim();
  }

  if (kind === "playful") {
    return [prefix, followup].filter(Boolean).join(" ").trim();
  }

  if (kind === "reconnection") {
    return [prefix, continuity].filter(Boolean).join(" ").trim();
  }

  return [prefix, continuity, followup].filter(Boolean).join(" ").trim();
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
