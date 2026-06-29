-- Discovery games: silhouettes + carnival crane prizes

ALTER TABLE vtubers ADD COLUMN IF NOT EXISTS silhouette_url text;

CREATE TABLE IF NOT EXISTS crane_catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  vtuber_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crane_catches_username ON crane_catches(username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vtubers_silhouette ON vtubers(silhouette_url) WHERE silhouette_url IS NOT NULL;