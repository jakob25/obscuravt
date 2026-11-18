-- Site claim requests. Users submit via /claim; admin approves in /admin.
-- Approval sets vtubers.claimed_by / is_claimed / claim_approved_at and inserts user_claimed_profiles.

CREATE TABLE IF NOT EXISTS profile_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  requested_by text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  proof_link text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON profile_claim_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_requests_user ON profile_claim_requests(requested_by, created_at DESC);
