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
  /怎么/,
  /为什么/,
  /如何/,
  /几点/,
  /多少/
];

const PLAYFUL_PATTERNS = [/\bhehe\b/i, /\bhaha\b/i, /\blol\b/i, /玩笑/, /逗/, /哈哈/];
const RECONNECTION_PATTERNS = [/\bmiss\b/i, /\bare you there\b/i, /\bback\b/i, /想你/, /在吗/, /回来了/];
const EMOTIONAL_PATTERNS = [
  /\bsad\b/i,
  /\bhurt\b/i,
  /\banxious\b/i,
  /\bafraid\b/i,
  /\blonely\b/i,
  /\bworried\b/i,
  /\bcry\b/i,
  /\bstressed\b/i,
  /难过/,
  /伤心/,
  /焦虑/,
  /害怕/,
  /孤独/,
  /压力/,
  /不开心/,
  /崩溃/
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
    userEmotionIntensity >= 0.65;
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
      : userEmotionIntensity >= 0.45 || content.length > 48
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
    targetLength: normalized.length > 80 ? "medium" : "short",
    maxFollowups: 1,
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
      "Lead with emotional presence first, then add only one next helpful thought if needed."
    );
  } else {
    base.push(
      "Answer directly first, then add only one small humanizing line or one natural follow-up if it helps."
    );
  }

  if (guidance.allowParagraphExpansion) {
    base.push(
      "A slightly longer reply is acceptable here, but keep it grounded and avoid sprawling monologues."
    );
  } else {
    base.push(
      "Do not expand into multiple dense paragraphs for this turn."
    );
  }

  return base.join(" ");
}
