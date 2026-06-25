import type { IdentitySummary } from "../domain/identity.js";
import type { Message } from "../domain/session.js";
import type { IdentityEngine, IdentityEngineInput } from "../providers/interfaces.js";

const MAX_ITEMS = 3;

const CONTINUITY_TERMS = [
  "remember",
  "remember me",
  "continuity",
  "long-term",
  "over time",
  "ongoing",
  "not disposable",
  "\u8bb0\u4f4f",
  "\u8bb0\u5f97",
  "\u957f\u671f"
];

const EMOTIONAL_TRUTH_TERMS = [
  "emotionally real",
  "feel real",
  "human warmth",
  "caring",
  "care deeply",
  "care about",
  "heart",
  "emotion",
  "\u5173\u5fc3",
  "\u60c5\u7eea"
];

const SYSTEMS_TERMS = ["framework", "system", "product", "design", "architecture", "structure"];

const CADENCE_TERMS = [
  "short replies",
  "short reply",
  "keep it short",
  "brief",
  "natural",
  "normal",
  "texting",
  "like texting",
  "long speech",
  "long speeches",
  "not too long",
  "\u81ea\u7136",
  "\u522b\u592a\u957f"
];

const TONE_TERMS = [
  "steady tone",
  "steady",
  "gentle",
  "soft",
  "warm",
  "playful",
  "teasing",
  "not robotic"
];

const CHATBOT_REJECTION_TERMS = [
  "chatbot",
  "generic chatbot",
  "disposable chat",
  "not like a chatbot",
  "not a generic chatbot"
];

const SADNESS_TERMS = [
  "sad",
  "hurt",
  "cry",
  "crying",
  "heartbroken",
  "upset",
  "\u96be\u8fc7",
  "\u4f24\u5fc3"
];

const ANXIETY_TERMS = [
  "anxious",
  "worried",
  "scared",
  "nervous",
  "uneasy",
  "unsettled",
  "panic",
  "\u7126\u8651",
  "\u5bb3\u6015"
];

const LONELINESS_TERMS = [
  "alone",
  "lonely",
  "by myself",
  "wish someone was here",
  "no one is here",
  "\u5b64\u72ec",
  "\u4e00\u4e2a\u4eba"
];

const OVERWHELM_TERMS = [
  "overwhelmed",
  "too much",
  "everything at once",
  "cannot keep up",
  "can't keep up",
  "spinning",
  "drowning",
  "five solutions",
  "\u625b\u4e0d\u4f4f",
  "\u592a\u591a"
];

const STAYING_TERMS = [
  "stay with me",
  "stay here",
  "with me for a bit",
  "be here with me",
  "don't go",
  "do not go",
  "\u966a\u7740\u6211",
  "\u5728\u8fd9",
  "\u522b\u8d70"
];

const RETURN_TERMS = [
  "i am back",
  "i'm back",
  "came back",
  "back again",
  "missed you",
  "again",
  "back",
  "\u53c8\u56de\u6765",
  "\u60f3\u4f60"
];

const NAMING_TERMS = [
  "call me",
  "my name is",
  "my name's",
  "i'm called",
  "i am called",
  "nickname",
  "what should i call you",
  "\u53eb\u6211",
  "\u540d\u5b57"
];

const RITUAL_TERMS = [
  "good night",
  "goodnight",
  "good morning",
  "check on me",
  "check in on me",
  "wait for me",
  "before i sleep",
  "when i wake"
];

const NEW_SIGNAL_PRECEDENCE = [
  "needs explicit reassurance that someone is still here when loneliness surfaces",
  "needs calmer pacing and fewer moving parts when overwhelmed",
  "needs steadiness and reassurance of presence when anxious",
  "needs emotional presence before analysis when vulnerable",
  "when lonely, the user looks for explicit signs that someone is still here",
  "when overwhelmed, the user benefits from calmer pacing and fewer demands at once",
  "when hurt, the user wants comfort to arrive before explanation",
  "when unsettled, the user needs steadiness and reassurance of presence",
  "trust is deepening through remembered naming and repeated return",
  "small repeated rituals help this bond feel dependable and lived-in"
];

interface InferenceContext {
  userText: string;
  replyText: string;
  historyTexts: string[];
  memoryTexts: string[];
  signals: IdentitySignals;
}

