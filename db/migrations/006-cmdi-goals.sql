-- CMDI (Chat Made Me Do It) Goals
-- Run this migration in Supabase SQL editor (staging first)

CREATE TABLE IF NOT EXISTS cmdi_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  title text NOT NULL,
  description text,
  current_progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL CHECK (target > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by text NOT NULL REFERENCES users(username),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE cmdi_goals ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read active goals for a VTuber
CREATE POLICY "Anyone can view active CMDI goals"
  ON cmdi_goals FOR SELECT
  USING (status = 'active');

-- Authenticated users can insert their own goal submissions
CREATE POLICY "Users can submit CMDI ideas"
  ON cmdi_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only the creator or service role can update their own goals
CREATE POLICY "Creators can update their own CMDI goals"
  ON cmdi_goals FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT username FROM users WHERE id = auth.uid()))
  WITH CHECK (created_by = (SELECT username FROM users WHERE id = auth.uid()));

-- Index for fast lookup by VTuber
CREATE INDEX IF NOT EXISTS idx_cmdi_goals_vtuber_status ON cmdi_goals (vtuber_id, status);
