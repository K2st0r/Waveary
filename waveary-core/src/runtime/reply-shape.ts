import type { ChatProviderRequest } from "../providers/interfaces.js";

export type ReplyShapeKind =
  | "practical"
  | "ordinary"
  | "playful"
  | "reconnection"
  | "emotional";

export interface ReplyShapeGuidance {
  kind: ReplyShapeKind;
  userIntensity: "low" | "medium" | "high";
  targetLength: "short" | "medium";
  maxFollowups: 0 | 1;
  shouldLeadWithEmotion: boolean;
  allowParagraphExpansion: boolean;
  ordinarySubtype?: "status_update" | "micro_ack" | "plain";
}

const PRACTICAL_PATTERNS = [
  /\bhow\b/i,
  /\bwhat\b/i,
  /\bwhy\b/i,
  /\bwhen\b/i,
  /\bwhere\b/i,
  /\bcan you\b/i,
  /\bplease\b/i,
  /\?\s*$/,
  /\u600e\u4e48/,
  /\u4e3a\u4ec0\u4e48/,
  /\u5982\u4f55/,
  /\u51e0\u70b9/,
  /\u591a\u5c11/
];

const PLAYFUL_PATTERNS = [
  /\bhehe\b/i,
  /\bhaha\b/i,
  /\blol\b/i,
  /\u73a9\u7b11/,
  /\u9017/,
  /\u54c8\u54c8/
];

const RECONNECTION_PATTERNS = [
  /\bmiss\b/i,
  /\bare you there\b/i,
  /\u60f3\u4f60/,
  /\u5728\u5417/
];

const STATUS_UPDATE_PATTERNS = [
  /\bi am home\b/i,
  /\bi'?m home\b/i,
  /\bgot home\b/i,
  /\bmade it home\b/i,
  /\bi am back\b/i,
  /\bi'?m back\b/i,
  /\bjust got back\b/i,
  /\bjust got home\b/i,
  /\bjust got in\b/i,
  /\bjust finished\b/i,
  /\bi am on my way\b/i,
  /\bi'?m on my way\b/i,
  /\bon my way\b/i,
  /\bi am on the way\b/i,
  /\bi'?m on the way\b/i,
  /\bon the way\b/i,
  /\bi made it\b/i,
  /\bmade it\b/i,
  /\bi arrived\b/i,
  /\bi'?ve arrived\b/i,
  /\bgot here\b/i,
  /\bjust arrived\b/i,
  /\bi am awake\b/i,
  /\bi'?m awake\b/i,
  /\bjust woke up\b/i,
  /\bi am up now\b/i,
  /\bi'?m up now\b/i,
  /\bawake now\b/i,
  /\bi am done now\b/i,
  /\bi'?m done now\b/i,
  /\bfinished now\b/i,
  /\bhome now\b/i,
  /\bback now\b/i,
  /\bi am back\b/i,
  /\bi'?m back\b/i,
  /\bback\b/i,
  /\u5230\u5bb6\u4e86/,
  /\u56de\u6765\u4e86/,
  /\u521a\u5230\u5bb6/,
  /\u6211\u56de\u6765\u4e86/,
  /\u6211\u5230\u5bb6\u4e86/,
  /\u6211\u5230\u4e86/,
  /\u5230\u4e86/,
  /\u5230\u5566/,
  /\u6211\u5230\u5566/,
  /\u5728\u8def\u4e0a/,
  /\u6211\u5728\u8def\u4e0a/,
  /\u5feb\u5230\u4e86/,
  /\u521a\u5230/,
  /\u521a\u9192/,
  /\u9192\u4e86/,
  /\u521a\u5fd9\u5b8c/,
  /\u5fd9\u5b8c\u4e86/,
  /\u5f04\u5b8c\u4e86/
];

