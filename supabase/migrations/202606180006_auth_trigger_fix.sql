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
begin
  if requested_role is null
    or requested_role not in ('student', 'parent', 'admin')
  then
    return new;
  end if;

  if requested_language not in ('en', 'ru') then
    requested_language := 'en';
  end if;

  insert into public.users (id, email, full_name, role, language)
  values (
    new.id,
    new.email,
    requested_name,
    requested_role::public.user_role,
    requested_language::public.user_language
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  return new;
end;
$$;
