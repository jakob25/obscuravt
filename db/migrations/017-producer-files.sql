-- Producer files: music producers who make music for VTubers but are not VTubers.
-- Additive only: two new tables. Nothing existing is renamed, changed or removed.
-- Anyone can read approved producers and their credits; there is no
-- insert/update/delete policy, so only the server's service role (the owner's
-- admin forms) can write. No prices, commission status or rights are stored.

CREATE TABLE IF NOT EXISTS public.producers (
  id text PRIMARY KEY CHECK (id ~ '^pr_[a-z0-9]{1,16}_[a-f0-9]{6}$'),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  bio text,
  avatar_url text,
  genre_tags text[] NOT NULL DEFAULT '{}',
  services text[] NOT NULL DEFAULT '{}'
    CHECK (services <@ ARRAY['original_songs', 'stream_bgm', 'covers_instrumentals', 'mixing_mastering', 'jingles_alerts']::text[]),
  commission_url text CHECK (commission_url IS NULL OR commission_url ~ '^https://'),
  portfolio_url text CHECK (portfolio_url IS NULL OR portfolio_url ~ '^https://'),
  youtube text CHECK (youtube IS NULL OR youtube ~ '^https://'),
  twitch text CHECK (twitch IS NULL OR twitch ~ '^https://'),
  x text CHECK (x IS NULL OR x ~ '^https://'),
  soundcloud text CHECK (soundcloud IS NULL OR soundcloud ~ '^https://'),
  bluesky text CHECK (bluesky IS NULL OR bluesky ~ '^https://'),
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS producers_name_idx ON public.producers (lower(name));
CREATE INDEX IF NOT EXISTS producers_genre_tags_idx ON public.producers USING gin (genre_tags);
CREATE INDEX IF NOT EXISTS producers_services_idx ON public.producers USING gin (services);

CREATE TABLE IF NOT EXISTS public.producer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id text NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  vtuber_id text NOT NULL REFERENCES public.vtubers(id) ON DELETE CASCADE,
  song_title text NOT NULL CHECK (char_length(btrim(song_title)) BETWEEN 1 AND 160),
  -- Public release where the producer is credited (the proof link).
  song_url text NOT NULL CHECK (song_url ~ '^https://'),
  role text NOT NULL CHECK (role IN ('produced', 'composed', 'mixed', 'lyrics', 'bgm')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producer_id, vtuber_id, song_url, role)
);

CREATE INDEX IF NOT EXISTS producer_credits_producer_idx
  ON public.producer_credits (producer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS producer_credits_vtuber_idx
  ON public.producer_credits (vtuber_id);

ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved producers" ON public.producers;
CREATE POLICY "Public can read approved producers"
  ON public.producers FOR SELECT
  TO anon, authenticated
  USING (approved = true);

DROP POLICY IF EXISTS "Public can read credits of approved producers" ON public.producer_credits;
CREATE POLICY "Public can read credits of approved producers"
  ON public.producer_credits FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.producers p
    WHERE p.id = producer_credits.producer_id AND p.approved = true
  ));

COMMENT ON TABLE public.producers IS 'Owner-added music producers (not VTubers) shown on /producer/[id]. Admin writes only.';
COMMENT ON TABLE public.producer_credits IS 'Owner-added song credits linking a producer to a VTuber, each with a public proof link. Admin writes only.';
