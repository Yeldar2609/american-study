-- Student self-serve profile (powers onboarding #9 and test-prep tracking #8).
-- Until now every students/picks write was admin-only. This adds a NARROW,
-- guarded self-edit surface: a student may update only their own preferences,
-- interests, English level, and test targets/dates -- never package_state,
-- stage, diagnostic_summary, or identity. Direct table writes stay admin-only
-- via RLS; students go through these SECURITY DEFINER RPCs (auth.uid()-scoped).

alter table public.students
  add column if not exists test_targets jsonb not null default '{}'::jsonb;
alter table public.students
  add column if not exists test_dates jsonb not null default '{}'::jsonb;
alter table public.students
  add column if not exists onboarded_at timestamptz;

-- Read the owning student's editable profile (+ onboarding flag) for the wizard
-- and the self-edit card. Returns no rows for non-students.
create or replace function public.get_student_self()
returns table (
  full_name text,
  english_level text,
  interests text[],
  pref_setting text,
  pref_size text,
  pref_state_or_region text,
  test_targets jsonb,
  test_dates jsonb,
  package_state text,
  stage text,
  onboarded boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select
    coalesce(u.full_name, ''),
    s.english_level,
    s.interests,
    s.pref_setting::text,
    s.pref_size::text,
    s.pref_state_or_region,
    s.test_targets,
    s.test_dates,
    s.package_state::text,
    s.stage::text,
    s.onboarded_at is not null
  from public.students as s
  join public.users as u on u.id = s.user_id
  where s.user_id = (select auth.uid());
end;
$$;

-- Update only the safe self-editable subset for the owning student.
create or replace function public.student_update_self(
  new_english_level text,
  new_interests text[],
  new_pref_setting public.school_setting,
  new_pref_size public.school_size,
  new_pref_state_or_region text,
  new_test_targets jsonb,
  new_test_dates jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  own_student_id uuid;
begin
  select s.id
  into own_student_id
  from public.students as s
  where s.user_id = (select auth.uid());

  if own_student_id is null then
    raise exception 'No student profile for this account' using errcode = '42501';
  end if;

  update public.students
  set
    english_level = nullif(btrim(coalesce(new_english_level, '')), ''),
    interests = coalesce(new_interests, '{}'),
    pref_setting = new_pref_setting,
    pref_size = new_pref_size,
    pref_state_or_region = nullif(btrim(coalesce(new_pref_state_or_region, '')), ''),
    test_targets = coalesce(new_test_targets, '{}'::jsonb),
    test_dates = coalesce(new_test_dates, '{}'::jsonb)
  where id = own_student_id;
end;
$$;

-- Mark the onboarding wizard complete for the owning student.
create or replace function public.student_complete_onboarding()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.students
  set onboarded_at = coalesce(onboarded_at, now())
  where user_id = (select auth.uid());
end;
$$;

revoke execute on function public.get_student_self() from public, anon;
grant execute on function public.get_student_self() to authenticated;
revoke execute on function public.student_update_self(
  text, text[], public.school_setting, public.school_size, text, jsonb, jsonb
) from public, anon;
grant execute on function public.student_update_self(
  text, text[], public.school_setting, public.school_size, text, jsonb, jsonb
) to authenticated;
revoke execute on function public.student_complete_onboarding() from public, anon;
grant execute on function public.student_complete_onboarding() to authenticated;
