-- PARALLEL — Indexes & DB Functions
-- Version: 003

-- ── Performance indexes ───────────────────────────────────────────────────
create index idx_parallels_user_id       on parallels(user_id);
create index idx_parallels_status        on parallels(user_id, status);
create index idx_episodes_parallel_id    on episodes(parallel_id);
create index idx_episodes_importance     on episodes(parallel_id, importance_score desc);
create index idx_insights_user_date      on insights(user_id, created_at desc);
create index idx_insights_utility        on insights(user_id, utility_score desc);
create index idx_daily_reports_user_date on daily_reports(user_id, report_date desc);
create index idx_messages_conversation   on messages(conversation_id, created_at asc);
create index idx_crisis_events_user      on crisis_events(user_id, detected_at desc);

-- ── pgvector HNSW indexes ─────────────────────────────────────────────────
create index idx_parallels_embedding  on parallels using hnsw (embedding vector_cosine_ops);
create index idx_episodes_embedding   on episodes  using hnsw (embedding vector_cosine_ops);
create index idx_profiles_embedding   on user_profiles using hnsw (core_embedding vector_cosine_ops);

-- ── updated_at trigger ────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_profiles_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

create trigger trg_parallels_updated_at
  before update on parallels
  for each row execute function set_updated_at();

-- ── Drift bound enforcement ───────────────────────────────────────────────
-- Marks Parallel as 'distant' if cosine_sim drops below 0.65
create or replace function enforce_drift_bound()
returns trigger language plpgsql as $$
begin
  if new.cosine_sim_to_core < 0.65 then
    new.status = 'distant';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_drift_bound
  before update of cosine_sim_to_core on parallels
  for each row execute function enforce_drift_bound();

-- ── Affection score update ────────────────────────────────────────────────
create or replace function update_affection_score(
  p_parallel_id uuid,
  p_conversation_depth float,
  p_insight_actioned boolean
) returns float language plpgsql security definer as $$
declare
  v_current float;
  v_new     float;
begin
  select affection_score into v_current
  from parallels where id = p_parallel_id;

  -- Weighted moving average: conversation depth + insight action bonus
  v_new := v_current
    + (0.03 * p_conversation_depth)
    + case when p_insight_actioned then 0.05 else 0 end
    - 0.001;  -- daily decay

  v_new := greatest(0, least(1, v_new));

  update parallels set affection_score = v_new where id = p_parallel_id;
  return v_new;
end;
$$;

-- ── Insight action rate calculation ──────────────────────────────────────
create or replace function get_insight_action_rate(
  p_user_id uuid,
  p_days int default 30
) returns float language sql security definer as $$
  select
    case when count(*) = 0 then 0
    else round(count(*) filter (where actioned) / count(*)::numeric, 4)
    end
  from insights
  where user_id = p_user_id
    and created_at > now() - (p_days || ' days')::interval;
$$;

-- ── Create user profile on auth signup ───────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  insert into user_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Episode memory eviction (FIFO by importance) ──────────────────────────
create or replace function evict_old_episodes(p_parallel_id uuid)
returns void language plpgsql security definer as $$
declare
  v_count int;
begin
  select count(*) into v_count from episodes where parallel_id = p_parallel_id;
  if v_count > 10000 then
    delete from episodes
    where id in (
      select id from episodes
      where parallel_id = p_parallel_id
      order by importance_score asc, created_at asc
      limit (v_count - 9500)
    );
  end if;
end;
$$;

-- ── Tier limits enforcement ───────────────────────────────────────────────
create or replace function check_parallel_limit()
returns trigger language plpgsql as $$
declare
  v_tier subscription_tier;
  v_count int;
  v_limit int;
begin
  select subscription_tier into v_tier from user_profiles where id = new.user_id;
  select count(*) into v_count from parallels where user_id = new.user_id and status != 'archived';
  v_limit := case v_tier
    when 'free'     then 3
    when 'plus'     then 25
    when 'infinite' then 100
    else 100
  end;
  if v_count >= v_limit then
    raise exception 'Parallel limit reached for tier: %', v_tier;
  end if;
  return new;
end;
$$;

create trigger trg_check_parallel_limit
  before insert on parallels
  for each row execute function check_parallel_limit();
