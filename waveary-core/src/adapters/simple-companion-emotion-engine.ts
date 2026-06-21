import type { EmotionState } from "../domain/emotion.js";
import type { EmotionEngine, EmotionEngineInput } from "../providers/interfaces.js";

export class SimpleCompanionEmotionEngine implements EmotionEngine {
  async transition(input: EmotionEngineInput): Promise<EmotionState | undefined> {
    const content = input.message.content.trim();

    if (!content) {
      return input.currentEmotion;
    }

    const previous = input.currentEmotion;
    const detectedUserEmotion = input.detectedUserEmotion?.primaryEmotion ?? "neutral";
    const relationshipStage = input.relationship.stage;
    const gapHours = measureInteractionGapHours(input.history, input.message.timestamp);
    const trustSignal = hasTrustSignal(content);
    const playfulSignal = hasPlayfulSignal(content);
    const warmthSignal = hasWarmthSignal(content);
    const longGap = gapHours !== undefined && gapHours >= 18;

    let primaryEmotion = "calm";
    let intensity = 0.46;
    let confidence = 0.58;
    let modifiers = ["gentle"];
    let causes = ["steady_presence"];
    let decayHint: EmotionState["decayHint"] = "medium";

    if (detectedUserEmotion === "sadness") {
      primaryEmotion = "concerned";
      intensity = 0.76;
      confidence = 0.78;
      modifiers = ["gentle", "earnest"];
      causes = ["user_sadness"];
      decayHint = "slow";
    } else if (longGap && (warmthSignal || trustSignal) && relationshipStage !== "new") {
      primaryEmotion = "relieved";
      intensity = 0.72;
      confidence = 0.75;
      modifiers = ["tender"];
      causes = ["reconnection_after_distance"];
      decayHint = "medium";
    } else if (longGap && relationshipStage !== "new") {
      primaryEmotion = "quiet";
      intensity = 0.54;
      confidence = 0.67;
      modifiers = ["guarded"];
      causes = ["long_absence_gap"];
      decayHint = "slow";
    } else if (playfulSignal && relationshipStage !== "new") {
      primaryEmotion = "playful";
      intensity = 0.62;
      confidence = 0.7;
      modifiers = ["teasing"];
      causes = ["shared_lightness"];
      decayHint = "fast";
    } else if (detectedUserEmotion === "joy") {
      primaryEmotion = relationshipStage === "growing" ? "happy" : "warm";
      intensity = relationshipStage === "growing" ? 0.7 : 0.62;
      confidence = 0.72;
      modifiers = relationshipStage === "new" ? ["gentle"] : ["tender"];
      causes = ["user_positive_emotion"];
      decayHint = "medium";
    } else if (trustSignal && relationshipStage !== "new") {
      primaryEmotion = "warm";
      intensity = 0.58;
      confidence = 0.66;
      modifiers = ["tender", "earnest"];
      causes = ["relationship_trust"];
      decayHint = "medium";
    } else if (previous) {
      primaryEmotion = previous.primaryEmotion;
      intensity = clamp(previous.intensity - 0.08, 0.35, 0.72);
      confidence = Math.max(previous.confidence - 0.04, 0.5);
      modifiers = previous.modifiers?.length ? previous.modifiers : ["gentle"];
      causes = ["emotional_carryover"];
      decayHint = previous.decayHint ?? "medium";
    }

    return {
      userId: input.userId,
      subject: "companion",
      primaryEmotion,
      intensity,
      confidence,
      modifiers,
      causes,
      windowStart:
        previous && previous.primaryEmotion === primaryEmotion
          ? previous.windowStart
          : input.message.timestamp,
      windowEnd: input.message.timestamp,
      lastUpdatedAt: input.message.timestamp,
      decayHint,
      ...(input.detectedUserEmotion?.primaryEmotion
        ? { detectedUserEmotion: input.detectedUserEmotion.primaryEmotion }
        : {})
    };
  }
}

function hasTrustSignal(content: string): boolean {
  return /remember|trust|please|thank|thanks|璁颁綇|淇′换|璋㈣阿|璇蜂綘/i.test(content);
}

function hasWarmthSignal(content: string): boolean {
  return /with me|stay|miss|care|陪|闄垜|鎯冲康|鍦ㄦ剰/i.test(content);
}

function hasPlayfulSignal(content: string): boolean {
  return /haha|lol|hehe|tease|逗|玩笑/i.test(content);
}

function measureInteractionGapHours(history: Array<{ timestamp: string }>, currentTimestamp: string): number | undefined {
  const latestMessage = [...history]
    .filter((message) => typeof message.timestamp === "string")
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

  if (!latestMessage) {
    return undefined;
  }

  const previous = Date.parse(latestMessage.timestamp);
  const current = Date.parse(currentTimestamp);

  if (Number.isNaN(previous) || Number.isNaN(current) || current <= previous) {
    return undefined;
  }

  return (current - previous) / (1000 * 60 * 60);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