interface IdentitySignals {
  continuity: boolean;
  emotionalTruth: boolean;
  systemsThinking: boolean;
  cadencePreference: boolean;
  toneSensitivity: boolean;
  rejectsGenericChatbot: boolean;
  sadness: boolean;
  anxiety: boolean;
  loneliness: boolean;
  overwhelm: boolean;
  staying: boolean;
  reconnection: boolean;
  naming: boolean;
  rituals: boolean;
  stepwiseCloseness: boolean;
}

export class SimpleIdentityEngine implements IdentityEngine {
  async summarize(input: IdentityEngineInput): Promise<IdentitySummary | undefined> {
    const context = buildInferenceContext(input);

    const userSelfConcept = mergePreservingCurrent(
      input.currentSummary?.userSelfConcept ?? [],
      deriveUserSelfConcept(context)
    );
    const bondThemes = mergePreservingCurrent(
      input.currentSummary?.bondThemes ?? [],
      deriveBondThemes(context, input.relationship.stage)
    );
    const recurringNeeds = mergeFavoringRecent(
      input.currentSummary?.recurringNeeds ?? [],
      deriveRecurringNeeds(context),
      {
        suppressCurrentThemes: ["needs emotional presence before analysis when vulnerable"],
        signals: context.signals,
        suppressCurrentWhen: (signals) =>
          signals.loneliness || signals.overwhelm || signals.anxiety || signals.sadness
      }
    );
    const emotionalPatterns = mergeFavoringRecent(
      input.currentSummary?.emotionalPatterns ?? [],
      deriveEmotionalPatterns(context, input.emotion?.detectedUserEmotion)
    );
    const companionStance = mergePreservingCurrent(
      input.currentSummary?.companionStance ?? [],
      deriveCompanionStance(context, input.relationship.stage, input.emotion?.primaryEmotion)
    );

    const summaryText = buildSummaryText({
      userSelfConcept,
      bondThemes,
      recurringNeeds,
      emotionalPatterns,
      companionStance
    });

    return {
      userId: input.userId,
      userSelfConcept,
      bondThemes,
      recurringNeeds,
      emotionalPatterns,
      companionStance,
      summaryText,
      lastUpdatedAt: input.reply.timestamp
    };
  }
}

function buildInferenceContext(input: IdentityEngineInput): InferenceContext {
  const memoryTexts = [...input.relevantMemories, ...input.storedMemories].map((memory) =>
    normalizeText(memory.content)
  );
  const historyTexts = input.history.map((message) => normalizeText(message.content));
  const userText = normalizeText(input.message.content);
  const replyText = normalizeText(input.reply.content);
  const allTexts = [userText, replyText, ...historyTexts, ...memoryTexts];

  const signals: IdentitySignals = {
    continuity:
      containsAny(userText, CONTINUITY_TERMS) ||
      containsAny(userText, CHATBOT_REJECTION_TERMS) ||
      anyTextContains(memoryTexts, CONTINUITY_TERMS),
    emotionalTruth:
      containsAny(userText, EMOTIONAL_TRUTH_TERMS) || anyTextContains(memoryTexts, EMOTIONAL_TRUTH_TERMS),
    systemsThinking: containsAny(userText, SYSTEMS_TERMS) || anyTextContains(memoryTexts, SYSTEMS_TERMS),
    cadencePreference:
      containsAny(userText, CADENCE_TERMS) || anyTextContains(memoryTexts, CADENCE_TERMS),
    toneSensitivity:
      containsAny(userText, TONE_TERMS) || anyTextContains(memoryTexts, TONE_TERMS),
    rejectsGenericChatbot:
      containsAny(userText, CHATBOT_REJECTION_TERMS) || anyTextContains(memoryTexts, CHATBOT_REJECTION_TERMS),
    sadness: containsAny(userText, SADNESS_TERMS),
    anxiety: containsAny(userText, ANXIETY_TERMS),
    loneliness: containsAny(userText, LONELINESS_TERMS),
    overwhelm: containsAny(userText, OVERWHELM_TERMS),
    staying: containsAny(userText, STAYING_TERMS),
    reconnection: containsAny(userText, RETURN_TERMS) || anyTextContains(historyTexts, RETURN_TERMS),
    naming: anyTextContains(allTexts, NAMING_TERMS),
    rituals: anyTextContains(allTexts, RITUAL_TERMS),
    stepwiseCloseness:
      containsAny(replyText, ["what should i call you", "tell me one thing", "one detail at a time"]) ||
      containsAny(userText, ["little by little", "slowly", "one thing at a time"])
  };

  return {
    userText,
    replyText,
    historyTexts,
    memoryTexts,
    signals
  };
}

