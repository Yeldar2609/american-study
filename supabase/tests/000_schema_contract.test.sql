begin;

create extension if not exists pgtap with schema extensions;

select plan(43);

select has_table('public', 'users', 'users exists');
select has_table('public', 'students', 'students exists');
select has_table('public', 'parents_students', 'parents_students exists');
select has_table('public', 'schools', 'schools exists');
select has_table('public', 'student_school_picks', 'student_school_picks exists');
select has_table('public', 'application_tasks', 'application_tasks exists');
select has_table('public', 'essays', 'essays exists');
select has_table('public', 'bookings', 'bookings exists');
select has_table('public', 'notes_internal', 'notes_internal exists');
select has_table('public', 'content_videos', 'content_videos exists');
select has_table('public', 'faq', 'faq exists');
select has_table('public', 'messages', 'messages exists');
select has_table('public', 'message_reads', 'message reads exist');
select has_table('public', 'notifications', 'notifications exists');
select has_table('public', 'activity_log', 'activity log exists');
select has_table('public', 'documents', 'documents exists');
select has_table('public', 'recommendations', 'recommendations exist');
select has_table('public', 'interview_questions', 'interview questions exist');
select has_table('public', 'interview_practice', 'interview practice exists');
select has_table('public', 'task_templates', 'task templates exist');
select has_table('public', 'student_tags', 'student tags exist');
select has_table('public', 'announcements', 'announcements exist');

select has_pk('public', 'users', 'users has a primary key');
select has_fk('public', 'students', 'students belongs to auth-backed users');
select has_fk('public', 'parents_students', 'parent links reference users and students');
select has_fk('public', 'student_school_picks', 'school picks have foreign keys');

select has_function(
  'public',
  'get_my_diagnostic_summary',
  array[]::text[],
  'diagnostic summary RPC exists'
);
select has_function(
  'public',
  'get_my_matched_schools',
  array[]::text[],
  'matched schools RPC exists'
);
select has_function(
  'public',
  'set_school_pick_starred',
  array['uuid', 'boolean'],
  'star mutation RPC exists'
);
select has_function(
  'public',
  'compute_match',
  array['uuid', 'uuid'],
  'match engine exists'
);
select has_function(
  'public',
  'admin_set_user_role',
  array['uuid', 'public.user_role'],
  'admin role RPC exists'
);
select has_function(
  'public',
  'admin_update_student_profile',
  array['uuid', 'jsonb'],
  'admin profile update RPC exists'
);

select results_eq(
  $$select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'users', 'students', 'parents_students', 'schools',
        'student_school_picks', 'application_tasks', 'essays', 'bookings',
        'notes_internal', 'content_videos', 'faq', 'messages', 'message_reads',
        'notifications', 'activity_log', 'documents', 'recommendations',
        'interview_questions', 'interview_practice', 'task_templates',
        'student_tags', 'announcements'
      )
      and c.relrowsecurity$$,
  array[22::bigint],
  'RLS is enabled on every application table'
);

select col_is_unique('public', 'students', 'user_id', 'one student per user');
select col_is_unique(
  'public',
  'student_school_picks',
  array['student_id', 'school_id'],
  'a school can be picked once per student'
);

select throws_ok(
  $$insert into public.students (
      user_id, package_state, aid_need_level, stage, test_scores
    ) values (
      gen_random_uuid(), 'trial', 'low', 'trial', '{"toefl": 121}'::jsonb
    )$$,
  '23503',
  null,
  'students require an auth-backed public user'
);

select throws_ok(
  $$insert into public.schools (name, acceptance_rate_pct)
    values ('Invalid percentage', 101)$$,
  '23514',
  null,
  'school percentages are bounded'
);

select throws_ok(
  $$insert into public.student_school_picks (
      student_id, school_id, match_percent
    ) values (gen_random_uuid(), gen_random_uuid(), 101)$$,
  '23514',
  null,
  'match percentages are bounded'
);

select is(
  has_table_privilege('anon', 'public.students', 'select'),
  false,
  'anonymous users cannot read students'
);
select is(
  has_table_privilege('anon', 'public.schools', 'select'),
  false,
  'anonymous users cannot read schools'
);
select is(
  has_function_privilege('anon', 'public.get_my_diagnostic_summary()', 'execute'),
  false,
  'anonymous users cannot execute diagnostic RPC'
);
select is(
  has_function_privilege('anon', 'public.get_my_matched_schools()', 'execute'),
  false,
  'anonymous users cannot execute matched schools RPC'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.admin_set_user_role(uuid, public.user_role)',
    'execute'
  ),
  true,
  'authenticated admins can invoke the guarded role RPC'
);

select * from finish();
rollback;
