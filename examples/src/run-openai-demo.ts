import {
  InMemoryRelationshipStore,
  InMemoryTimelineStore,
  OpenAICompatibleChatProvider,
  resolveProviderPreset,
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
  const providerId = process.env.WAVEARY_PROVIDER ?? "openai";
  const preset = resolveProviderPreset(providerId);
  const resolvedApiKey = process.env.WAVEARY_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!resolvedApiKey) {
    throw new Error("Set WAVEARY_API_KEY or OPENAI_API_KEY before running demo:provider.");
  }

  if (!process.env.WAVEARY_MODEL) {
    throw new Error(
      "Set WAVEARY_MODEL before running demo:provider. You can first run npm run models:provider to inspect available models."
    );
  }

  const providerOptions: {
    provider: string;
    model?: string;
    baseURL?: string;
    apiKey?: string;
  } = {
    provider: providerId
  };

  if (process.env.WAVEARY_MODEL) {
    providerOptions.model = process.env.WAVEARY_MODEL;
  }

  const resolvedBaseURL = process.env.WAVEARY_BASE_URL ?? preset?.baseURL;
  if (resolvedBaseURL) {
    providerOptions.baseURL = resolvedBaseURL;
  }

  if (resolvedApiKey) {
    providerOptions.apiKey = resolvedApiKey;
  }

  const runtime = new WavearyRuntime({
    chatProvider: new OpenAICompatibleChatProvider(providerOptions),
    emotionAnalyzer: new SimpleEmotionAnalyzer(),
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
        storedMemories: result.storedMemories.map((memory) => memory.content),
        relationship: result.relationship
      },
      null,
      2
    )
  );
}

void runDemo();
