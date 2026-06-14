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
