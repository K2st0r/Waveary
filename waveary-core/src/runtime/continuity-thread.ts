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
  relevantMemories: MemoryItem[];
  timeline: TimelineEvent[];
}

export function selectContinuityThread(
  input: ContinuityThreadSelectionInput
): ContinuityThreadSelection {
  const turnText = input.latestUserMessage?.content ?? "";
  const emotionalTurn = hasHighEmotionalTurnSignal(turnText);
  const sortedMemoryCandidates = [...input.relevantMemories]
    .map((memory) => ({
      memory,
      rawScore: scoreContinuityMatch(memory.content, turnText)
    }))
    .sort((left, right) => right.rawScore - left.rawScore);
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

export function summarizeCurrentTurnFocus(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();

  if (!compact) {
    return "No explicit user-turn focus was available.";
  }

  return compact.length > 120 ? `${compact.slice(0, 120).trim()}...` : compact;
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
