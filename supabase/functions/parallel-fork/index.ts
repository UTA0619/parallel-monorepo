// Edge Function: parallel-fork
// Creates a new Parallel from a fork point

import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { parallel_name, parallel_description, choice_made, counterfactual_choice, significance } = body;

    if (!parallel_name || !counterfactual_choice) {
      return new Response(JSON.stringify({ error: "parallel_name and counterfactual_choice required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch user core profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, core_embedding")
      .eq("id", user.id)
      .single();

    // ── Generate Parallel personality via Claude ───────────────────────────
    const genResp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Generate a Parallel self description. This is a version of ${profile?.display_name ?? "the user"} who chose "${counterfactual_choice}" instead of "${choice_made}".

Name: ${parallel_name}
Description provided: ${parallel_description || "(none)"}

Write:
1. A 2-sentence description of who this Parallel became (first person, as if they're describing themselves)
2. Their current life context (1 sentence)
3. Their most prominent trait difference from the main self (1 sentence)

Return as JSON:
{"description": "...", "current_context": "...", "trait_note": "..."}`
      }],
    });

    let aiDescription = parallel_description;
    let currentContext = `Living the life where you chose ${counterfactual_choice}.`;

    try {
      const genText = genResp.content[0].type === "text" ? genResp.content[0].text : "{}";
      const genData = JSON.parse(genText);
      aiDescription = genData.description || parallel_description;
      currentContext = genData.current_context || currentContext;
    } catch { /* use defaults */ }

    // ── Create fork point ─────────────────────────────────────────────────
    const { data: forkPoint } = await supabase.from("fork_points").insert({
      user_id: user.id,
      description: `${choice_made} vs ${counterfactual_choice}`,
      choice_made: choice_made ?? "(main path)",
      counterfactual_choice,
      significance: significance ?? 3,
    }).select("id").single();

    // ── Create Parallel ───────────────────────────────────────────────────
    const defaultTraits = {
      openness: 0.6 + Math.random() * 0.3,
      conscientiousness: 0.5 + Math.random() * 0.3,
      extraversion: 0.4 + Math.random() * 0.4,
      agreeableness: 0.5 + Math.random() * 0.3,
      neuroticism: 0.3 + Math.random() * 0.3,
      honesty_humility: 0.6 + Math.random() * 0.3,
      risk_tolerance: 0.4 + Math.random() * 0.5,
      future_orientation: 0.5 + Math.random() * 0.4,
      identity_certainty: 0.5 + Math.random() * 0.4,
    };

    const { data: parallel } = await supabase.from("parallels").insert({
      user_id: user.id,
      name: parallel_name,
      description: aiDescription,
      avatar_prompt: `A version of ${profile?.display_name ?? "a person"} who ${counterfactual_choice}. Dreamlike, introspective portrait.`,
      birth_fork_id: forkPoint?.id,
      current_context: currentContext,
      traits: defaultTraits,
      divergence_score: 0.1 + (significance ?? 3) * 0.1,
      cosine_sim_to_core: 0.95 - (significance ?? 3) * 0.05,
    }).select("*").single();

    // Update fork point with parallel_id
    if (parallel && forkPoint) {
      await supabase.from("fork_points")
        .update({ parallel_id: parallel.id })
        .eq("id", forkPoint.id);
    }

    // Seed first episode
    await supabase.from("episodes").insert({
      parallel_id: parallel?.id,
      user_id: user.id,
      summary: `Born from the choice to ${counterfactual_choice}. Beginning a new path.`,
      importance_score: 1.0,
      domain: "meaning",
    });

    return new Response(JSON.stringify({ parallel, fork_point: forkPoint }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("parallel-fork error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
