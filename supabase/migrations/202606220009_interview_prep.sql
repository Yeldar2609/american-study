-- Interview preparation. Reuses interview_questions (the question bank) and
-- interview_practice (per-student responses), which existed in the schema but
-- were never surfaced. Adds a consultant feedback column, seeds a starter bank
-- (fixed ids => re-running is a no-op), and exposes three guarded RPCs. Direct
-- table access stays admin-only via existing RLS; students go through the
-- SECURITY DEFINER RPCs below.

alter table public.interview_practice
  add column if not exists admin_feedback text;

insert into public.interview_questions
  (id, category, question_en, question_ru, tip_en, tip_ru, "order")
values
  (
    '00000000-0000-4000-8000-000000000001', 'About you',
    'Tell us about yourself.', 'Расскажите о себе.',
    'Lead with two or three qualities, each backed by a brief example.',
    'Назовите две-три черты и подкрепите каждую коротким примером.', 1
  ),
  (
    '00000000-0000-4000-8000-000000000002', 'About you',
    'What are your biggest strengths, and one thing you are working to improve?',
    'В чём ваши сильные стороны и что вы стараетесь улучшить?',
    'Pick a real, honest weakness and show the steps you are taking.',
    'Назовите настоящую слабость и покажите, что вы делаете для роста.', 2
  ),
  (
    '00000000-0000-4000-8000-000000000003', 'Academics',
    'Which subject excites you most, and why?',
    'Какой предмет вам интереснее всего и почему?',
    'Name a specific topic, project, or moment that hooked you.',
    'Назовите конкретную тему, проект или момент, который вас увлёк.', 1
  ),
  (
    '00000000-0000-4000-8000-000000000004', 'Academics',
    'How do you handle a subject you find difficult?',
    'Как вы справляетесь с трудным для вас предметом?',
    'Show one concrete strategy and the result it produced.',
    'Покажите конкретную стратегию и результат, к которому она привела.', 2
  ),
  (
    '00000000-0000-4000-8000-000000000005', 'Activities',
    'Tell us about an activity that matters to you.',
    'Расскажите о занятии, которое для вас важно.',
    'Focus on your role and impact, not just the activity itself.',
    'Сделайте акцент на своей роли и вкладе, а не только на самом занятии.', 1
  ),
  (
    '00000000-0000-4000-8000-000000000006', 'Why this school',
    'Why do you want to attend our school?',
    'Почему вы хотите учиться в нашей школе?',
    'Name two specific programs or values and tie them to your goals.',
    'Назовите две конкретные программы или ценности и свяжите их со своими целями.', 1
  ),
  (
    '00000000-0000-4000-8000-000000000007', 'Why this school',
    'What will you contribute to our community?',
    'Что вы привнесёте в наше сообщество?',
    'Be specific: a club you would join, a perspective you would add.',
    'Будьте конкретны: клуб, к которому присоединитесь, ваш особый взгляд.', 2
  ),
  (
    '00000000-0000-4000-8000-000000000008', 'Character',
    'Describe a challenge you overcame.',
    'Опишите трудность, которую вы преодолели.',
    'Use situation, action, result and keep the focus on what you did.',
    'Используйте схему: ситуация, действие, результат; в центре — ваши действия.', 1
  ),
  (
    '00000000-0000-4000-8000-000000000009', 'Character',
    'What does integrity mean to you?',
    'Что для вас значит честность?',
    'Tell a short story where you chose the harder right thing.',
    'Расскажите короткую историю, где вы выбрали более трудный, но честный путь.', 2
  )
on conflict (id) do nothing;

-- Read the bank joined with this student's practice. Authorized for admin, the
-- owning student, or a linked parent.
create or replace function public.get_interview_prep(target_student_id uuid)
returns table (
  question_id uuid,
  category text,
  question_en text,
  question_ru text,
  tip_en text,
  tip_ru text,
  sample_youtube_id text,
  sort_order integer,
  practice_id uuid,
  response_notes text,
  recording_link text,
  self_rating integer,
  status text,
  admin_feedback text
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
    q.id,
    q.category,
    q.question_en,
    q.question_ru,
    q.tip_en,
    q.tip_ru,
    q.sample_youtube_id,
    q."order",
    p.id,
    p.response_notes,
    p.recording_link,
    p.self_rating,
    p.status::text,
    p.admin_feedback
  from public.interview_questions as q
  left join public.interview_practice as p
    on p.question_id = q.id
    and p.student_id = target_student_id
  order by q.category, q."order", q.id;
end;
$$;

-- Student saves/updates their own answer for one question (paid only).
create or replace function public.student_save_interview_practice(
  target_question_id uuid,
  new_response_notes text,
  new_recording_link text,
  new_self_rating integer,
  new_status public.interview_practice_status
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

  if not exists (select 1 from public.interview_questions where id = target_question_id) then
    raise exception 'Question not found' using errcode = 'P0002';
  end if;

  insert into public.interview_practice (
    student_id,
    question_id,
    response_notes,
    recording_link,
    self_rating,
    status,
    updated_at
  )
  values (
    own_student_id,
    target_question_id,
    nullif(btrim(coalesce(new_response_notes, '')), ''),
    case when new_recording_link ~ '^https://' then btrim(new_recording_link) else null end,
    case when new_self_rating between 1 and 5 then new_self_rating else null end,
    coalesce(new_status, 'practiced'),
    now()
  )
  on conflict (student_id, question_id) do update
  set
    response_notes = excluded.response_notes,
    recording_link = excluded.recording_link,
    self_rating = excluded.self_rating,
    status = excluded.status,
    updated_at = now()
  returning id into result_id;

  return result_id;
end;
$$;

-- Consultant leaves feedback on a student's answer and notifies them.
create or replace function public.admin_set_interview_feedback(
  target_practice_id uuid,
  new_feedback text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  practice_student_user_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  update public.interview_practice as p
  set
    admin_feedback = nullif(btrim(coalesce(new_feedback, '')), ''),
    updated_at = now()
  from public.students as s
  where p.id = target_practice_id
    and s.id = p.student_id
  returning s.user_id into practice_student_user_id;

  if practice_student_user_id is null then
    raise exception 'Practice entry not found' using errcode = 'P0002';
  end if;

  perform private.notify_user(
    practice_student_user_id,
    'interview',
    'Interview feedback added',
    'Добавлен отзыв по интервью',
    'Your consultant left feedback on an interview answer.',
    'Ваш консультант оставил отзыв по ответу на интервью.',
    '/en/app/student?section=interview'
  );
end;
$$;

revoke execute on function public.get_interview_prep(uuid) from public, anon;
grant execute on function public.get_interview_prep(uuid) to authenticated;
revoke execute on function public.student_save_interview_practice(
  uuid, text, text, integer, public.interview_practice_status
) from public, anon;
grant execute on function public.student_save_interview_practice(
  uuid, text, text, integer, public.interview_practice_status
) to authenticated;
revoke execute on function public.admin_set_interview_feedback(uuid, text) from public, anon;
grant execute on function public.admin_set_interview_feedback(uuid, text) to authenticated;
