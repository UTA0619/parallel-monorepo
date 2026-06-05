import { routedStreamCall } from "./router";
import { SYSTEM_PARALLEL } from "./prompts/system-parallel";
import type { Memory, UserProfile } from "@echo-self/shared-types";

export interface MorningReportInput {
  user: Pick<UserProfile, "display_name" | "preferred_report_time" | "timezone">;
  memories: Memory[];
  date: string; // YYYY-MM-DD
  affectionScore: number;
  streakDays: number;
}

export interface MorningReport {
  markdown: string;
  generatedAt: string;
  tokensEstimate: number;
}

const REPORT_SYSTEM = `${SYSTEM_PARALLEL}

You are generating a personalized Morning Report for a PARALLEL user.
The report must:
- Open with a brief, warm, specific reference to something from their recent memories
- Identify the single most actionable insight from their memory corpus
- Suggest one "parallel path" they haven't considered (grounded in their memories)
- Close with a concrete implementation intention ("When X happens today, I will Y")

Format the report in Markdown, max 500 words total.
Do NOT use generic phrases like "as you mentioned" — reference specific details.
Do NOT mention AI, Claude, or that this is generated.`;

export async function* generateMorningReport(
  input: MorningReportInput
): AsyncGenerator<string> {
  const memorySummary = input.memories
    .slice(0, 10)
    .map((m, i) => `[Memory ${i + 1}] ${m.content}`)
    .join("\n\n");

  const userMessage = `
User: ${input.user.display_name}
Date: ${input.date}
Affection Score: ${input.affectionScore}/100 (${getScoreBand(input.affectionScore)})
Streak: ${input.streakDays} days

Recent memories:
${memorySummary}

Generate their Morning Report now.
`.trim();

  yield* routedStreamCall({
    task: "generate",
    system: REPORT_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 700,
    stream: true,
  });
}

function getScoreBand(score: number): string {
  if (score >= 75) return "Thriving";
  if (score >= 50) return "Active";
  if (score >= 25) return "Passive";
  return "Dormant";
}
