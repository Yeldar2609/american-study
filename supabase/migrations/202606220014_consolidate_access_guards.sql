-- Cleanup: the read RPCs added across the recent waves each re-inlined the same
-- "admin OR owning student OR linked parent" access check. That predicate already
-- exists as private.can_access_student(uuid, require_paid) (202606130002) and is
-- the project's canonical access boundary (also used by the RLS policies). This
-- recreates the four read RPCs to call it instead of re-deriving it, so the rule
-- lives in one place and cannot drift between surfaces.
--
-- Guard-only change: each function body is otherwise byte-identical to its prior
-- definition (same projection, same ORDER BY, same grants). create-or-replace
-- preserves privileges; the revoke/grant pairs are repeated only to match the
-- codebase convention and are idempotent.
--
-- Deliberately NOT touched (their guards are different predicates, not this one):
--   * compute_match            — intentionally allows a null auth.uid() through
--                                (it runs inside triggers / other definer fns).
--   * set_application_stage     — admin OR owning STUDENT only; parents excluded
--                                (parents are read-only), so it is not can_access_student.
--   * student_save_interview_practice — owning student + paid, a mutation guard.

-- 1) get_student_school_summary (202606220007) — counts for the student home.
create or replace function public.get_student_school_summary(target_student_id uuid)
returns table (
  recommended_count integer,
  saved_count integer,
  shortlist_count integer,
  next_deadline date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_access_student(target_student_id) then
    raise exception 'Student is not accessible' using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (where pick.admin_pick)::integer,
    count(*) filter (where pick.starred)::integer,
    count(*) filter (where pick.student_shortlisted)::integer,
    min(pick.sao_deadline) filter (
      where pick.sao_deadline is not null
        and (pick.admin_pick or pick.starred or pick.student_shortlisted)
    )
  from public.student_school_picks as pick
  where pick.student_id = target_student_id;
end;
$$;

revoke execute on function public.get_student_school_summary(uuid) from public, anon;
grant execute on function public.get_student_school_summary(uuid) to authenticated;

-- 2) get_interview_prep (202606220009) — question bank joined with practice.
create or replace function public.get_interview_prep(target_student_id uuid)
returns table (
  question_id uuid,
  category text,
  question_en text,
  question_ru text,
  tip_en text,
  tip_ru text,
  sample_youtube_id text,
  sort_order integer,
  practice_id uuid,
  response_notes text,
  recording_link text,
  self_rating integer,
  status text,
  admin_feedback text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_access_student(target_student_id) then
    raise exception 'Student is not accessible' using errcode = '42501';
  end if;

  return query
  select
    q.id,
    q.category,
    q.question_en,
    q.question_ru,
    q.tip_en,
    q.tip_ru,
    q.sample_youtube_id,
    q."order",
    p.id,
    p.response_notes,
    p.recording_link,
    p.self_rating,
    p.status::text,
    p.admin_feedback
  from public.interview_questions as q
  left join public.interview_practice as p
    on p.question_id = q.id
    and p.student_id = target_student_id
  order by q.category, q."order", q.id;
end;
$$;

revoke execute on function public.get_interview_prep(uuid) from public, anon;
grant execute on function public.get_interview_prep(uuid) to authenticated;

-- 3) get_application_board (202606220011) — saved/final/admin picks for the board.
create or replace function public.get_application_board(target_student_id uuid)
returns table (
  school_id uuid,
  school_name text,
  state text,
  city text,
  application_stage text,
  application_portal_url text,
  sao_deadline date,
  is_final_7 boolean,
  starred boolean,
  student_shortlisted boolean,
  admin_pick boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_access_student(target_student_id) then
    raise exception 'Student is not accessible' using errcode = '42501';
  end if;

  return query
  select
    school.id,
    school.name,
    school.state,
    school.city,
    pick.application_stage::text,
    pick.application_portal_url,
    pick.sao_deadline,
    coalesce(pick.is_final_7, false),
    coalesce(pick.starred, false),
    coalesce(pick.student_shortlisted, false),
    coalesce(pick.admin_pick, false)
  from public.student_school_picks as pick
  join public.schools as school on school.id = pick.school_id
  where pick.student_id = target_student_id
    and (pick.admin_pick or pick.starred or pick.student_shortlisted or pick.is_final_7)
  order by pick.sao_deadline asc nulls last, school.name;
end;
$$;

revoke execute on function public.get_application_board(uuid) from public, anon;
grant execute on function public.get_application_board(uuid) to authenticated;

-- 4) get_school_catalog (202606220013) — the full catalog. Guard swapped; the
-- ORDER BY 22 (compute_match evaluated once) and the projection are unchanged.
create or replace function public.get_school_catalog(target_student_id uuid)
returns table (
  pick_id uuid,
  school_id uuid,
  school_name text,
  state text,
  city text,
  setting public.school_setting,
  student_body public.school_student_body,
  affiliation text,
  grades text,
  enrollment integer,
  pct_boarding numeric,
  pct_international numeric,
  boarding_tuition_usd integer,
  acceptance_rate_pct numeric,
  avg_ssat_pctile numeric,
  offers_financial_aid boolean,
  niche_grade text,
  niche_profile_url text,
  notes text,
  strengths text[],
  website_url text,
  match_percent integer,
  starred boolean,
  student_shortlisted boolean,
  student_interest_level text,
  student_note text,
  admin_pick boolean,
  is_final_7 boolean,
  match_reason text,
  sao_deadline date,
  status public.school_pick_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_access_student(target_student_id) then
    raise exception 'Student is not accessible' using errcode = '42501';
  end if;

  return query
  select
    pick.id,
    school.id,
    school.name,
    school.state,
    school.city,
    school.setting,
    school.student_body,
    school.affiliation,
    school.grades,
    school.enrollment,
    school.pct_boarding,
    school.pct_international,
    school.boarding_tuition_usd,
    school.acceptance_rate_pct,
    school.avg_ssat_pctile,
    school.offers_financial_aid,
    school.niche_grade,
    school.niche_profile_url,
    school.notes,
    school.strengths,
    school.website_url,
    coalesce(
      pick.match_percent_override,
      pick.match_percent,
      public.compute_match(target_student_id, school.id)
    ),
    coalesce(pick.starred, false),
    coalesce(pick.student_shortlisted, false),
    coalesce(pick.student_interest_level, 'exploring'),
    pick.student_note,
    coalesce(pick.admin_pick, false),
    coalesce(pick.is_final_7, false),
    pick.match_reason,
    pick.sao_deadline,
    coalesce(pick.status, 'researching'::public.school_pick_status)
  from public.schools as school
  left join public.student_school_picks as pick
    on pick.student_id = target_student_id
    and pick.school_id = school.id
  order by 22 desc, school.name;
end;
$$;

revoke execute on function public.get_school_catalog(uuid) from public, anon;
grant execute on function public.get_school_catalog(uuid) to authenticated;
