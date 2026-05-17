-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists users (
  id              uuid primary key references auth.users(id) on delete cascade,
  intra_login     text unique not null,
  forty_two_id    bigint unique,
  display_name    text,
  profile_image_url text,
  profile_url     text,
  forty_two_profile jsonb,
  forty_two_profile_updated_at timestamptz,
  campus_id       bigint,
  campus_name     text,
  campus_time_zone text,
  correction_point integer,
  cursus_grade    text,
  cursus_id       bigint,
  cursus_level    numeric,
  cursus_name     text,
  intra_location  text,
  is_active       boolean,
  is_alumni       boolean,
  is_staff        boolean,
  kind            text,
  pool_month      text,
  pool_year       text,
  wallet          integer,
  last_logtime_date date,
  last_logtime_hours numeric,
  last_logtime_seconds integer,
  last_logtime_synced_at timestamptz,
  balance         integer not null default 0,
  weekly_coins    integer not null default 0,
  total_coins     integer not null default 0,
  current_streak  integer not null default 0,
  claimed_today   boolean not null default false,
  last_claim_date date,
  streak_started_at date,
  total_clicks    integer not null default 0,
  xp              integer not null default 0,
  pc_level        integer not null default 0,
  streak_frozen_until date,
  streak_milestone_reached integer not null default 0,
  first_purchase_done boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table users
  add column if not exists forty_two_id bigint,
  add column if not exists display_name text,
  add column if not exists profile_image_url text,
  add column if not exists profile_url text,
  add column if not exists forty_two_profile jsonb,
  add column if not exists forty_two_profile_updated_at timestamptz,
  add column if not exists campus_id bigint,
  add column if not exists campus_name text,
  add column if not exists campus_time_zone text,
  add column if not exists correction_point integer,
  add column if not exists cursus_grade text,
  add column if not exists cursus_id bigint,
  add column if not exists cursus_level numeric,
  add column if not exists cursus_name text,
  add column if not exists intra_location text,
  add column if not exists is_active boolean,
  add column if not exists is_alumni boolean,
  add column if not exists is_staff boolean,
  add column if not exists kind text,
  add column if not exists pool_month text,
  add column if not exists pool_year text,
  add column if not exists wallet integer,
  add column if not exists last_logtime_date date,
  add column if not exists last_logtime_hours numeric,
  add column if not exists last_logtime_seconds integer,
  add column if not exists last_logtime_synced_at timestamptz;

create unique index if not exists users_forty_two_id_key
  on users(forty_two_id)
  where forty_two_id is not null;

-- ─── Inventory ───────────────────────────────────────────────────────────────
create table if not exists inventory (
  id                bigserial primary key,
  user_id           uuid not null references users(id) on delete cascade,
  item_id           text not null,
  quantity          integer not null default 1 check (quantity > 0),
  is_equipped       boolean not null default false,
  acquired_at       timestamptz not null default now(),
  first_acquired_at timestamptz not null default now(),
  last_acquired_at  timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists inventory_user_id_idx on inventory(user_id);
create unique index if not exists inventory_user_item_key
  on inventory(user_id, item_id);
create index if not exists inventory_user_equipped_idx
  on inventory(user_id, is_equipped)
  where is_equipped;

-- ─── Market Purchases ────────────────────────────────────────────────────────
create table if not exists market_purchases (
  id             bigserial primary key,
  user_id        uuid not null references users(id) on delete cascade,
  item_id        text not null,
  item_name      text not null,
  item_category  text not null,
  item_snapshot  jsonb not null default '{}'::jsonb,
  price_paid     integer not null check (price_paid >= 0),
  quantity_delta integer not null default 1 check (quantity_delta > 0),
  balance_before integer not null,
  balance_after  integer not null,
  xp_awarded     integer not null default 0,
  purchased_at   timestamptz not null default now()
);

create index if not exists market_purchases_user_id_purchased_at_idx
  on market_purchases(user_id, purchased_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table users enable row level security;
alter table inventory enable row level security;
alter table market_purchases enable row level security;

create policy "Users can read own row"
  on users for select using (auth.uid() = id);

create policy "Users can insert own row"
  on users for insert with check (auth.uid() = id);

create policy "Users can update own row"
  on users for update using (auth.uid() = id);

create policy "Users can read own inventory"
  on inventory for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read own market purchases"
  on market_purchases for select to authenticated using ((select auth.uid()) = user_id);

grant select on table inventory to authenticated;
grant select on table market_purchases to authenticated;
grant select, insert, update, delete on table inventory to service_role;
grant select, insert on table market_purchases to service_role;
grant select, update on table users to service_role;
grant usage, select on sequence inventory_id_seq to service_role;
grant usage, select on sequence market_purchases_id_seq to service_role;

-- ─── Weekly Reset Function (call via cron / pg_cron) ─────────────────────────
create or replace function reset_weekly()
returns void language plpgsql as $$
begin
  update users set
    weekly_coins   = 0,
    claimed_today  = false;
end;
$$;

-- ─── Daily Reset of claimed_today (call every midnight) ──────────────────────
create or replace function reset_daily_claim()
returns void language plpgsql as $$
begin
  update users set claimed_today = false;
end;
$$;

-- ─── Atomic Market Purchase ─────────────────────────────────────────────────
create or replace function purchase_market_item(
  p_user_id uuid,
  p_item_id text,
  p_item_name text,
  p_item_category text,
  p_item_price integer,
  p_item_snapshot jsonb,
  p_base_xp_reward integer default 0,
  p_first_purchase_xp integer default 0,
  p_quantity_delta integer default 1
)
returns table (
  balance_before integer,
  balance_after integer,
  xp_awarded integer,
  first_purchase_awarded boolean,
  quantity integer,
  purchase_id bigint
)
language plpgsql
set search_path = public
as $$
declare
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
begin
  if p_user_id is null then
    raise exception 'market_user_required' using errcode = '22023';
  end if;

  if p_item_id is null or btrim(p_item_id) = '' then
    raise exception 'market_item_required' using errcode = '22023';
  end if;

  if p_item_category is null or btrim(p_item_category) = '' then
    raise exception 'market_category_required' using errcode = '22023';
  end if;

  if p_item_price is null or p_item_price < 0 then
    raise exception 'market_invalid_price' using errcode = '22023';
  end if;

  if p_quantity_delta is null or p_quantity_delta <= 0 then
    raise exception 'market_invalid_quantity' using errcode = '22023';
  end if;

  select balance, xp, first_purchase_done
  into v_balance_before, v_current_xp, v_first_purchase_done
  from users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'market_user_not_found' using errcode = 'P0002';
  end if;

  if v_balance_before < p_item_price then
    raise exception 'market_insufficient_balance' using errcode = 'P0001';
  end if;

  if p_item_category <> 'consumable' then
    select inventory.quantity
    into v_existing_quantity
    from inventory
    where user_id = p_user_id
      and item_id = p_item_id;

    if found then
      raise exception 'market_item_already_owned' using errcode = 'P0001';
    end if;
  end if;

  v_first_purchase_awarded := not coalesce(v_first_purchase_done, false);
  v_xp_awarded := greatest(coalesce(p_base_xp_reward, 0), 0);

  if v_first_purchase_awarded then
    v_xp_awarded := v_xp_awarded + greatest(coalesce(p_first_purchase_xp, 0), 0);
  end if;

  v_balance_after := v_balance_before - p_item_price;

  update users
  set
    balance = v_balance_after,
    xp = coalesce(v_current_xp, 0) + v_xp_awarded,
    first_purchase_done = true
  where id = p_user_id;

  insert into inventory (
    user_id,
    item_id,
    quantity,
    acquired_at,
    first_acquired_at,
    last_acquired_at,
    updated_at
  )
  values (
    p_user_id,
    p_item_id,
    p_quantity_delta,
    v_now,
    v_now,
    v_now,
    v_now
  )
  on conflict (user_id, item_id)
  do update set
    quantity = inventory.quantity + excluded.quantity,
    last_acquired_at = excluded.last_acquired_at,
    updated_at = excluded.updated_at
  returning inventory.quantity into v_quantity;

  insert into market_purchases (
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
  values (
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
  returning id into v_purchase_id;

  return query select
    v_balance_before,
    v_balance_after,
    v_xp_awarded,
    v_first_purchase_awarded,
    v_quantity,
    v_purchase_id;
end;
$$;

revoke all on function purchase_market_item(
  uuid,
  text,
  text,
  text,
  integer,
  jsonb,
  integer,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function purchase_market_item(
  uuid,
  text,
  text,
  text,
  integer,
  jsonb,
  integer,
  integer,
  integer
) to service_role;

-- ─── Inventory Item Usage ───────────────────────────────────────────────────
create or replace function use_market_item(
  p_user_id uuid,
  p_item_id text,
  p_item_category text,
  p_equippable_item_ids text[] default array[]::text[]
)
returns table (
  item_id text,
  item_category text,
  quantity integer,
  consumed boolean,
  equipped boolean
)
language plpgsql
set search_path = public
as $$
declare
  v_inventory_id bigint;
  v_quantity integer;
  v_next_quantity integer;
  v_now timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'inventory_user_required' using errcode = '22023';
  end if;

  if p_item_id is null or btrim(p_item_id) = '' then
    raise exception 'inventory_item_required' using errcode = '22023';
  end if;

  if p_item_category is null or btrim(p_item_category) = '' then
    raise exception 'inventory_category_required' using errcode = '22023';
  end if;

  select inventory.id, inventory.quantity
  into v_inventory_id, v_quantity
  from inventory
  where inventory.user_id = p_user_id
    and inventory.item_id = p_item_id
  for update;

  if not found then
    raise exception 'inventory_item_not_owned' using errcode = 'P0001';
  end if;

  if p_item_category = 'consumable' then
    if v_quantity > 1 then
      v_next_quantity := v_quantity - 1;

      update inventory
      set
        quantity = v_next_quantity,
        updated_at = v_now
      where id = v_inventory_id;
    else
      v_next_quantity := 0;

      delete from inventory
      where id = v_inventory_id;
    end if;

    return query select
      p_item_id,
      p_item_category,
      v_next_quantity,
      true,
      false;

    return;
  end if;

  update inventory
  set
    is_equipped = false,
    updated_at = v_now
  where inventory.user_id = p_user_id
    and inventory.is_equipped
    and inventory.item_id <> p_item_id
    and (
      coalesce(array_length(p_equippable_item_ids, 1), 0) = 0
      or inventory.item_id = any(p_equippable_item_ids)
    );

  update inventory
  set
    is_equipped = true,
    updated_at = v_now
  where id = v_inventory_id;

  return query select
    p_item_id,
    p_item_category,
    v_quantity,
    false,
    true;
end;
$$;

revoke all on function use_market_item(
  uuid,
  text,
  text,
  text[]
) from public, anon, authenticated;

grant execute on function use_market_item(
  uuid,
  text,
  text,
  text[]
) to service_role;
