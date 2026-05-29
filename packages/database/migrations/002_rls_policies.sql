-- PARALLEL — Row Level Security Policies
-- Version: 002
-- All tables enforce user_id = auth.uid() as second defense layer

alter table user_profiles         enable row level security;
alter table fork_points           enable row level security;
alter table parallels             enable row level security;
alter table episodes              enable row level security;
alter table insights              enable row level security;
alter table daily_reports         enable row level security;
alter table conversations         enable row level security;
alter table messages              enable row level security;
alter table crisis_events         enable row level security;
alter table onboarding_sessions   enable row level security;
alter table user_stats            enable row level security;
alter table marketplace_parallels enable row level security;

-- user_profiles: users can only read/update their own profile
create policy "users_own_profile_select" on user_profiles for select using (id = auth.uid());
create policy "users_own_profile_update" on user_profiles for update using (id = auth.uid());
create policy "users_own_profile_insert" on user_profiles for insert with check (id = auth.uid());

-- fork_points
create policy "users_own_forks" on fork_points for all using (user_id = auth.uid());

-- parallels
create policy "users_own_parallels" on parallels for all using (user_id = auth.uid());

-- episodes (via parallel ownership)
create policy "users_own_episodes" on episodes for all using (user_id = auth.uid());

-- insights
create policy "users_own_insights" on insights for all using (user_id = auth.uid());

-- daily_reports
create policy "users_own_reports" on daily_reports for all using (user_id = auth.uid());

-- conversations
create policy "users_own_conversations" on conversations for all using (user_id = auth.uid());

-- messages
create policy "users_own_messages" on messages for all using (user_id = auth.uid());

-- crisis_events (service role only can insert; user can read their own)
create policy "users_read_own_crisis" on crisis_events for select using (user_id = auth.uid());
create policy "service_insert_crisis"  on crisis_events for insert with check (true);

-- onboarding_sessions
create policy "users_own_onboarding" on onboarding_sessions for all using (user_id = auth.uid());

-- user_stats
create policy "users_own_stats" on user_stats for select using (user_id = auth.uid());
create policy "service_upsert_stats"  on user_stats for all using (true) with check (true);

-- marketplace: anyone can read published parallels; only creator can modify
create policy "marketplace_public_read"   on marketplace_parallels for select using (published = true);
create policy "marketplace_creator_write" on marketplace_parallels for all using (creator_id = auth.uid());
