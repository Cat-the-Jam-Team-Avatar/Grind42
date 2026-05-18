-- Persist the Sanal Cluster 1000-click window in the database.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS click_window_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_window_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS click_window_expires_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_click_window_count_range'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_click_window_count_range
      CHECK (click_window_count >= 0 AND click_window_count <= 1000);
  END IF;
END;
$$;

REVOKE UPDATE (
  click_window_count,
  click_window_started_at,
  click_window_expires_at
) ON TABLE public.users FROM anon, authenticated;

GRANT SELECT, UPDATE ON TABLE public.users TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_client_click_window_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_role IN ('anon', 'authenticated')
    AND (
      NEW.click_window_count IS DISTINCT FROM OLD.click_window_count
      OR NEW.click_window_started_at IS DISTINCT FROM OLD.click_window_started_at
      OR NEW.click_window_expires_at IS DISTINCT FROM OLD.click_window_expires_at
    ) THEN
    RAISE EXCEPTION 'click_window_server_only' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_click_window_columns ON public.users;
CREATE TRIGGER protect_click_window_columns
  BEFORE UPDATE OF
    click_window_count,
    click_window_started_at,
    click_window_expires_at
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_click_window_update();

REVOKE ALL ON FUNCTION public.prevent_client_click_window_update()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_click_window(
  p_user_id uuid,
  p_coins integer DEFAULT 0,
  p_xp integer DEFAULT 0,
  p_clicks integer DEFAULT 0,
  p_window_max integer DEFAULT 1000,
  p_window_hours integer DEFAULT 4
)
RETURNS TABLE (
  balance integer,
  total_coins integer,
  weekly_coins integer,
  total_clicks integer,
  xp integer,
  click_window_count integer,
  click_window_started_at timestamptz,
  click_window_expires_at timestamptz,
  accepted_clicks integer,
  rejected_clicks integer,
  synced_coins integer,
  synced_xp integer
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window_max integer := LEAST(GREATEST(COALESCE(p_window_max, 1000), 1), 1000);
  v_window_hours integer := LEAST(GREATEST(COALESCE(p_window_hours, 4), 1), 24);
  v_requested_clicks integer := GREATEST(COALESCE(p_clicks, 0), 0);
  v_safe_clicks integer;
  v_safe_coins integer := GREATEST(COALESCE(p_coins, 0), 0);
  v_safe_xp integer := GREATEST(COALESCE(p_xp, 0), 0);
  v_balance integer;
  v_total_coins integer;
  v_weekly_coins integer;
  v_total_clicks integer;
  v_xp integer;
  v_click_window_count integer;
  v_click_window_started_at timestamptz;
  v_click_window_expires_at timestamptz;
  v_remaining_clicks integer;
  v_accepted_clicks integer;
  v_rejected_clicks integer;
  v_synced_coins integer;
  v_synced_xp integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'click_window_user_required' USING ERRCODE = '22023';
  END IF;

  SELECT
    users.balance,
    users.total_coins,
    users.weekly_coins,
    users.total_clicks,
    users.xp,
    users.click_window_count,
    users.click_window_started_at,
    users.click_window_expires_at
  INTO
    v_balance,
    v_total_coins,
    v_weekly_coins,
    v_total_clicks,
    v_xp,
    v_click_window_count,
    v_click_window_started_at,
    v_click_window_expires_at
  FROM public.users
  WHERE users.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'click_window_user_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_click_window_expires_at IS NOT NULL
    AND v_click_window_expires_at <= v_now THEN
    v_click_window_count := 0;
    v_click_window_started_at := NULL;
    v_click_window_expires_at := NULL;
  END IF;

  v_safe_clicks := LEAST(v_requested_clicks, v_window_max);
  v_remaining_clicks := GREATEST(v_window_max - COALESCE(v_click_window_count, 0), 0);
  v_accepted_clicks := LEAST(v_safe_clicks, v_remaining_clicks);
  v_rejected_clicks := GREATEST(v_requested_clicks - v_accepted_clicks, 0);

  IF v_accepted_clicks > 0 AND COALESCE(v_click_window_count, 0) = 0 THEN
    v_click_window_started_at := v_now;
    v_click_window_expires_at := v_now + make_interval(hours => v_window_hours);
  END IF;

  IF v_requested_clicks = 0 THEN
    v_synced_coins := 0;
    v_synced_xp := 0;
  ELSIF v_accepted_clicks = 0 THEN
    v_synced_coins := 0;
    v_synced_xp := 0;
  ELSIF v_requested_clicks > 0 AND v_accepted_clicks < v_requested_clicks THEN
    v_synced_coins := ROUND((v_safe_coins::numeric * v_accepted_clicks) / v_requested_clicks)::integer;
    v_synced_xp := ROUND((v_safe_xp::numeric * v_accepted_clicks) / v_requested_clicks)::integer;
  ELSE
    v_synced_coins := v_safe_coins;
    v_synced_xp := v_safe_xp;
  END IF;

  v_click_window_count := LEAST(
    v_window_max,
    COALESCE(v_click_window_count, 0) + v_accepted_clicks
  );

  UPDATE public.users AS target
  SET
    balance = COALESCE(v_balance, 0) + v_synced_coins,
    total_coins = COALESCE(v_total_coins, 0) + v_synced_coins,
    weekly_coins = COALESCE(v_weekly_coins, 0) + v_synced_coins,
    total_clicks = COALESCE(v_total_clicks, 0) + v_accepted_clicks,
    xp = COALESCE(v_xp, 0) + v_synced_xp,
    click_window_count = v_click_window_count,
    click_window_started_at = v_click_window_started_at,
    click_window_expires_at = v_click_window_expires_at
  WHERE target.id = p_user_id
  RETURNING
    target.balance,
    target.total_coins,
    target.weekly_coins,
    target.total_clicks,
    target.xp,
    target.click_window_count,
    target.click_window_started_at,
    target.click_window_expires_at
  INTO
    balance,
    total_coins,
    weekly_coins,
    total_clicks,
    xp,
    click_window_count,
    click_window_started_at,
    click_window_expires_at;

  accepted_clicks := v_accepted_clicks;
  rejected_clicks := v_rejected_clicks;
  synced_coins := v_synced_coins;
  synced_xp := v_synced_xp;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_click_window(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sync_click_window(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer
) TO service_role;
