-- Username-based identity. Login is now username + password; the email column
-- holds a synthetic, never-delivered internal address derived from the username.
-- (Existing accounts are wiped + an admin re-bootstrapped out of band via the
-- GoTrue admin API, so this migration only needs to make the schema/trigger
-- username-aware and stay self-consistent on any pre-wipe data.)

-- 1. Username column (nullable for backfill).
alter table public.users add column username extensions.citext;

-- 2. Backfill from the email local-part, deduped deterministically so the unique
-- constraint holds even if two addresses share a local-part.
with ranked as (
  select
    id,
    lower(split_part(email::text, '@', 1)) as base,
    row_number() over (
      partition by lower(split_part(email::text, '@', 1))
      order by created_at, id
    ) as rn
  from public.users
)
update public.users as u
set username = case when r.rn = 1 then r.base else r.base || r.rn::text end
from ranked as r
where r.id = u.id;

-- 3. Enforce going forward.
alter table public.users
  alter column username set not null,
  add constraint users_username_key unique (username),
  add constraint users_username_format
    check (username ~ '^[A-Za-z0-9._-]+$' and char_length(username::text) <= 64);

-- 4. Provisioning trigger must persist username (NOT NULL now). Username comes
-- from user_metadata, falling back to the email local-part. Also accept kk.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_app_meta_data ->> 'role';
  requested_language text := coalesce(
    new.raw_user_meta_data ->> 'language',
    new.raw_app_meta_data ->> 'language',
    'en'
  );
  requested_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );
  requested_username text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  );
begin
  if requested_role not in ('student', 'parent', 'admin') then
    return new;
  end if;

  if requested_language not in ('en', 'ru', 'kk') then
    requested_language := 'en';
  end if;

  insert into public.users (id, email, username, full_name, role, language)
  values (
    new.id,
    new.email,
    requested_username,
    requested_name,
    requested_role::public.user_role,
    requested_language::public.user_language
  )
  on conflict (id) do update
    set email = excluded.email,
        username = excluded.username,
        full_name = excluded.full_name;

  return new;
end;
$$;

-- 5. Username is now a login identity — protect it like email/role (only
-- admins or the service role may change it).
create or replace function private.protect_user_security_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() or (select auth.role()) = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.username is distinct from old.username
    or new.role is distinct from old.role
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only admins may change user security fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
