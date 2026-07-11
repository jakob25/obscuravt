CREATE TABLE IF NOT EXISTS collab_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL REFERENCES vtubers(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  game_or_activity text NOT NULL,
  on_stream boolean NOT NULL DEFAULT true,
  availability text,
  contact_twitter text,
  contact_discord text,
  expires_in_days integer NOT NULL DEFAULT 3,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collab_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL REFERENCES vtubers(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES collab_requests(id) ON DELETE CASCADE,
  cleared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collab_requests_vtuber_id ON collab_requests(vtuber_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_expires_at ON collab_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_collab_notifications_recipient ON collab_notifications(recipient, cleared);
CREATE INDEX IF NOT EXISTS idx_collab_notifications_request_id ON collab_notifications(request_id);
