import type { ChatProviderRequest } from "../providers/interfaces.js";
import type { ReplyShapeKind } from "./reply-shape.js";

export interface GettingToKnowYouState {
  userPreferredName?: string;
  companionAssignedName?: string;
  desiredStyleDescriptors: string[];
  latestTurnAskedCompanionName: boolean;
  latestTurnAskedForPlayfulCompanion: boolean;
  shouldInviteUserName: boolean;
  shouldInviteCompanionNaming: boolean;
  shouldInviteStylePreference: boolean;
}

const DEFAULT_USER_PLACEHOLDERS = new Set(["waveary user", "user", "friend"]);
const USER_NAME_STOPWORDS = new Set([
  "still",
  "not",
  "really",
  "so",
  "very",
  "just",
  "kind",
  "kinda",
  "sorta",
  "the",
  "a",
  "an",
  "feeling",
  "scared",
  "afraid",
  "anxious",
  "worried",
  "tired",
  "sad",
  "upset",
  "angry",
  "okay",
  "ok",
  "fine",
  "here",
  "back",
  "going",
  "gonna",
  "someone",
  "somebody",
  "person"
]);

const USER_NAME_PATTERNS = [
  /\bmy name is\s+([a-z][a-z0-9_-]{0,15})/i,
  /\bmy name is\s+["']?([a-z][a-z0-9_-]{0,15})["']?/i,
  /\bmy name is\s+\(?([a-z][a-z0-9_-]{0,15})\)?/i,
  /\bmy name's\s+([a-z][a-z0-9_-]{0,15})/i,
  /\bmy name's\s+["']?([a-z][a-z0-9_-]{0,15})["']?/i,
  /\bmy name's\s+\(?([a-z][a-z0-9_-]{0,15})\)?/i,
  /\bcall me\s+([a-z][a-z0-9_-]{0,15})/i,
  /\bcall me\s+["']?([a-z][a-z0-9_-]{0,15})["']?/i,
  /\bcall me\s+\(?([a-z][a-z0-9_-]{0,15})\)?/i,
  /\bi(?:'m| am)\s+(?!going\b|gonna\b)([a-z][a-z0-9_-]{0,15})\b/i,
  /\bi(?:'m| am)\s+["']?([a-z][a-z0-9_-]{0,15})["']?\b/i,
  /\bi(?:'m| am)\s+\(?([a-z][a-z0-9_-]{0,15})\)?\b/i,
  /(?:\u6211\u53eb|\u53eb\u6211|\u4f60\u53ef\u4ee5\u53eb\u6211)([\p{Script=Han}A-Za-z0-9_-]{1,16})/u
];

const COMPANION_NAME_PATTERNS = [
  /\bi(?:'ll| will)? call you\s+([a-z][a-z0-9_-]{0,15})/i,
  /\bi(?:'m| am)\s+going to call you\s+([a-z][a-z0-9_-]{0,15})/i,
  /\bi(?:'m| am)\s+gonna call you\s+([a-z][a-z0-9_-]{0,15})/i,
  /\blet me call you\s+([a-z][a-z0-9_-]{0,15})/i,
  /\bi want to call you\s+([a-z][a-z0-9_-]{0,15})/i,
  /(?:\u6211\u60f3\u53eb\u4f60|\u4ee5\u540e\u53eb\u4f60|\u5c31\u53eb\u4f60|\u7ba1\u4f60\u53eb)([\p{Script=Han}A-Za-z0-9_-]{1,16})/u
];

const COMPANION_NAME_QUESTION_PATTERNS = [
  /\bwhat should i call you\b/i,
  /\bwhat is your name\b/i,
  /\bwho are you\b/i,
  /\u4f60\u53eb\u4ec0\u4e48/,
  /\u4f60\u7684\u540d\u5b57/,
  /\u600e\u4e48\u79f0\u547c\u4f60/
];

const PLAYFUL_STYLE_PATTERNS = [
  /\bplayful\b/i,
  /\bteasing\b/i,
  /\bwitty\b/i,
  /\bgentle\b/i,
  /\bcaring\b/i,
  /\bclingy\b/i,
  /\bsteady\b/i,
  /\u98ce\u8da3/,
  /\u6253\u95f9/,
  /\u6492\u5a07/,
  /\u4f1a\u54c4\u4eba/,
  /\u4f1a\u5173\u5fc3\u4eba/,
  /\u6e29\u67d4/,
  /\u5634\u786c/,
  /\u7a33\u7a33/
];

const STYLE_DESCRIPTOR_PATTERNS: Array<{ descriptor: string; pattern: RegExp }> = [
  { descriptor: "playful", pattern: /\bplayful\b|\u98ce\u8da3|\u6253\u95f9/i },
  { descriptor: "teasing", pattern: /\bteasing\b|\u5634\u786c|\u9017\u6211/i },
  { descriptor: "gentle", pattern: /\bgentle\b|\u6e29\u67d4/i },
  { descriptor: "caring", pattern: /\bcaring\b|\u4f1a\u5173\u5fc3\u4eba|\u7ec6\u81f4/i },
  { descriptor: "clingy", pattern: /\bclingy\b|\u6492\u5a07/i },
  { descriptor: "steady", pattern: /\bsteady\b|\u7a33\u7a33/i },
  { descriptor: "witty", pattern: /\bwitty\b|\u673a\u7075/i }
];

export function deriveGettingToKnowYouState(
  request: ChatProviderRequest
): GettingToKnowYouState {
  const userTexts = request.messages
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  const memoryTexts = request.relevantMemories.map((memory) => memory.content);
  const allTexts = [...userTexts, ...memoryTexts];
  const latestUserMessage = [...request.messages]
    .reverse()
    .find((message) => message.role === "user")
    ?.content ?? "";

  const userPreferredName = findLatestUserName(allTexts);
  const companionAssignedName = findLatestMatch(allTexts, COMPANION_NAME_PATTERNS);
  const desiredStyleDescriptors = collectStyleDescriptors(allTexts);
  const userDisplayNameLooksDefault = DEFAULT_USER_PLACEHOLDERS.has(
    request.user.displayName.trim().toLowerCase()
  );

  return {
    ...(userPreferredName ? { userPreferredName } : {}),
    ...(companionAssignedName ? { companionAssignedName } : {}),
    desiredStyleDescriptors,
    latestTurnAskedCompanionName: COMPANION_NAME_QUESTION_PATTERNS.some((pattern) =>
      pattern.test(latestUserMessage)
    ),
    latestTurnAskedForPlayfulCompanion: PLAYFUL_STYLE_PATTERNS.some((pattern) =>
      pattern.test(latestUserMessage)
    ),
    shouldInviteUserName: !userPreferredName && userDisplayNameLooksDefault,
    shouldInviteCompanionNaming: !companionAssignedName,
    shouldInviteStylePreference: desiredStyleDescriptors.length === 0
  };
}

export function describeGettingToKnowYouGuidance(
  state: GettingToKnowYouState,
  relationshipStage: string,
  replyShapeKind: ReplyShapeKind
): string {
  const emotionallyHeavy = replyShapeKind === "emotional";
  const practical = replyShapeKind === "practical";

  if (state.userPreferredName && state.companionAssignedName && state.desiredStyleDescriptors.length > 0) {
    return "Core getting-to-know-you details are already present. Use them naturally and do not keep asking beginner questions.";
  }

  if (relationshipStage !== "new") {
    return "The earliest getting-to-know-you phase is already passing. Only ask about names or vibe if the user clearly opens that door again.";
  }

  if (emotionallyHeavy) {
    return "This turn is emotionally heavier. Do not switch into playful onboarding questions; stay with the feeling first.";
  }

  if (state.latestTurnAskedCompanionName) {
    return "The user is asking who you are or what to call you. Answer lightly, let them rename you if they want, and if it feels natural ask what you should call them in return.";
  }

  if (practical) {
    return "This turn is practical. Answer the practical need first and avoid turning it into a getting-to-know-you detour.";
  }

  return "In the new stage, a little playful mutual discovery is welcome. If one detail is still missing, gently ask for only one: what to call them, whether they want to name you, or what kind of presence they want from you.";
}

function findLatestMatch(texts: string[], patterns: RegExp[]): string | undefined {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index] ?? "";

    for (const pattern of patterns) {
      const match = text.match(pattern);
      const value = match?.[1]?.trim();

      if (value) {
        return value;
      }
    }
  }

  return undefined;
}

function findLatestUserName(texts: string[]): string | undefined {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index] ?? "";

    for (const pattern of USER_NAME_PATTERNS) {
      const match = text.match(pattern);
      const value = match?.[1]?.trim();

      if (value && isProbableUserName(value)) {
        return value;
      }
    }
  }

  return undefined;
}

function isProbableUserName(value: string): boolean {
  const normalized = value.trim().replace(/[.,!?;:]+$/g, "");
  const lowered = normalized.toLowerCase();

  if (!normalized) {
    return false;
  }

  if (USER_NAME_STOPWORDS.has(lowered)) {
    return false;
  }

  if (/^(the|a|an|someone|somebody|person)\b/i.test(lowered)) {
    return false;
  }

  return true;
}

function collectStyleDescriptors(texts: string[]): string[] {
  const descriptors = new Set<string>();

  for (const text of texts) {
    for (const entry of STYLE_DESCRIPTOR_PATTERNS) {
      if (entry.pattern.test(text)) {
        descriptors.add(entry.descriptor);
      }
    }
  }

  return [...descriptors];
}
