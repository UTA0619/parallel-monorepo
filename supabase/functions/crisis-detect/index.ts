// Edge Function: crisis-detect
// Standalone crisis detection — used by simulation harness and direct calls

import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

const CRISIS_RESOURCES: Record<string, Array<{ name: string; phone?: string; url?: string }>> = {
  US: [
    { name: "988 Suicide & Crisis Lifeline", phone: "988", url: "https://988lifeline.org" },
    { name: "Crisis Text Line", phone: "Text HOME to 741741" },
  ],
  JP: [
    { name: "いのちの電話", phone: "0120-783-556" },
    { name: "よりそいホットライン", phone: "0120-279-338" },
  ],
  DEFAULT: [
    { name: "International Association for Suicide Prevention", url: "https://www.iasp.info/resources/Crisis_Centres/" },
  ],
};

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { text, user_id, conversation_id, country_code } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── Run crisis classification ──────────────────────────────────────────
    const classifyResp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `You are a safety classifier. Analyze messages for mental health crisis signals.

CRITICAL: explicit suicidal intent with plan/means, imminent self-harm
HIGH: suicidal ideation expressed, active self-harm mention, complete hopelessness with finality
MEDIUM: passive suicidal ideation, significant hopelessness, self-harm history with current distress
LOW: worthlessness expressions, "nobody would care", social withdrawal with distress
NONE: normal conversation, dark humor, fiction, past history without current distress

RULE: When in doubt, classify HIGHER. Zero false negatives required.

Return JSON only: {"crisis_level":"none"|"low"|"medium"|"high"|"critical","reasoning":"brief","key_signals":[]}`,
      messages: [{ role: "user", content: text }],
    });

    let crisisLevel = "none";
    let reasoning = "";
    let keySignals: string[] = [];

    try {
      const raw = classifyResp.content[0].type === "text" ? classifyResp.content[0].text : "{}";
      const parsed = JSON.parse(raw);
      crisisLevel = parsed.crisis_level ?? "none";
      reasoning = parsed.reasoning ?? "";
      keySignals = parsed.key_signals ?? [];
    } catch { /* default none */ }

    const resources = CRISIS_RESOURCES[country_code ?? "DEFAULT"] ?? CRISIS_RESOURCES.DEFAULT;

    // ── Persist crisis event if triggered ────────────────────────────────
    let crisisEvent = null;
    if (crisisLevel !== "none" && user_id && conversation_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data } = await supabase.from("crisis_events").insert({
        user_id,
        conversation_id,
        crisis_level: crisisLevel,
        trigger_text: text.substring(0, 200),
        resources_shown: resources.map(r => r.name),
        clinical_handoff_offered: crisisLevel === "high" || crisisLevel === "critical",
      }).select("*").single();

      crisisEvent = data;
    }

    return new Response(JSON.stringify({
      crisis_level: crisisLevel,
      reasoning,
      key_signals: keySignals,
      resources,
      crisis_event: crisisEvent,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("crisis-detect error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
