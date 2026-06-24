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

    const introductionCandidates = extractIntroductionCandidates(content, reply.content.length > 0);
    if (introductionCandidates.length > 0) {
      return introductionCandidates;
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

function extractIntroductionCandidates(
  content: string,
  replied: boolean
): MemoryCandidate[] {
  const compact = content.replace(/\s+/g, " ").trim();
  const candidates: MemoryCandidate[] = [];
  const confidence = replied ? 0.84 : 0.62;

  const userNameClause = firstMatchingClause(compact, [
    /\bmy name is\s+[a-z][a-z0-9_-]{0,15}/i,
    /\bcall me\s+[a-z][a-z0-9_-]{0,15}/i,
    /(?:\u6211\u53eb|\u53eb\u6211|\u4f60\u53ef\u4ee5\u53eb\u6211)[\p{Script=Han}A-Za-z0-9_-]{1,16}/u
  ]);

  if (userNameClause) {
    candidates.push({
      type: "preference",
      content: userNameClause,
      importance: 0.86,
      confidence
    });
  }

  const companionNameClause = firstMatchingClause(compact, [
    /\bi(?:'ll| will)? call you\s+[a-z][a-z0-9_-]{0,15}/i,
    /\bi(?:'m| am)\s+going to call you\s+[a-z][a-z0-9_-]{0,15}/i,
    /\bi(?:'m| am)\s+gonna call you\s+[a-z][a-z0-9_-]{0,15}/i,
    /\blet me call you\s+[a-z][a-z0-9_-]{0,15}/i,
    /\bi want to call you\s+[a-z][a-z0-9_-]{0,15}/i,
    /(?:\u6211\u60f3\u53eb\u4f60|\u4ee5\u540e\u53eb\u4f60|\u5c31\u53eb\u4f60|\u7ba1\u4f60\u53eb)[\p{Script=Han}A-Za-z0-9_-]{1,16}/u
  ]);

  if (companionNameClause) {
    candidates.push({
      type: "preference",
      content: companionNameClause,
      importance: 0.83,
      confidence
    });
  }

  const styleClause = firstMatchingClause(compact, [
    /\bplayful\b|\bteasing\b|\bgentle\b|\bcaring\b|\bclingy\b|\bsteady\b|\bwitty\b/i,
    /\u98ce\u8da3|\u6253\u95f9|\u6492\u5a07|\u4f1a\u54c4\u4eba|\u4f1a\u5173\u5fc3\u4eba|\u6e29\u67d4|\u5634\u786c|\u7a33\u7a33/u
  ]);

  if (styleClause) {
    candidates.push({
      type: "reflection",
      content: styleClause,
      importance: 0.8,
      confidence
    });
  }

  return dedupeCandidates(candidates);
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

function firstMatchingClause(content: string, patterns: RegExp[]): string | undefined {
  const clauses = content
    .split(/[.!?;,\u3002\uff01\uff1f\uff1b\uff0c]/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    if (patterns.some((pattern) => pattern.test(clause))) {
      return clause.length > 72 ? `${clause.slice(0, 72).trim()}...` : clause;
    }
  }

  return undefined;
}

function dedupeCandidates(candidates: MemoryCandidate[]): MemoryCandidate[] {
  const seen = new Set<string>();
  const deduped: MemoryCandidate[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.content)) {
      continue;
    }

    seen.add(candidate.content);
    deduped.push(candidate);
  }

  return deduped;
}
