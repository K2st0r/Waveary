import type { EmotionState, EmotionStore } from "../index.js";

export class InMemoryEmotionStore implements EmotionStore {
  private readonly states = new Map<string, EmotionState>();

  async getState(userId: string): Promise<EmotionState | undefined> {
    return this.states.get(userId);
  }

  async saveState(userId: string, state: EmotionState): Promise<EmotionState> {
    const next = { ...state, userId };
    this.states.set(userId, next);
    return next;
  }
}
