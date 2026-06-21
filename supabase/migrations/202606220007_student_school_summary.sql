-- Speed up the student home page. StudentSchoolsSummary only needs pick COUNTS
-- (recommended / saved / shortlisted) plus the next deadline, but it loaded the
-- full get_school_catalog, which runs public.compute_match for every school the
-- student has no saved pick for (~70 calls, 2 SELECTs each) on every home load.
-- This set-based aggregate over student_school_picks answers the summary in one
-- query with zero match computation. Same authorization as get_school_catalog.

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
  if not exists (
    select 1
    from public.students as s
    where s.id = target_student_id
      and (
        private.is_admin()
        or s.user_id = (select auth.uid())
        or exists (
          select 1
          from public.parents_students as link
          where link.student_id = s.id
            and link.parent_user_id = (select auth.uid())
        )
      )
  ) then
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
