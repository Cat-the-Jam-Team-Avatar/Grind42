-- Market inventory summary, purchase history, and atomic purchases.

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS quantity integer,
  ADD COLUMN IF NOT EXISTS first_acquired_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_acquired_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.inventory
SET
  quantity = greatest(coalesce(quantity, 1), 1),
  first_acquired_at = coalesce(first_acquired_at, acquired_at, now()),
  last_acquired_at = coalesce(last_acquired_at, acquired_at, now()),
  updated_at = coalesce(updated_at, acquired_at, now())
WHERE
  quantity IS NULL
  OR first_acquired_at IS NULL
  OR last_acquired_at IS NULL
  OR updated_at IS NULL;

WITH ranked_inventory AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, item_id
      ORDER BY coalesce(first_acquired_at, acquired_at, now()), id
    ) AS row_rank,
    sum(greatest(coalesce(quantity, 1), 1)) OVER (
      PARTITION BY user_id, item_id
    ) AS total_quantity,
    min(coalesce(first_acquired_at, acquired_at, now())) OVER (
      PARTITION BY user_id, item_id
    ) AS first_seen_at,
    max(coalesce(last_acquired_at, acquired_at, now())) OVER (
      PARTITION BY user_id, item_id
    ) AS last_seen_at
  FROM public.inventory
)
UPDATE public.inventory AS inventory
SET
  quantity = ranked_inventory.total_quantity,
  first_acquired_at = ranked_inventory.first_seen_at,
  last_acquired_at = ranked_inventory.last_seen_at,
  updated_at = now()
FROM ranked_inventory
WHERE inventory.id = ranked_inventory.id
  AND ranked_inventory.row_rank = 1;

WITH ranked_inventory AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, item_id
      ORDER BY coalesce(first_acquired_at, acquired_at, now()), id
    ) AS row_rank
  FROM public.inventory
)
DELETE FROM public.inventory
USING ranked_inventory
WHERE inventory.id = ranked_inventory.id
  AND ranked_inventory.row_rank > 1;

ALTER TABLE public.inventory
  ALTER COLUMN quantity SET DEFAULT 1,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN first_acquired_at SET DEFAULT now(),
  ALTER COLUMN first_acquired_at SET NOT NULL,
  ALTER COLUMN last_acquired_at SET DEFAULT now(),
  ALTER COLUMN last_acquired_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_quantity_positive'
      AND conrelid = 'public.inventory'::regclass
  ) THEN
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_quantity_positive CHECK (quantity > 0);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_user_item_key
  ON public.inventory(user_id, item_id);

