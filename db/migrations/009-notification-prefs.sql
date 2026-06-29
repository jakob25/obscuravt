-- Notification preferences (per-type toggles) + admin audit log

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{
  "cmdmi_selected": true,
  "cmdmi_funded": true,
  "cmdmi_new": true,
  "bet_voting": true,
  "bet_won": true,
  "bet_lost": true,
  "achievement": true,
  "qa_open": true,
  "karaoke_open": true,
  "schedule_vote": true,
  "meme_new": true
}'::jsonb;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL REFERENCES users(username),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);