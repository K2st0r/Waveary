import {
  InMemoryEmotionStore,
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  OpenAICompatibleChatProvider,
  resolveProviderPreset,
  SimpleCompanionEmotionEngine,
  SimpleEmotionAnalyzer,
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

function createBaseContext(): RuntimeContext {
  return {
    session: {
      id: "session-provider-1",
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

async function runDemo(): Promise<void> {
  const saved = loadSavedProviderConfig();
  const providerId = process.env.WAVEARY_PROVIDER ?? saved?.provider ?? "openai";
  const preset = resolveProviderPreset(providerId);
  const resolvedApiKey = process.env.WAVEARY_API_KEY ?? process.env.OPENAI_API_KEY ?? saved?.apiKey;
  const resolvedModel = process.env.WAVEARY_MODEL ?? saved?.model;
  const resolvedBaseURL = process.env.WAVEARY_BASE_URL ?? saved?.baseURL ?? preset?.baseURL;

  if (!resolvedApiKey || !resolvedModel || !resolvedBaseURL) {
    throw new Error(
      "Provider config is incomplete. Run npm run setup:provider, or set WAVEARY_PROVIDER / WAVEARY_API_KEY / WAVEARY_MODEL / WAVEARY_BASE_URL."
    );
  }

  const runtime = new WavearyRuntime({
    chatProvider: new OpenAICompatibleChatProvider({
      provider: providerId,
      apiKey: resolvedApiKey,
      model: resolvedModel,
      baseURL: resolvedBaseURL
    }),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
    emotionStore: new InMemoryEmotionStore(),
    emotionEngine: new SimpleCompanionEmotionEngine(),
    memoryStore: new InMemoryMemoryStore(),
    memoryExtractor: new SimpleMemoryExtractor(),
    relationshipStore: new InMemoryRelationshipStore(),
    relationshipEngine: new SimpleRelationshipEngine(),
    timelineStore: new InMemoryTimelineStore(),
    timelineEngine: new SimpleTimelineEngine()
  });

  const context = createBaseContext();
  const message: Message = {
    id: "turn-provider-1",
    sessionId: context.session.id,
    role: "user",
    content: "请用温和自然的方式回应我，并记住我希望 Waveary 重视长期陪伴。",
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const result = await runtime.handleTurn(context, message);

  console.log(
    JSON.stringify(
      {
        provider: providerId,
        reply: result.reply.content,
        emotion: result.emotion,
        storedMemories: result.storedMemories.map((memory) => memory.content),
        relationship: result.relationship
      },
      null,
      2
    )
  );
}

void runDemo();
