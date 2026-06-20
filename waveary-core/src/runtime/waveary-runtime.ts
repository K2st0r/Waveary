import type { Message } from "../domain/session.js";
import type {
  ChatProvider,
  EmotionAnalyzer,
  MemoryExtractor,
  MemoryStore,
  RelationshipEngine,
  RelationshipStore,
  TimelineEngine,
  TimelineStore
} from "../providers/interfaces.js";
import type { RuntimeContext, RuntimeTurnResult } from "./types.js";

export interface WavearyRuntimeDependencies {
  chatProvider: ChatProvider;
  emotionAnalyzer: EmotionAnalyzer;
  memoryStore: MemoryStore;
  memoryExtractor: MemoryExtractor;
  relationshipStore: RelationshipStore;
  relationshipEngine: RelationshipEngine;
  timelineStore: TimelineStore;
  timelineEngine: TimelineEngine;
}

export class WavearyRuntime {
  constructor(private readonly deps: WavearyRuntimeDependencies) {}

  async handleTurn(context: RuntimeContext, input: Message): Promise<RuntimeTurnResult> {
    const emotion = await this.deps.emotionAnalyzer.analyze(input);
    const recalledMemories = await this.deps.memoryStore.recallRelevantMemories(
      context.user.id,
      input.content
    );
    const relationship = await this.deps.relationshipStore.getProfile(context.user.id);
    const timeline = await this.deps.timelineStore.getRelevantEvents(context.user.id);

    const request = {
      session: context.session,
      user: context.user,
      persona: context.persona,
      messages: [...context.history, input],
      relevantMemories: recalledMemories,
      relationship,
      timeline
    };
    const content = await this.deps.chatProvider.generateReply(
      emotion ? { ...request, emotion } : request
    );

    const reply: Message = {
      id: `reply-${input.id}`,
      sessionId: context.session.id,
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    const memoryCandidates = await this.deps.memoryExtractor.extractCandidates(input, reply);
    const storedMemories = await this.deps.memoryStore.saveMemories(
      context.user.id,
      input,
      memoryCandidates
    );
    const relationshipDelta = await this.deps.relationshipEngine.evaluateDelta(
      input,
      reply,
      relationship
    );
    const updatedRelationship = await this.deps.relationshipStore.applyDelta(
      context.user.id,
      relationshipDelta
    );
    const derivedEvents = await this.deps.timelineEngine.deriveEvents(
      input,
      reply,
      storedMemories
    );
    const updatedTimeline = await this.deps.timelineStore.appendEvents(
      context.user.id,
      derivedEvents
    );

    const result = {
      reply,
      recalledMemories,
      relationship: updatedRelationship,
      timeline: updatedTimeline,
      storedMemories
    };
    return emotion ? { ...result, emotion } : result;
  }
}
