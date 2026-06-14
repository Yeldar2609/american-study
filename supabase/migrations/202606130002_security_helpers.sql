create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select u.role
  from public.users as u
  where u.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false);
$$;

create or replace function private.can_access_student(
  target_student_id uuid,
  require_paid boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or exists (
      select 1
      from public.students as s
      where s.id = target_student_id
        and (not require_paid or s.package_state = 'paid')
        and (
          s.user_id = (select auth.uid())
          or exists (
            select 1
            from public.parents_students as ps
            where ps.student_id = s.id
              and ps.parent_user_id = (select auth.uid())
          )
        )
    );
$$;

create or replace function private.has_paid_student_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or exists (
      select 1
      from public.students as s
      where s.package_state = 'paid'
        and (
          s.user_id = (select auth.uid())
          or exists (
            select 1
            from public.parents_students as ps
            where ps.student_id = s.id
              and ps.parent_user_id = (select auth.uid())
          )
        )
    );
$$;

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
begin
  if requested_role not in ('student', 'parent', 'admin') then
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

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
    or new.role is distinct from old.role
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only admins may change user security fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger protect_user_security_fields
  before update on public.users
  for each row execute function private.protect_user_security_fields();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger essays_touch_updated_at
  before update on public.essays
  for each row execute function private.touch_updated_at();
