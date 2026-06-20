import type {
  MemoryCandidate,
  Message,
  MemoryExtractor
} from "../../waveary-core/dist/index.js";

function inferMemoryType(content: string): MemoryCandidate["type"] {
  if (content.includes("喜欢") || content.includes("like")) {
    return "preference";
  }
  if (content.includes("今天") || content.includes("yesterday") || content.includes("生日")) {
    return "life_event";
  }
  return "fact";
}

export class SimpleMemoryExtractor implements MemoryExtractor {
  async extractCandidates(message: Message, reply: Message): Promise<MemoryCandidate[]> {
    const content = message.content.trim();

    if (message.role !== "user" || content.length < 12) {
      return [];
    }

    return [
      {
        type: inferMemoryType(content),
        content,
        importance: Math.min(1, Math.max(0.3, content.length / 120)),
        confidence: reply.content.length > 0 ? 0.8 : 0.5
      }
    ];
  }
}
