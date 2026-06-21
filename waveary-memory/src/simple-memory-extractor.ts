import type {
  MemoryCandidate,
  Message,
  MemoryExtractor
} from "../../waveary-core/dist/index.js";

function inferMemoryType(content: string): MemoryCandidate["type"] {
  if (content.includes("喜欢") || content.includes("like")) {
    return "preference";
  }

  if (content.includes("今天") || content.includes("昨天") || content.includes("生日") || content.includes("yesterday")) {
    return "life_event";
  }

  if (
    content.includes("希望")
    || content.includes("在意")
    || content.includes("想把")
    || content.includes("I hope")
    || content.includes("I want")
    || content.includes("I care")
  ) {
    return "reflection";
  }

  return "fact";
}

export class SimpleMemoryExtractor implements MemoryExtractor {
  async extractCandidates(message: Message, reply: Message): Promise<MemoryCandidate[]> {
    const content = message.content.trim();

    if (message.role !== "user" || content.length < 12) {
      return [];
    }

    const normalizedContent = normalizeMemoryContent(content);
    if (!normalizedContent) {
      return [];
    }

    return [
      {
        type: inferMemoryType(content),
        content: normalizedContent,
        importance: estimateImportance(content, normalizedContent),
        confidence: reply.content.length > 0 ? 0.8 : 0.5
      }
    ];
  }
}

function normalizeMemoryContent(content: string): string | undefined {
  const compact = content.replace(/\s+/g, " ").trim();
  const clauses = compact
    .split(/[，,。.!！？?；;：:]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const preferredClause =
    clauses.find((part) => /希望|喜欢|在意|想把|I hope|I want|I care|I like/i.test(part))
    ?? clauses[0];

  if (!preferredClause) {
    return undefined;
  }

  return preferredClause.length > 72 ? `${preferredClause.slice(0, 72).trim()}...` : preferredClause;
}

function estimateImportance(originalContent: string, normalizedContent: string): number {
  const base = Math.min(1, Math.max(0.34, normalizedContent.length / 90));

  if (/希望|在意|喜欢|I hope|I care|I like/i.test(originalContent)) {
    return Math.min(1, base + 0.14);
  }

  if (/今天|昨天|生日|yesterday/i.test(originalContent)) {
    return Math.min(1, base + 0.08);
  }

  return base;
}
