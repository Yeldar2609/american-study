-- Custom admin-authored notifications / reminders. The admin composes a one-off
-- message and sends it to all students or a chosen subset; it lands in each
-- student's existing notifications panel via private.notify_user. Students are
-- English-only, so the single composed title/body is stored in both the _en and
-- _ru notification columns (the table requires both non-null).

create or replace function public.admin_broadcast_notification(
  target_student_ids uuid[],
  new_title text,
  new_body text,
  new_link text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  student_user_id uuid;
  sent_count integer := 0;
  safe_link text;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if btrim(coalesce(new_title, '')) = '' or btrim(coalesce(new_body, '')) = '' then
    raise exception 'A title and message are required' using errcode = '22023';
  end if;

  -- notifications.link must be an internal path (starts with '/'); drop anything else.
  safe_link := nullif(btrim(coalesce(new_link, '')), '');
  if safe_link is not null and left(safe_link, 1) <> '/' then
    safe_link := null;
  end if;

  foreach target_id in array coalesce(target_student_ids, array[]::uuid[])
  loop
    select user_id into student_user_id
    from public.students where id = target_id;
    if student_user_id is null then
      continue;
    end if;

    perform private.notify_user(
      student_user_id,
      'announcement',
      btrim(new_title),
      btrim(new_title),
      btrim(new_body),
      btrim(new_body),
      safe_link
    );

    sent_count := sent_count + 1;
  end loop;

  return sent_count;
end;
$$;

revoke execute on function public.admin_broadcast_notification(uuid[], text, text, text)
  from public, anon;
grant execute on function public.admin_broadcast_notification(uuid[], text, text, text)
  to authenticated;
