-- Additive only. Existing groups remain corpos. No memberships are seeded.
BEGIN;
ALTER TABLE public.corpo_groups
  ADD COLUMN kind text NOT NULL DEFAULT 'corpo' CHECK (kind IN ('corpo', 'world')),
  ADD COLUMN world_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(world_details) = 'object');
CREATE INDEX corpo_groups_world_members_idx ON public.corpo_groups USING gin(member_vtuber_ids) WHERE kind = 'world';
-- Existing table has RLS enabled and no policies. Keep client writes denied;
-- allow anonymous reads only for the new, deliberately public world rows.
CREATE POLICY "Public world read" ON public.corpo_groups FOR SELECT TO anon, authenticated USING (kind = 'world');
COMMIT;
