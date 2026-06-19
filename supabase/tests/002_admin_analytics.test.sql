begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

delete from public.students;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000010',
    'authenticated',
    'authenticated',
    'analytics.diagnostic@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Diagnostic","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000011',
    'authenticated',
    'authenticated',
    'analytics.finalized@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Finalized","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000012',
    'authenticated',
    'authenticated',
    'analytics.application@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Application","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000013',
    'authenticated',
    'authenticated',
    'analytics.submitted@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Submitted","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000014',
    'authenticated',
    'authenticated',
    'analytics.diagnostic.two@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Diagnostic Two","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000015',
    'authenticated',
    'authenticated',
    'analytics.trial.two@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Trial Two","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000016',
    'authenticated',
    'authenticated',
    'analytics.list.two@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics List Two","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000017',
    'authenticated',
    'authenticated',
    'analytics.trial.three@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics Trial Three","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000018',
    'authenticated',
    'authenticated',
    'analytics.list.three@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Analytics List Three","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into public.students (id, user_id, package_state, stage) values
  (
    '00000000-0000-0000-0000-000000000110',
    '00000000-0000-0000-0000-000000000010',
    'trial',
    'diagnostic'
  ),
  (
    '00000000-0000-0000-0000-000000000111',
    '00000000-0000-0000-0000-000000000011',
    'paid',
    'finalized'
  ),
  (
    '00000000-0000-0000-0000-000000000112',
    '00000000-0000-0000-0000-000000000012',
    'trial',
    'application'
  ),
  (
    '00000000-0000-0000-0000-000000000113',
    '00000000-0000-0000-0000-000000000013',
    'paid',
    'submitted'
  ),
  (
    '00000000-0000-0000-0000-000000000114',
    '00000000-0000-0000-0000-000000000014',
    'trial',
    'diagnostic'
  ),
  (
    '00000000-0000-0000-0000-000000000115',
    '00000000-0000-0000-0000-000000000015',
    'trial',
    'trial'
  ),
  (
    '00000000-0000-0000-0000-000000000116',
    '00000000-0000-0000-0000-000000000016',
    'paid',
    'list_building'
  ),
  (
    '00000000-0000-0000-0000-000000000117',
    '00000000-0000-0000-0000-000000000017',
    'trial',
    'trial'
  ),
  (
    '00000000-0000-0000-0000-000000000118',
    '00000000-0000-0000-0000-000000000018',
    'paid',
    'list_building'
  );

insert into public.schools (id, name) values (
  '10000000-0000-0000-0000-000000000010',
  'Analytics Admin Pick'
);

insert into public.student_school_picks (
  student_id,
  school_id,
  match_percent,
  admin_pick
) values (
  '00000000-0000-0000-0000-000000000110',
  '10000000-0000-0000-0000-000000000010',
  80,
  true
);

insert into public.application_tasks (
  student_id,
  section,
  title,
  status,
  due_date
) values
  (
    '00000000-0000-0000-0000-000000000110',
    'Analytics',
    'At-risk task',
    'in_progress',
    current_date
  ),
  (
    '00000000-0000-0000-0000-000000000112',
    'Analytics',
    'Approved task',
    'approved',
    current_date + 1
  ),
  (
    '00000000-0000-0000-0000-000000000114',
    'Analytics',
    'Outside risk window',
    'not_started',
    current_date + 15
  );

insert into public.documents (
  student_id,
  type,
  title,
  status,
  required,
  due_date
) values
  (
    '00000000-0000-0000-0000-000000000110',
    'passport',
    'Duplicate at-risk evidence',
    'requested',
    true,
    current_date + 2
  ),
  (
    '00000000-0000-0000-0000-000000000111',
    'transcript',
    'Second at-risk student',
    'uploaded',
    true,
    current_date + 14
  ),
  (
    '00000000-0000-0000-0000-000000000112',
    'photo',
    'Optional document',
    'requested',
    false,
    current_date + 3
  ),
  (
    '00000000-0000-0000-0000-000000000113',
    'test_score',
    'Verified document',
    'verified',
    true,
    current_date + 4
  );

