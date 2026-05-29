// Edge Function: parallel-generate-report
// Generates a Daily Report from a Parallel (called by batch simulation or on-demand)

import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const SONNET = "claude-sonnet-4-6";
const HAIKU  = "claude-haiku-4-5-20251001";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get("Authorization");
    // Accept both user auth and service role for batch generation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      authHeader
        ? Deno.env.get("SUPABASE_ANON_KEY")!
        : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    );

    const body = await req.json();
    const { parallel_id, user_id, report_date } = body;
    const date = report_date ?? new Date().toISOString().split("T")[0];

    // Check if report already exists for today
    const { data: existing } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("parallel_id", parallel_id)
      .eq("report_date", date)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ cached: true, report_id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── Fetch data ────────────────────────────────────────────────────────
    const [{ data: parallel }, { data: profile }, { data: episodes }] = await Promise.all([
      supabase.from("parallels").select("*").eq("id", parallel_id).single(),
      supabase.from("user_profiles").select("display_name, language").eq("id", user_id).single(),
      supabase.from("episodes").select("summary, domain, importance_score")
        .eq("parallel_id", parallel_id)
        .order("importance_score", { ascending: false })
        .limit(12),
    ]);

    if (!parallel) return new Response("Parallel not found", { status: 404 });

    const episodeSummaries = (episodes ?? []).map((e: { summary: string; domain: string }) =>
      `[${e.domain}] ${e.summary}`
    );

    // ── Generate narrative (Sonnet for quality) ───────────────────────────
    const narrativePrompt = `You are ${parallel.name}, writing your daily report to ${profile?.display_name ?? "yourself"}.

Your identity: ${parallel.description}

Your recent experiences and memories:
${episodeSummaries.length > 0 ? episodeSummaries.join("\n") : "You are newly born — write about the feeling of your divergence."}

Current life context: ${parallel.current_context || "Living your diverged path."}

Write a daily report (200-280 words). It should feel like a dispatch from your life — intimate, specific, honest.
1. Something you noticed or experienced today (2-3 sentences)
2. How it reflects the difference between your path and theirs (1-2 sentences)
3. One grounded insight that only you could offer from your vantage point

End with a genuine question — not rhetorical, actually curious about their day.
Write in flowing paragraphs. No headers. No bullet points.`;

    const narrativeResp = await anthropic.messages.create({
      model: SONNET,
      max_tokens: 600,
      messages: [{ role: "user", content: narrativePrompt }],
    });

    const narrative = narrativeResp.content[0].type === "text"
      ? narrativeResp.content[0].text
      : "Today I found myself thinking about the fork in our road...";

    // ── Generate insight (Haiku for speed/cost) ───────────────────────────
    const insightResp = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Extract the single most actionable insight from this report (1-3 sentences, max 150 words). Start with "I noticed..." or "From my path...". Return ONLY the insight text.\n\n${narrative}`
      }],
    });

    const insightContent = insightResp.content[0].type === "text"
      ? insightResp.content[0].text
      : narrative.substring(0, 150);

    // ── Determine domain (Haiku classification) ───────────────────────────
    const domainResp = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 20,
      messages: [{
        role: "user",
        content: `Classify this insight into exactly one domain. Return only the domain word.\nDomains: career, relationships, health, creativity, meaning\n\nInsight: ${insightContent}`
      }],
    });

    const domainRaw = domainResp.content[0].type === "text"
      ? domainResp.content[0].text.trim().toLowerCase()
      : "meaning";
    const VALID_DOMAINS = ["career", "relationships", "health", "creativity", "meaning"];
    const domain = VALID_DOMAINS.includes(domainRaw) ? domainRaw : "meaning";

    // ── Compute convergence score ─────────────────────────────────────────
    const convergenceScore = Math.min(
      0.4 + (parallel.affection_score * 0.3) + (parallel.divergence_score * 0.2) + Math.random() * 0.1,
      1.0
    );

    // ── Persist insight + report ──────────────────────────────────────────
    const { data: insight } = await supabase.from("insights").insert({
      parallel_id,
      user_id,
      content: insightContent,
      utility_score: convergenceScore,
      domain,
      evidence_episode_ids: (episodes ?? []).slice(0, 3).map((e: { id?: string }) => e.id).filter(Boolean),
    }).select("id").single();

    const { data: report } = await supabase.from("daily_reports").insert({
      parallel_id,
      user_id,
      report_date: date,
      narrative,
      insight_id: insight?.id,
      convergence_score: convergenceScore,
    }).select("*").single();

    // Update parallel last_report_at
    await supabase.from("parallels")
      .update({ last_report_at: new Date().toISOString(), total_insights_generated: (parallel.total_insights_generated ?? 0) + 1 })
      .eq("id", parallel_id);

    // Add to episodic memory
    await supabase.from("episodes").insert({
      parallel_id,
      user_id,
      summary: `Generated daily report: ${narrative.substring(0, 100)}...`,
      importance_score: 0.6,
      domain,
    });

    return new Response(JSON.stringify({ report, tokens_used: narrativeResp.usage.input_tokens + narrativeResp.usage.output_tokens }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("parallel-generate-report error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
