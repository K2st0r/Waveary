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
    const warmthSignal = hasWarmthSignal(content);
    const playfulSignal = hasPlayfulSignal(content);
    const vulnerabilitySignal = hasVulnerabilitySignal(content);
    const reconnectionSignal = gapHours !== undefined && gapHours >= 18;
    const recallSignal = input.relevantMemories.length > 0 || input.timeline.length > 0;

    let primaryEmotion = "calm";
    let intensity = stageAdjustedBaseline(relationshipStage);
    let confidence = 0.6;
    let modifiers = stageDefaultModifiers(relationshipStage);
    let causes = ["steady_presence"];
    let decayHint: EmotionState["decayHint"] = "medium";

    if (detectedUserEmotion === "sadness") {
      primaryEmotion = relationshipStage === "growing" ? "protective" : "concerned";
      intensity = relationshipStage === "growing" ? 0.82 : 0.76;
      confidence = 0.8;
      modifiers = relationshipStage === "new" ? ["gentle", "careful"] : ["gentle", "close"];
      causes = ["user_sadness"];
      decayHint = "slow";
    } else if (detectedUserEmotion === "anxiety") {
      primaryEmotion = "attentive";
      intensity = relationshipStage === "growing" ? 0.74 : 0.68;
      confidence = 0.78;
      modifiers = ["steady", "grounding"];
      causes = ["user_anxiety"];
      decayHint = "medium";
    } else if (reconnectionSignal && relationshipStage === "growing" && (warmthSignal || trustSignal)) {
      primaryEmotion = "relieved";
      intensity = 0.78;
      confidence = 0.78;
      modifiers = ["tender", "closer"];
      causes = ["warm_reconnection"];
      decayHint = "medium";
    } else if (reconnectionSignal && relationshipStage !== "new") {
      primaryEmotion = "soft";
      intensity = 0.62;
      confidence = 0.68;
      modifiers = ["quiet", "patient"];
      causes = ["reconnection_after_distance"];
      decayHint = "slow";
    } else if (detectedUserEmotion === "affection" || (warmthSignal && relationshipStage !== "new")) {
      primaryEmotion = relationshipStage === "growing" ? "fond" : "warm";
      intensity = relationshipStage === "growing" ? 0.74 : 0.64;
      confidence = 0.74;
      modifiers = relationshipStage === "new" ? ["gentle"] : ["tender", "soft"];
      causes = ["shared_affection"];
      decayHint = "medium";
    } else if (detectedUserEmotion === "joy") {
      primaryEmotion = relationshipStage === "growing" ? "happy" : "warm";
      intensity = relationshipStage === "growing" ? 0.72 : 0.62;
      confidence = 0.72;
      modifiers = relationshipStage === "new" ? ["light"] : ["warm", "open"];
      causes = ["user_positive_emotion"];
      decayHint = "medium";
    } else if (playfulSignal && relationshipStage !== "new") {
      primaryEmotion = "playful";
      intensity = relationshipStage === "growing" ? 0.7 : 0.61;
      confidence = 0.69;
      modifiers = relationshipStage === "growing" ? ["teasing", "bright"] : ["light", "teasing"];
      causes = ["shared_playfulness"];
      decayHint = "fast";
    } else if (trustSignal || vulnerabilitySignal) {
      primaryEmotion = relationshipStage === "new" ? "earnest" : "warm";
      intensity = relationshipStage === "new" ? 0.58 : 0.63;
      confidence = 0.68;
      modifiers = relationshipStage === "new" ? ["careful", "present"] : ["earnest", "tender"];
      causes = ["user_opened_up"];
      decayHint = "medium";
    } else if (recallSignal && relationshipStage !== "new") {
      primaryEmotion = "settled";
      intensity = relationshipStage === "growing" ? 0.59 : 0.54;
      confidence = 0.64;
      modifiers = ["steady"];
      causes = ["continuity_thread"];
      decayHint = "medium";
    } else if (previous) {
      primaryEmotion = previous.primaryEmotion;
      intensity = clamp(previous.intensity - 0.06, 0.36, 0.78);
      confidence = Math.max(previous.confidence - 0.03, 0.52);
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

function stageAdjustedBaseline(stage: string): number {
  if (stage === "growing") {
    return 0.52;
  }

  if (stage === "warming") {
    return 0.48;
  }

  return 0.44;
}

function stageDefaultModifiers(stage: string): string[] {
  if (stage === "growing") {
    return ["steady", "warm"];
  }

  if (stage === "warming") {
    return ["gentle", "present"];
  }

  return ["gentle", "careful"];
}

function hasTrustSignal(content: string): boolean {
  return /remember|trust|please|thank|thanks|记住|信任|拜托|麻烦你|谢谢/i.test(content);
}

function hasWarmthSignal(content: string): boolean {
  return /with me|stay|miss|care|抱抱|陪着我|想你|在我身边|关心我/i.test(content);
}

function hasPlayfulSignal(content: string): boolean {
  return /haha|lol|hehe|tease|逗你|玩笑|哈哈|嘿嘿/i.test(content);
}

function hasVulnerabilitySignal(content: string): boolean {
  return /sad|afraid|lonely|anxious|worried|hurt|难过|害怕|孤单|焦虑|委屈|失落/i.test(
    content
  );
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
