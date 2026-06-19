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
    profile.full_name,
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
  join public.users as profile on profile.id = student.user_id
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

revoke execute on function public.get_dashboard_students() from public, anon;
grant execute on function public.get_dashboard_students() to authenticated;
