create or replace function private.notify_user(
  target_user_id uuid,
  notification_type text,
  notification_title_en text,
  notification_title_ru text,
  notification_body_en text,
  notification_body_ru text,
  notification_link text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (
    user_id,
    type,
    title_en,
    title_ru,
    body_en,
    body_ru,
    link
  )
  values (
    target_user_id,
    notification_type,
    notification_title_en,
    notification_title_ru,
    notification_body_en,
    notification_body_ru,
    notification_link
  );
$$;

create or replace function public.update_task_status(
  target_task_id uuid,
  new_status public.task_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
  task_student_id uuid;
  student_user_id uuid;
  task_title text;
begin
  select task.student_id, student.user_id, task.title
  into task_student_id, student_user_id, task_title
  from public.application_tasks as task
  join public.students as student on student.id = task.student_id
  where task.id = target_task_id;

  if task_student_id is null or not private.is_unlocked(task_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;
  if actor_role not in ('student', 'admin') then
    raise exception 'This task is read-only' using errcode = '42501';
  end if;

  update public.application_tasks set status = new_status where id = target_task_id;

  if actor_role = 'admin' then
    perform private.notify_user(
      student_user_id,
      'task',
      'Task updated',
      'Задача обновлена',
      task_title,
      task_title,
      '/en/app/student?section=roadmap'
    );
  else
    insert into public.notifications (
      user_id, type, title_en, title_ru, body_en, body_ru, link
    )
    select
      app_user.id,
      'task',
      'Student updated a task',
      'Ученик обновил задачу',
      task_title,
      task_title,
      '/en/app/admin?section=home'
    from public.users as app_user
    where app_user.role = 'admin';
  end if;
end;
$$;

create or replace function public.admin_save_task(
  target_student_id uuid,
  target_task_id uuid,
  target_school_id uuid,
  new_section text,
  new_title text,
  new_description text,
  new_video_youtube_id text,
  new_due_date date,
  new_drive_link text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
  student_user_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select user_id into student_user_id
  from public.students where id = target_student_id;
  if student_user_id is null then
    raise exception 'Student not found' using errcode = 'P0002';
  end if;

  if target_task_id is null then
    insert into public.application_tasks (
      student_id,
      school_id,
      section,
      title,
      description,
      video_youtube_id,
      due_date,
      drive_link
    )
    values (
      target_student_id,
      target_school_id,
      btrim(new_section),
      btrim(new_title),
      nullif(btrim(new_description), ''),
      nullif(btrim(new_video_youtube_id), ''),
      new_due_date,
      nullif(btrim(new_drive_link), '')
    )
    returning id into saved_id;
  else
    update public.application_tasks
    set
      school_id = target_school_id,
      section = btrim(new_section),
      title = btrim(new_title),
      description = nullif(btrim(new_description), ''),
      video_youtube_id = nullif(btrim(new_video_youtube_id), ''),
      due_date = new_due_date,
      drive_link = nullif(btrim(new_drive_link), '')
    where id = target_task_id
      and student_id = target_student_id
    returning id into saved_id;
  end if;

  if saved_id is null then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  perform private.notify_user(
    student_user_id,
    'task',
    'New application task',
    'Новая задача по поступлению',
    btrim(new_title),
    btrim(new_title),
    '/en/app/student?section=roadmap'
  );
  return saved_id;
end;
$$;

create or replace function public.admin_save_document(
  target_student_id uuid,
  target_document_id uuid,
  new_type public.document_type,
  new_title text,
  new_drive_link text,
  new_status public.document_status,
  new_required boolean,
  new_due_date date,
  new_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
  student_user_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select user_id into student_user_id
  from public.students where id = target_student_id;
  if student_user_id is null then
    raise exception 'Student not found' using errcode = 'P0002';
  end if;

  if target_document_id is null then
    insert into public.documents (
      student_id, type, title, drive_link, status, required, due_date, notes
    )
    values (
      target_student_id,
      new_type,
      btrim(new_title),
      nullif(btrim(new_drive_link), ''),
      new_status,
      new_required,
      new_due_date,
      nullif(btrim(new_notes), '')
    )
    returning id into saved_id;
  else
    update public.documents
    set
      type = new_type,
      title = btrim(new_title),
      drive_link = nullif(btrim(new_drive_link), ''),
      status = new_status,
      required = new_required,
      due_date = new_due_date,
      notes = nullif(btrim(new_notes), '')
    where id = target_document_id
      and student_id = target_student_id
    returning id into saved_id;
  end if;

  if saved_id is null then
    raise exception 'Document not found' using errcode = 'P0002';
  end if;

  perform private.notify_user(
    student_user_id,
    'document',
    'Document checklist updated',
    'Список документов обновлён',
    btrim(new_title),
    btrim(new_title),
    '/en/app/student?section=roadmap'
  );
  return saved_id;
end;
$$;

create or replace function public.save_essay(
  target_student_id uuid,
  target_essay_id uuid,
  target_school_id uuid,
  new_title text,
  new_drive_link text,
  new_status public.essay_status,
  new_admin_feedback text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
  saved_id uuid;
  student_user_id uuid;
begin
  if not private.is_unlocked(target_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;
  if actor_role not in ('student', 'admin') then
    raise exception 'Essays are read-only' using errcode = '42501';
  end if;
  if actor_role = 'student'
    and (new_status not in ('draft', 'in_review') or new_admin_feedback is not null)
  then
    raise exception 'Students cannot review essays' using errcode = '42501';
  end if;

  select user_id into student_user_id
  from public.students where id = target_student_id;

  if target_essay_id is null then
    insert into public.essays (
      student_id, school_id, title, drive_link, status, admin_feedback
    )
    values (
      target_student_id,
      target_school_id,
      btrim(new_title),
      nullif(btrim(new_drive_link), ''),
      new_status,
      nullif(btrim(new_admin_feedback), '')
    )
    returning id into saved_id;
  else
    update public.essays
    set
      school_id = target_school_id,
      title = btrim(new_title),
      drive_link = nullif(btrim(new_drive_link), ''),
      status = new_status,
      admin_feedback = nullif(btrim(new_admin_feedback), '')
    where id = target_essay_id
      and student_id = target_student_id
    returning id into saved_id;
  end if;

  if saved_id is null then
    raise exception 'Essay not found' using errcode = 'P0002';
  end if;

  if actor_role = 'admin' then
    perform private.notify_user(
      student_user_id,
      'essay',
      'Essay reviewed',
      'Эссе проверено',
      btrim(new_title),
      btrim(new_title),
      '/en/app/student?section=essays'
    );
  else
    insert into public.notifications (
      user_id, type, title_en, title_ru, body_en, body_ru, link
    )
    select
      app_user.id,
      'essay',
      'Essay ready for review',
      'Эссе готово к проверке',
      btrim(new_title),
      btrim(new_title),
      '/en/app/admin?section=essays'
    from public.users as app_user
    where app_user.role = 'admin';
  end if;

  return saved_id;
end;
$$;

create or replace function public.request_booking(
  target_student_id uuid,
  requested_type public.booking_type,
  booking_calendar_link text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
  booking_id uuid;
begin
  if not private.is_unlocked(target_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;
  if actor_role not in ('student', 'admin') then
    raise exception 'Bookings are read-only' using errcode = '42501';
  end if;
  if booking_calendar_link !~ '^https://' then
    raise exception 'A valid Calendar link is required' using errcode = '22023';
  end if;

  insert into public.bookings (student_id, type, calendar_link)
  values (target_student_id, requested_type, booking_calendar_link)
  returning id into booking_id;

  insert into public.notifications (
    user_id, type, title_en, title_ru, body_en, body_ru, link
  )
  select
    app_user.id,
    'booking',
    'Call requested',
    'Запрошен звонок',
    requested_type::text,
    requested_type::text,
    '/en/app/admin?section=home'
  from public.users as app_user
  where app_user.role = 'admin';

  return booking_id;
end;
$$;

create or replace function public.mark_notification_read(target_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set read = true
  where id = target_notification_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Notification not found' using errcode = 'P0002';
  end if;
end;
$$;

drop policy if exists documents_paid_select on public.documents;
create policy documents_paid_select on public.documents
  for select to authenticated
  using ((select private.can_access_student(student_id, true)));

drop policy if exists messages_paid_select on public.messages;
create policy messages_paid_select on public.messages
  for select to authenticated
  using ((select private.can_access_student(student_id, true)));

revoke execute on function private.notify_user(
  uuid, text, text, text, text, text, text
) from public, anon, authenticated;
revoke execute on function public.update_task_status(uuid, public.task_status) from public, anon;
revoke execute on function public.admin_save_task(
  uuid, uuid, uuid, text, text, text, text, date, text
) from public, anon;
revoke execute on function public.admin_save_document(
  uuid, uuid, public.document_type, text, text, public.document_status, boolean, date, text
) from public, anon;
revoke execute on function public.save_essay(
  uuid, uuid, uuid, text, text, public.essay_status, text
) from public, anon;
revoke execute on function public.request_booking(
  uuid, public.booking_type, text
) from public, anon;
revoke execute on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.update_task_status(uuid, public.task_status) to authenticated;
grant execute on function public.admin_save_task(
  uuid, uuid, uuid, text, text, text, text, date, text
) to authenticated;
grant execute on function public.admin_save_document(
  uuid, uuid, public.document_type, text, text, public.document_status, boolean, date, text
) to authenticated;
grant execute on function public.save_essay(
  uuid, uuid, uuid, text, text, public.essay_status, text
) to authenticated;
grant execute on function public.request_booking(
  uuid, public.booking_type, text
) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
