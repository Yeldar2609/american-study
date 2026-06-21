-- Corrective: 202606220003 recreated handle_new_auth_user from the original and
-- lost the null-role guard added in 202606180006 (read role from user_metadata
-- first; if role is null, return without inserting so the explicit profile
-- upsert handles it). Without the guard, a null role inserts role = NULL and
-- the NOT NULL constraint aborts auth.users insert ("Database error creating
-- new user"). Restore the guard and keep the username/kk additions.

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := coalesce(
    new.raw_user_meta_data ->> 'role',
    new.raw_app_meta_data ->> 'role'
  );
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
  if requested_role is null
    or requested_role not in ('student', 'parent', 'admin')
  then
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
