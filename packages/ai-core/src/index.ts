export * from "./prompts/system-parallel";
export * from "./prompts/system-onboarding";
export * from "./prompts/system-crisis";

import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

export const MODELS = {
  /** Fast classification — crisis detection, insight domain tagging */
  haiku: "claude-haiku-4-5-20251001",
  /** Generation — daily reports, parallel conversation, onboarding */
  sonnet: "claude-sonnet-4-6",
} as const;
