-- Perf: stop computing the match twice per school in get_school_catalog.
-- compute_match is STABLE (not folded), and it appeared in BOTH the SELECT
-- projection and the ORDER BY coalesce, so a catalog load for a student with no
-- saved picks ran it ~2x per school (~140 calls / ~280 row reads for 70 schools).
-- Order by the already-projected match column (ordinal 22) so it is evaluated
-- once per row. Result is byte-identical; only the duplicate evaluation is gone.
-- Also mark compute_match parallel-safe so the catalog scan may parallelize.

alter function public.compute_match(uuid, uuid) parallel safe;

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
declare
  student public.students%rowtype;
begin
  select candidate.*
  into student
  from public.students as candidate
  where candidate.id = target_student_id
    and (
      private.is_admin()
      or candidate.user_id = (select auth.uid())
      or exists (
        select 1
        from public.parents_students as link
        where link.student_id = candidate.id
          and link.parent_user_id = (select auth.uid())
      )
    );

  if not found then
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
