-- Current-school catalog + searchable picker support.
--
-- Replaces the free-text `students.current_school` with a real, searchable
-- catalog (`public.current_schools`) while preserving backward compatibility:
-- the legacy text column is kept as a display/fallback for schools that are not
-- in the catalog ("Can't find my school"), and a boolean flags students who are
-- not attached to any school ("Independent student").

create table public.current_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 300),
  city text,
  region text,
  country text not null default 'Kazakhstan',
  type text not null default 'school',
  code text,
  active boolean not null default true,
  source text not null default 'seed',
  source_url text check (source_url is null or source_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A school is uniquely identified by name + city (case-insensitive) so repeated
-- seeds/imports upsert instead of duplicating.
create unique index current_schools_natural_key_idx
  on public.current_schools (lower(name), lower(coalesce(city, '')));

create index current_schools_name_idx on public.current_schools (lower(name));
create index current_schools_city_idx on public.current_schools (city);
create index current_schools_region_idx on public.current_schools (region);
create index current_schools_active_idx on public.current_schools (active);
create index current_schools_code_idx on public.current_schools (code);

create trigger current_schools_touch_updated_at
  before update on public.current_schools
  for each row execute function private.touch_updated_at();

-- Link the student to the catalog; keep the legacy text column as a fallback.
alter table public.students
  add column current_school_id uuid references public.current_schools(id) on delete set null,
  add column is_independent_student boolean not null default false;

create index students_current_school_idx
  on public.students (current_school_id);

-- RLS: reference data. Any authenticated user may read *active* rows so the
-- picker works for every role; only admins may see inactive rows or write.
alter table public.current_schools enable row level security;

create policy current_schools_select_active_or_admin
  on public.current_schools
  for select
  to authenticated
  using (active or (select private.is_admin()));

create policy current_schools_admin_insert
  on public.current_schools
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy current_schools_admin_update
  on public.current_schools
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy current_schools_admin_delete
  on public.current_schools
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Curated seed. NOT an official Kazakhstan school registry — these are a
-- starter set so the picker is usable; provenance is tracked as 'curated_seed'
-- (see docs/DATA_SOURCES.md). "Independent student" is represented by the
-- students.is_independent_student flag, not a catalog row.
insert into public.current_schools (name, city, region, country, type, source)
values
  ('American Study', 'Astana', 'Astana', 'Kazakhstan', 'partner', 'curated_seed'),
  ('Demo School', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Nazarbayev Intellectual School of Physics and Mathematics, Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Haileybury Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Miras International School, Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('QSI International School of Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Astana International School', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Nazarbayev Intellectual School of Chemistry and Biology, Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Lyceum No. 60, Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed'),
  ('Gymnasium No. 5, Astana', 'Astana', 'Astana', 'Kazakhstan', 'school', 'curated_seed')
on conflict (lower(name), lower(coalesce(city, ''))) do nothing;

-- Extend the admin profile RPC to persist the catalog link, the legacy text
-- fallback, and the independent-student flag atomically.
create or replace function public.admin_update_student_profile(
  target_student_id uuid,
  profile jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select student.user_id
  into target_user_id
  from public.students as student
  where student.id = target_student_id
  for update;

  if target_user_id is null then
    raise exception 'Student not found' using errcode = 'P0002';
  end if;

  update public.students
  set
    address = profile ->> 'address',
    aid_need_level = nullif(profile ->> 'aid_need_level', '')::public.aid_need_level,
    current_grade = profile ->> 'current_grade',
    current_school = profile ->> 'current_school',
    current_school_id = nullif(profile ->> 'current_school_id', '')::uuid,
    is_independent_student = coalesce((profile ->> 'is_independent_student')::boolean, false),
    diagnostic_summary = profile ->> 'diagnostic_summary',
    dob = nullif(profile ->> 'dob', '')::date,
    drive_folder_url = profile ->> 'drive_folder_url',
    english_level = profile ->> 'english_level',
    interests = coalesce(
      array(select jsonb_array_elements_text(profile -> 'interests')),
      '{}'::text[]
    ),
    parent_email = profile ->> 'parent_email',
    parent_phone = profile ->> 'parent_phone',
    passport_id_drive_url = profile ->> 'passport_id_drive_url',
    phone = profile ->> 'phone',
    pref_setting = nullif(profile ->> 'pref_setting', '')::public.school_setting,
    pref_size = nullif(profile ->> 'pref_size', '')::public.school_size,
    pref_state_or_region = profile ->> 'pref_state_or_region',
    stage = (profile ->> 'stage')::public.student_stage,
    test_scores = coalesce(profile -> 'test_scores', '{}'::jsonb)
  where id = target_student_id;

  update public.users
  set
    email = profile ->> 'email',
    full_name = profile ->> 'full_name',
    language = (profile ->> 'language')::public.user_language
  where id = target_user_id;

  if not found then
    raise exception 'Student user not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_update_student_profile(uuid, jsonb)
  from public, anon;
grant execute on function public.admin_update_student_profile(uuid, jsonb)
  to authenticated;
