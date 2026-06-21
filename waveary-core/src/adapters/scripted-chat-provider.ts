import type { ChatProvider, ChatProviderRequest } from "../index.js";

export class ScriptedChatProvider implements ChatProvider {
  async generateReply(request: ChatProviderRequest): Promise<string> {
    const latestUserMessage = [...request.messages].reverse().find((message) => message.role === "user");
    const memoryHint = request.relevantMemories[0]?.content;

    if (!latestUserMessage) {
      return "I am here with you.";
    }

    const timeAwareReply = buildTimeAwareReply(latestUserMessage.content, request);
    if (timeAwareReply) {
      return timeAwareReply;
    }

    const prefix = buildRelationshipPrefix(request.relationship.stage, request.emotion?.primaryEmotion);
    const continuity = memoryHint
      ? `I still remember ${wrapMemory(memoryHint)}, so I can follow what this means to you.`
      : "I am staying with what you just shared instead of treating it like a one-off question.";

    return `${prefix} ${continuity} ${buildFollowup(latestUserMessage.content, request.emotion?.primaryEmotion)}`.trim();
  }
}

function buildTimeAwareReply(
  content: string,
  request: ChatProviderRequest
): string | undefined {
  if (!request.localTime) {
    return undefined;
  }

  const normalized = content.toLowerCase();
  const asksForTime =
    normalized.includes("几点") ||
    normalized.includes("时间") ||
    normalized.includes("what time") ||
    normalized.includes("current time") ||
    normalized.includes("date") ||
    normalized.includes("几号") ||
    normalized.includes("星期") ||
    normalized.includes("today") ||
    normalized.includes("tonight") ||
    normalized.includes("tomorrow");

  if (!asksForTime) {
    return undefined;
  }

  const localDate = new Date(request.localTime.iso);
  const formatted = new Intl.DateTimeFormat(request.localTime.locale ?? "en-US", {
    dateStyle: "full",
    timeStyle: "short",
    ...(request.localTime.timeZone ? { timeZone: request.localTime.timeZone } : {})
  }).format(localDate);

  if ((request.localTime.locale ?? "").toLowerCase().startsWith("zh")) {
    return `我这边看到你当前的本地时间是 ${formatted}。如果你愿意，我也可以顺着这个时间点继续陪你聊现在的状态。`;
  }

  return `I can see your local time as ${formatted}. If you want, I can stay with this moment and keep going from here with you.`;
}

function buildRelationshipPrefix(stage: string, emotion?: string): string {
  if (emotion === "concerned") {
    return "I can feel the weight in this, and I want to stay close to it with you.";
  }

  if (emotion === "relieved") {
    return "I am really glad you came back and let me stay in this moment with you.";
  }

  if (emotion === "playful") {
    return "I am here with a lighter smile, but I am still listening closely.";
  }

  if (stage === "growing") {
    return "I am glad you brought this back to me.";
  }

  if (stage === "warming") {
    return "I remember the thread we are building together.";
  }

  return "I am here, and I am listening carefully.";
}

function buildFollowup(content: string, emotion?: string): string {
  if (emotion === "concerned") {
    return `Tell me a little more about ${summarizeTopic(content)}, and we can hold it carefully together.`;
  }

  return `Tell me a little more about ${summarizeTopic(content)}, and I will stay close to it with you.`;
}

function summarizeTopic(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 56 ? `${compact.slice(0, 56).trim()}...` : compact;
}

function wrapMemory(memory: string): string {
  return memory.startsWith("\"") ? memory : `"${memory}"`;
}
