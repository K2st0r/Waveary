import type {
  MemoryCandidate,
  MemoryItem,
  MemoryStore,
  Message
} from "../../waveary-core/dist/index.js";

function scoreMemoryMatch(memory: MemoryItem, input: string): number {
  const tokens = input
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return 0;
  }

  const normalizedContent = memory.content.toLowerCase();
  const hitCount = tokens.filter((token) => normalizedContent.includes(token)).length;
  return hitCount / tokens.length + memory.importance * 0.25;
}

export class InMemoryMemoryStore implements MemoryStore {
  private readonly records = new Map<string, MemoryItem[]>();

  async recallRelevantMemories(userId: string, input: string): Promise<MemoryItem[]> {
    const memories = this.records.get(userId) ?? [];

    return [...memories]
      .sort((left, right) => scoreMemoryMatch(right, input) - scoreMemoryMatch(left, input))
      .slice(0, 5);
  }

  async saveMemories(
    userId: string,
    sourceMessage: Message,
    candidates: MemoryCandidate[]
  ): Promise<MemoryItem[]> {
    const existing = this.records.get(userId) ?? [];
    const created = candidates.map<MemoryItem>((candidate, index) => ({
      id: `memory-${sourceMessage.id}-${index}`,
      userId,
      type: candidate.type,
      content: candidate.content,
      importance: candidate.importance,
      confidence: candidate.confidence,
      sourceMessageIds: [sourceMessage.id],
      createdAt: new Date().toISOString()
    }));

    this.records.set(userId, [...existing, ...created]);
    return created;
  }
}
