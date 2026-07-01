import type { Message } from "../domain/session.js";
import {
  resolveProactiveCarePolicy,
  resolveProactiveCareState
} from "../domain/proactive-care.js";
import type {
  ChatProvider,
  EmotionAnalyzer,
  EmotionEngine,
  EmotionStore,
  IdentityEngine,
  IdentityStore,
  MemoryExtractor,
  MemoryStore,
  ProactiveCareEngine,
  RelationshipEngine,
  RelationshipStore,
  TimelineEngine,
  TimelineStore
} from "../providers/interfaces.js";
import type {
  RuntimeContext,
  RuntimeProactiveCareOptions,
  RuntimeProactiveCareResult,
  RuntimeTurnOptions,
  RuntimeTurnResult
} from "./types.js";
import { buildDeterministicLocalTimeReply } from "./local-time-reply.js";

export interface WavearyRuntimeDependencies {
  chatProvider: ChatProvider;
  emotionAnalyzer: EmotionAnalyzer;
  emotionStore: EmotionStore;
  emotionEngine: EmotionEngine;
  identityStore: IdentityStore;
  identityEngine: IdentityEngine;
  proactiveCareEngine: ProactiveCareEngine;
  memoryStore: MemoryStore;
  memoryExtractor: MemoryExtractor;
  relationshipStore: RelationshipStore;
  relationshipEngine: RelationshipEngine;
  timelineStore: TimelineStore;
  timelineEngine: TimelineEngine;
}

export class WavearyRuntime {
  constructor(private readonly deps: WavearyRuntimeDependencies) {}

  async evaluateProactiveCare(
    context: RuntimeContext,
    options: RuntimeProactiveCareOptions = {}
  ): Promise<RuntimeProactiveCareResult> {
    const now = options.now ?? new Date().toISOString();
    const relationship = await this.deps.relationshipStore.getProfile(context.user.id);
    const timeline = await this.deps.timelineStore.getRelevantEvents(context.user.id);
    const emotion = await this.deps.emotionStore.getState(context.user.id);

    return this.deps.proactiveCareEngine.evaluate({
      userId: context.user.id,
      now,
      history: context.history,
      relationship,
      timeline,
      policy: resolveProactiveCarePolicy(options.policy),
      careState: resolveProactiveCareState(options.state),
      ...(emotion ? { emotion } : {})
    });
  }

  async handleTurn(
    context: RuntimeContext,
    input: Message,
    options: RuntimeTurnOptions = {}
  ): Promise<RuntimeTurnResult> {
    const detectedUserEmotion = await this.deps.emotionAnalyzer.analyze(input);
    const recalledMemories = await this.deps.memoryStore.recallRelevantMemories(
      context.user.id,
      input.content
    );
    const currentIdentitySummary = await this.deps.identityStore.getSummary(context.user.id);
    const relationship = await this.deps.relationshipStore.getProfile(context.user.id);
    const timeline = await this.deps.timelineStore.getRelevantEvents(context.user.id);
    const currentEmotion = await this.deps.emotionStore.getState(context.user.id);
    const emotion = await this.deps.emotionEngine.transition({
      userId: context.user.id,
      message: input,
      history: context.history,
      relationship,
      relevantMemories: recalledMemories,
      timeline,
      ...(currentEmotion ? { currentEmotion } : {}),
      ...(detectedUserEmotion ? { detectedUserEmotion } : {})
    });

    const request = {
      session: context.session,
      user: context.user,
      persona: context.persona,
      messages: [...context.history, input],
      relevantMemories: recalledMemories,
      ...(currentIdentitySummary ? { identitySummary: currentIdentitySummary } : {}),
      relationship,
      timeline,
      ...(options.localTime ? { localTime: options.localTime } : {}),
      ...(options.reasoningEffort ? { reasoningEffort: options.reasoningEffort } : {}),
      ...(detectedUserEmotion ? { detectedUserEmotion } : {})
    };
    const deterministicLocalTimeReply = buildDeterministicLocalTimeReply(
      input.content,
      options.localTime
    );
    const content =
      deterministicLocalTimeReply ??
      (await this.deps.chatProvider.generateReply(
        emotion ? { ...request, emotion } : request
      ));

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
    const savedEmotion = emotion
      ? await this.deps.emotionStore.saveState(context.user.id, emotion)
      : undefined;
    const identitySummary = await this.deps.identityEngine.summarize({
      userId: context.user.id,
      message: input,
      reply,
      history: context.history,
      relevantMemories: recalledMemories,
      storedMemories,
      relationship: updatedRelationship,
      timeline: updatedTimeline,
      ...(savedEmotion ? { emotion: savedEmotion } : {}),
      ...(currentIdentitySummary ? { currentSummary: currentIdentitySummary } : {})
    });
    const savedIdentitySummary = identitySummary
      ? await this.deps.identityStore.saveSummary(context.user.id, identitySummary)
      : undefined;

    const result = {
      reply,
      recalledMemories,
      ...(savedIdentitySummary ? { identitySummary: savedIdentitySummary } : {}),
      relationship: updatedRelationship,
      timeline: updatedTimeline,
      storedMemories
    };
    return savedEmotion ? { ...result, emotion: savedEmotion } : result;
  }
}
