create or replace function public.get_student_comments(target_student_id uuid)
returns table (
  id uuid,
  author_name text,
  body text,
  attachment_link text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_unlocked(target_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;

  return query
  select message.id, app_user.full_name, message.body, message.attachment_link, message.created_at
  from public.messages as message
  join public.users as app_user on app_user.id = message.author_user_id
  where message.student_id = target_student_id
    and message.thread_type = 'general'
  order by message.created_at desc;
end;
$$;

create or replace function public.post_student_comment(
  target_student_id uuid,
  comment_body text,
  comment_attachment_link text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
  message_id uuid;
  student_user_id uuid;
begin
  if not private.is_unlocked(target_student_id) then
    raise exception 'This feature requires paid student access' using errcode = '42501';
  end if;
  if actor_role not in ('student', 'parent', 'admin') then
    raise exception 'A provisioned user is required' using errcode = '42501';
  end if;
  if length(btrim(comment_body)) = 0 then
    raise exception 'Comment cannot be empty' using errcode = '22023';
  end if;

  insert into public.messages (
    thread_type,
    student_id,
    author_user_id,
    body,
    attachment_link
  )
  values (
    'general',
    target_student_id,
    (select auth.uid()),
    btrim(comment_body),
    nullif(btrim(comment_attachment_link), '')
  )
  returning id into message_id;

  select user_id into student_user_id from public.students where id = target_student_id;
  if student_user_id <> (select auth.uid()) then
    perform private.notify_user(
      student_user_id,
      'comment',
      'New application comment',
      'Новый комментарий по поступлению',
      btrim(comment_body),
      btrim(comment_body),
      '/en/app/student?section=roadmap'
    );
  end if;

  insert into public.notifications (
    user_id, type, title_en, title_ru, body_en, body_ru, link
  )
  select
    app_user.id,
    'comment',
    'New student comment',
    'Новый комментарий ученика',
    btrim(comment_body),
    btrim(comment_body),
    '/en/app/admin?section=roadmap&student=' || target_student_id::text
  from public.users as app_user
  where app_user.role = 'admin'
    and app_user.id <> (select auth.uid());

  return message_id;
end;
$$;

create or replace function public.get_admin_applications()
returns table (
  student_name text,
  school_name text,
  status public.school_pick_status,
  sao_deadline date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select app_user.full_name, school.name, pick.status, pick.sao_deadline
  from public.student_school_picks as pick
  join public.students as student on student.id = pick.student_id
  join public.users as app_user on app_user.id = student.user_id
  join public.schools as school on school.id = pick.school_id
  where pick.status in ('applied', 'submitted')
  order by pick.sao_deadline nulls last, app_user.full_name, school.name;
end;
$$;

revoke execute on function public.get_student_comments(uuid) from public, anon;
revoke execute on function public.post_student_comment(uuid, text, text) from public, anon;
revoke execute on function public.get_admin_applications() from public, anon;
grant execute on function public.get_student_comments(uuid) to authenticated;
grant execute on function public.post_student_comment(uuid, text, text) to authenticated;
grant execute on function public.get_admin_applications() to authenticated;
