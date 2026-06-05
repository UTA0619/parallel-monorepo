import Anthropic from "@anthropic-ai/sdk";
import { MODELS, getAnthropicClient } from "./index";

export type TaskType =
  | "classify"    // Behavioral tagging, emotion extraction → Haiku
  | "generate"    // Morning report, conversation → Sonnet
  | "evaluate"    // LLM-as-judge prompt eval → Opus
  | "crisis";     // Crisis detection → Haiku (speed-critical)

/** Routes to the appropriate Claude model based on task type. */
export function selectModel(task: TaskType): string {
  switch (task) {
    case "classify":
    case "crisis":
      return MODELS.haiku;
    case "generate":
      return MODELS.sonnet;
    case "evaluate":
      return "claude-opus-4-8";
  }
}

export interface RouterOptions {
  task: TaskType;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  stream?: boolean;
}

/** Unified LLM call — picks model, applies caching, handles retries. */
export async function routedLLMCall(opts: RouterOptions): Promise<string> {
  const client = getAnthropicClient();
  const model = selectModel(opts.task);
  const maxTokens = opts.maxTokens ?? (opts.task === "generate" ? 1024 : 256);

  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: opts.system,
        // Enable prompt caching for system prompts (saves cost on repeated calls)
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: opts.messages,
  };

  const response = await client.messages.create(params);
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}

/** Streaming variant — yields text chunks as they arrive. */
export async function* routedStreamCall(opts: RouterOptions): AsyncGenerator<string> {
  const client = getAnthropicClient();
  const model = selectModel(opts.task);
  const maxTokens = opts.maxTokens ?? 1024;

  const stream = await client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: opts.system,
    messages: opts.messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield chunk.delta.text;
    }
  }
}
