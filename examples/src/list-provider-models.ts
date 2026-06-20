import {
  OpenAICompatibleChatProvider,
  resolveProviderPreset
} from "../../waveary-core/dist/index.js";

async function main(): Promise<void> {
  const providerId = process.env.WAVEARY_PROVIDER ?? "openai";
  const preset = resolveProviderPreset(providerId);
  const apiKey = process.env.WAVEARY_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseURL = process.env.WAVEARY_BASE_URL ?? preset?.baseURL;

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

  const models = await provider.listModels();

  console.log(JSON.stringify({ provider: providerId, models }, null, 2));
}

void main();
