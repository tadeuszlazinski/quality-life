import { invoke } from "@tauri-apps/api/core";
import type { QualityLifeSettings } from "../types/settings";

export type AiProviderResult = {
  text: string;
};

export function openAiConfigured(settings: QualityLifeSettings) {
  return settings.openAiEnabled && settings.openAiApiKey.trim().length > 0;
}

export async function generateOpenAiText(args: {
  settings: QualityLifeSettings;
  systemPrompt: string;
  userPrompt: string;
}) {
  const response = await invoke<AiProviderResult>("generate_openai_text", {
    apiKey: args.settings.openAiApiKey.trim(),
    model: args.settings.openAiModel.trim() || "gpt-5.4-mini",
    systemPrompt: args.systemPrompt,
    userPrompt: args.userPrompt
  });

  return response.text.trim();
}
