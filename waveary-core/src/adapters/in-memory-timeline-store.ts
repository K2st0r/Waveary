import type { TimelineEvent, TimelineStore } from "../index.js";

export class InMemoryTimelineStore implements TimelineStore {
  private readonly events = new Map<string, TimelineEvent[]>();

  async getRelevantEvents(userId: string): Promise<TimelineEvent[]> {
    return [...(this.events.get(userId) ?? [])].slice(-5);
  }

  async appendEvents(userId: string, events: TimelineEvent[]): Promise<TimelineEvent[]> {
    const existing = this.events.get(userId) ?? [];
    const next = [...existing, ...events];
    this.events.set(userId, next);
    return [...next].slice(-10);
  }
}
