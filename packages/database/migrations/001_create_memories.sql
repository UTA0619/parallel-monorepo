-- Migration: 001_create_memories
-- Creates the core memory layer schema with pgvector support

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  embedding       vector(1536),
  source          TEXT NOT NULL CHECK (source IN (
                    'onboarding','tap_to_converse','reflection','morning_report','system'
                  )),
  tags            TEXT[] DEFAULT '{}',
  emotion         JSONB DEFAULT '{"valence":0,"arousal":0}',
  salience        FLOAT DEFAULT 0.5 CHECK (salience BETWEEN 0 AND 1),
  access_count    INT DEFAULT 0 CHECK (access_count >= 0),
  encrypted       BOOLEAN DEFAULT FALSE,
  retention_until DATE,
  event_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ANN index (IVFFlat for cosine similarity)
CREATE INDEX IF NOT EXISTS memories_embedding_idx
  ON memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Covering index for per-user queries
CREATE INDEX IF NOT EXISTS memories_user_created_idx
  ON memories (user_id, created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS memories_fts_idx
  ON memories USING GIN (to_tsvector('english', content));

-- RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own memories only"
  ON memories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Hybrid search function (ANN + FTS combined)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(1536),
  uid UUID,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  tags TEXT[],
  emotion JSONB,
  salience FLOAT,
  access_count INT,
  created_at TIMESTAMPTZ,
  distance FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (m.id)
    m.id,
    m.content,
    m.tags,
    m.emotion,
    m.salience,
    m.access_count,
    m.created_at,
    (m.embedding <=> query_embedding) AS distance
  FROM memories m
  WHERE m.user_id = uid
    AND (
      m.embedding IS NOT NULL
      OR to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
    )
  ORDER BY m.id, (m.embedding <=> query_embedding)
  LIMIT match_count;
$$;

-- Increment access count helper
CREATE OR REPLACE FUNCTION increment_access_count(memory_ids UUID[])
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE memories
  SET access_count = access_count + 1,
      updated_at = NOW()
  WHERE id = ANY(memory_ids);
$$;

-- User metrics table (nightly computed Affection Score)
CREATE TABLE IF NOT EXISTS user_metrics (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  affection_score     FLOAT DEFAULT 0 CHECK (affection_score BETWEEN 0 AND 100),
  report_open_rate    FLOAT DEFAULT 0,
  reflection_rate     FLOAT DEFAULT 0,
  action_rate         FLOAT DEFAULT 0,
  session_depth_score FLOAT DEFAULT 0,
  streak_days         INT DEFAULT 0,
  computed_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own metrics"
  ON user_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Crisis audit log (append-only, no RLS delete)
CREATE TABLE IF NOT EXISTS crisis_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  conversation_id UUID NOT NULL,
  tier            TEXT NOT NULL,
  detected_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resources_shown TEXT[] DEFAULT '{}',
  false_positive  BOOLEAN DEFAULT FALSE,
  reviewed_at     TIMESTAMPTZ,
  reviewer_id     UUID
);

-- Only clinical role can read crisis logs
ALTER TABLE crisis_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical role reads crisis logs"
  ON crisis_audit_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'clinical');
