-- Fix student-facing school catalog + add bulk task assignment.
--
-- Bug: public.compute_match raised 'Only admins may compute compatibility
-- scores' for ANY authenticated non-admin. get_school_catalog calls it for every
-- school a student has no saved pick for (the whole catalog, post self-serve), so
-- a student's catalog load aborted and the list came back empty. The same guard
-- fires inside the student_school_picks compute-match trigger, so it also blocked
-- students from saving schools to their own list. Relax the guard to authorize
-- the SAME viewers get_school_catalog already allows: admin, the owning student,
-- or a linked parent of the target student. A null auth.uid() (server/trigger
-- context with no JWT) stays allowed exactly as before.
--
-- Feature: admin_bulk_create_task lets an admin push one task to many students at
-- once (all students, or a chosen subset), mirroring admin_save_task's insert +
-- notification per student. Signature is new; grants are set explicitly below.

create or replace function public.compute_match(
  target_student_id uuid,
  target_school_id uuid
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  student_record public.students%rowtype;
  school_record public.schools%rowtype;
  english_proficiency numeric;
  school_english_target numeric;
  english_fit numeric;
  student_ssat_percentile numeric;
  school_academic_target numeric;
  academic_fit numeric;
  interest_overlap integer;
  interest_denominator integer;
  interests_fit numeric;
  aid_fit numeric;
  preference_points numeric := 0;
  preference_count integer := 0;
  preference_fit numeric;
  derived_size public.school_size;
begin
  -- Authorize the caller for THIS student: admin, the owning student, or a
  -- linked parent. A null auth.uid() (trigger / server context) is allowed.
  if (select auth.uid()) is not null
    and not private.is_admin()
    and not exists (
      select 1
      from public.students as s
      where s.id = target_student_id
        and (
          s.user_id = (select auth.uid())
          or exists (
            select 1
            from public.parents_students as link
            where link.student_id = s.id
              and link.parent_user_id = (select auth.uid())
          )
        )
    )
  then
    raise exception 'Not authorized to compute compatibility scores'
      using errcode = '42501';
  end if;

  select *
  into strict student_record
  from public.students
  where id = target_student_id;

  select *
  into strict school_record
  from public.schools
  where id = target_school_id;

  -- English: normalize the strongest available language signal to 0-100.
  english_proficiency := greatest(
    coalesce((student_record.test_scores ->> 'toefl')::numeric / 120 * 100, 0),
    coalesce((student_record.test_scores ->> 'det')::numeric / 160 * 100, 0),
    case lower(coalesce(student_record.english_level, ''))
      when 'a1' then 20
      when 'beginner' then 20
      when 'a2' then 35
      when 'elementary' then 35
      when 'b1' then 50
      when 'pre-intermediate' then 50
      when 'intermediate' then 60
      when 'b2' then 70
      when 'upper-intermediate' then 70
      when 'c1' then 85
      when 'advanced' then 85
      when 'c2' then 100
      else 50
    end
  );
  -- More international enrollment modestly lowers the inferred language barrier.
  school_english_target := 85 - coalesce(school_record.pct_international, 20) * 0.35;
  english_fit := greatest(
    0,
    least(100, 100 - abs(english_proficiency - school_english_target))
  );

  -- Academic: SSAT is treated as percentile when <=100, otherwise normalized
  -- from the published 1320-2400 total-score range.
  student_ssat_percentile := case
    when not student_record.test_scores ? 'ssat' then 50
    when (student_record.test_scores ->> 'ssat')::numeric <= 100
      then (student_record.test_scores ->> 'ssat')::numeric
    else greatest(
      1,
      least(
        99,
        (
          ((student_record.test_scores ->> 'ssat')::numeric - 1320)
          / (2400 - 1320)
        ) * 98 + 1
      )
    )
  end;
  -- Published average SSAT is preferred; inverse acceptance rate is fallback.
  school_academic_target := coalesce(
    school_record.avg_ssat_pctile,
    100 - school_record.acceptance_rate_pct,
    50
  );
  academic_fit := greatest(
    0,
    least(100, 100 - abs(student_ssat_percentile - school_academic_target))
  );

  -- Interests: neutral when either side has no data, otherwise overlap is
  -- measured against the larger list so broad lists do not inflate the score.
  select count(distinct lower(student_interest))
  into interest_overlap
  from unnest(student_record.interests) as student_interest
  join unnest(school_record.strengths) as school_strength
    on lower(student_interest) = lower(school_strength);

  interest_denominator := greatest(
    cardinality(student_record.interests),
    cardinality(school_record.strengths)
  );
  interests_fit := case
    when interest_denominator = 0 then 50
    else 40 + 60 * interest_overlap::numeric / interest_denominator
  end;

  -- Aid: high-need students require an aid-positive school; lower need is less
  -- sensitive, while unknown school aid data stays deliberately neutral.
  aid_fit := case
    when school_record.offers_financial_aid is null then 50
    when student_record.aid_need_level = 'high'
      then case when school_record.offers_financial_aid then 100 else 0 end
    when student_record.aid_need_level = 'medium'
      then case when school_record.offers_financial_aid then 100 else 35 end
    when student_record.aid_need_level = 'low'
      then case when school_record.offers_financial_aid then 90 else 100 end
    else 50
  end;

  -- Preferences: average only the preferences an admin has actually set.
  if student_record.pref_setting is not null then
    preference_count := preference_count + 1;
    preference_points := preference_points
      + case when student_record.pref_setting = school_record.setting then 100 else 0 end;
  end if;

  if student_record.pref_size is not null then
    preference_count := preference_count + 1;
    derived_size := case
      when school_record.enrollment is null then null
      when school_record.enrollment < 300 then 'small'::public.school_size
      when school_record.enrollment < 700 then 'medium'::public.school_size
      else 'large'::public.school_size
    end;
    preference_points := preference_points
      + case
          when derived_size is null then 50
          when student_record.pref_size = derived_size then 100
          else 0
        end;
  end if;

  if nullif(btrim(student_record.pref_state_or_region), '') is not null then
    preference_count := preference_count + 1;
    preference_points := preference_points
      + case
          when lower(student_record.pref_state_or_region)
            in (lower(coalesce(school_record.state, '')), lower(coalesce(school_record.city, '')))
          then 100
          else 0
        end;
  end if;

  preference_fit := case
    when preference_count = 0 then 50
    else preference_points / preference_count
  end;

  return round(
    (
      english_fit
      + academic_fit
      + interests_fit
      + aid_fit
      + preference_fit
    ) / 5
  )::integer;
end;
$$;

-- Bulk task assignment: admin pushes one task to many students at once. Empty
-- array is a no-op. Mirrors admin_save_task's insert + per-student notification.
create or replace function public.admin_bulk_create_task(
  target_student_ids uuid[],
  new_section text,
  new_title text,
  new_description text,
  new_video_youtube_id text,
  new_due_date date,
  new_drive_link text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  student_user_id uuid;
  created_count integer := 0;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if btrim(coalesce(new_title, '')) = '' then
    raise exception 'A task title is required' using errcode = '22023';
  end if;

  if btrim(coalesce(new_section, '')) = '' then
    raise exception 'A task section is required' using errcode = '22023';
  end if;

  foreach target_id in array coalesce(target_student_ids, array[]::uuid[])
  loop
    select user_id into student_user_id
    from public.students where id = target_id;
    if student_user_id is null then
      continue;
    end if;

    insert into public.application_tasks (
      student_id,
      section,
      title,
      description,
      video_youtube_id,
      due_date,
      drive_link
    )
    values (
      target_id,
      btrim(new_section),
      btrim(new_title),
      nullif(btrim(coalesce(new_description, '')), ''),
      nullif(btrim(coalesce(new_video_youtube_id, '')), ''),
      new_due_date,
      nullif(btrim(coalesce(new_drive_link, '')), '')
    );

    perform private.notify_user(
      student_user_id,
      'task',
      'New application task',
      'Новая задача по поступлению',
      btrim(new_title),
      btrim(new_title),
      '/en/app/student?section=roadmap'
    );

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

revoke execute on function public.admin_bulk_create_task(uuid[], text, text, text, text, date, text)
  from public, anon;
grant execute on function public.admin_bulk_create_task(uuid[], text, text, text, text, date, text)
  to authenticated;
