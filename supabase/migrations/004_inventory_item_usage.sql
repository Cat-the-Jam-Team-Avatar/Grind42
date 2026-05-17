-- Inventory item usage and cosmetic equip state.

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS is_equipped boolean;

UPDATE public.inventory
SET is_equipped = false
WHERE is_equipped IS NULL;

ALTER TABLE public.inventory
  ALTER COLUMN is_equipped SET DEFAULT false,
  ALTER COLUMN is_equipped SET NOT NULL;

CREATE INDEX IF NOT EXISTS inventory_user_equipped_idx
  ON public.inventory(user_id, is_equipped)
  WHERE is_equipped;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory TO service_role;

CREATE OR REPLACE FUNCTION public.use_market_item(
  p_user_id uuid,
  p_item_id text,
  p_item_category text,
  p_equippable_item_ids text[] DEFAULT ARRAY[]::text[]
)
RETURNS TABLE (
  item_id text,
  item_category text,
  quantity integer,
  consumed boolean,
  equipped boolean
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_inventory_id bigint;
  v_quantity integer;
  v_next_quantity integer;
  v_now timestamptz := now();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'inventory_user_required' USING ERRCODE = '22023';
  END IF;

  IF p_item_id IS NULL OR btrim(p_item_id) = '' THEN
    RAISE EXCEPTION 'inventory_item_required' USING ERRCODE = '22023';
  END IF;

  IF p_item_category IS NULL OR btrim(p_item_category) = '' THEN
    RAISE EXCEPTION 'inventory_category_required' USING ERRCODE = '22023';
  END IF;

  SELECT inventory.id, inventory.quantity
  INTO v_inventory_id, v_quantity
  FROM public.inventory
  WHERE inventory.user_id = p_user_id
    AND inventory.item_id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inventory_item_not_owned' USING ERRCODE = 'P0001';
  END IF;

  IF p_item_category = 'consumable' THEN
    IF v_quantity > 1 THEN
      v_next_quantity := v_quantity - 1;

      UPDATE public.inventory
      SET
        quantity = v_next_quantity,
        updated_at = v_now
      WHERE id = v_inventory_id;
    ELSE
      v_next_quantity := 0;

      DELETE FROM public.inventory
      WHERE id = v_inventory_id;
    END IF;

    RETURN QUERY SELECT
      p_item_id,
      p_item_category,
      v_next_quantity,
      true,
      false;

    RETURN;
  END IF;

  UPDATE public.inventory
  SET
    is_equipped = false,
    updated_at = v_now
  WHERE user_id = p_user_id
    AND inventory.is_equipped
    AND inventory.item_id <> p_item_id
    AND (
      coalesce(array_length(p_equippable_item_ids, 1), 0) = 0
      OR inventory.item_id = ANY(p_equippable_item_ids)
    );

  UPDATE public.inventory
  SET
    is_equipped = true,
    updated_at = v_now
  WHERE id = v_inventory_id;

  RETURN QUERY SELECT
    p_item_id,
    p_item_category,
    v_quantity,
    false,
    true;
END;
$$;

REVOKE ALL ON FUNCTION public.use_market_item(
  uuid,
  text,
  text,
  text[]
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.use_market_item(
  uuid,
  text,
  text,
  text[]
) TO service_role;