insert into public.activity_log (
  student_id,
  action,
  created_at
) values
  ('00000000-0000-0000-0000-000000000110', 'old-diagnostic-action', '2026-01-01 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000110', 'latest-diagnostic-action', '2026-01-10 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000111', 'finalized-action', '2026-01-09 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000110', 'diagnostic-action', '2026-01-08 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000112', 'application-action', '2026-01-07 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000113', 'submitted-action', '2026-01-06 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000114', 'diagnostic-two-action', '2026-01-05 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000115', 'trial-two-action', '2026-01-04 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000116', 'list-two-action', '2026-01-03 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000117', 'trial-three-action', '2026-01-02 08:00:00+00'),
  ('00000000-0000-0000-0000-000000000118', 'list-three-action', '2026-01-01 08:00:00+00');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (public.get_admin_analytics() ->> 'total_students')::integer,
  9,
  'admin analytics reports the total student count'
);
select is(
  (public.get_admin_analytics() ->> 'trial_students')::integer,
  5,
  'admin analytics reports trial students'
);
select is(
  (public.get_admin_analytics() ->> 'paid_students')::integer,
  4,
  'admin analytics reports paid students'
);
select is(
  (public.get_admin_analytics() ->> 'conversion_percent')::integer,
  44,
  'admin analytics rounds paid conversion to the nearest percent'
);
select is(
  (public.get_admin_analytics() ->> 'activated_students')::integer,
  6,
  'admin analytics counts stage and admin-pick activation once per student'
);
select is(
  (public.get_admin_analytics() ->> 'at_risk_count')::integer,
  2,
  'admin analytics counts distinct students with actionable due work'
);
select is(
  public.get_admin_analytics() -> 'stage_counts',
  '{
    "diagnostic": 2,
    "trial": 2,
    "list_building": 2,
    "finalized": 1,
    "application": 1,
    "submitted": 1
  }'::jsonb,
  'admin analytics includes every stage with deterministic counts'
);
select is(
  jsonb_array_length(public.get_admin_analytics() -> 'recent_students'),
  8,
  'recent students is limited to eight entries'
);
select is(
  public.get_admin_analytics() #>> '{recent_students,0,last_action}',
  'latest-diagnostic-action',
  'recent students uses each student latest activity and orders newest first'
);
select is(
  public.get_admin_analytics() #>> '{recent_students,0,student_name}',
  'Analytics Diagnostic',
  'recent students includes the student display name'
);
select is(
  public.get_admin_analytics() #>> '{recent_students,0,package_state}',
  'trial',
  'recent students includes package state'
);
select is(
  public.get_admin_analytics() #>> '{recent_students,0,stage}',
  'diagnostic',
  'recent students includes stage'
);
select is(
  public.get_admin_analytics() #>> '{recent_students,0,last_active_at}',
  '2026-01-10T08:00:00+00:00',
  'recent students includes the latest activity timestamp'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.get_admin_analytics()$$,
  '42501',
  'Admin access required',
  'student users cannot read admin analytics'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.get_admin_analytics()$$,
  '42501',
  'Admin access required',
  'parent users cannot read admin analytics'
);

reset role;

select is(
  (
    select routine.provolatile
    from pg_proc as routine
    join pg_namespace as namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname = 'get_admin_analytics'
      and routine.pronargs = 0
  ),
  's'::"char",
  'admin analytics is stable'
);
select is(
  (
    select routine.prosecdef
    from pg_proc as routine
    join pg_namespace as namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname = 'get_admin_analytics'
      and routine.pronargs = 0
  ),
  true,
  'admin analytics is security definer'
);
select is(
  (
    select routine.proconfig
    from pg_proc as routine
    join pg_namespace as namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname = 'get_admin_analytics'
      and routine.pronargs = 0
  ),
  array['search_path=""']::text[],
  'admin analytics has an empty search path'
);
select is(
  has_function_privilege('public', 'public.get_admin_analytics()', 'execute'),
  false,
  'public cannot execute admin analytics'
);
select is(
  has_function_privilege('anon', 'public.get_admin_analytics()', 'execute'),
  false,
  'anonymous users cannot execute admin analytics'
);
select is(
  has_function_privilege('authenticated', 'public.get_admin_analytics()', 'execute'),
  true,
  'authenticated users can invoke the guarded admin analytics RPC'
);

delete from public.students;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  public.get_admin_analytics() - 'stage_counts' - 'recent_students',
  '{
    "total_students": 0,
    "trial_students": 0,
    "paid_students": 0,
    "conversion_percent": 0,
    "activated_students": 0,
    "at_risk_count": 0
  }'::jsonb,
  'empty analytics returns zero scalar metrics'
);
select is(
  public.get_admin_analytics() -> 'stage_counts',
  '{
    "diagnostic": 0,
    "trial": 0,
    "list_building": 0,
    "finalized": 0,
    "application": 0,
    "submitted": 0
  }'::jsonb,
  'empty analytics retains every stage key at zero'
);
select is(
  public.get_admin_analytics() -> 'recent_students',
  '[]'::jsonb,
  'empty analytics returns an empty recent students array'
);

select * from finish();
rollback;
