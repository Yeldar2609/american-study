begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

insert into public.schools (
  id, name, state, city, setting, student_body, strengths
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'Test Admin Pick',
    'Test State',
    'Test City',
    'suburban',
    'coed',
    array['STEM']
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Test Non Admin Pick',
    'Other State',
    'Other City',
    'urban',
    'girls',
    array['Arts']
  );

insert into public.student_school_picks (
  id, student_id, school_id, match_percent, admin_pick, match_reason
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000001',
    83,
    true,
    'Test reason'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000002',
    71,
    false,
    'Hidden trial pick'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000103',
    '10000000-0000-0000-0000-000000000002',
    76,
    false,
    'Paid pick'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  'select count(*) from public.students',
  array[0::bigint],
  'trial student cannot directly read students'
);
select results_eq(
  'select count(*) from public.schools',
  array[0::bigint],
  'trial student cannot directly read schools'
);
select results_eq(
  'select count(*) from public.student_school_picks',
  array[0::bigint],
  'trial student cannot bypass the matched-schools RPC through picks'
);
select results_eq(
  'select count(*) from public.get_my_diagnostic_summary()',
  array[1::bigint],
  'trial student receives one diagnostic summary'
);
select results_eq(
  $$select school_name from public.get_my_matched_schools()$$,
  array['Test Admin Pick'::text],
  'trial student receives only admin-matched schools'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select results_eq(
  'select count(*) from public.students',
  array[0::bigint],
  'parent of a trial student cannot directly read students'
);
select results_eq(
  'select count(*) from public.schools',
  array[0::bigint],
  'parent of a trial student cannot directly read schools'
);
select results_eq(
  'select count(*) from public.get_my_diagnostic_summary()',
  array[1::bigint],
  'parent of a trial student receives the linked summary'
);
select results_eq(
  'select count(*) from public.get_my_matched_schools()',
  array[1::bigint],
  'parent of a trial student receives only the linked admin pick'
);
select throws_ok(
  $$select public.set_school_pick_starred(
      '20000000-0000-0000-0000-000000000001', true
    )$$,
  '42501',
  'Parents have read-only access',
  'parents cannot mutate student picks'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select results_eq(
  $$select id from public.students$$,
  array['00000000-0000-0000-0000-000000000103'::uuid],
  'paid student can directly read only their student row'
);
select results_eq(
  'select count(*) from public.schools',
  array[2::bigint],
  'paid student can read the school catalog'
);
select results_eq(
  'select count(*) from public.student_school_picks',
  array[1::bigint],
  'paid student can directly read only their picks'
);
select lives_ok(
  $$select public.set_school_pick_starred(
      '20000000-0000-0000-0000-000000000003', true
    )$$,
  'paid student can star their own pick'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
select results_eq(
  $$select id from public.students$$,
  array['00000000-0000-0000-0000-000000000103'::uuid],
  'parent of a paid student can directly read the linked student'
);
select results_eq(
  'select count(*) from public.schools',
  array[2::bigint],
  'parent of a paid student can read the school catalog'
);
select throws_ok(
  $$update public.students set full_name = 'No such column' where true$$,
  '42703',
  null,
  'parent test executes with restricted database role'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000006","role":"authenticated"}',
  true
);
select results_eq(
  'select count(*) from public.students',
  array[0::bigint],
  'unrelated users cannot read student profiles'
);
select results_eq(
  'select count(*) from public.schools',
  array[0::bigint],
  'unrelated users cannot read the paid school catalog'
);
select throws_ok(
  $$select public.admin_update_student_profile(
      '00000000-0000-0000-0000-000000000102',
      '{}'::jsonb
    )$$,
  '42501',
  'Admin access required',
  'non-admin users cannot invoke the profile update RPC'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select results_eq(
  'select count(*) from public.students',
  array[2::bigint],
  'admin can read all students'
);
select results_eq(
  'select count(*) from public.schools',
  array[2::bigint],
  'admin can read all schools'
);
select lives_ok(
  $$update public.students
    set diagnostic_summary = diagnostic_summary
    where id = '00000000-0000-0000-0000-000000000102'$$,
  'admin can update students'
);
select lives_ok(
  $$select public.admin_update_student_profile(
      '00000000-0000-0000-0000-000000000102',
      jsonb_build_object(
        'address', 'Almaty',
        'aid_need_level', 'medium',
        'current_grade', '8',
        'current_school', 'Local School',
        'diagnostic_summary', 'Updated by pgTAP',
        'dob', '2012-01-01',
        'drive_folder_url', null,
        'email', 'trial.student@american-study.local',
        'english_level', 'B2',
        'full_name', 'Trial Student',
        'interests', jsonb_build_array('STEM'),
        'language', 'en',
        'parent_email', 'trial.parent@american-study.local',
        'parent_phone', null,
        'passport_id_drive_url', null,
        'phone', null,
        'pref_setting', 'suburban',
        'pref_size', 'medium',
        'pref_state_or_region', 'New England',
        'stage', 'trial',
        'test_scores', '{}'::jsonb
      )
    )$$,
  'admin can update student and user profile rows transactionally'
);

select * from finish();
rollback;
