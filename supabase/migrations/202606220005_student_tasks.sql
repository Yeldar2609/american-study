-- Let paid students manage their OWN application tasks from the calendar
-- (add / edit / delete any of their own tasks; status still flows through
-- update_task_status). student_id is derived from auth.uid(), never supplied by
-- the client. RLS keeps direct writes admin-only; these SECURITY DEFINER RPCs
-- are the student path, gated on private.is_unlocked (paid).

create or replace function public.student_save_task(
  target_task_id uuid,
  new_title text,
  new_section text,
  new_description text,
  new_due_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  own_student_id uuid;
  result_id uuid;
begin
  select s.id
  into own_student_id
  from public.students as s
  where s.user_id = (select auth.uid());

  if own_student_id is null or not private.is_unlocked(own_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;

  if btrim(coalesce(new_title, '')) = '' then
    raise exception 'A task title is required' using errcode = '22023';
  end if;

  if target_task_id is null then
    insert into public.application_tasks (student_id, section, title, description, due_date)
    values (
      own_student_id,
      coalesce(nullif(btrim(new_section), ''), 'My tasks'),
      btrim(new_title),
      nullif(btrim(coalesce(new_description, '')), ''),
      new_due_date
    )
    returning id into result_id;
  else
    update public.application_tasks
    set
      section = coalesce(nullif(btrim(new_section), ''), section),
      title = btrim(new_title),
      description = nullif(btrim(coalesce(new_description, '')), ''),
      due_date = new_due_date
    where id = target_task_id
      and student_id = own_student_id
    returning id into result_id;

    if result_id is null then
      raise exception 'Task not found' using errcode = 'P0002';
    end if;
  end if;

  return result_id;
end;
$$;

create or replace function public.student_delete_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  own_student_id uuid;
  deleted_id uuid;
begin
  select s.id
  into own_student_id
  from public.students as s
  where s.user_id = (select auth.uid());

  if own_student_id is null or not private.is_unlocked(own_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;

  delete from public.application_tasks
  where id = target_task_id
    and student_id = own_student_id
  returning id into deleted_id;

  if deleted_id is null then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.student_save_task(uuid, text, text, text, date) from public, anon;
grant execute on function public.student_save_task(uuid, text, text, text, date) to authenticated;
revoke execute on function public.student_delete_task(uuid) from public, anon;
grant execute on function public.student_delete_task(uuid) to authenticated;
