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
  coalition_id    bigint,
  coalition_name  text,
  coalition_slug  text,
  coalition_color text,
  coalition_image_url text,
  coalition_cover_url text,
  coalition_synced_at timestamptz,
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
  click_window_count integer not null default 0,
  click_window_started_at timestamptz,
  click_window_expires_at timestamptz,
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
  add column if not exists coalition_id bigint,
  add column if not exists coalition_name text,
  add column if not exists coalition_slug text,
  add column if not exists coalition_color text,
  add column if not exists coalition_image_url text,
  add column if not exists coalition_cover_url text,
  add column if not exists coalition_synced_at timestamptz,
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
  add column if not exists last_logtime_synced_at timestamptz,
  add column if not exists click_window_count integer not null default 0,
  add column if not exists click_window_started_at timestamptz,
  add column if not exists click_window_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_click_window_count_range'
      and conrelid = 'public.users'::regclass
  ) then
    alter table users
      add constraint users_click_window_count_range
      check (click_window_count >= 0 and click_window_count <= 1000);
  end if;
end;
$$;

create unique index if not exists users_forty_two_id_key
  on users(forty_two_id)
  where forty_two_id is not null;

create index if not exists users_coalition_slug_idx
  on users(coalition_slug)
  where coalition_slug is not null;

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

revoke update (
  click_window_count,
  click_window_started_at,
  click_window_expires_at
) on table users from anon, authenticated;

revoke update (
  coalition_id,
  coalition_name,
  coalition_slug,
  coalition_color,
  coalition_image_url,
  coalition_cover_url,
  coalition_synced_at
) on table users from anon, authenticated;

grant select on table inventory to authenticated;
grant select on table market_purchases to authenticated;
grant select, insert, update, delete on table inventory to service_role;
grant select, insert on table market_purchases to service_role;
grant select, update on table users to service_role;
grant usage, select on sequence inventory_id_seq to service_role;
grant usage, select on sequence market_purchases_id_seq to service_role;

-- ─── Click Window Column Guard ──────────────────────────────────────────────
create or replace function prevent_client_click_window_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_role in ('anon', 'authenticated')
    and (
      new.click_window_count is distinct from old.click_window_count
      or new.click_window_started_at is distinct from old.click_window_started_at
      or new.click_window_expires_at is distinct from old.click_window_expires_at
    ) then
    raise exception 'click_window_server_only' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_click_window_columns on users;
create trigger protect_click_window_columns
  before update of
    click_window_count,
    click_window_started_at,
    click_window_expires_at
  on users
  for each row
  execute function prevent_client_click_window_update();

revoke all on function prevent_client_click_window_update()
  from public, anon, authenticated;

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

-- ─── Atomic Click Window Sync ───────────────────────────────────────────────
create or replace function sync_click_window(
  p_user_id uuid,
  p_coins integer default 0,
  p_xp integer default 0,
  p_clicks integer default 0,
  p_window_max integer default 1000,
  p_window_hours integer default 4
)
returns table (
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
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_max integer := least(greatest(coalesce(p_window_max, 1000), 1), 1000);
  v_window_hours integer := least(greatest(coalesce(p_window_hours, 4), 1), 24);
  v_requested_clicks integer := greatest(coalesce(p_clicks, 0), 0);
  v_safe_clicks integer;
  v_safe_coins integer := greatest(coalesce(p_coins, 0), 0);
  v_safe_xp integer := greatest(coalesce(p_xp, 0), 0);
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
begin
  if p_user_id is null then
    raise exception 'click_window_user_required' using errcode = '22023';
  end if;

  select
    users.balance,
    users.total_coins,
    users.weekly_coins,
    users.total_clicks,
    users.xp,
    users.click_window_count,
    users.click_window_started_at,
    users.click_window_expires_at
  into
    v_balance,
    v_total_coins,
    v_weekly_coins,
    v_total_clicks,
    v_xp,
    v_click_window_count,
    v_click_window_started_at,
    v_click_window_expires_at
  from users
  where users.id = p_user_id
  for update;

  if not found then
    raise exception 'click_window_user_not_found' using errcode = 'P0002';
  end if;

  if v_click_window_expires_at is not null
    and v_click_window_expires_at <= v_now then
    v_click_window_count := 0;
    v_click_window_started_at := null;
    v_click_window_expires_at := null;
  end if;

  v_safe_clicks := least(v_requested_clicks, v_window_max);
  v_remaining_clicks := greatest(v_window_max - coalesce(v_click_window_count, 0), 0);
  v_accepted_clicks := least(v_safe_clicks, v_remaining_clicks);
  v_rejected_clicks := greatest(v_requested_clicks - v_accepted_clicks, 0);

  if v_accepted_clicks > 0 and coalesce(v_click_window_count, 0) = 0 then
    v_click_window_started_at := v_now;
    v_click_window_expires_at := v_now + make_interval(hours => v_window_hours);
  end if;

  if v_requested_clicks = 0 then
    v_synced_coins := 0;
    v_synced_xp := 0;
  elsif v_accepted_clicks = 0 then
    v_synced_coins := 0;
    v_synced_xp := 0;
  elsif v_accepted_clicks < v_requested_clicks then
    v_synced_coins := round((v_safe_coins::numeric * v_accepted_clicks) / v_requested_clicks)::integer;
    v_synced_xp := round((v_safe_xp::numeric * v_accepted_clicks) / v_requested_clicks)::integer;
  else
    v_synced_coins := v_safe_coins;
    v_synced_xp := v_safe_xp;
  end if;

  v_click_window_count := least(
    v_window_max,
    coalesce(v_click_window_count, 0) + v_accepted_clicks
  );

  update users as target
  set
    balance = coalesce(v_balance, 0) + v_synced_coins,
    total_coins = coalesce(v_total_coins, 0) + v_synced_coins,
    weekly_coins = coalesce(v_weekly_coins, 0) + v_synced_coins,
    total_clicks = coalesce(v_total_clicks, 0) + v_accepted_clicks,
    xp = coalesce(v_xp, 0) + v_synced_xp,
    click_window_count = v_click_window_count,
    click_window_started_at = v_click_window_started_at,
    click_window_expires_at = v_click_window_expires_at
  where target.id = p_user_id
  returning
    target.balance,
    target.total_coins,
    target.weekly_coins,
    target.total_clicks,
    target.xp,
    target.click_window_count,
    target.click_window_started_at,
    target.click_window_expires_at
  into
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

  return next;
end;
$$;

revoke all on function sync_click_window(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function sync_click_window(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer
) to service_role;

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
