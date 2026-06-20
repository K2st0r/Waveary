import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  OpenAICompatibleChatProvider,
  PROVIDER_PRESETS
} from "../../waveary-core/dist/index.js";
import { saveProviderConfig } from "./provider-config.js";

async function main(): Promise<void> {
  const rl = createInterface({ input, output });

  try {
    output.write("Waveary provider setup\n\n");

    PROVIDER_PRESETS.forEach((preset, index) => {
      output.write(`${index + 1}. ${preset.label} (${preset.id})\n`);
    });

    const providerSelection = await rl.question("\nSelect provider number: ");
    const providerIndex = Number(providerSelection) - 1;
    const preset = PROVIDER_PRESETS[providerIndex];

    if (!preset) {
      throw new Error("Invalid provider selection.");
    }

    const customBaseURL = await rl.question(
      `Base URL [press Enter to use ${preset.baseURL}]: `
    );
    const baseURL = customBaseURL.trim() || preset.baseURL;

    const apiKey = (await rl.question("API key: ")).trim();
    if (!apiKey) {
      throw new Error("API key is required.");
    }

    const provider = new OpenAICompatibleChatProvider({
      provider: preset.id,
      apiKey,
      baseURL,
      model: "placeholder-model"
    });
    const models = await provider.listModels();

    if (models.length === 0) {
      throw new Error("No models were returned for this provider key.");
    }

    output.write("\nAvailable models:\n");
    models.forEach((model, index) => {
      output.write(`${index + 1}. ${model.id}\n`);
    });

    const modelSelection = await rl.question("\nSelect model number: ");
    const modelIndex = Number(modelSelection) - 1;
    const model = models[modelIndex];

    if (!model) {
      throw new Error("Invalid model selection.");
    }

    saveProviderConfig({
      provider: preset.id,
      baseURL,
      apiKey,
      model: model.id
    });

    output.write("\nSaved provider configuration successfully.\n");
  } finally {
    rl.close();
  }
}

void main();
