import type { MemoryItem, Message, TimelineEngine, TimelineEvent } from "../index.js";

export class SimpleTimelineEngine implements TimelineEngine {
  async deriveEvents(
    message: Message,
    _reply: Message,
    memories: MemoryItem[]
  ): Promise<TimelineEvent[]> {
    if (message.role !== "user" || memories.length === 0) {
      return [];
    }

    const latestMemory = memories[0];
    if (!latestMemory) {
      return [];
    }

    return [
      {
        id: `timeline-${message.id}`,
        userId: latestMemory.userId,
        title: summarizeTitle(message.content),
        description: message.content,
        eventType: latestMemory.type,
        eventTime: message.timestamp,
        importance: latestMemory.importance,
        linkedMemoryIds: [latestMemory.id]
      }
    ];
  }
}

function summarizeTitle(content: string): string {
  return content.length > 24 ? `${content.slice(0, 24)}...` : content;
}
