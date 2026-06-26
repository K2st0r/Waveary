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
  ordinarySubtype?:
    | "check_back"
    | "status_update"
    | "soft_update"
    | "micro_ack"
    | "delay_repair"
    | "reassurance_close"
    | "plain";
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
  /\bmiss(?:ed|ing)?\b/i,
  /\u60f3\u4f60/,
  /\u60f3\u4f60\u4e86/
];

const CHECK_BACK_PATTERNS = [
  /^\s*you there\??\s*$/i,
  /^\s*are you there\??\s*$/i,
  /^\s*still there\??\s*$/i,
  /^\s*still up\??\s*$/i,
  /^\s*you up\??\s*$/i,
  /^\s*are you awake\??\s*$/i,
  /^\s*you awake\??\s*$/i,
  /^\s*you around\??\s*$/i,
  /^\s*still around\??\s*$/i,
  /^\s*\u5728\u5417[~\u3002\uff01!?？]*\s*$/u,
  /^\s*\u8fd8\u5728\u5417[~\u3002\uff01!?？]*\s*$/u,
  /^\s*\u8fd8\u9192\u7740\u5417[~\u3002\uff01!?？]*\s*$/u,
  /^\s*\u8fd8\u6ca1\u7761\u5417[~\u3002\uff01!?？]*\s*$/u,
  /^\s*\u7761\u4e86\u5417[~\u3002\uff01!?？]*\s*$/u
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

const SOFT_UPDATE_PATTERNS = [
  /^\s*maybe(?:\s+just)?\s+(?:a\s+bit\s+)?later\.?\s*$/i,
  /^\s*probably\s+after\s+(?:dinner|work|lunch|that)\.?\s*$/i,
  /^\s*i think i(?:'ll| will)\s+(?:head back|go back|turn in|sleep|rest)\s+(?:soon|a bit earlier|early)(?:\s+tonight)?\.?\s*$/i,
  /^\s*i might\s+(?:head back|go back|turn in|sleep|rest)\s+(?:soon|a little earlier|early)(?:\s+tonight)?\.?\s*$/i,
  /^\s*that should be fine(?:\s+for\s+tonight)?\.?\s*$/i,
  /^\s*i(?:'ll| will)\s+do it in a bit\.?\s*$/i,
  /^\s*\u53ef\u80fd\u665a\u70b9[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u5e94\u8be5\u665a\u70b9[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6211\u5e94\u8be5\u665a\u70b9\u56de\u53bb[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6211\u53ef\u80fd\u7a0d\u5fae\u65e9\u70b9\u7761[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u90a3\u4eca\u665a\u5e94\u8be5\u53ef\u4ee5[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6211\u7b49\u4f1a\u513f\u5f04[~\u3002\uff01!]?[\s]*$/u
];

const DELAY_REPAIR_PATTERNS = [
  /^\s*sorry(?:\s+i(?:'m| am))?\s+(?:just\s+)?(?:got\s+)?busy\.?\s*$/i,
  /^\s*sorry(?:\s+for)?\s+the\s+late\s+reply\.?\s*$/i,
  /^\s*sorry(?:\s+i)?\s+replied\s+late\.?\s*$/i,
  /^\s*my bad(?:\s+i(?:'m| am))?\s+(?:just\s+)?busy\.?\s*$/i,
  /^\s*just saw this\.?\s*$/i,
  /^\s*just got out of something\.?\s*$/i,
  /^\s*i was just busy\.?\s*$/i,
  /^\s*i got caught up(?:\s+just now)?\.?\s*$/i,
  /^\s*\u62b1\u6b49[\u54c8\u5440\u554a]?(?:\u56de\u665a\u4e86|\u521a\u521a\u5728\u5fd9|\u624d\u770b\u5230)?[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u56de\u665a\u4e86[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u521a\u521a\u5728\u5fd9[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u624d\u770b\u5230[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u521a\u770b\u5230[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u65b9\u624d\u5728\u5fd9[~\u3002\uff01!]?[\s]*$/u
];

const REASSURANCE_CLOSE_PATTERNS = [
  /^\s*no worries(?:\s+then)?\.?\s*$/i,
  /^\s*it's okay(?:\s+then)?\.?\s*$/i,
  /^\s*it is okay(?:\s+then)?\.?\s*$/i,
  /^\s*get some rest(?:\s+then|\s+tonight)?\.?\s*$/i,
  /^\s*rest early(?:\s+tonight)?\.?\s*$/i,
  /^\s*do not overthink it(?:\s+tonight)?\.?\s*$/i,
  /^\s*don't overthink it(?:\s+tonight)?\.?\s*$/i,
  /^\s*sleep early(?:\s+tonight)?\.?\s*$/i,
  /^\s*\u6ca1\u4e8b\u5566[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6ca1\u4e8b\u7684[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u522b\u60f3\u592a\u591a\u5566[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u522b\u60f3\u592a\u591a\u4e86[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u65e9\u70b9\u4f11\u606f\u5427[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u5feb\u53bb\u4f11\u606f\u5427[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u4f60\u5148\u597d\u597d\u4f11\u606f[~\u3002\uff01!]?[\s]*$/u
];

const MICRO_ACK_PATTERNS = [
  /^\s*ok(?:ay)?\.?\s*$/i,
  /^\s*ok(?:ay)?\s+ok(?:ay)?\.?\s*$/i,
  /^\s*ok(?:ay)?\s+then\.?\s*$/i,
  /^\s*got it\.?\s*$/i,
  /^\s*i got it\.?\s*$/i,
  /^\s*gotcha(?:\s+then)?\.?\s*$/i,
  /^\s*guess\s+that(?:'s| is)\s+fine(?:\s+then)?\.?\s*$/i,
  /^\s*we can do that(?:\s+then)?\.?\s*$/i,
  /^\s*that works(?:\s+then)?\.?\s*$/i,
  /^\s*noted\.?\s*$/i,
  /^\s*sounds good\.?\s*$/i,
  /^\s*sounds good\s+then\.?\s*$/i,
  /^\s*all right\.?\s*$/i,
  /^\s*all right\s+then\.?\s*$/i,
  /^\s*alright\.?\s*$/i,
  /^\s*alright\s+then\.?\s*$/i,
  /^\s*sure\.?\s*$/i,
  /^\s*kk\.?\s*$/i,
  /^\s*mm-?hmm\.?\s*$/i,
  /^\s*yeah\.?\s*$/i,
  /^\s*yeah yeah\.?\s*$/i,
  /^\s*yep\.?\s*$/i,
  /^\s*\u597d(?:\u5440|\u561b|\u54e6|\u561e)?[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u884c(?:\u5440|\u5427|\u54e6)?[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u77e5\u9053\u4e86[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u77e5\u9053\u5566[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u660e\u767d\u4e86[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u660e\u767d\u5566[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6536\u5230[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6536\u5230\u5566[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u55ef\u55ef[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u6069\u6069[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u54e6\u54e6[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u597d\u5462[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u597d\u5594[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u597d\u54e6[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u597d\u5566[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u884c\u5440[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u884c\u5462[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u90a3\u884c\u5427[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u5148\u8fd9\u6837[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u90a3\u5c31\u5148\u8fd9\u6837[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u597d\u5427\u90a3\u5c31\u8fd9\u6837[~\u3002\uff01!]?[\s]*$/u,
  /^\s*\u90a3\u5c31\u8fd9\u6837\u5427[~\u3002\uff01!]?[\s]*$/u
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
  const checkBack =
    CHECK_BACK_PATTERNS.some((pattern) => pattern.test(content)) &&
    content.length <= 40;
  const practical =
    PRACTICAL_PATTERNS.some((pattern) => pattern.test(content)) && !checkBack;
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
    !checkBack &&
    !microAck;
  const softUpdate =
    SOFT_UPDATE_PATTERNS.some((pattern) => pattern.test(content)) &&
    content.length <= 72 &&
    !practical &&
    !playful &&
    !reconnection &&
    !checkBack &&
    !microAck &&
    !statusUpdate;
  const delayRepair =
    DELAY_REPAIR_PATTERNS.some((pattern) => pattern.test(content)) &&
    content.length <= 72 &&
    !practical &&
    !playful &&
    !reconnection &&
    !checkBack &&
    !microAck &&
    !statusUpdate &&
    !softUpdate;
  const reassuranceClose =
    REASSURANCE_CLOSE_PATTERNS.some((pattern) => pattern.test(content)) &&
    content.length <= 72 &&
    !practical &&
    !playful &&
    !reconnection &&
    !checkBack &&
    !microAck &&
    !statusUpdate &&
    !softUpdate &&
    !delayRepair;

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
    ordinarySubtype: checkBack
      ? "check_back"
      : microAck
        ? "micro_ack"
        : statusUpdate
        ? "status_update"
        : delayRepair
          ? "delay_repair"
          : softUpdate
            ? "soft_update"
            : reassuranceClose
              ? "reassurance_close"
              : "plain"
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
      guidance.ordinarySubtype === "check_back"
        ? "For light check-back nudges, answer with a brief warm presence signal. Keep it easy and human. Do not turn it into a heavy reunion, a practical answer, or a follow-up chain."
        : guidance.ordinarySubtype === "micro_ack"
        ? "For tiny confirmations or soft acknowledgments, prefer one very short human reply and usually stop there. Do not inflate the moment into continuity theater, recap, or a fresh question."
        : guidance.ordinarySubtype === "status_update"
        ? "For simple status updates or check-ins, prefer one warm acknowledgment or one acknowledgment plus one tiny continuity beat. Do not turn it into analysis, recap, or a check-in questionnaire."
        : guidance.ordinarySubtype === "delay_repair"
        ? "For small apology or delayed-reply repair messages, answer like a real person resuming the thread. Keep it brief, warm, and do not turn the apology into a heavy emotional scene."
        : guidance.ordinarySubtype === "reassurance_close"
        ? "For gentle reassurance or soft rest-style closers, answer with a brief warm receipt. Do not reopen the conversation unless the user clearly leaves the door open."
        : guidance.ordinarySubtype === "soft_update"
        ? "For lightly hedged updates or quiet plan confirmations, answer like a quick human text back. Keep it short, lightly warm, and usually question-free."
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
