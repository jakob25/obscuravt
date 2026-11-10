-- Clip-post scrap rewards.
-- Additive only: creates scrap_transactions if migration 010 was never applied,
-- widens kind so 'clip_post' is allowed, and adds a race-safe award function.
-- Does not change RLS or data on other tables.

CREATE TABLE IF NOT EXISTS public.scrap_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  kind text NOT NULL CHECK (kind IN (
    'daily_bonus', 'bet_place', 'bet_win', 'bet_loss', 'shop_purchase',
    'cmdmi_pledge', 'tag_validator', 'achievement', 'admin_adjust', 'other'
  )),
  reference_id text,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrap_tx_username
  ON public.scrap_transactions (username, created_at DESC);

DO $$
DECLARE
  rec record;
  already_ok boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'scrap_transactions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%clip_post%'
  ) INTO already_ok;

  IF already_ok THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'scrap_transactions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ~* '\mkind\M'
  LOOP
    EXECUTE format('ALTER TABLE public.scrap_transactions DROP CONSTRAINT %I', rec.conname);
  END LOOP;

  ALTER TABLE public.scrap_transactions
    ADD CONSTRAINT scrap_transactions_kind_check
    CHECK (kind IN (
      'daily_bonus', 'bet_place', 'bet_win', 'bet_loss', 'shop_purchase',
      'cmdmi_pledge', 'tag_validator', 'achievement', 'admin_adjust', 'other',
      'clip_post'
    ));
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS scrap_transactions_clip_post_reference_uidx
  ON public.scrap_transactions (reference_id)
  WHERE kind = 'clip_post' AND reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS scrap_transactions_clip_post_user_created_idx
  ON public.scrap_transactions (username, created_at)
  WHERE kind = 'clip_post';

ALTER TABLE public.scrap_transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.award_clip_post_scraps(
  p_username text,
  p_clip_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_amount constant integer := 5;
  c_cap constant integer := 5;
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_count integer;
  v_new_balance integer;
BEGIN
  IF p_username IS NULL OR btrim(p_username) = '' OR p_username = 'guest' THEN
    RETURN jsonb_build_object(
      'awarded', 0,
      'count_today', 0,
      'capped', false,
      'reason', 'not_signed_in'
    );
  END IF;

  IF p_clip_id IS NULL OR btrim(p_clip_id) = '' THEN
    RETURN jsonb_build_object(
      'awarded', 0,
      'count_today', 0,
      'capped', false,
      'reason', 'missing_clip_id'
    );
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('clip_post_scraps'), hashtext(p_username));

  v_window_start :=
    (date_trunc('day', (now() AT TIME ZONE 'UTC') - interval '8 hours') + interval '8 hours')
    AT TIME ZONE 'UTC';
  v_reset_at := v_window_start + interval '1 day';

  IF EXISTS (
    SELECT 1
    FROM public.scrap_transactions
    WHERE kind = 'clip_post'
      AND reference_id = p_clip_id
  ) THEN
    SELECT count(*)::integer INTO v_count
    FROM public.scrap_transactions
    WHERE username = p_username
      AND kind = 'clip_post'
      AND created_at >= v_window_start;

    RETURN jsonb_build_object(
      'awarded', 0,
      'count_today', COALESCE(v_count, 0),
      'capped', COALESCE(v_count, 0) >= c_cap,
      'reset_at', v_reset_at,
      'reason', 'already_awarded'
    );
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.scrap_transactions
  WHERE username = p_username
    AND kind = 'clip_post'
    AND created_at >= v_window_start;

  IF v_count >= c_cap THEN
    RETURN jsonb_build_object(
      'awarded', 0,
      'count_today', v_count,
      'capped', true,
      'reset_at', v_reset_at
    );
  END IF;

  UPDATE public.users
  SET coins = COALESCE(coins, 0) + c_amount
  WHERE username = p_username
  RETURNING coins INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'awarded', 0,
      'count_today', v_count,
      'capped', false,
      'reset_at', v_reset_at,
      'reason', 'user_not_found'
    );
  END IF;

  BEGIN
    INSERT INTO public.scrap_transactions (
      username, amount, balance_after, kind, reference_id, note
    ) VALUES (
      p_username, c_amount, v_new_balance, 'clip_post', p_clip_id, 'Clip posted'
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.users
    SET coins = coins - c_amount
    WHERE username = p_username;

    SELECT count(*)::integer INTO v_count
    FROM public.scrap_transactions
    WHERE username = p_username
      AND kind = 'clip_post'
      AND created_at >= v_window_start;

    RETURN jsonb_build_object(
      'awarded', 0,
      'count_today', COALESCE(v_count, 0),
      'capped', COALESCE(v_count, 0) >= c_cap,
      'reset_at', v_reset_at,
      'reason', 'already_awarded'
    );
  END;

  RETURN jsonb_build_object(
    'awarded', c_amount,
    'count_today', v_count + 1,
    'capped', false,
    'reset_at', v_reset_at,
    'balance', v_new_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_clip_post_scraps(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_clip_post_scraps(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_clip_post_scraps(text, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.award_clip_post_scraps(text, text) TO service_role;

COMMENT ON FUNCTION public.award_clip_post_scraps(text, text) IS
  'Awards 5 scraps for a posted clip, max 5 per user per 08:00 UTC window. Service role only.';