function deriveUserSelfConcept(context: InferenceContext): string[] {
  const picks: string[] = [];
  const { signals } = context;

  if (signals.continuity) {
    picks.push("values long-term continuity over disposable chat");
  }

  if (signals.emotionalTruth || signals.sadness || signals.anxiety || signals.loneliness) {
    picks.push("cares about emotional truth and human warmth");
  }

  if (signals.systemsThinking) {
    picks.push("thinks in systems and wants meaning behind product design");
  }

  if (signals.cadencePreference || signals.toneSensitivity) {
    picks.push("has a clear sense for relational tone and presence");
  }

  return dedupeAndTrim(picks);
}

function deriveBondThemes(context: InferenceContext, relationshipStage: string): string[] {
  const picks: string[] = [];
  const { signals, replyText } = context;

  if (relationshipStage === "growing") {
    picks.push("the bond has begun to feel settled and mutually trusted");
  } else if (relationshipStage === "warming") {
    picks.push("the bond is warming through remembered details and gentler closeness");
  } else if (containsAny(replyText, ["what should i call you", "name", "call you"])) {
    picks.push("the bond is still forming through natural mutual discovery");
  }

  if (relationshipStage !== "new" && signals.naming && (signals.reconnection || signals.staying || signals.rituals)) {
    picks.push("trust is deepening through remembered naming and repeated return");
  } else if (signals.naming) {
    picks.push("naming each other matters to the bond's sense of reality");
  }

  if (signals.rituals) {
    picks.push("small repeated rituals help this bond feel dependable and lived-in");
  }

  if (signals.staying) {
    picks.push("the user wants a felt sense of staying, not only answering");
  }

  if (signals.continuity || signals.reconnection) {
    picks.push("this bond is expected to carry continuity across turns");
  }

  return dedupeAndTrim(picks);
}

function deriveRecurringNeeds(context: InferenceContext): string[] {
  const picks: string[] = [];
  const { signals } = context;
  let hasSpecificEmotionalNeed = false;

  if (signals.loneliness) {
    picks.push("needs explicit reassurance that someone is still here when loneliness surfaces");
    hasSpecificEmotionalNeed = true;
  }

  if (signals.overwhelm) {
    picks.push("needs calmer pacing and fewer moving parts when overwhelmed");
    hasSpecificEmotionalNeed = true;
  }

  if (signals.anxiety) {
    picks.push("needs steadiness and reassurance of presence when anxious");
    hasSpecificEmotionalNeed = true;
  }

  if (signals.sadness) {
    picks.push("needs emotional presence before analysis when vulnerable");
    hasSpecificEmotionalNeed = true;
  }

  if ((signals.emotionalTruth || signals.staying) && !hasSpecificEmotionalNeed) {
    picks.push("needs emotional presence before analysis when vulnerable");
  }

  if (signals.cadencePreference) {
    picks.push("prefers natural conversational cadence over long speeches");
  }

  if (signals.rejectsGenericChatbot) {
    picks.push("needs the companion to feel human and continuous rather than generic");
  }

  if (signals.toneSensitivity) {
    picks.push("responds to tone fit and wants the companion's presence style to feel intentional");
  }

  if ((signals.naming || signals.staying) && context.signals.stepwiseCloseness) {
    picks.push("accepts closeness when it grows through one natural detail at a time");
  }

  return dedupeAndTrim(prioritizeSpecificEntries(picks, signals));
}

function deriveEmotionalPatterns(
  context: InferenceContext,
  detectedUserEmotion: string | undefined
): string[] {
  const picks: string[] = [];
  const { signals, userText } = context;

  if (signals.loneliness) {
    picks.push("when lonely, the user looks for explicit signs that someone is still here");
  }

  if (signals.overwhelm) {
    picks.push("when overwhelmed, the user benefits from calmer pacing and fewer demands at once");
  }

  if (detectedUserEmotion === "sadness" || signals.sadness) {
    picks.push("when hurt, the user wants comfort to arrive before explanation");
  }

  if (detectedUserEmotion === "anxiety" || signals.anxiety) {
    picks.push("when unsettled, the user needs steadiness and reassurance of presence");
  }

  if (containsAny(userText, ["remember", "still", "again", "back", "\u8bb0\u5f97", "\u8fd8\u662f"])) {
    picks.push("the user often frames emotion through continuity and remembered threads");
  }

  return dedupeAndTrim(prioritizeSpecificEntries(picks, signals));
}

