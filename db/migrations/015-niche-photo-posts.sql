-- Photo posts (links to specific X posts) for the dossier's pictures page.
-- Additive only: one new table, nothing existing is renamed, changed or removed.
-- Anyone can read; there is no insert/update/delete policy, so only the
-- server's service role (owner-run additions) can write.

CREATE TABLE IF NOT EXISTS public.niche_photo_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL REFERENCES public.vtubers(id) ON DELETE CASCADE,
  post_url text NOT NULL
    CHECK (post_url ~ '^https://(x|twitter)\.com/[A-Za-z0-9_]{1,15}/status/[0-9]+$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vtuber_id, post_url)
);

CREATE INDEX IF NOT EXISTS niche_photo_posts_vtuber_created_idx
  ON public.niche_photo_posts (vtuber_id, created_at DESC);

ALTER TABLE public.niche_photo_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "niche_photo_posts are publicly readable" ON public.niche_photo_posts;
CREATE POLICY "niche_photo_posts are publicly readable"
  ON public.niche_photo_posts FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.niche_photo_posts IS 'Owner-curated links to X photo posts shown on a creator''s dossier pictures page';
