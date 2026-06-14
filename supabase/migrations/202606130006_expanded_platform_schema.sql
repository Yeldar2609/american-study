create type public.message_thread_type as enum ('task', 'essay', 'general');
create type public.document_type as enum (
  'passport',
  'transcript',
  'recommendation',
  'financial',
  'test_score',
  'photo',
  'other'
);
create type public.document_status as enum ('requested', 'uploaded', 'verified');
create type public.recommendation_status as enum ('requested', 'in_progress', 'submitted');
create type public.interview_practice_status as enum ('todo', 'practiced', 'reviewed');
create type public.template_audience as enum ('all', 'paid');
create type public.announcement_audience as enum ('all', 'student', 'parent');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_type public.message_thread_type not null,
  ref_id uuid,
  student_id uuid not null references public.students(id) on delete cascade,
  author_user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  attachment_link text check (attachment_link is null or attachment_link ~ '^https://'),
  created_at timestamptz not null default now()
);

create table public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (length(btrim(type)) between 1 and 80),
  title_en text not null check (length(btrim(title_en)) > 0),
  title_ru text not null check (length(btrim(title_ru)) > 0),
  body_en text not null check (length(btrim(body_en)) > 0),
  body_ru text not null check (length(btrim(body_ru)) > 0),
  link text check (link is null or link like '/%'),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null check (length(btrim(action)) between 1 and 120),
  detail text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  type public.document_type not null,
  title text not null check (length(btrim(title)) between 1 and 300),
  drive_link text check (drive_link is null or drive_link ~ '^https://'),
  status public.document_status not null default 'requested',
  required boolean not null default false,
  due_date date,
  notes text
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  recommender_name text not null check (length(btrim(recommender_name)) between 1 and 200),
  recommender_role text,
  recommender_email extensions.citext,
  status public.recommendation_status not null default 'requested',
  drive_link text check (drive_link is null or drive_link ~ '^https://'),
  due_date date,
  notes text
);

create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (length(btrim(category)) between 1 and 80),
  question_en text not null check (length(btrim(question_en)) > 0),
  question_ru text not null check (length(btrim(question_ru)) > 0),
  tip_en text not null check (length(btrim(tip_en)) > 0),
  tip_ru text not null check (length(btrim(tip_ru)) > 0),
  sample_youtube_id text check (
    sample_youtube_id is null or sample_youtube_id ~ '^[A-Za-z0-9_-]{11}$'
  ),
  "order" integer not null default 0 check ("order" >= 0)
);

create table public.interview_practice (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  response_notes text,
  recording_link text check (recording_link is null or recording_link ~ '^https://'),
  self_rating integer check (self_rating between 1 and 5),
  status public.interview_practice_status not null default 'todo',
  updated_at timestamptz not null default now(),
  unique (student_id, question_id)
);

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  stage public.student_stage not null,
  section text not null check (length(btrim(section)) between 1 and 120),
  title_en text not null check (length(btrim(title_en)) > 0),
  title_ru text not null check (length(btrim(title_ru)) > 0),
  description_en text not null check (length(btrim(description_en)) > 0),
  description_ru text not null check (length(btrim(description_ru)) > 0),
  video_youtube_id text check (
    video_youtube_id is null or video_youtube_id ~ '^[A-Za-z0-9_-]{11}$'
  ),
  default_offset_days integer not null default 0,
  applies_to public.template_audience not null default 'all'
);

create table public.student_tags (
  student_id uuid not null references public.students(id) on delete cascade,
  tag text not null check (length(btrim(tag)) between 1 and 80),
  primary key (student_id, tag)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_en text not null check (length(btrim(title_en)) > 0),
  title_ru text not null check (length(btrim(title_ru)) > 0),
  body_en text not null check (length(btrim(body_en)) > 0),
  body_ru text not null check (length(btrim(body_ru)) > 0),
  audience public.announcement_audience not null default 'all',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index messages_student_created_idx on public.messages (student_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id, read, created_at desc);
create index activity_log_student_created_idx on public.activity_log (student_id, created_at desc);
create index documents_student_status_idx on public.documents (student_id, status, due_date);
create index recommendations_student_status_idx
  on public.recommendations (student_id, status, due_date);
create index interview_questions_order_idx
  on public.interview_questions (category, "order", id);
create index task_templates_stage_idx on public.task_templates (stage, applies_to);
create index student_tags_tag_idx on public.student_tags (tag, student_id);
create index announcements_active_idx on public.announcements (active, audience, created_at desc);

create trigger interview_practice_touch_updated_at
  before update on public.interview_practice
  for each row execute function private.touch_updated_at();

alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;
alter table public.documents enable row level security;
alter table public.recommendations enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_practice enable row level security;
alter table public.task_templates enable row level security;
alter table public.student_tags enable row level security;
alter table public.announcements enable row level security;

create policy expanded_admin_messages on public.messages
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_message_reads on public.message_reads
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy notifications_owner_select on public.notifications
  for select to authenticated using (
    user_id = (select auth.uid()) or (select private.is_admin())
  );
create policy notifications_admin_write on public.notifications
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_activity on public.activity_log
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_documents on public.documents
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_recommendations on public.recommendations
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_questions on public.interview_questions
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_practice on public.interview_practice
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_templates on public.task_templates
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy expanded_admin_tags on public.student_tags
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy announcements_authenticated_select on public.announcements
  for select to authenticated using (active or (select private.is_admin()));
create policy announcements_admin_write on public.announcements
  for all to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
