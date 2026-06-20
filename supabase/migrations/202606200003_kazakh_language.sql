-- Add Kazakh (kk) as a supported UI language.
--
-- Policy (enforced in the app layer): students are English-only with no
-- switcher; parents may choose Russian / English / Kazakh; admins may choose
-- any. The database simply needs to accept 'kk' as a valid user_language.

alter type public.user_language add value if not exists 'kk';

-- Re-declare the auth-user trigger so newly provisioned accounts may carry the
-- 'kk' language. (Definition does not use the new enum value as a literal, so it
-- is safe to ship in the same migration that adds the value.)
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

  if requested_language not in ('en', 'ru', 'kk') then
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
