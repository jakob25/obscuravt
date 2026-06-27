-- Clips system (raw + edited) scoped per VTuber

CREATE TABLE IF NOT EXISTS raw_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  uploaded_by text NOT NULL REFERENCES users(username),
  storage_path text NOT NULL,
  title text,
  duration_seconds integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS edited_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  raw_clip_id uuid REFERENCES raw_clips(id) ON DELETE SET NULL,
  created_by text NOT NULL REFERENCES users(username),
  storage_path text NOT NULL,
  title text NOT NULL,
  description text,
  duration_seconds integer,
  view_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE raw_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE edited_clips ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view approved/published clips for a VTuber"
  ON edited_clips FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can upload raw clips"
  ON raw_clips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can manage their edited clips"
  ON edited_clips FOR ALL
  TO authenticated
  USING (created_by = (SELECT username FROM users WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edited_clips_vtuber ON edited_clips (vtuber_id, status);
CREATE INDEX IF NOT EXISTS idx_raw_clips_vtuber ON raw_clips (vtuber_id, status);
