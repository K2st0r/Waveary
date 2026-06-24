import type { IdentitySummary, IdentityStore } from "../index.js";

export class InMemoryIdentityStore implements IdentityStore {
  private readonly summaries = new Map<string, IdentitySummary>();

  async getSummary(userId: string): Promise<IdentitySummary | undefined> {
    return this.summaries.get(userId);
  }

  async saveSummary(userId: string, summary: IdentitySummary): Promise<IdentitySummary> {
    const next = { ...summary, userId };
    this.summaries.set(userId, next);
    return next;
  }
}
