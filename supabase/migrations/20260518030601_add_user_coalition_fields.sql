alter table public.users
  add column if not exists coalition_id bigint,
  add column if not exists coalition_name text,
  add column if not exists coalition_slug text,
  add column if not exists coalition_color text,
  add column if not exists coalition_image_url text,
  add column if not exists coalition_cover_url text,
  add column if not exists coalition_synced_at timestamptz;

create index if not exists users_coalition_slug_idx
  on public.users(coalition_slug)
  where coalition_slug is not null;

revoke update (
  coalition_id,
  coalition_name,
  coalition_slug,
  coalition_color,
  coalition_image_url,
  coalition_cover_url,
  coalition_synced_at
) on table public.users from anon, authenticated;

grant select, update on table public.users to service_role;
