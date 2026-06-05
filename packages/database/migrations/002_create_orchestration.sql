-- Migration: 002_create_orchestration
-- Pipeline run tracking and morning reports

CREATE TABLE IF NOT EXISTS orchestration_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('morning_report','tap_to_converse','reflection','simulation')),
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  current_stage   TEXT CHECK (current_stage IN ('sense','reflect','simulate','advise')),
  started_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX ON orchestration_runs (user_id, started_at DESC);

-- Morning reports table
CREATE TABLE IF NOT EXISTS morning_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id          UUID REFERENCES orchestration_runs(id),
  report_date     DATE NOT NULL,
  markdown        TEXT NOT NULL,
  memory_ids_used UUID[] DEFAULT '{}',
  tokens_used     INT,
  generated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at    TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  read_duration_s INT,
  UNIQUE(user_id, report_date)  -- one report per user per day
);

ALTER TABLE morning_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own reports"
  ON morning_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at        TIMESTAMPTZ,
  crisis_triggered BOOLEAN DEFAULT FALSE,
  depth_score     FLOAT DEFAULT 0,
  audio_url       TEXT,  -- ephemeral; deleted after transcription
  transcript      TEXT
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  crisis_level    TEXT DEFAULT 'none' CHECK (crisis_level IN ('none','tier_1','tier_2','tier_3','tier_4')),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own conversations"
  ON conversations FOR ALL USING (auth.uid() = user_id);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access messages in own conversations"
  ON conversation_messages FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id)
  );
