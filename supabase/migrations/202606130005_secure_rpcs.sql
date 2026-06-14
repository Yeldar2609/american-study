create or replace function public.get_my_diagnostic_summary()
returns table (
  student_id uuid,
  diagnostic_summary text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if private.current_user_role() is null then
    raise exception 'A provisioned authenticated user is required'
      using errcode = '42501';
  end if;

  return query
  select s.id, s.diagnostic_summary
  from public.students as s
  where private.is_admin()
    or s.user_id = (select auth.uid())
    or exists (
      select 1
      from public.parents_students as ps
      where ps.student_id = s.id
        and ps.parent_user_id = (select auth.uid())
    )
  order by s.created_at, s.id;
end;
$$;

create or replace function public.get_my_matched_schools()
returns table (
  pick_id uuid,
  student_id uuid,
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
  strengths text[],
  website_url text,
  niche_profile_url text,
  match_percent integer,
  match_percent_override integer,
  effective_match_percent integer,
  starred boolean,
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
  if private.current_user_role() is null then
    raise exception 'A provisioned authenticated user is required'
      using errcode = '42501';
  end if;

  return query
  select
    pick.id,
    pick.student_id,
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
    school.strengths,
    school.website_url,
    school.niche_profile_url,
    pick.match_percent,
    pick.match_percent_override,
    coalesce(pick.match_percent_override, pick.match_percent),
    pick.starred,
    pick.admin_pick,
    pick.is_final_7,
    pick.match_reason,
    pick.sao_deadline,
    pick.status
  from public.student_school_picks as pick
  join public.students as student on student.id = pick.student_id
  join public.schools as school on school.id = pick.school_id
  where (
      private.is_admin()
      or student.user_id = (select auth.uid())
      or exists (
        select 1
        from public.parents_students as ps
        where ps.student_id = student.id
          and ps.parent_user_id = (select auth.uid())
      )
    )
    and (
      private.is_admin()
      or student.package_state = 'paid'
      or pick.admin_pick
    )
  order by student.created_at, coalesce(pick.match_percent_override, pick.match_percent) desc;
end;
$$;

create or replace function public.set_school_pick_starred(
  target_pick_id uuid,
  new_starred boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
  affected_rows integer;
begin
  if actor_role = 'parent' then
    raise exception 'Parents have read-only access'
      using errcode = '42501';
  end if;

  if actor_role not in ('student', 'admin') then
    raise exception 'A provisioned student or admin is required'
      using errcode = '42501';
  end if;

  update public.student_school_picks as pick
  set starred = new_starred
  from public.students as student
  where pick.id = target_pick_id
    and student.id = pick.student_id
    and (
      actor_role = 'admin'
      or (
        student.user_id = (select auth.uid())
        and (student.package_state = 'paid' or pick.admin_pick)
      )
    );

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'School pick is not accessible'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_set_user_role(
  target_user_id uuid,
  new_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  update public.users
  set role = new_role
  where id = target_user_id;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role::text),
    true
  ),
  updated_at = now()
  where id = target_user_id;
end;
$$;

create or replace function public.admin_set_student_package_state(
  target_student_id uuid,
  new_package_state public.package_state
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  update public.students
  set package_state = new_package_state
  where id = target_student_id;

  if not found then
    raise exception 'Student not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.admin_import_schools(import_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  imported_count integer;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if jsonb_typeof(import_rows) <> 'array' then
    raise exception 'School import payload must be a JSON array'
      using errcode = '22023';
  end if;

  insert into public.schools (
    name,
    state,
    city,
    setting,
    student_body,
    affiliation,
    grades,
    enrollment,
    pct_boarding,
    pct_international,
    boarding_tuition_usd,
    acceptance_rate_pct,
    avg_ssat_pctile,
    offers_financial_aid,
    niche_grade,
    strengths,
    website_url,
    niche_profile_url,
    notes
  )
  select
    row.name,
    row.state,
    row.city,
    row.setting,
    row.student_body,
    row.affiliation,
    row.grades,
    row.enrollment,
    row.pct_boarding,
    row.pct_international,
    row.boarding_tuition_usd,
    row.acceptance_rate_pct,
    row.avg_ssat_pctile,
    row.offers_financial_aid,
    row.niche_grade,
    coalesce(row.strengths, '{}'),
    row.website_url,
    row.niche_profile_url,
    row.notes
  from jsonb_to_recordset(import_rows) as row (
    name text,
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
    strengths text[],
    website_url text,
    niche_profile_url text,
    notes text
  )
  on conflict (
    lower(name),
    lower(coalesce(state, '')),
    lower(coalesce(city, ''))
  )
  do update set
    setting = excluded.setting,
    student_body = excluded.student_body,
    affiliation = excluded.affiliation,
    grades = excluded.grades,
    enrollment = excluded.enrollment,
    pct_boarding = excluded.pct_boarding,
    pct_international = excluded.pct_international,
    boarding_tuition_usd = excluded.boarding_tuition_usd,
    acceptance_rate_pct = excluded.acceptance_rate_pct,
    avg_ssat_pctile = excluded.avg_ssat_pctile,
    offers_financial_aid = excluded.offers_financial_aid,
    niche_grade = excluded.niche_grade,
    strengths = excluded.strengths,
    website_url = excluded.website_url,
    niche_profile_url = excluded.niche_profile_url,
    notes = excluded.notes;

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;
