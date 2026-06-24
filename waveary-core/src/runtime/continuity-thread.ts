import type { MemoryItem } from "../domain/memory.js";
import type { Message } from "../domain/session.js";
import type { TimelineEvent } from "../domain/timeline.js";

export interface ContinuityThreadSelection {
  primaryLine: string;
  guidance: string;
  secondaryMemories: MemoryItem[];
}

export interface ContinuityThreadSelectionInput {
  latestUserMessage?: Message | undefined;
  messageHistory?: Message[] | undefined;
  relevantMemories: MemoryItem[];
  timeline: TimelineEvent[];
}

export function selectContinuityThread(
  input: ContinuityThreadSelectionInput
): ContinuityThreadSelection {
  const continuityQuery = resolveContinuityQuery(
    input.latestUserMessage,
    input.messageHistory
  );
  const turnText = continuityQuery.queryText;
  const emotionalTurn = hasHighEmotionalTurnSignal(turnText);
  const sortedMemoryCandidates = [...input.relevantMemories]
    .map((memory) => ({
      memory,
      rawScore: scoreContinuityMatch(memory.content, turnText),
      rankingScore: rankMemoryCandidate(memory, turnText, input.messageHistory)
    }))
    .sort((left, right) => right.rankingScore - left.rankingScore);
  const sortedTimelineCandidates = [...input.timeline]
    .map((event) => ({
      event,
      rawScore: scoreContinuityMatch(
        `${event.title} ${event.description ?? ""}`,
        turnText
      )
    }))
    .sort((left, right) => right.rawScore - left.rawScore);
  const topMemoryCandidate = sortedMemoryCandidates[0];
  const topTimelineCandidate = sortedTimelineCandidates[0];
  const memoryCandidate = topMemoryCandidate?.memory;
  const timelineCandidate = topTimelineCandidate?.event;
  const rawMemoryScore = topMemoryCandidate?.rawScore ?? 0;
  const rawTimelineScore = topTimelineCandidate?.rawScore ?? 0;
  const memoryScore = memoryCandidate
    ? rawMemoryScore + (emotionalTurn ? 0 : 0.12)
    : 0;
  const timelineScore = timelineCandidate ? rawTimelineScore : 0;
  const memoryRemainder = sortedMemoryCandidates
    .slice(1)
    .map((candidate) => candidate.memory);
  const timelineBackfill = sortedTimelineCandidates
    .slice(0, 2)
    .map((candidate) => candidate.event);

  if (
    memoryCandidate &&
    emotionalTurn &&
    rawMemoryScore < 0.48 &&
    (!timelineCandidate || rawTimelineScore < 0.48)
  ) {
    return {
      primaryLine: `[memory:${memoryCandidate.type}] ${memoryCandidate.content}`,
      guidance:
        "This memory is available, but only use it if the current turn clearly connects. Otherwise stay present with the immediate feeling.",
      secondaryMemories: memoryRemainder.slice(0, 2)
    };
  }

  if (
    memoryCandidate &&
    memoryScore >= timelineScore &&
    memoryScore >= (emotionalTurn ? 0.48 : 0.18)
  ) {
    return {
      primaryLine: `[memory:${memoryCandidate.type}] ${memoryCandidate.content}`,
      guidance:
        "Use at most one natural reference to this remembered thread if it deepens the user's sense of being understood.",
      secondaryMemories: memoryRemainder.slice(0, 2)
    };
  }

  if (timelineCandidate && emotionalTurn && rawTimelineScore < 0.48) {
    return {
      primaryLine: `[timeline:${timelineCandidate.eventType}] ${timelineCandidate.title}`,
      guidance:
        "This timeline thread is available, but do not force it unless it naturally matches the user's present concern.",
      secondaryMemories: sortedMemoryCandidates
        .map((candidate) => candidate.memory)
        .slice(0, 2)
    };
  }

  if (timelineCandidate && timelineScore >= 0.18) {
    return {
      primaryLine: `[timeline:${timelineCandidate.eventType}] ${timelineCandidate.title}`,
      guidance:
        "If continuity helps here, anchor the reply around this shared life thread rather than listing multiple remembered details.",
      secondaryMemories: sortedMemoryCandidates
        .map((candidate) => candidate.memory)
        .slice(0, 2)
    };
  }

  if (memoryCandidate) {
    return {
      primaryLine: `[memory:${memoryCandidate.type}] ${memoryCandidate.content}`,
      guidance:
        "This memory is available, but only use it if the current turn clearly connects. Otherwise stay present with the immediate feeling.",
      secondaryMemories: memoryRemainder.slice(0, 2)
    };
  }

  if (timelineCandidate) {
    return {
      primaryLine: `[timeline:${timelineCandidate.eventType}] ${timelineCandidate.title}`,
      guidance:
        "This timeline thread is available, but do not force it unless it naturally matches the user's present concern.",
      secondaryMemories:
        timelineBackfill.length > 0 ? input.relevantMemories.slice(0, 2) : []
    };
  }

  return {
    primaryLine: "None",
    guidance:
      "No strong continuity thread is available. Stay with the current emotional moment rather than inventing continuity.",
    secondaryMemories: []
  };
}

