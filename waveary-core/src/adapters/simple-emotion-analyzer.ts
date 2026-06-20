import type { EmotionAnalyzer, EmotionState, Message } from "../index.js";

export class SimpleEmotionAnalyzer implements EmotionAnalyzer {
  async analyze(message: Message): Promise<EmotionState | undefined> {
    const content = message.content.toLowerCase();

    if (content.length === 0) {
      return undefined;
    }

    const primaryEmotion = content.includes("开心") || content.includes("happy")
      ? "joy"
      : content.includes("难过") || content.includes("sad")
        ? "sadness"
        : "neutral";

    return {
      userId: message.sessionId,
      primaryEmotion,
      intensity: primaryEmotion === "neutral" ? 0.35 : 0.7,
      confidence: 0.6,
      windowStart: message.timestamp,
      windowEnd: message.timestamp
    };
  }
}
