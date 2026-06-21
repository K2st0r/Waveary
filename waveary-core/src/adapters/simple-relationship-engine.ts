import type { Message, RelationshipDelta, RelationshipEngine, RelationshipProfile } from "../index.js";

export class SimpleRelationshipEngine implements RelationshipEngine {
  async evaluateDelta(
    message: Message,
    _reply: Message,
    current: RelationshipProfile
  ): Promise<RelationshipDelta> {
    const content = message.content.trim();
    const openness = measureOpenness(content);
    const vulnerability = measureVulnerability(content);
    const trustSignal = measureTrustSignal(content);
    const warmth = measureWarmth(content);

    const affinityDelta = clampDelta(0.02 + openness * 0.06 + warmth * 0.04);
    const trustDelta = clampDelta(0.015 + vulnerability * 0.07 + trustSignal * 0.05);
    const stabilityBias = current.stage === "new" ? 0.008 : current.stage === "warming" ? 0.015 : 0.02;
    const stabilityDelta = clampDelta(stabilityBias + trustSignal * 0.02);

    return {
      affinityDelta,
      trustDelta,
      stabilityDelta,
      reason: deriveReason(openness, vulnerability, trustSignal)
    };
  }
}

function measureOpenness(content: string): number {
  let score = 0;

  if (content.length >= 18) {
    score += 0.4;
  }

  if (/我|my|me|I /i.test(content)) {
    score += 0.2;
  }

  if (/喜欢|希望|想|在意|担心|开心|难过|I like|I hope|I want|I care|I feel/i.test(content)) {
    score += 0.4;
  }

  return Math.min(1, score);
}

function measureVulnerability(content: string): number {
  let score = 0;

  if (/难过|害怕|孤独|失望|压力|紧张|担心|焦虑|想念|委屈|sad|afraid|lonely|anxious|worried|miss/i.test(content)) {
    score += 0.7;
  }

  if (/开心|感动|珍惜|重要|信任|温暖|happy|moved|important|trust/i.test(content)) {
    score += 0.3;
  }

  return Math.min(1, score);
}

function measureTrustSignal(content: string): number {
  let score = 0;

  if (/谢谢|拜托|请你|记住|信任|告诉你|thanks|thank you|please|remember|trust/i.test(content)) {
    score += 0.7;
  }

  if (/以后|一直|继续|长期|future|keep|continue|long-term/i.test(content)) {
    score += 0.3;
  }

  return Math.min(1, score);
}

function measureWarmth(content: string): number {
  if (/谢谢|辛苦了|抱抱|陪我|thanks|thank you|stay with me|with me/i.test(content)) {
    return 1;
  }

  return 0;
}

function deriveReason(openness: number, vulnerability: number, trustSignal: number): string {
  if (vulnerability >= 0.6) {
    return "user_shared_vulnerability";
  }

  if (trustSignal >= 0.6) {
    return "user_extended_trust";
  }

  if (openness >= 0.5) {
    return "user_shared_personal_context";
  }

  return "user_continued_conversation";
}

function clampDelta(value: number): number {
  return Math.min(0.16, Math.max(0.01, value));
}
