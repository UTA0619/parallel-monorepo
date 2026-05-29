-- PARALLEL — Initial Schema Migration
-- Version: 001
-- Requires: pgvector extension

-- ── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_cron";

-- ── Enums ─────────────────────────────────────────────────────────────────
create type subscription_tier as enum ('free', 'plus', 'infinite', 'legacy_addon');
create type parallel_status   as enum ('active', 'distant', 'archived', 'legacy');
create type crisis_level      as enum ('none', 'low', 'medium', 'high', 'critical');
create type insight_domain    as enum ('career', 'relationships', 'health', 'creativity', 'meaning');
create type message_role      as enum ('user', 'parallel', 'system');
create type language_code     as enum ('en', 'ja', 'ko', 'zh');

-- ── user_profiles ─────────────────────────────────────────────────────────
create table user_profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  email                     text not null,
  display_name              text not null default '',
  avatar_url                text,
  subscription_tier         subscription_tier not null default 'free',
  subscription_expires_at   timestamptz,
  onboarding_completed      boolean not null default false,
  core_embedding            vector(1024),
  preferred_report_time     time not null default '08:00',
  timezone                  text not null default 'UTC',
  language                  language_code not null default 'en',
  daily_use_cap_minutes     int,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ── fork_points ───────────────────────────────────────────────────────────
create table fork_points (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references user_profiles(id) on delete cascade,
  parallel_id           uuid,  -- set after parallel is created (or null for onboarding forks)
  description           text not null,
  choice_made           text not null,
  counterfactual_choice text not null,
  significance          smallint not null default 3 check (significance between 1 and 5),
  created_at            timestamptz not null default now()
);

-- ── parallels ─────────────────────────────────────────────────────────────
create table parallels (
  id                          uuid primary key default uuid_generate_v4(),
  user_id                     uuid not null references user_profiles(id) on delete cascade,
  name                        text not null,
  description                 text not null default '',
  avatar_prompt               text not null default '',
  avatar_url                  text,
  birth_fork_id               uuid references fork_points(id),
  status                      parallel_status not null default 'active',
  affection_score             float not null default 0.3 check (affection_score between 0 and 1),
  -- State (stored as JSONB for flexibility, queried as structured data)
  embedding                   vector(1024),
  traits                      jsonb not null default '{}',
  current_context             text not null default '',
  mood_vector                 float[] not null default '{0,0,0,0,0,0,0,0}',
  divergence_score            float not null default 0 check (divergence_score between 0 and 1),
  cosine_sim_to_core          float not null default 1.0,
  -- Counters
  total_conversations         int not null default 0,
  total_insights_generated    int not null default 0,
  total_insights_actioned     int not null default 0,
  last_report_at              timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ── episodes (episodic memory) ────────────────────────────────────────────
create table episodes (
  id               uuid primary key default uuid_generate_v4(),
  parallel_id      uuid not null references parallels(id) on delete cascade,
  user_id          uuid not null references user_profiles(id) on delete cascade,
  summary          text not null,
  full_content     text,
  importance_score float not null default 0.5 check (importance_score between 0 and 1),
  domain           insight_domain not null default 'meaning',
  embedding        vector(1536),  -- text-embedding-3-small
  created_at       timestamptz not null default now()
);

-- ── insights ──────────────────────────────────────────────────────────────
create table insights (
  id                    uuid primary key default uuid_generate_v4(),
  parallel_id           uuid not null references parallels(id) on delete cascade,
  user_id               uuid not null references user_profiles(id) on delete cascade,
  content               text not null,
  utility_score         float not null default 0.5 check (utility_score between 0 and 1),
  domain                insight_domain not null,
  evidence_episode_ids  uuid[] not null default '{}',
  actioned              boolean not null default false,
  actioned_at           timestamptz,
  created_at            timestamptz not null default now()
);

-- ── daily_reports ─────────────────────────────────────────────────────────
create table daily_reports (
  id               uuid primary key default uuid_generate_v4(),
  parallel_id      uuid not null references parallels(id) on delete cascade,
  user_id          uuid not null references user_profiles(id) on delete cascade,
  report_date      date not null,
  narrative        text not null,
  insight_id       uuid references insights(id),
  mood_delta       float[] not null default '{0,0,0,0,0,0,0,0}',
  image_url        text,
  convergence_score float not null default 0.5,
  opened_at        timestamptz,
  read_duration_s  int,
  generated_at     timestamptz not null default now(),
  unique (parallel_id, report_date)
);

-- ── conversations ─────────────────────────────────────────────────────────
create table conversations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references user_profiles(id) on delete cascade,
  parallel_id      uuid not null references parallels(id) on delete cascade,
  crisis_triggered boolean not null default false,
  depth_score      float not null default 0,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz
);

-- ── messages ──────────────────────────────────────────────────────────────
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references user_profiles(id) on delete cascade,
  role            message_role not null,
  content         text not null,
  crisis_level    crisis_level not null default 'none',
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

-- ── crisis_events ─────────────────────────────────────────────────────────
create table crisis_events (
  id                         uuid primary key default uuid_generate_v4(),
  user_id                    uuid not null references user_profiles(id) on delete cascade,
  conversation_id            uuid not null references conversations(id) on delete cascade,
  crisis_level               crisis_level not null,
  trigger_text               text not null,  -- anonymized excerpt
  resources_shown            text[] not null default '{}',
  clinical_handoff_offered   boolean not null default false,
  clinical_handoff_accepted  boolean not null default false,
  false_positive             boolean not null default false,
  resolved_at                timestamptz,
  detected_at                timestamptz not null default now()
);

-- ── onboarding_sessions ───────────────────────────────────────────────────
create table onboarding_sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references user_profiles(id) on delete cascade,
  voice_transcript  text,
  fork_points       jsonb not null default '[]',
  parallels_created uuid[] not null default '{}',
  duration_s        int not null default 0,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- ── user_stats ────────────────────────────────────────────────────────────
create table user_stats (
  user_id                  uuid primary key references user_profiles(id) on delete cascade,
  d1_retained              boolean not null default false,
  d7_retained              boolean not null default false,
  d30_retained             boolean not null default false,
  sessions_last_7d         int not null default 0,
  avg_session_duration_s   float not null default 0,
  avg_affection_score      float not null default 0,
  insight_action_rate      float not null default 0,
  total_insights_actioned  int not null default 0,
  streak_days              int not null default 0,
  computed_at              timestamptz not null default now()
);

-- ── marketplace_parallels ─────────────────────────────────────────────────
create table marketplace_parallels (
  id                  uuid primary key default uuid_generate_v4(),
  creator_id          uuid not null references user_profiles(id) on delete cascade,
  name                text not null,
  description         text not null,
  archetype           text not null,
  preview_insight     text not null,
  price_monthly_usd   float not null default 4.99,
  installs            int not null default 0,
  rating              float not null default 0 check (rating between 0 and 5),
  avatar_url          text not null default '',
  tags                text[] not null default '{}',
  published           boolean not null default false,
  created_at          timestamptz not null default now()
);
