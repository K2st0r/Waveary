import type { EmotionAnalyzer, EmotionState, Message } from "../index.js";

interface EmotionPattern {
  emotion: string;
  patterns: RegExp[];
  intensity: number;
  confidence: number;
}

const EMOTION_PATTERNS: EmotionPattern[] = [
  {
    emotion: "sadness",
    patterns: [
      /难过|伤心|失落|委屈|低落|崩溃|想哭/i,
      /\bsad\b|\bdown\b|\bhurt\b|\bheartbroken\b|\bcry\b/i
    ],
    intensity: 0.76,
    confidence: 0.78
  },
  {
    emotion: "anxiety",
    patterns: [
      /焦虑|紧张|担心|害怕|不安|慌/i,
      /\banxious\b|\bworried\b|\bstressed\b|\bnervous\b|\bafraid\b|\boverwhelmed\b/i
    ],
    intensity: 0.74,
    confidence: 0.76
  },
  {
    emotion: "joy",
    patterns: [
      /开心|高兴|快乐|激动|欣慰|轻松/i,
      /\bhappy\b|\bglad\b|\bexcited\b|\brelieved\b|\bdelighted\b/i
    ],
    intensity: 0.72,
    confidence: 0.74
  },
  {
    emotion: "affection",
    patterns: [
      /想你|喜欢你|爱你|陪着我|抱抱|温暖/i,
      /\bmiss you\b|\blove\b|\bcare about\b|\bstay with me\b|\bhug\b/i
    ],
    intensity: 0.68,
    confidence: 0.72
  },
  {
    emotion: "playfulness",
    patterns: [
      /哈哈|嘿嘿|逗你|开玩笑|笑死/i,
      /\bhaha\b|\blol\b|\bhehe\b|\bkidding\b|\btease\b/i
    ],
    intensity: 0.56,
    confidence: 0.65
  }
];

export class SimpleEmotionAnalyzer implements EmotionAnalyzer {
  async analyze(message: Message): Promise<EmotionState | undefined> {
    const content = message.content.trim();

    if (!content) {
      return undefined;
    }

    const normalized = content.toLowerCase();
    const match = EMOTION_PATTERNS.find((candidate) =>
      candidate.patterns.some((pattern) => pattern.test(normalized))
    );
    const punctuationBoost = /[!！]{1,}/.test(content) ? 0.05 : 0;
    const elongatedBoost = /(好+|很+|太+|super|really|so )/i.test(content) ? 0.04 : 0;

    if (!match) {
      return {
        userId: message.sessionId,
        primaryEmotion: "neutral",
        intensity: 0.34,
        confidence: 0.52,
        windowStart: message.timestamp,
        windowEnd: message.timestamp
      };
    }

    return {
      userId: message.sessionId,
      primaryEmotion: match.emotion,
      intensity: clamp(match.intensity + punctuationBoost + elongatedBoost, 0.35, 0.88),
      confidence: clamp(match.confidence + punctuationBoost, 0.5, 0.88),
      windowStart: message.timestamp,
      windowEnd: message.timestamp
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
