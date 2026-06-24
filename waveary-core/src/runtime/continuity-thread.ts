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

  if (memoryCandidate && memoryScore >= timelineScore && memoryScore >= (emotionalTurn ? 0.48 : 0.18)) {
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
      secondaryMemories: timelineBackfill.length > 0 ? input.relevantMemories.slice(0, 2) : []
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
  const continuityQuery = resolveContinuityQuery(
    latestContent
      ? {
          id: "focus-latest",
          sessionId: "focus-session",
          role: "user",
          content: latestContent,
          timestamp: new Date(0).toISOString(),
          metadata: {}
        }
      : undefined,
    messageHistory
  );

  return summarizeCurrentTurnFocus(continuityQuery.focusText);
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

  for (let index = messageHistory.length - 1; index >= 0; index -= 1) {
    const message = messageHistory[index];

    if (!message || message.role !== "user" || message.id === latestUserMessage.id) {
      continue;
    }

    return message;
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
    /^(and|but|so|still|also|then|just|well|actually|yeah|yes|no|其实|还是|然后|而且|但是|不过|所以|就|那|这)/i.test(
      compact
    );
  const explicitCarryover =
    /\b(still|same thing|about that|about it|that part|this part|that one|this one|again)\b/i.test(
      compact
    ) ||
    /(那个|这个|这件事|那件事|这一点|那一点|还是这个|还是那个|还是这件事|还是那件事|这部分|那部分)/.test(
      compact
    );
  const genericReference =
    /\b(it|that|this|they|them)\b/i.test(compact) ||
    /(它|他|她|这|那)/.test(compact);

  if (explicitCarryover) {
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
  return /sad|anxious|worried|hurt|alone|afraid|lonely|难过|焦虑|担心|害怕|孤单|失落|委屈/i.test(
    value
  );
}
