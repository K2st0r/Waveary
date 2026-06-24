import type { IdentitySummary } from "../domain/identity.js";
import type { Message } from "../domain/session.js";
import type { IdentityEngine, IdentityEngineInput } from "../providers/interfaces.js";

const MAX_ITEMS = 3;

export class SimpleIdentityEngine implements IdentityEngine {
  async summarize(input: IdentityEngineInput): Promise<IdentitySummary | undefined> {
    const combinedMemories = [...input.relevantMemories, ...input.storedMemories];
    const userSelfConcept = mergeUnique(
      input.currentSummary?.userSelfConcept ?? [],
      deriveUserSelfConcept(input.message, combinedMemories)
    );
    const bondThemes = mergeUnique(
      input.currentSummary?.bondThemes ?? [],
      deriveBondThemes(input.message, input.reply, input.relationship.stage, combinedMemories)
    );
    const recurringNeeds = mergeUnique(
      input.currentSummary?.recurringNeeds ?? [],
      deriveRecurringNeeds(input.message, input.reply, combinedMemories)
    );
    const emotionalPatterns = mergeUnique(
      input.currentSummary?.emotionalPatterns ?? [],
      deriveEmotionalPatterns(input.message, input.emotion?.detectedUserEmotion, input.currentSummary)
    );
    const companionStance = mergeUnique(
      input.currentSummary?.companionStance ?? [],
      deriveCompanionStance(input.relationship.stage, input.emotion?.primaryEmotion)
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

function deriveUserSelfConcept(message: Message, memoryContents: Array<{ content: string }>): string[] {
  const picks: string[] = [];
  const text = normalizeText(message.content);

  if (containsAny(text, ["remember", "continuity", "long-term", "steady", "ongoing"])) {
    picks.push("values long-term continuity over disposable chat");
  }

  if (containsAny(text, ["feel", "feelings", "heart", "care", "陪", "关心", "情绪"])) {
    picks.push("cares about emotional truth and human warmth");
  }

  if (containsAny(text, ["framework", "system", "product", "design", "architecture"])) {
    picks.push("thinks in systems and wants meaning behind product design");
  }

  for (const memory of memoryContents) {
    const memoryText = normalizeText(memory.content);

    if (
      containsAny(memoryText, ["playful", "teasing", "soft", "gentle", "steady"]) &&
      !picks.includes("has a clear sense for relational tone and presence")
    ) {
      picks.push("has a clear sense for relational tone and presence");
    }
  }

  return picks.slice(0, MAX_ITEMS);
}

function deriveBondThemes(
  message: Message,
  reply: Message,
  relationshipStage: string,
  memoryContents: Array<{ content: string }>
): string[] {
  const picks: string[] = [];
  const userText = normalizeText(message.content);
  const replyText = normalizeText(reply.content);

  if (containsAny(userText, ["remember", "still", "again", "back", "continue"])) {
    picks.push("this bond is expected to carry continuity across turns");
  }

  if (containsAny(userText, ["with me", "stay", "陪着", "在这", "别走"])) {
    picks.push("the user wants a felt sense of staying, not only answering");
  }

  if (relationshipStage === "growing") {
    picks.push("the bond has begun to feel settled and mutually trusted");
  } else if (relationshipStage === "warming") {
    picks.push("the bond is becoming more personal and continuous");
  } else if (containsAny(replyText, ["what should i call you", "name", "call you"])) {
    picks.push("the bond is still forming through natural mutual discovery");
  }

  if (
    memoryContents.some((memory) =>
      containsAny(normalizeText(memory.content), ["nickname", "call me", "name's", "i'm called"])
    )
  ) {
    picks.push("naming each other matters to the bond's sense of reality");
  }

  return picks.slice(0, MAX_ITEMS);
}

function deriveRecurringNeeds(
  message: Message,
  reply: Message,
  memoryContents: Array<{ content: string }>
): string[] {
  const picks: string[] = [];
  const userText = normalizeText(message.content);
  const replyText = normalizeText(reply.content);

  if (containsAny(userText, ["sad", "hurt", "anxious", "worried", "alone", "lonely"])) {
    picks.push("needs emotional presence before analysis when vulnerable");
  }

  if (
    containsAny(userText, ["emotionally real", "emotionally", "real", "human warmth", "care", "caring"]) &&
    !picks.includes("needs emotional presence before analysis when vulnerable")
  ) {
    picks.push("needs emotional presence before analysis when vulnerable");
  }

  if (containsAny(userText, ["short", "brief", "normal", "text", "自然", "别太长"])) {
    picks.push("prefers natural conversational cadence over long speeches");
  }

  if (
    containsAny(userText, ["disposable chatbot", "chatbot", "not like a chatbot", "not a generic chatbot"])
  ) {
    picks.push("needs the companion to feel human and continuous rather than generic");
  }

  if (
    memoryContents.some((memory) =>
      containsAny(normalizeText(memory.content), ["playful", "teasing", "soft", "gentle", "steady"])
    )
  ) {
    picks.push("responds to tone fit and wants the companion's presence style to feel intentional");
  }

  if (containsAny(replyText, ["what should i call you", "tell me one thing"])) {
    picks.push("accepts closeness when it grows through one natural detail at a time");
  }

  return picks.slice(0, MAX_ITEMS);
}

function deriveEmotionalPatterns(
  message: Message,
  detectedUserEmotion: string | undefined,
  currentSummary: IdentitySummary | undefined
): string[] {
  const picks = [...(currentSummary?.emotionalPatterns ?? [])];
  const userText = normalizeText(message.content);

  if (detectedUserEmotion === "sadness" || containsAny(userText, ["sad", "hurt", "难过", "伤心"])) {
    picks.push("when hurt, the user wants comfort to arrive before explanation");
  }

  if (detectedUserEmotion === "anxiety" || containsAny(userText, ["anxious", "worried", "怕", "焦虑"])) {
    picks.push("when unsettled, the user needs steadiness and reassurance of presence");
  }

  if (containsAny(userText, ["remember", "still", "again", "back"])) {
    picks.push("the user often frames emotion through continuity and remembered threads");
  }

  return dedupeAndTrim(picks);
}

function deriveCompanionStance(relationshipStage: string, companionEmotion: string | undefined): string[] {
  const picks: string[] = ["stay caring, human, and continuity-aware"];

  if (relationshipStage === "new") {
    picks.push("earn trust through warmth and curiosity, not forced intimacy");
  } else if (relationshipStage === "warming") {
    picks.push("be a little more personal while keeping the tone gentle");
  } else {
    picks.push("speak with soft familiarity and settled loyalty");
  }

  if (companionEmotion === "protective" || companionEmotion === "concerned") {
    picks.push("slow down and lead with emotional safety");
  } else if (companionEmotion === "playful") {
    picks.push("allow light playfulness without losing attentiveness");
  }

  return picks.slice(0, MAX_ITEMS);
}

function buildSummaryText(input: {
  userSelfConcept: string[];
  bondThemes: string[];
  recurringNeeds: string[];
  emotionalPatterns: string[];
  companionStance: string[];
}): string {
  const segments = [
    input.userSelfConcept.length > 0
      ? `User identity: ${input.userSelfConcept.join("; ")}.`
      : null,
    input.bondThemes.length > 0
      ? `Bond understanding: ${input.bondThemes.join("; ")}.`
      : null,
    input.recurringNeeds.length > 0
      ? `Recurring needs: ${input.recurringNeeds.join("; ")}.`
      : null,
    input.emotionalPatterns.length > 0
      ? `Emotional patterns: ${input.emotionalPatterns.join("; ")}.`
      : null,
    input.companionStance.length > 0
      ? `Companion stance: ${input.companionStance.join("; ")}.`
      : null
  ].filter((segment): segment is string => Boolean(segment));

  return segments.join(" ");
}

function mergeUnique(current: string[], next: string[]): string[] {
  return dedupeAndTrim([...current, ...next]);
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

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}
