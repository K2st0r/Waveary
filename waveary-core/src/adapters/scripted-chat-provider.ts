import type { ChatProvider, ChatProviderRequest } from "../index.js";

export class ScriptedChatProvider implements ChatProvider {
  async generateReply(request: ChatProviderRequest): Promise<string> {
    const latestUserMessage = [...request.messages].reverse().find((message) => message.role === "user");
    const memoryHint = request.relevantMemories[0]?.content;

    if (!latestUserMessage) {
      return "I am here with you.";
    }

    if (memoryHint) {
      return `I remember you mentioned "${memoryHint}". Thank you for sharing more with me: ${latestUserMessage.content}`;
    }

    return `I am listening carefully. You said: ${latestUserMessage.content}`;
  }
}
