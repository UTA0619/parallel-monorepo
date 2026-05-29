import { createClient } from "@parallel/supabase/server";
import { redirect, notFound } from "next/navigation";
import ConversationClient from "./ConversationClient";

export default async function ParallelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (id === "new") {
    return redirect("/onboarding");
  }

  const [{ data: parallel }, { data: messages }] = await Promise.all([
    supabase.from("parallels").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("messages")
      .select("id,role,content,crisis_level,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(40),
  ]);

  if (!parallel) notFound();

  // Mark today's report as opened
  await supabase.from("daily_reports")
    .update({ opened_at: new Date().toISOString() })
    .eq("parallel_id", id)
    .eq("report_date", new Date().toISOString().split("T")[0])
    .is("opened_at", null);

  return <ConversationClient parallel={parallel} initialMessages={messages ?? []} userId={user.id} />;
}
