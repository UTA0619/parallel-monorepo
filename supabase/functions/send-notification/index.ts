import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

Deno.serve(async (req) => {
  // Only accept POST from internal service role calls
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify caller is service role (internal only — not user-callable)
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!authHeader.includes(serviceRoleKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
  );

  let payload: NotificationPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user_id, title, body, data } = payload;
  if (!user_id || !title || !body) {
    return new Response(JSON.stringify({ error: "Missing required fields: user_id, title, body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch user's push token and notification preference
  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select("expo_push_token, notifications_enabled")
    .eq("id", user_id)
    .single();

  if (profileErr || !profile) {
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!profile.notifications_enabled || !profile.expo_push_token) {
    return new Response(JSON.stringify({ skipped: true, reason: "notifications disabled or no token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token: string = profile.expo_push_token;

  // Validate Expo push token format
  if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
    return new Response(JSON.stringify({ error: "Invalid push token format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message: ExpoPushMessage = {
    to: token,
    title,
    body,
    data: data ?? {},
    sound: "default",
    priority: "high",
  };

  // Send via Expo Push API
  const expoRes = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(message),
  });

  const expoData = await expoRes.json();

  // Log the notification attempt
  await supabase.from("notification_logs").insert({
    user_id,
    title,
    body,
    data: data ?? {},
    expo_response: expoData,
    sent_at: new Date().toISOString(),
  });

  // Check for Expo-level errors
  const ticket = expoData?.data?.[0] ?? expoData;
  if (ticket?.status === "error") {
    console.error("Expo push error:", ticket.message, ticket.details);
    return new Response(JSON.stringify({ error: ticket.message, details: ticket.details }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, ticket }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
