-- PARALLEL — Migration 004
-- Adds push notification token storage and subscription tracking

-- expo push token (stored per device, updated on login)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS expo_push_token text,
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- Index for efficient push queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_push_token
  ON user_profiles(expo_push_token)
  WHERE expo_push_token IS NOT NULL;

-- Track notification delivery for analytics
CREATE TABLE IF NOT EXISTS notification_logs (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parallel_id    uuid REFERENCES parallels(id) ON DELETE SET NULL,
  type           text NOT NULL,               -- 'daily_report' | 'insight' | 'crisis_followup'
  expo_ticket_id text,                         -- Expo push receipt ID
  status         text NOT NULL DEFAULT 'sent', -- 'sent' | 'delivered' | 'failed'
  sent_at        timestamptz NOT NULL DEFAULT now()
);
