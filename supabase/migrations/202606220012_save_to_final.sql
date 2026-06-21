-- Saving a school now adds it straight to the student's final list. Previously
-- a student starred ("saved"), separately shortlisted, and only an admin could
-- move a school into the final list. Per product direction, the single Save
-- action sets both starred and is_final_7 (uncapped — students build their own
-- final list). Shortlist is removed from the UI; this keeps set_school_star the
-- one student-facing pick mutation. Authorization is unchanged.

create or replace function public.set_school_star(
  target_student_id uuid,
  target_school_id uuid,
  new_starred boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
begin
  if actor_role = 'parent' then
    raise exception 'Parents have read-only access' using errcode = '42501';
  end if;
  if actor_role not in ('student', 'admin') then
    raise exception 'A provisioned student or admin is required' using errcode = '42501';
  end if;
  if not private.can_student_save(target_student_id, target_school_id) then
    raise exception 'Saving requires a paid package or an assigned school'
      using errcode = '42501';
  end if;

  insert into public.student_school_picks (
    student_id,
    school_id,
    match_percent,
    starred,
    is_final_7
  )
  values (
    target_student_id,
    target_school_id,
    public.compute_match(target_student_id, target_school_id),
    new_starred,
    new_starred
  )
  on conflict (student_id, school_id)
  do update set starred = excluded.starred, is_final_7 = excluded.is_final_7;
end;
$$;

revoke execute on function public.set_school_star(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_school_star(uuid, uuid, boolean) to authenticated;