function rankMemoryCandidate(
  memory: MemoryItem,
  turnText: string,
  messageHistory?: Message[]
): number {
  const baseScore = scoreContinuityMatch(memory.content, turnText);
  const recencyBonus = resolveMemoryRecencyBonus(memory.createdAt);
  const sourceTurnBonus = resolveMemorySourceTurnBonus(memory, messageHistory);
  return baseScore + recencyBonus + sourceTurnBonus;
}

function resolveMemoryRecencyBonus(createdAt: string): number {
  const createdAtMs = Date.parse(createdAt);

  if (!Number.isFinite(createdAtMs)) {
    return 0;
  }

  const ageDays = Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));

  if (ageDays <= 3) {
    return 0.08;
  }

  if (ageDays <= 14) {
    return 0.04;
  }

  if (ageDays <= 45) {
    return 0.015;
  }

  return 0;
}

function resolveMemorySourceTurnBonus(
  memory: MemoryItem,
  messageHistory?: Message[]
): number {
  if (!messageHistory || messageHistory.length === 0 || memory.sourceMessageIds.length === 0) {
    return 0;
  }

  const userMessages = messageHistory.filter((message) => message.role === "user");

  if (userMessages.length === 0) {
    return 0;
  }

  let bestRank = -1;

  for (let index = 0; index < userMessages.length; index += 1) {
    const message = userMessages[index];

    if (message && memory.sourceMessageIds.includes(message.id)) {
      bestRank = Math.max(bestRank, index);
    }
  }

  if (bestRank < 0) {
    return 0;
  }

  const relativeRank = (bestRank + 1) / userMessages.length;
  return 0.03 * relativeRank;
}

export function summarizeCurrentTurnFocus(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();

  if (!compact) {
    return "No explicit user-turn focus was available.";
  }

  return compact.length > 120 ? `${compact.slice(0, 120).trim()}...` : compact;
}

export function summarizeCurrentTurnFocusWithHistory(
  latestContent: string,
  messageHistory?: Message[]
): string {
  const compactLatest = latestContent.trim();

  if (!compactLatest) {
    return summarizeCurrentTurnFocus(latestContent);
  }

  const previousUserMessage = findPreviousUserMessageByContent(
    compactLatest,
    messageHistory
  );

  if (
    !previousUserMessage ||
    !shouldBlendWithPreviousUserTurn(compactLatest, previousUserMessage.content)
  ) {
    return summarizeCurrentTurnFocus(compactLatest);
  }

  return `Continuing: ${summarizeCurrentTurnFocus(previousUserMessage.content)} Follow-up now: ${summarizeCurrentTurnFocus(compactLatest)}`;
}

function scoreContinuityMatch(candidateText: string, turnText: string): number {
  const candidate = normalizePromptScoringText(candidateText);
  const turn = normalizePromptScoringText(turnText);
  const turnTokens = extractPromptScoringTokens(turn);

  if (!candidate || turnTokens.length === 0) {
    return 0;
  }

  const tokenHits = turnTokens.filter((token) => candidate.includes(token)).length;
  const phraseBonus = turn.length >= 10 && candidate.includes(turn) ? 0.35 : 0;

  return tokenHits / turnTokens.length + phraseBonus;
}

function resolveContinuityQuery(
  latestUserMessage: Message | undefined,
  messageHistory?: Message[]
): { queryText: string; focusText: string } {
  const latestContent = latestUserMessage?.content.trim() ?? "";

  if (!latestContent) {
    return {
      queryText: "",
      focusText: ""
    };
  }

  const previousUserMessage = findPreviousUserMessage(latestUserMessage, messageHistory);

  if (!previousUserMessage) {
    return {
      queryText: latestContent,
      focusText: latestContent
    };
  }

  if (!shouldBlendWithPreviousUserTurn(latestContent, previousUserMessage.content)) {
    return {
      queryText: latestContent,
      focusText: latestContent
    };
  }

  const previousCompact = summarizeCurrentTurnFocus(previousUserMessage.content);
  const latestCompact = summarizeCurrentTurnFocus(latestContent);

  return {
    queryText: `${previousUserMessage.content.trim()} ${latestContent}`.trim(),
    focusText: `Continuing: ${previousCompact} Follow-up now: ${latestCompact}`
  };
}

function findPreviousUserMessage(
  latestUserMessage: Message | undefined,
  messageHistory?: Message[]
): Message | undefined {
  if (!latestUserMessage || !messageHistory || messageHistory.length === 0) {
    return undefined;
  }

  let skippedCurrentLikeMessage = false;

  for (let index = messageHistory.length - 1; index >= 0; index -= 1) {
    const message = messageHistory[index];

    if (!message || message.role !== "user") {
      continue;
    }

    if (message.id === latestUserMessage.id) {
      continue;
    }

    if (
      !skippedCurrentLikeMessage &&
      message.content.trim() === latestUserMessage.content.trim()
    ) {
      skippedCurrentLikeMessage = true;
      continue;
    }

    return message;
  }

  return undefined;
}

