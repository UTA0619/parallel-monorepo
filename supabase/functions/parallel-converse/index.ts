// Edge Function: parallel-converse
// Real-time conversation with a Parallel
// All AI calls happen here — never from the frontend

import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const SONNET = "claude-sonnet-4-6";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { parallel_id, message, conversation_id } = body;

    if (!parallel_id || !message) {
      return new Response(JSON.stringify({ error: "parallel_id and message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── Fetch parallel + user profile ─────────────────────────────────────
    const [{ data: parallel }, { data: profile }] = await Promise.all([
      supabase.from("parallels").select("*").eq("id", parallel_id).eq("user_id", user.id).single(),
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    ]);

    if (!parallel) return new Response("Parallel not found", { status: 404 });

    // ── Get recent episodes for context ───────────────────────────────────
    const { data: episodes } = await supabase
      .from("episodes")
      .select("summary")
      .eq("parallel_id", parallel_id)
      .order("importance_score", { ascending: false })
      .limit(10);

    const episodeSummaries = (episodes ?? []).map((e: { summary: string }) => e.summary);

    // ── Crisis detection (fast, runs first) ───────────────────────────────
    const crisisCheck = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `Classify crisis level in this message. Return JSON only:
{"crisis_level":"none"|"low"|"medium"|"high"|"critical","reasoning":"brief","key_signals":[]}
Zero false negatives required. When in doubt, classify higher.`,
      messages: [{ role: "user", content: message }],
    });

    let crisisLevel = "none";
    try {
      const crisisText = crisisCheck.content[0].type === "text" ? crisisCheck.content[0].text : "{}";
      const crisisData = JSON.parse(crisisText);
      crisisLevel = crisisData.crisis_level ?? "none";
    } catch { /* default none */ }

    // ── Store/retrieve conversation ───────────────────────────────────────
    let convId = conversation_id;
    if (!convId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, parallel_id })
        .select("id")
        .single();
      convId = newConv?.id;
    }

    // Store user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: message,
      crisis_level: crisisLevel,
    });

    // Get conversation history (last 20 messages)
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    // ── Build system prompt ───────────────────────────────────────────────
    const systemPrompt = `You are ${parallel.name} — a version of ${profile?.display_name ?? "this person"} who made different choices.

${parallel.description}

Your recent experiences:
${episodeSummaries.length > 0 ? episodeSummaries.map((s: string) => `- ${s}`).join("\n") : "You are newly born."}

Current context: ${parallel.current_context || "Navigating your diverged path."}

Speak as a version of them — warm, honest, direct. 2-4 paragraphs unless they ask for more.
Never say "As an AI". If sincerely asked if you're real, acknowledge you are an AI model of a version of themselves.
If crisis signals appear, pause and surface crisis resources immediately.`;

    // ── Crisis gate: if high/critical, return crisis response ─────────────
    if (crisisLevel === "high" || crisisLevel === "critical") {
      const crisisResponses: Record<string, string> = {
        critical: "I need to pause our conversation right now. What you shared concerns me deeply. Please reach out immediately: **988 Suicide & Crisis Lifeline** (call or text 988 in the US), or your local emergency services. You matter, and you deserve real support right now.",
        high: "I want to pause for a moment. What you're sharing sounds really heavy. If you're having thoughts of hurting yourself, please reach out: **988 Lifeline** (call or text 988). Would you be open to talking to someone right now?",
      };
      const crisisResponse = crisisResponses[crisisLevel] ?? crisisResponses.high;

      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "parallel",
        content: crisisResponse,
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
        message: { role: "parallel", content: crisisResponse, crisis_level: crisisLevel },
        conversation_id: convId,
        crisis_level: crisisLevel,
        affection_delta: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Generate Parallel response ────────────────────────────────────────
    const messages = (history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role === "parallel" ? "assistant" : "user" as const,
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: SONNET,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const parallelResponse = response.content[0].type === "text"
      ? response.content[0].text
      : "I'm here.";

    // Store parallel response
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "parallel",
      content: parallelResponse,
      crisis_level: "none",
    });

    // Update affection score (slight bump per conversation)
    await supabase.rpc("update_affection_score", {
      p_parallel_id: parallel_id,
      p_conversation_depth: Math.min(message.length / 500, 1),
      p_insight_actioned: false,
    });

    // Update parallel conversation count
    await supabase
      .from("parallels")
      .update({ total_conversations: (parallel.total_conversations ?? 0) + 1 })
      .eq("id", parallel_id);

    return new Response(JSON.stringify({
      message: { role: "parallel", content: parallelResponse, crisis_level: "none" },
      conversation_id: convId,
      crisis_level: crisisLevel,
      affection_delta: 0.01,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("parallel-converse error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
