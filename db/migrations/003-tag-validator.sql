-- Tag validator votes (run on staging Supabase)

CREATE TABLE IF NOT EXISTS vtuber_tag_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  tag text NOT NULL,
  tag_type text NOT NULL DEFAULT 'vibe',
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  profile_id text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  voted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username, vtuber_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_vtuber_tag_votes_vtuber ON vtuber_tag_votes(vtuber_id);
CREATE INDEX IF NOT EXISTS idx_vtuber_tag_votes_username ON vtuber_tag_votes(username);