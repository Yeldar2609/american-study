create or replace function private.is_unlocked(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.students as student
    where student.id = target_student_id
      and (
        private.is_admin()
        or (
          student.package_state = 'paid'
          and (
            student.user_id = (select auth.uid())
            or exists (
              select 1
              from public.parents_students as link
              where link.student_id = student.id
                and link.parent_user_id = (select auth.uid())
            )
          )
        )
      )
  );
$$;

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
  boarding_tuition_usd integer,
  offers_financial_aid boolean,
  niche_grade text,
  strengths text[],
  website_url text,
  match_percent integer,
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
    school.boarding_tuition_usd,
    school.offers_financial_aid,
    school.niche_grade,
    school.strengths,
    school.website_url,
    coalesce(
      pick.match_percent_override,
      pick.match_percent,
      public.compute_match(target_student_id, school.id)
    ),
    coalesce(pick.starred, false),
    coalesce(pick.admin_pick, false),
    coalesce(pick.is_final_7, false),
    pick.match_reason,
    pick.sao_deadline,
    coalesce(pick.status, 'researching'::public.school_pick_status)
  from public.schools as school
  left join public.student_school_picks as pick
    on pick.student_id = target_student_id
    and pick.school_id = school.id
  where private.is_admin()
    or student.package_state = 'paid'
    or pick.admin_pick
  order by
    coalesce(
      pick.match_percent_override,
      pick.match_percent,
      public.compute_match(target_student_id, school.id)
    ) desc,
    school.name;
end;
$$;

create or replace function public.set_school_star(
  target_student_id uuid,
  target_school_id uuid,
  new_starred boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
begin
  if actor_role = 'parent' then
    raise exception 'Parents have read-only access' using errcode = '42501';
  end if;

  if actor_role not in ('student', 'admin') then
    raise exception 'A provisioned student or admin is required' using errcode = '42501';
  end if;

  if not private.is_unlocked(target_student_id) then
    raise exception 'This feature requires a paid package' using errcode = '42501';
  end if;

  insert into public.student_school_picks (
    student_id,
    school_id,
    match_percent,
    starred
  )
  values (
    target_student_id,
    target_school_id,
    public.compute_match(target_student_id, target_school_id),
    new_starred
  )
  on conflict (student_id, school_id)
  do update set starred = excluded.starred;
end;
$$;

revoke execute on function private.is_unlocked(uuid) from public, anon, authenticated;
revoke execute on function public.get_school_catalog(uuid) from public, anon;
revoke execute on function public.set_school_star(uuid, uuid, boolean) from public, anon;
grant execute on function public.get_school_catalog(uuid) to authenticated;
grant execute on function public.set_school_star(uuid, uuid, boolean) to authenticated;
