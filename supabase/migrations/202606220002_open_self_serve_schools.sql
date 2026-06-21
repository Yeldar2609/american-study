-- Open self-serve schools + make created students reliably visible.
--
-- Product change: students (trial and paid) may now browse, search, and add ANY
-- school to their own list (previously trial students saw only consultant picks).
-- Bug fix: the admin recipient picker is fed by get_dashboard_students, which
-- inner-joined public.users; a created student missing/with-blank profile was
-- invisible and could not be assigned to. LEFT JOIN + coalesce surfaces them.
--
-- Signatures are unchanged, so create-or-replace preserves existing grants.

-- 1. Save eligibility — any student may save schools to THEIR OWN list. Paid/admin
-- keep full access via is_unlocked; the owner branch no longer requires admin_pick.
create or replace function private.can_student_save(
  target_student_id uuid,
  target_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_unlocked(target_student_id)
    or exists (
      select 1
      from public.students as s
      where s.id = target_student_id
        and s.user_id = (select auth.uid())
    );
$$;

-- 2. Catalog payload — return the full school catalog to every accessible viewer
-- (access is already authorized above). Dropped the package_state/admin_pick
-- filter so trial students can discover and search all schools.
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
  order by
    coalesce(
      pick.match_percent_override,
      pick.match_percent,
      public.compute_match(target_student_id, school.id)
    ) desc,
    school.name;
end;
$$;

-- 3. Dashboard students — LEFT JOIN public.users so a created student whose
-- profile row is missing/blank is still visible to the admin (and thus
-- assignable) instead of silently vanishing.
create or replace function public.get_dashboard_students()
returns table (
  student_id uuid,
  student_name text,
  package_state public.package_state,
  stage public.student_stage,
  diagnostic_summary text,
  total_tasks bigint,
  completed_tasks bigint,
  overdue_tasks bigint,
  next_task_title text,
  next_task_due_date date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
begin
  if actor_role is null then
    raise exception 'A provisioned authenticated user is required'
      using errcode = '42501';
  end if;

  return query
  select
    student.id,
    coalesce(profile.full_name, '(unnamed)'),
    student.package_state,
    student.stage,
    student.diagnostic_summary,
    count(task.id),
    count(task.id) filter (where task.status = 'approved'),
    count(task.id) filter (
      where task.due_date < current_date
        and task.status <> 'approved'
    ),
    next_task.title,
    next_task.due_date
  from public.students as student
  left join public.users as profile on profile.id = student.user_id
  left join public.application_tasks as task
    on task.student_id = student.id
    and (actor_role = 'admin' or student.package_state = 'paid')
  left join lateral (
    select candidate.title, candidate.due_date
    from public.application_tasks as candidate
    where candidate.student_id = student.id
      and candidate.status <> 'approved'
      and (actor_role = 'admin' or student.package_state = 'paid')
    order by candidate.due_date asc nulls last, candidate.created_at, candidate.id
    limit 1
  ) as next_task on true
  where actor_role = 'admin'
    or student.user_id = (select auth.uid())
    or (
      actor_role = 'parent'
      and exists (
        select 1
        from public.parents_students as link
        where link.student_id = student.id
          and link.parent_user_id = (select auth.uid())
      )
    )
  group by
    student.id,
    profile.full_name,
    student.package_state,
    student.stage,
    student.diagnostic_summary,
    next_task.title,
    next_task.due_date
  order by student.created_at, student.id;
end;
$$;
