create or replace function public.get_admin_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return (
    with student_rollup as (
      select
        count(*)::integer as total_students,
        count(*) filter (where student.package_state = 'trial')::integer
          as trial_students,
        count(*) filter (where student.package_state = 'paid')::integer
          as paid_students,
        count(*) filter (where student.stage = 'diagnostic')::integer
          as diagnostic_students,
        count(*) filter (where student.stage = 'trial')::integer
          as trial_stage_students,
        count(*) filter (where student.stage = 'list_building')::integer
          as list_building_students,
        count(*) filter (where student.stage = 'finalized')::integer
          as finalized_students,
        count(*) filter (where student.stage = 'application')::integer
          as application_students,
        count(*) filter (where student.stage = 'submitted')::integer
          as submitted_students
      from public.students as student
    ),
    activation_rollup as (
      select count(*)::integer as activated_students
      from public.students as student
      where student.stage in ('list_building', 'finalized', 'application', 'submitted')
        or exists (
          select 1
          from public.student_school_picks as pick
          where pick.student_id = student.id
            and pick.admin_pick
        )
    ),
    at_risk_students as (
      select task.student_id
      from public.application_tasks as task
      where task.due_date between current_date and current_date + 14
        and task.status <> 'approved'
      union
      select document.student_id
      from public.documents as document
      where document.required
        and document.due_date between current_date and current_date + 14
        and document.status <> 'verified'
    ),
    risk_rollup as (
      select count(*)::integer as at_risk_count
      from at_risk_students
    ),
    latest_activity as (
      select distinct on (activity.student_id)
        activity.student_id,
        activity.action,
        activity.created_at
      from public.activity_log as activity
      order by activity.student_id, activity.created_at desc, activity.id desc
    ),
    recent_activity as (
      select
        student.id as student_id,
        app_user.full_name as student_name,
        student.package_state,
        student.stage,
        activity.action as last_action,
        activity.created_at as last_active_at
      from latest_activity as activity
      join public.students as student on student.id = activity.student_id
      join public.users as app_user on app_user.id = student.user_id
      order by activity.created_at desc, student.id
      limit 8
    ),
    recent_rollup as (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'student_id', recent.student_id,
            'student_name', recent.student_name,
            'package_state', recent.package_state,
            'stage', recent.stage,
            'last_action', recent.last_action,
            'last_active_at', recent.last_active_at
          )
          order by recent.last_active_at desc, recent.student_id
        ),
        '[]'::jsonb
      ) as recent_students
      from recent_activity as recent
    )
    select jsonb_build_object(
      'total_students', student_rollup.total_students,
      'trial_students', student_rollup.trial_students,
      'paid_students', student_rollup.paid_students,
      'conversion_percent',
        case
          when student_rollup.total_students = 0 then 0
          else round(
            student_rollup.paid_students * 100.0 / student_rollup.total_students
          )::integer
        end,
      'activated_students', activation_rollup.activated_students,
      'at_risk_count', risk_rollup.at_risk_count,
      'stage_counts', jsonb_build_object(
        'diagnostic', student_rollup.diagnostic_students,
        'trial', student_rollup.trial_stage_students,
        'list_building', student_rollup.list_building_students,
        'finalized', student_rollup.finalized_students,
        'application', student_rollup.application_students,
        'submitted', student_rollup.submitted_students
      ),
      'recent_students', recent_rollup.recent_students
    )
    from student_rollup
    cross join activation_rollup
    cross join risk_rollup
    cross join recent_rollup
  );
end;
$$;

revoke execute on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;
