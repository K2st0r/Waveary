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
  /\bback\b/i,
  /\u60f3\u4f60/,
  /\u5728\u5417/,
  /\u56de\u6765\u4e86/
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
    allowParagraphExpansion: false
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
      guidance.maxFollowups === 0
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
