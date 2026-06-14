create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum ('student', 'parent', 'admin');
create type public.user_language as enum ('en', 'ru');
create type public.package_state as enum ('trial', 'paid');
create type public.aid_need_level as enum ('low', 'medium', 'high');
create type public.school_setting as enum ('urban', 'suburban', 'rural');
create type public.school_student_body as enum ('coed', 'boys', 'girls');
create type public.school_size as enum ('small', 'medium', 'large');
create type public.student_stage as enum (
  'diagnostic',
  'trial',
  'list_building',
  'finalized',
  'application',
  'submitted'
);
create type public.school_pick_status as enum ('researching', 'applied', 'submitted');
create type public.task_status as enum (
  'not_started',
  'in_progress',
  'submitted',
  'needs_revision',
  'approved'
);
create type public.essay_status as enum (
  'draft',
  'in_review',
  'needs_revision',
  'approved'
);
create type public.booking_type as enum (
  'school_list_review',
  'essay_review',
  'mock_interview',
  'final_application_check',
  'general_strategy'
);
create type public.booking_status as enum ('requested', 'booked', 'completed');

create or replace function private.valid_test_scores(scores jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    jsonb_typeof(scores) = 'object'
    and not exists (
      select 1
      from jsonb_object_keys(scores) as key
      where key not in ('toefl', 'ssat', 'det')
    )
    and (
      not scores ? 'toefl'
      or (
        jsonb_typeof(scores -> 'toefl') = 'number'
        and (scores ->> 'toefl')::numeric between 0 and 120
      )
    )
    and (
      not scores ? 'ssat'
      or (
        jsonb_typeof(scores -> 'ssat') = 'number'
        and (scores ->> 'ssat')::numeric between 0 and 2400
      )
    )
    and (
      not scores ? 'det'
      or (
        jsonb_typeof(scores -> 'det') = 'number'
        and (scores ->> 'det')::numeric between 10 and 160
      )
    );
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  full_name text not null check (length(btrim(full_name)) between 1 and 200),
  role public.user_role not null,
  language public.user_language not null default 'en',
  google_account_email extensions.citext,
  created_at timestamptz not null default now()
);

create unique index users_single_admin_idx
  on public.users (role)
  where role = 'admin';

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  package_state public.package_state not null default 'trial',
  diagnostic_summary text,
  english_level text check (
    english_level is null or length(btrim(english_level)) between 1 and 80
  ),
  dob date check (dob is null or dob <= current_date),
  address text,
  phone text,
  current_school text,
  current_grade text,
  parent_email extensions.citext,
  parent_phone text,
  passport_id_drive_url text check (
    passport_id_drive_url is null or passport_id_drive_url ~ '^https://'
  ),
  test_scores jsonb not null default '{}'::jsonb
    check (private.valid_test_scores(test_scores)),
  aid_need_level public.aid_need_level,
  interests text[] not null default '{}',
  pref_size public.school_size,
  pref_setting public.school_setting,
  pref_state_or_region text,
  drive_folder_url text check (
    drive_folder_url is null or drive_folder_url ~ '^https://'
  ),
  stage public.student_stage not null default 'diagnostic',
  created_at timestamptz not null default now()
);

create table public.parents_students (
  parent_user_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (parent_user_id, student_id)
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 300),
  state text,
  city text,
  setting public.school_setting,
  student_body public.school_student_body,
  affiliation text,
  grades text,
  enrollment integer check (enrollment is null or enrollment >= 0),
  pct_boarding numeric(5, 2) check (pct_boarding between 0 and 100),
  pct_international numeric(5, 2) check (pct_international between 0 and 100),
  boarding_tuition_usd integer check (
    boarding_tuition_usd is null or boarding_tuition_usd >= 0
  ),
  acceptance_rate_pct numeric(5, 2) check (acceptance_rate_pct between 0 and 100),
  avg_ssat_pctile numeric(5, 2) check (avg_ssat_pctile between 0 and 100),
  offers_financial_aid boolean,
  niche_grade text,
  strengths text[] not null default '{}',
  website_url text check (website_url is null or website_url ~ '^https://'),
  niche_profile_url text check (
    niche_profile_url is null or niche_profile_url ~ '^https://'
  ),
  notes text
);

create unique index schools_natural_key_idx
  on public.schools (
    lower(name),
    lower(coalesce(state, '')),
    lower(coalesce(city, ''))
  );

create table public.student_school_picks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  match_percent integer not null default 0 check (match_percent between 0 and 100),
  match_percent_override integer check (match_percent_override between 0 and 100),
  starred boolean not null default false,
  admin_pick boolean not null default false,
  is_final_7 boolean not null default false,
  match_reason text,
  sao_deadline date,
  status public.school_pick_status not null default 'researching',
  created_at timestamptz not null default now(),
  unique (student_id, school_id)
);

create table public.application_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  section text not null check (length(btrim(section)) between 1 and 120),
  title text not null check (length(btrim(title)) between 1 and 300),
  description text,
  video_youtube_id text check (
    video_youtube_id is null
    or video_youtube_id ~ '^[A-Za-z0-9_-]{11}$'
  ),
  status public.task_status not null default 'not_started',
  due_date date,
  drive_link text check (drive_link is null or drive_link ~ '^https://'),
  created_at timestamptz not null default now()
);

create table public.essays (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 300),
  drive_link text check (drive_link is null or drive_link ~ '^https://'),
  status public.essay_status not null default 'draft',
  admin_feedback text,
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  type public.booking_type not null,
  calendar_link text not null check (calendar_link ~ '^https://'),
  scheduled_at timestamptz,
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.notes_internal (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  author_label text not null check (length(btrim(author_label)) between 1 and 200),
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create table public.content_videos (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique check (length(btrim(section_key)) between 1 and 120),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title_en text not null check (length(btrim(title_en)) > 0),
  title_ru text not null check (length(btrim(title_ru)) > 0)
);

create table public.faq (
  id uuid primary key default gen_random_uuid(),
  question_en text not null check (length(btrim(question_en)) > 0),
  question_ru text not null check (length(btrim(question_ru)) > 0),
  answer_en text not null check (length(btrim(answer_en)) > 0),
  answer_ru text not null check (length(btrim(answer_ru)) > 0),
  "order" integer not null default 0 check ("order" >= 0)
);

create index students_package_stage_idx
  on public.students (package_state, stage);
create index parents_students_student_idx
  on public.parents_students (student_id, parent_user_id);
create index schools_filters_idx
  on public.schools (state, setting, student_body);
create index schools_strengths_idx
  on public.schools using gin (strengths);
create index student_school_picks_student_idx
  on public.student_school_picks (student_id, status, starred);
create index student_school_picks_school_idx
  on public.student_school_picks (school_id);
create index application_tasks_student_idx
  on public.application_tasks (student_id, status, due_date);
create index application_tasks_school_idx
  on public.application_tasks (school_id);
create index essays_student_idx
  on public.essays (student_id, status);
create index essays_school_idx
  on public.essays (school_id);
create index bookings_student_idx
  on public.bookings (student_id, scheduled_at);
create index notes_internal_student_idx
  on public.notes_internal (student_id, created_at desc);
create index faq_order_idx
  on public.faq ("order", id);
