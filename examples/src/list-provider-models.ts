import {
  OpenAICompatibleChatProvider,
  resolveProviderPreset
} from "../../waveary-core/dist/index.js";
import { loadSavedProviderConfig } from "./provider-config.js";

async function main(): Promise<void> {
  const saved = loadSavedProviderConfig();
  const providerId = process.env.WAVEARY_PROVIDER ?? saved?.provider ?? "openai";
  const preset = resolveProviderPreset(providerId);
  const apiKey = process.env.WAVEARY_API_KEY ?? process.env.OPENAI_API_KEY ?? saved?.apiKey;
  const baseURL = process.env.WAVEARY_BASE_URL ?? saved?.baseURL ?? preset?.baseURL;

  if (!apiKey) {
    throw new Error("Set WAVEARY_API_KEY or OPENAI_API_KEY before listing models.");
  }

  if (!baseURL) {
    throw new Error("Set WAVEARY_BASE_URL or use a known WAVEARY_PROVIDER preset.");
  }

  const provider = new OpenAICompatibleChatProvider({
    provider: providerId,
    apiKey,
    baseURL,
    model: process.env.WAVEARY_MODEL ?? "placeholder-model"
  });

  try {
    const models = await provider.listModels();

    console.log(JSON.stringify({ provider: providerId, baseURL, models }, null, 2));
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          provider: providerId,
          baseURL,
          step: "list-models",
          error: error instanceof Error ? error.message : "Unknown provider error."
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}

void main();