CREATE TABLE IF NOT EXISTS public.market_purchases (
  id             bigserial PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id        text NOT NULL,
  item_name      text NOT NULL,
  item_category  text NOT NULL,
  item_snapshot  jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_paid     integer NOT NULL CHECK (price_paid >= 0),
  quantity_delta integer NOT NULL DEFAULT 1 CHECK (quantity_delta > 0),
  balance_before integer NOT NULL,
  balance_after  integer NOT NULL,
  xp_awarded     integer NOT NULL DEFAULT 0,
  purchased_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_purchases_user_id_purchased_at_idx
  ON public.market_purchases(user_id, purchased_at DESC);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory;
CREATE POLICY "Users can read own inventory"
  ON public.inventory
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own market purchases" ON public.market_purchases;
CREATE POLICY "Users can read own market purchases"
  ON public.market_purchases
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.market_purchases FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.inventory FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.market_purchases FROM anon, authenticated;

GRANT SELECT ON TABLE public.inventory TO authenticated;
GRANT SELECT ON TABLE public.market_purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.inventory TO service_role;
GRANT SELECT, INSERT ON TABLE public.market_purchases TO service_role;
GRANT SELECT, UPDATE ON TABLE public.users TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.market_purchases_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.purchase_market_item(
  p_user_id uuid,
  p_item_id text,
  p_item_name text,
  p_item_category text,
  p_item_price integer,
  p_item_snapshot jsonb,
  p_base_xp_reward integer DEFAULT 0,
  p_first_purchase_xp integer DEFAULT 0,
  p_quantity_delta integer DEFAULT 1
)
RETURNS TABLE (
  balance_before integer,
  balance_after integer,
  xp_awarded integer,
  first_purchase_awarded boolean,
  quantity integer,
  purchase_id bigint
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_balance_before integer;
  v_balance_after integer;
  v_current_xp integer;
  v_first_purchase_done boolean;
  v_existing_quantity integer;
  v_xp_awarded integer;
  v_first_purchase_awarded boolean;
  v_quantity integer;
  v_purchase_id bigint;
  v_now timestamptz := now();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'market_user_required' USING ERRCODE = '22023';
  END IF;

  IF p_item_id IS NULL OR btrim(p_item_id) = '' THEN
    RAISE EXCEPTION 'market_item_required' USING ERRCODE = '22023';
  END IF;

  IF p_item_category IS NULL OR btrim(p_item_category) = '' THEN
    RAISE EXCEPTION 'market_category_required' USING ERRCODE = '22023';
  END IF;

  IF p_item_price IS NULL OR p_item_price < 0 THEN
    RAISE EXCEPTION 'market_invalid_price' USING ERRCODE = '22023';
  END IF;

  IF p_quantity_delta IS NULL OR p_quantity_delta <= 0 THEN
    RAISE EXCEPTION 'market_invalid_quantity' USING ERRCODE = '22023';
  END IF;

  SELECT balance, xp, first_purchase_done
  INTO v_balance_before, v_current_xp, v_first_purchase_done
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'market_user_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_balance_before < p_item_price THEN
    RAISE EXCEPTION 'market_insufficient_balance' USING ERRCODE = 'P0001';
  END IF;

  IF p_item_category <> 'consumable' THEN
    SELECT inventory.quantity
    INTO v_existing_quantity
    FROM public.inventory
    WHERE user_id = p_user_id
      AND item_id = p_item_id;

    IF FOUND THEN
      RAISE EXCEPTION 'market_item_already_owned' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_first_purchase_awarded := NOT coalesce(v_first_purchase_done, false);
  v_xp_awarded := greatest(coalesce(p_base_xp_reward, 0), 0);

  IF v_first_purchase_awarded THEN
    v_xp_awarded := v_xp_awarded + greatest(coalesce(p_first_purchase_xp, 0), 0);
  END IF;

  v_balance_after := v_balance_before - p_item_price;

  UPDATE public.users
  SET
    balance = v_balance_after,
    xp = coalesce(v_current_xp, 0) + v_xp_awarded,
    first_purchase_done = true
  WHERE id = p_user_id;

  INSERT INTO public.inventory (
    user_id,
    item_id,
    quantity,
    acquired_at,
    first_acquired_at,
    last_acquired_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_item_id,
    p_quantity_delta,
    v_now,
    v_now,
    v_now,
    v_now
  )
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET
    quantity = public.inventory.quantity + EXCLUDED.quantity,
    last_acquired_at = EXCLUDED.last_acquired_at,
    updated_at = EXCLUDED.updated_at
  RETURNING public.inventory.quantity INTO v_quantity;

  INSERT INTO public.market_purchases (
    user_id,
    item_id,
    item_name,
    item_category,
    item_snapshot,
    price_paid,
    quantity_delta,
    balance_before,
    balance_after,
    xp_awarded,
    purchased_at
  )
  VALUES (
    p_user_id,
    p_item_id,
    p_item_name,
    p_item_category,
    coalesce(p_item_snapshot, '{}'::jsonb),
    p_item_price,
    p_quantity_delta,
    v_balance_before,
    v_balance_after,
    v_xp_awarded,
    v_now
  )
  RETURNING id INTO v_purchase_id;

  RETURN QUERY SELECT
    v_balance_before,
    v_balance_after,
    v_xp_awarded,
    v_first_purchase_awarded,
    v_quantity,
    v_purchase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_market_item(
  uuid,
  text,
  text,
  text,
  integer,
  jsonb,
  integer,
  integer,
  integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.purchase_market_item(
  uuid,
  text,
  text,
  text,
  integer,
  jsonb,
  integer,
  integer,
  integer
) TO service_role;
