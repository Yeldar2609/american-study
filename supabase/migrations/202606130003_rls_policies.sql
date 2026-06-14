alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.parents_students enable row level security;
alter table public.schools enable row level security;
alter table public.student_school_picks enable row level security;
alter table public.application_tasks enable row level security;
alter table public.essays enable row level security;
alter table public.bookings enable row level security;
alter table public.notes_internal enable row level security;
alter table public.content_videos enable row level security;
alter table public.faq enable row level security;

create policy users_select_authorized
  on public.users
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin())
  );

create policy users_insert_transition_profile
  on public.users
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and role::text = (select auth.jwt() -> 'app_metadata' ->> 'role')
    and email::text = (select auth.jwt() ->> 'email')
  );

create policy users_update_authorized
  on public.users
  for update
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin())
  )
  with check (
    id = (select auth.uid())
    or (select private.is_admin())
  );

create policy students_select_paid_or_admin
  on public.students
  for select
  to authenticated
  using ((select private.can_access_student(id, true)));

create policy students_admin_insert
  on public.students
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy students_admin_update
  on public.students
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy students_admin_delete
  on public.students
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy parents_students_select_linked
  on public.parents_students
  for select
  to authenticated
  using (
    (select private.is_admin())
    or parent_user_id = (select auth.uid())
    or (select private.can_access_student(student_id, false))
  );

create policy parents_students_admin_insert
  on public.parents_students
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy parents_students_admin_update
  on public.parents_students
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy parents_students_admin_delete
  on public.parents_students
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy schools_select_paid_or_admin
  on public.schools
  for select
  to authenticated
  using ((select private.has_paid_student_access()));

create policy schools_admin_insert
  on public.schools
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy schools_admin_update
  on public.schools
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy schools_admin_delete
  on public.schools
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy picks_select_paid_or_admin
  on public.student_school_picks
  for select
  to authenticated
  using ((select private.can_access_student(student_id, true)));

create policy picks_admin_insert
  on public.student_school_picks
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy picks_admin_update
  on public.student_school_picks
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy picks_admin_delete
  on public.student_school_picks
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy tasks_select_paid_or_admin
  on public.application_tasks
  for select
  to authenticated
  using ((select private.can_access_student(student_id, true)));

create policy tasks_admin_insert
  on public.application_tasks
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy tasks_admin_update
  on public.application_tasks
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy tasks_admin_delete
  on public.application_tasks
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy essays_select_paid_or_admin
  on public.essays
  for select
  to authenticated
  using ((select private.can_access_student(student_id, true)));

create policy essays_admin_insert
  on public.essays
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy essays_admin_update
  on public.essays
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy essays_admin_delete
  on public.essays
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy bookings_select_paid_or_admin
  on public.bookings
  for select
  to authenticated
  using ((select private.can_access_student(student_id, true)));

create policy bookings_admin_insert
  on public.bookings
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy bookings_admin_update
  on public.bookings
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy bookings_admin_delete
  on public.bookings
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy notes_internal_admin_all
  on public.notes_internal
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy content_videos_select_paid_or_admin
  on public.content_videos
  for select
  to authenticated
  using ((select private.has_paid_student_access()));

create policy content_videos_admin_all
  on public.content_videos
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy faq_select_paid_or_admin
  on public.faq
  for select
  to authenticated
  using ((select private.has_paid_student_access()));

create policy faq_admin_all
  on public.faq
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
