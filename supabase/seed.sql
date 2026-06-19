-- Local development accounts. Password for every account: LocalTest123!
-- No school records are seeded; import the user-supplied CSV separately.
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
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{"full_name":"Local Admin","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'trial.student@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Trial Student","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'paid.student@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"student"}',
    '{"full_name":"Paid Student","language":"en"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'paid.parent@american-study.local',
    crypt('LocalTest123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"parent"}',
    '{"full_name":"Paid Parent","language":"ru"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into public.students (
  id,
  user_id,
  package_state,
  diagnostic_summary,
  aid_need_level,
  stage
) values
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000002',
    'trial',
    null,
    'medium',
    'trial'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000003',
    'paid',
    null,
    'low',
    'list_building'
  )
on conflict (id) do nothing;

insert into public.parents_students (parent_user_id, student_id) values
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000103'
  )
on conflict do nothing;
