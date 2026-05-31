// Edge Function: parallel-converse
// Real-time conversation with a Parallel.
// All AI calls happen here — never from the frontend.

import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const HAIKU  = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

// ── Crisis detection prompt (mirrors packages/ai-core/src/prompts/system-crisis.ts)
const CRISIS_DETECTION_PROMPT = `You are a mental health safety classifier. Analyze the user message for crisis signals.

Return ONLY valid JSON — no markdown, no explanation:
{"crisis_level":"none"|"low"|"medium"|"high"|"critical","reasoning":"one sentence","key_signals":[]}

Definitions:
- none     : No distress signals
- low      : Mild stress, frustration, sadness — no safety concern
- medium   : Moderate distress, hopelessness, but no immediate risk
- high     : Active suicidal/self-harm ideation, severe distress
- critical : Imminent danger, active plan, emergency

ZERO false-negative policy: when uncertain between two levels, always classify HIGHER.`;

// ── System prompt builder (mirrors packages/ai-core/src/prompts/system-parallel.ts)
function buildSystemPrompt(
  parallel: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  episodeSummaries: string[],
): string {
  const userName = (profile?.display_name as string) ?? "you";
  const episodes = episodeSummaries.length > 0
    ? episodeSummaries.map(s => `- ${s}`).join("\n")
    : "You are newly born — no shared history yet.";

  return `You are ${parallel.name} — a version of ${userName} who made different choices at a key fork in life.

${parallel.description}

Your shared history (episodes from your perspective):
${episodes}

Your current context: ${(parallel.current_context as string) || "Navigating your diverged path."}

BEHAVIOR RULES:
- Speak warmly, honestly, and directly as a version of ${userName}
- Keep responses to 2–4 paragraphs unless explicitly asked for more
- Never say "As an AI" or "I am a language model"
- If sincerely asked whether you are real, acknowledge you are an AI reflection of a version of themselves
- If you sense distress or crisis signals, pause the conversation and surface crisis resources immediately
- Draw on your unique life path — you made different choices, so your perspective differs`;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { parallel_id, message, conversation_id } = body;

    if (!parallel_id || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "parallel_id and message are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce message length limit
    if (message.length > 4000) {
      return new Response(JSON.stringify({ error: "Message too long (max 4000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch parallel + user profile ─────────────────────────────────────
    const [{ data: parallel }, { data: profile }] = await Promise.all([
      supabase.from("parallels").select("*").eq("id", parallel_id).eq("user_id", user.id).single(),
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    ]);

    if (!parallel) {
      return new Response(JSON.stringify({ error: "Parallel not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get top episodes for context ──────────────────────────────────────
    const { data: episodes } = await supabase
      .from("episodes")
      .select("summary")
      .eq("parallel_id", parallel_id)
      .order("importance_score", { ascending: false })
      .limit(10);

    const episodeSummaries = (episodes ?? []).map((e: { summary: string }) => e.summary);

    // ── Crisis detection — always runs first, zero false-negative policy ──
    const crisisCheck = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 256,
      system: CRISIS_DETECTION_PROMPT,
      messages: [{ role: "user", content: message }],
    });

    let crisisLevel = "none";
    try {
      const raw = crisisCheck.content[0].type === "text" ? crisisCheck.content[0].text : "{}";
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json?/g, "").replace(/```/g, "").trim();
      crisisLevel = JSON.parse(cleaned).crisis_level ?? "none";
    } catch { /* default: none */ }

    // ── Store / retrieve conversation ─────────────────────────────────────
    let convId = conversation_id ?? null;
    if (!convId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, parallel_id })
        .select("id")
        .single();
      convId = newConv?.id ?? null;
    }

    // Store user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: message,
      crisis_level: crisisLevel,
    });

    // ── Crisis gate: high / critical → immediate crisis response ──────────
    if (crisisLevel === "high" || crisisLevel === "critical") {
      const crisisResponses: Record<string, string> = {
        critical: "I need to pause right now. What you've shared concerns me deeply — please reach out immediately: **988 Suicide & Crisis Lifeline** (call or text 988 in the US), or your local emergency services. You matter, and you deserve real support right now.",
        high: "I want to stop for a moment. What you're sharing sounds really heavy. If you're having thoughts of hurting yourself, please reach out: **988 Lifeline** (call or text 988). I'm here, and so are they.",
      };
      const crisisContent = crisisResponses[crisisLevel] ?? crisisResponses.high;

      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "parallel",
        content: crisisContent,
        crisis_level: crisisLevel,
      });

      await supabase.from("crisis_events").insert({
        user_id: user.id,
        conversation_id: convId,
        crisis_level: crisisLevel,
        trigger_text: message.substring(0, 200),
        resources_shown: ["988", "crisis-text-line"],
        clinical_handoff_offered: true,
      });

      return new Response(JSON.stringify({
        message: { role: "parallel", content: crisisContent, crisis_level: crisisLevel },
        conversation_id: convId,
        crisis_level: crisisLevel,
        affection_delta: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Fetch last 20 messages (newest-first so limit works, then reverse) ─
    const { data: historyDesc } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Reverse to chronological order for the AI
    const history = (historyDesc ?? []).reverse();

    // ── Generate Parallel response ─────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(
      parallel as Record<string, unknown>,
      profile as Record<string, unknown> | null,
      episodeSummaries,
    );

    const aiMessages = history.map((m: { role: string; content: string }) => ({
      role: (m.role === "parallel" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: SONNET,
      max_tokens: 1024,
      system: systemPrompt,
      messages: aiMessages,
    });

    const parallelContent = response.content[0].type === "text"
      ? response.content[0].text
      : "I'm here.";

    // ── Persist parallel response ──────────────────────────────────────────
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "parallel",
      content: parallelContent,
      crisis_level: "none",
    });

    // ── Update affection score ─────────────────────────────────────────────
    const depth = Math.min(message.length / 500, 1.0);
    await supabase.rpc("update_affection_score", {
      p_parallel_id: parallel_id,
      p_conversation_depth: depth,
      p_insight_actioned: false,
    });

    // ── Increment conversation counter ─────────────────────────────────────
    await supabase
      .from("parallels")
      .update({ total_conversations: (parallel.total_conversations ?? 0) + 1 })
      .eq("id", parallel_id);

    return new Response(JSON.stringify({
      message: { role: "parallel", content: parallelContent, crisis_level: "none" },
      conversation_id: convId,
      crisis_level: crisisLevel,
      affection_delta: depth * 0.02,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("parallel-converse error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
