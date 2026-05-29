import { createClient } from "@parallel/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: parallels },
    { data: reports },
  ] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase.from("parallels").select("id,name,description,avatar_url,affection_score,status,last_report_at,divergence_score")
      .eq("user_id", user.id).eq("status", "active").order("affection_score", { ascending: false }),
    supabase.from("daily_reports")
      .select("id,parallel_id,narrative,convergence_score,generated_at,opened_at,insight_id")
      .eq("user_id", user.id)
      .eq("report_date", new Date().toISOString().split("T")[0])
      .order("convergence_score", { ascending: false }),
  ]);

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  return <DashboardClient profile={profile} parallels={parallels ?? []} reports={reports ?? []} />;
}