const MICRO_ACK_PATTERNS = [
  /^\s*ok(?:ay)?\.?\s*$/i,
  /^\s*ok(?:ay)?\s+ok(?:ay)?\.?\s*$/i,
  /^\s*got it\.?\s*$/i,
  /^\s*i got it\.?\s*$/i,
  /^\s*noted\.?\s*$/i,
  /^\s*sounds good\.?\s*$/i,
  /^\s*all right\.?\s*$/i,
  /^\s*alright\.?\s*$/i,
  /^\s*sure\.?\s*$/i,
  /^\s*kk\.?\s*$/i,
  /^\s*mm-?hmm\.?\s*$/i,
  /^\s*yeah\.?\s*$/i,
  /^\s*yeah yeah\.?\s*$/i,
  /^\s*yep\.?\s*$/i,
  /^\s*\u597d(?:\u5440|\u561b|\u54e6|\u561e)?[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u884c(?:\u5440|\u5427|\u54e6)?[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u77e5\u9053\u4e86[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u660e\u767d\u4e86[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6536\u5230[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u55ef\u55ef[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6069\u6069[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u54e6\u54e6[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u597d\u5462[~\u3002\uff01!]?[\s]*$/u
];

const EMOTIONAL_PATTERNS = [
  /\bsad\b/i,
  /\bhurt\b/i,
  /\banxious\b/i,
  /\bafraid\b/i,
  /\blonely\b/i,
  /\bworried\b/i,
  /\bcry\b/i,
  /\bstressed\b/i,
  /\btired\b/i,
  /\boverwhelmed\b/i,
  /\bexhausted\b/i,
  /\bdo not want advice\b/i,
  /\bdon't want advice\b/i,
  /\bjust want someone here\b/i,
  /\u96be\u8fc7/,
  /\u4f24\u5fc3/,
  /\u7126\u8651/,
  /\u5bb3\u6015/,
  /\u5b64\u72ec/,
  /\u538b\u529b/,
  /\u4e0d\u5f00\u5fc3/,
  /\u5d29\u6e83/
];

export function deriveReplyShapeGuidance(
  request: ChatProviderRequest
): ReplyShapeGuidance {
  const latestUserMessage = [...request.messages]
    .reverse()
    .find((message) => message.role === "user");
  const content = latestUserMessage?.content.trim() ?? "";
  const normalized = content.toLowerCase();
  const userEmotion = request.detectedUserEmotion?.primaryEmotion ?? "neutral";
  const userEmotionIntensity = request.detectedUserEmotion?.intensity ?? 0;

  const emotional =
    userEmotion !== "neutral" ||
    EMOTIONAL_PATTERNS.some((pattern) => pattern.test(content)) ||
    userEmotionIntensity >= 0.58;
  const practical = PRACTICAL_PATTERNS.some((pattern) => pattern.test(content));
  const playful = PLAYFUL_PATTERNS.some((pattern) => pattern.test(content));
  const reconnection = RECONNECTION_PATTERNS.some((pattern) => pattern.test(content));
  const microAck =
    MICRO_ACK_PATTERNS.some((pattern) => pattern.test(content)) &&
    content.length <= 32 &&
    !practical &&
    !playful &&
    !reconnection;
  const statusUpdate =
    STATUS_UPDATE_PATTERNS.some((pattern) => pattern.test(content)) &&
    content.length <= 64 &&
    !practical &&
    !playful &&
    !reconnection &&
    !microAck;

  let kind: ReplyShapeKind = "ordinary";
  if (emotional) {
    kind = "emotional";
  } else if (practical) {
    kind = "practical";
  } else if (playful) {
    kind = "playful";
  } else if (reconnection) {
    kind = "reconnection";
  }

  const userIntensity =
    userEmotionIntensity >= 0.78 || content.length > 120
      ? "high"
      : userEmotionIntensity >= 0.4 || content.length > 48
        ? "medium"
        : "low";

  if (kind === "emotional") {
    return {
      kind,
      userIntensity,
      targetLength: userIntensity === "high" ? "medium" : "short",
      maxFollowups: 1,
      shouldLeadWithEmotion: true,
      allowParagraphExpansion: userIntensity !== "low"
    };
  }

  if (kind === "practical") {
    return {
      kind,
      userIntensity,
      targetLength: "short",
      maxFollowups: 1,
      shouldLeadWithEmotion: false,
      allowParagraphExpansion: false
    };
  }

  if (kind === "playful") {
    return {
      kind,
      userIntensity,
      targetLength: "short",
      maxFollowups: 1,
      shouldLeadWithEmotion: false,
      allowParagraphExpansion: false
    };
  }

  if (kind === "reconnection") {
    return {
      kind,
      userIntensity,
      targetLength: "short",
      maxFollowups: 1,
      shouldLeadWithEmotion: true,
      allowParagraphExpansion: false
    };
  }

  return {
    kind,
    userIntensity,
    targetLength: normalized.length > 96 ? "medium" : "short",
    maxFollowups: userIntensity === "low" ? 0 : 1,
    shouldLeadWithEmotion: false,
    allowParagraphExpansion: false,
    ordinarySubtype: microAck ? "micro_ack" : statusUpdate ? "status_update" : "plain"
  };
}

export function describeReplyShapeGuidance(
  guidance: ReplyShapeGuidance
): string {
  const base = [
    `Current reply mode: ${guidance.kind}.`,
    `User intensity: ${guidance.userIntensity}.`,
    `Default reply length: ${guidance.targetLength}.`,
    `Maximum natural follow-up questions: ${guidance.maxFollowups}.`
  ];

  if (guidance.shouldLeadWithEmotion) {
    base.push(
      "Lead with emotional presence first. Do not open with analysis, advice, tools, or factual correction unless the user clearly asked for that first."
    );
  } else {
    base.push(
      "Answer directly first, then add only one small human line if it helps. Do not over-wrap the reply with explanation."
    );
  }

  if (guidance.allowParagraphExpansion) {
    base.push(
      "A slightly longer reply is acceptable here, but keep it grounded and avoid sprawling monologues."
    );
  } else {
    base.push("Do not expand into multiple dense paragraphs for this turn.");
  }

  if (guidance.kind === "ordinary") {
    base.push(
      guidance.ordinarySubtype === "micro_ack"
        ? "For tiny confirmations or soft acknowledgments, prefer one very short human reply and usually stop there. Do not inflate the moment into continuity theater, recap, or a fresh question."
        : guidance.ordinarySubtype === "status_update"
        ? "For simple status updates or check-ins, prefer one warm acknowledgment or one acknowledgment plus one tiny continuity beat. Do not turn it into analysis, recap, or a check-in questionnaire."
        : guidance.maxFollowups === 0
        ? "For ordinary low-intensity chat, prefer 1 to 2 short natural sentences and usually no trailing question."
        : "For ordinary chat, prefer 1 to 3 short natural sentences and ask a follow-up only if it feels genuinely human."
    );
  }

  if (guidance.kind === "emotional") {
    base.push(
      "If the user sounds hurt, lonely, anxious, or overwhelmed, let the first sentence feel like company, not a diagnosis."
    );
  }

  if (guidance.kind === "practical") {
    base.push(
      "Keep practical replies compact and useful. Do not drift into a soft speech when a clear answer will do."
    );
  }

  base.push(
    "Avoid polished essay cadence. The reply should feel like a real message someone sends, with a little breathing room left in it."
  );

  return base.join(" ");
}
