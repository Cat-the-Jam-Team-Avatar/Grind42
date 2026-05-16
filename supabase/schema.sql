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
