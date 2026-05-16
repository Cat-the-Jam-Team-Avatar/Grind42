-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists users (
  id              uuid primary key references auth.users(id) on delete cascade,
  intra_login     text unique not null,
  forty_two_id    bigint unique,
  forty_two_profile jsonb,
  forty_two_profile_updated_at timestamptz,
  balance         integer not null default 0,
  weekly_coins    integer not null default 0,
  total_coins     integer not null default 0,
  current_streak  integer not null default 0,
  claimed_today   boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table users
  add column if not exists forty_two_id bigint,
  add column if not exists forty_two_profile jsonb,
  add column if not exists forty_two_profile_updated_at timestamptz;

create unique index if not exists users_forty_two_id_key
  on users(forty_two_id)
  where forty_two_id is not null;

-- ─── Inventory ───────────────────────────────────────────────────────────────
create table if not exists inventory (
  id          bigserial primary key,
  user_id     uuid not null references users(id) on delete cascade,
  item_id     text not null,
  acquired_at timestamptz not null default now()
);

create index if not exists inventory_user_id_idx on inventory(user_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table users enable row level security;
alter table inventory enable row level security;

create policy "Users can read own row"
  on users for select using (auth.uid() = id);

create policy "Users can insert own row"
  on users for insert with check (auth.uid() = id);

create policy "Users can update own row"
  on users for update using (auth.uid() = id);

create policy "Users can read own inventory"
  on inventory for select using (auth.uid() = user_id);

-- ─── Weekly Reset Function (call via cron / pg_cron) ─────────────────────────
create or replace function reset_weekly()
returns void language plpgsql as $$
begin
  update users set
    weekly_coins   = 0,
    current_streak = 0,
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