function findPreviousUserMessageByContent(
  latestContent: string,
  messageHistory?: Message[]
): Message | undefined {
  if (!messageHistory || messageHistory.length === 0) {
    return undefined;
  }

  let matchedLatest = false;

  for (let index = messageHistory.length - 1; index >= 0; index -= 1) {
    const message = messageHistory[index];

    if (!message || message.role !== "user") {
      continue;
    }

    if (!matchedLatest && message.content.trim() === latestContent) {
      matchedLatest = true;
      continue;
    }

    if (matchedLatest) {
      return message;
    }
  }

  return undefined;
}

function shouldBlendWithPreviousUserTurn(
  latestContent: string,
  previousContent: string
): boolean {
  const compact = latestContent.replace(/\s+/g, " ").trim();

  if (!compact || compact.length > 96 || previousContent.trim().length < 12) {
    return false;
  }

  const tokenCount = extractPromptScoringTokens(normalizePromptScoringText(compact)).length;
  const startsLikeContinuation =
    /^(and|but|so|still|also|then|just|well|actually|yeah|yes|no|\u5176\u5b9e|\u8fd8\u662f|\u7136\u540e|\u800c\u4e14|\u4f46\u662f|\u4e0d\u8fc7|\u6240\u4ee5|\u5c31|\u90a3|\u8fd9)/i.test(
      compact
    );
  const explicitCarryover =
    /\b(still|same thing|about that|about it|that part|this part|that one|this one|again)\b/i.test(
      compact
    ) ||
    /(\u90a3\u4e2a|\u8fd9\u4e2a|\u8fd9\u4ef6\u4e8b|\u90a3\u4ef6\u4e8b|\u8fd9\u4e00\u70b9|\u90a3\u4e00\u70b9|\u8fd8\u662f\u8fd9\u4e2a|\u8fd8\u662f\u90a3\u4e2a|\u8fd8\u662f\u8fd9\u4ef6\u4e8b|\u8fd8\u662f\u90a3\u4ef6\u4e8b|\u8fd9\u90e8\u5206|\u90a3\u90e8\u5206)/.test(
      compact
    );
  const emotionalCarryover =
    /\b(not over it|not over that|still hurts|still stings|can't shake it|cannot shake it|same feeling|same ache|it still hurts)\b/i.test(
      compact
    ) ||
    /(\u6211\u8fd8\u6ca1\u8fc7\u53bb|\u8fd8\u6ca1\u7f13\u8fc7\u6765|\u8fd8\u662f\u90a3\u4e2a\u611f\u89c9|\u8fd8\u662f\u90a3\u79cd\u611f\u89c9|\u90a3\u79cd\u611f\u89c9\u8fd8\u5728|\u90a3\u4e00\u5757\u8fd8\u5728\u75bc)/.test(
      compact
    );
  const inferentialCarryover =
    /^(maybe|perhaps|probably|i guess|i think)\b/i.test(compact) &&
    /\b(that's why|that is why|part of the same thing|part of it|why i can't|why i cannot|why i still can't|why i still cannot)\b/i.test(
      compact
    );
  const lowAffectPronounCarryover =
    /^(it|that|this|things|everything)\b/i.test(compact) &&
    /\b(feels?|felt|seems?|seemed|is|was|gets?|got)\b/i.test(compact) &&
    /\b(just|still|now|kind of|kinda|a bit|a little)\b/i.test(compact) &&
    /\b(strange|weird|off|different|heavy|hard|harder|unclear|odd)\b/i.test(compact);
  const genericReference =
    /\b(it|that|this|they|them)\b/i.test(compact) ||
    /(\u5b83|\u4ed6|\u5979|\u8fd9|\u90a3)/.test(compact);

  if (explicitCarryover) {
    return true;
  }

  if (emotionalCarryover && tokenCount <= 12) {
    return true;
  }

  if (inferentialCarryover && tokenCount <= 12) {
    return true;
  }

  if (lowAffectPronounCarryover && tokenCount <= 10) {
    return true;
  }

  if (startsLikeContinuation && tokenCount <= 10) {
    return true;
  }

  return genericReference && startsLikeContinuation && tokenCount <= 12;
}

function normalizePromptScoringText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractPromptScoringTokens(value: string): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "that",
    "with",
    "this",
    "have",
    "your",
    "from",
    "just",
    "want",
    "like",
    "really",
    "about",
    "into",
    "feel",
    "stay",
    "still",
    "tonight",
    "alone",
    "not"
  ]);
  const matches = value.match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  return [...new Set(matches.filter((token) => !stopWords.has(token)))];
}

function hasHighEmotionalTurnSignal(value: string): boolean {
  return /sad|anxious|worried|hurt|alone|afraid|lonely|闅捐繃|鐒﹁檻|鎷呭績|瀹虫€?|瀛ゅ崟|澶辫惤|濮斿眻/i.test(
    value
  );
}
