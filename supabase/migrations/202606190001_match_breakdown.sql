-- A4: per-factor match breakdown.
-- public.compute_match averages five sub-scores but only returns the rounded
-- mean that lands in student_school_picks.match_percent. This RPC exposes the
-- five sub-scores plus the overall, gated to unlocked viewers (paid student /
-- linked parent / admin) via private.is_unlocked. The arithmetic is copied
-- verbatim from public.compute_match so `overall` is identical to the persisted
-- match_percent; supabase/tests/003_match_breakdown.test.sql pins that equality.

create or replace function public.get_match_breakdown(
  target_student_id uuid,
  target_school_id uuid
)
returns table (
  english_fit integer,
  academic_fit integer,
  interests_fit integer,
  aid_fit integer,
  preference_fit integer,
  overall integer
)
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
  v_english_fit numeric;
  student_ssat_percentile numeric;
  school_academic_target numeric;
  v_academic_fit numeric;
  interest_overlap integer;
  interest_denominator integer;
  v_interests_fit numeric;
  v_aid_fit numeric;
  preference_points numeric := 0;
  preference_count integer := 0;
  v_preference_fit numeric;
  derived_size public.school_size;
begin
  if not private.is_unlocked(target_student_id) then
    raise exception 'Score breakdown is available to unlocked students only'
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
  school_english_target := 85 - coalesce(school_record.pct_international, 20) * 0.35;
  v_english_fit := greatest(
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
  school_academic_target := coalesce(
    school_record.avg_ssat_pctile,
    100 - school_record.acceptance_rate_pct,
    50
  );
  v_academic_fit := greatest(
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
  v_interests_fit := case
    when interest_denominator = 0 then 50
    else 40 + 60 * interest_overlap::numeric / interest_denominator
  end;

  -- Aid: high-need students require an aid-positive school; lower need is less
  -- sensitive, while unknown school aid data stays deliberately neutral.
  v_aid_fit := case
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

  v_preference_fit := case
    when preference_count = 0 then 50
    else preference_points / preference_count
  end;

  return query select
    round(v_english_fit)::integer,
    round(v_academic_fit)::integer,
    round(v_interests_fit)::integer,
    round(v_aid_fit)::integer,
    round(v_preference_fit)::integer,
    round(
      (
        v_english_fit
        + v_academic_fit
        + v_interests_fit
        + v_aid_fit
        + v_preference_fit
      ) / 5
    )::integer;
end;
$$;

revoke execute on function public.get_match_breakdown(uuid, uuid) from public, anon;
grant execute on function public.get_match_breakdown(uuid, uuid) to authenticated;