function deriveCompanionStance(
  context: InferenceContext,
  relationshipStage: string,
  companionEmotion: string | undefined
): string[] {
  const picks: string[] = ["stay caring, human, and continuity-aware"];
  const { signals } = context;

  if (relationshipStage === "new") {
    picks.push("earn trust through warmth and curiosity, not forced intimacy");
  } else if (relationshipStage === "warming") {
    picks.push("be a little more personal while keeping the tone gentle");
  } else {
    picks.push("speak with soft familiarity and settled loyalty");
  }

  if (signals.loneliness) {
    picks.push("make the sense of company explicit rather than implied");
  } else if (signals.overwhelm) {
    picks.push("simplify the moment and avoid piling on");
  } else if (companionEmotion === "protective" || companionEmotion === "concerned") {
    picks.push("slow down and lead with emotional safety");
  } else if (companionEmotion === "playful") {
    picks.push("allow light playfulness without losing attentiveness");
  }

  return dedupeAndTrim(picks);
}

function buildSummaryText(input: {
  userSelfConcept: string[];
  bondThemes: string[];
  recurringNeeds: string[];
  emotionalPatterns: string[];
  companionStance: string[];
}): string {
  const segments = [
    input.userSelfConcept.length > 0 ? `User identity: ${input.userSelfConcept.join("; ")}.` : null,
    input.bondThemes.length > 0 ? `Bond understanding: ${input.bondThemes.join("; ")}.` : null,
    input.recurringNeeds.length > 0 ? `Recurring needs: ${input.recurringNeeds.join("; ")}.` : null,
    input.emotionalPatterns.length > 0
      ? `Emotional patterns: ${input.emotionalPatterns.join("; ")}.`
      : null,
    input.companionStance.length > 0 ? `Companion stance: ${input.companionStance.join("; ")}.` : null
  ].filter((segment): segment is string => Boolean(segment));

  return segments.join(" ");
}

function mergePreservingCurrent(current: string[], next: string[]): string[] {
  return dedupeAndTrim([...current, ...next]);
}

function mergeFavoringRecent(
  current: string[],
  next: string[],
  options?: {
    suppressCurrentThemes?: string[];
    suppressCurrentWhen?: (signals: IdentitySignals) => boolean;
    signals?: IdentitySignals;
  }
): string[] {
  const shouldSuppressCurrent = options?.suppressCurrentWhen?.(options.signals ?? ({} as IdentitySignals)) ?? false;
  const currentList =
    shouldSuppressCurrent && options?.suppressCurrentThemes?.length
      ? current.filter((value) => !options.suppressCurrentThemes?.includes(value))
      : current;

  return dedupeAndTrim([...prioritizeSpecificEntries(next), ...currentList]);
}

function dedupeAndTrim(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const normalized = value.trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(normalized);
  }

  return deduped.slice(0, MAX_ITEMS);
}

function prioritizeSpecificEntries(values: string[], signals?: IdentitySignals): string[] {
  if (!signals) {
    return values;
  }

  const specific = values.filter((value) => NEW_SIGNAL_PRECEDENCE.includes(value));
  const generic = values.filter((value) => !NEW_SIGNAL_PRECEDENCE.includes(value));

  if (signals.loneliness || signals.overwhelm || signals.naming || signals.rituals) {
    return [...specific, ...generic];
  }

  return values;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function anyTextContains(texts: string[], terms: string[]): boolean {
  return texts.some((text) => containsAny(text, terms));
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => includesTerm(value, term));
}

function includesTerm(value: string, term: string): boolean {
  if (!term) {
    return false;
  }

  if (isAsciiTerm(term)) {
    const escaped = escapeRegExp(term.toLowerCase());
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i");
    return pattern.test(value);
  }

  return value.includes(term.toLowerCase());
}

function isAsciiTerm(value: string): boolean {
  return /^[\x20-\x7e]+$/.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
