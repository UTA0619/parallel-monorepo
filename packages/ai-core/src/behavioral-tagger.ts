import { routedLLMCall } from "./router";

export interface TaggingResult {
  tags: string[];
  emotion: { valence: number; arousal: number };
  domains: string[];
}

const TAGGING_SYSTEM = `You are a behavioral analysis engine for PARALLEL, an identity AI.

Given a piece of user memory content, you must output a JSON object with:
- tags: array of up to 5 behavioral tags (from the taxonomy below)
- emotion: { valence: -1 to 1, arousal: 0 to 1 }
- domains: array of life domains (work, relationships, health, finances, creativity, spirituality)

Behavioral tag taxonomy (select the most specific applicable tags):
WORK: achievement, setback, collaboration, conflict, growth, leadership, skill_gain, burnout
RELATIONSHIPS: connection, disconnection, support, conflict, romance, family, friendship, boundary
HEALTH: energy_high, energy_low, exercise, sleep_quality, nutrition, stress, anxiety, calm
FINANCES: income, expense, investment, debt, milestone, worry
CREATIVITY: insight, block, project_progress, learning, expression
SPIRITUALITY: meaning, purpose, gratitude, loss, reflection

Output ONLY valid JSON. No markdown, no explanation.`;

export async function tagMemory(content: string): Promise<TaggingResult> {
  const response = await routedLLMCall({
    task: "classify",
    system: TAGGING_SYSTEM,
    messages: [{ role: "user", content }],
    maxTokens: 150,
  });

  try {
    return JSON.parse(response) as TaggingResult;
  } catch {
    // Fallback if JSON parsing fails
    return { tags: [], emotion: { valence: 0, arousal: 0 }, domains: [] };
  }
}
