import {
  InMemoryEmotionStore,
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  OpenAICompatibleChatProvider,
  resolveProviderPreset,
  SimpleCompanionEmotionEngine,
  SimpleEmotionAnalyzer,
  SimpleProactiveCareEngine,
  SimpleRelationshipEngine,
  SimpleTimelineEngine,
  WavearyRuntime,
  type Message,
  type RuntimeContext
} from "../../waveary-core/dist/index.js";
import {
  InMemoryMemoryStore,
  SimpleMemoryExtractor
} from "../../waveary-memory/dist/index.js";
import { loadSavedProviderConfig } from "./provider-config.js";

function createBaseContext(providerId: string): RuntimeContext {
  return {
    session: {
      id: `verify-${providerId}`,
      userId: "user-1",
      personaId: "persona-1",
      startedAt: new Date().toISOString(),
      channel: "text",
      state: "active"
    },
    user: {
      id: "user-1",
      displayName: "K2st0r",
      profileTraits: ["reflective"],
      preferences: ["continuity"]
    },
    persona: {
      id: "persona-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["attentive", "steady"],
      relationshipStyle: "supportive"
    },
    history: []
  };
}

async function main(): Promise<void> {
  const saved = loadSavedProviderConfig();
  const providerId = process.env.WAVEARY_PROVIDER ?? saved?.provider ?? "openai";
  const preset = resolveProviderPreset(providerId);
  const apiKey = process.env.WAVEARY_API_KEY ?? process.env.OPENAI_API_KEY ?? saved?.apiKey;
  const baseURL = process.env.WAVEARY_BASE_URL ?? saved?.baseURL ?? preset?.baseURL;
  const model = process.env.WAVEARY_MODEL ?? saved?.model;

  if (!apiKey || !baseURL) {
    throw new Error(
      "Provider verification requires at least an API key and base URL. Run npm run setup:provider or set WAVEARY_API_KEY / WAVEARY_BASE_URL."
    );
  }

  try {
    const discoveryProvider = new OpenAICompatibleChatProvider({
      provider: providerId,
      apiKey,
      baseURL
    });

    const models = await discoveryProvider.listModels();
    const resolvedModel = model ?? models[0]?.id;

    if (!resolvedModel) {
      throw new Error("Provider verification could not resolve a usable model from the current key.");
    }

    const runtime = new WavearyRuntime({
      chatProvider: new OpenAICompatibleChatProvider({
        provider: providerId,
        apiKey,
        baseURL,
        model: resolvedModel
      }),
      emotionAnalyzer: new SimpleEmotionAnalyzer(),
      emotionStore: new InMemoryEmotionStore(),
      emotionEngine: new SimpleCompanionEmotionEngine(),
      proactiveCareEngine: new SimpleProactiveCareEngine(),
      memoryStore: new InMemoryMemoryStore(),
      memoryExtractor: new SimpleMemoryExtractor(),
      relationshipStore: new InMemoryRelationshipStore(),
      relationshipEngine: new SimpleRelationshipEngine(),
      timelineStore: new InMemoryTimelineStore(),
      timelineEngine: new SimpleTimelineEngine()
    });

    const context = createBaseContext(providerId);
    const message: Message = {
      id: `verify-turn-${providerId}`,
      sessionId: context.session.id,
      role: "user",
      content:
        "Please reply in one short sentence confirming this provider can maintain long-term continuity.",
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    const result = await runtime.handleTurn(context, message);

    console.log(
      JSON.stringify(
        {
          provider: providerId,
          baseURL,
          configuredModel: model ?? null,
          discoveredModelCount: models.length,
          sampleDiscoveredModels: models.slice(0, 5),
          resolvedModel,
          reply: result.reply.content,
          storedMemories: result.storedMemories.map((memory) => memory.content),
          relationshipStage: result.relationship.stage
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          provider: providerId,
          baseURL,
          configuredModel: model ?? null,
          step: "verify-provider",
          error: error instanceof Error ? error.message : "Unknown provider verification error."
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}

void main();
