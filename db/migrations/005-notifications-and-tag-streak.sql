-- Run on staging Supabase before using notifications + tag streak rewards

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  related_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_username ON notifications(username);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(username, is_read) WHERE is_read = false;

ALTER TABLE users ADD COLUMN IF NOT EXISTS tag_validator_streak integer NOT NULL DEFAULT 0;