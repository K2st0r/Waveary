import type { ChatProvider, ChatProviderRequest } from "../index.js";

export class ScriptedChatProvider implements ChatProvider {
  async generateReply(request: ChatProviderRequest): Promise<string> {
    const latestUserMessage = [...request.messages].reverse().find((message) => message.role === "user");
    const memoryHint = request.relevantMemories[0]?.content;

    if (!latestUserMessage) {
      return "I am here with you.";
    }

    const prefix = buildRelationshipPrefix(request.relationship.stage, request.emotion?.primaryEmotion);
    const continuity = memoryHint
      ? `I still remember ${wrapMemory(memoryHint)}, so I can follow what this means to you.`
      : "I am staying with what you just shared instead of treating it like a one-off question.";

    return `${prefix} ${continuity} ${buildFollowup(latestUserMessage.content, request.emotion?.primaryEmotion)}`.trim();
  }
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
