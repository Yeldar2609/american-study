-- Per-school application status board (#4). Adds a richer application stage to
-- each saved school pick (the existing school_pick_status stays for the catalog),
-- plus a portal URL and a decision note. A student may move their OWN schools
-- through the pipeline (paid only); an admin may set any student's stages.

create type public.application_stage as enum (
  'not_started',
  'in_progress',
  'submitted',
  'interview',
  'accepted',
  'waitlisted',
  'rejected'
);

alter table public.student_school_picks
  add column if not exists application_stage public.application_stage not null default 'not_started';
alter table public.student_school_picks
  add column if not exists application_portal_url text
    check (application_portal_url is null or application_portal_url ~ '^https://');
alter table public.student_school_picks
  add column if not exists decision_note text;

-- Move a school through the application pipeline. Admin for any student; the
-- owning student only when paid. The pick must already exist on the list.
create or replace function public.set_application_stage(
  target_student_id uuid,
  target_school_id uuid,
  new_stage public.application_stage,
  new_portal_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  if not (
    private.is_admin()
    or (
      exists (
        select 1
        from public.students as s
        where s.id = target_student_id
          and s.user_id = (select auth.uid())
      )
      and private.is_unlocked(target_student_id)
    )
  ) then
    raise exception 'Not authorized to update this application' using errcode = '42501';
  end if;

  -- Only touch the portal URL when a valid https value is supplied; a blank or
  -- malformed field leaves the saved link unchanged rather than silently wiping
  -- it (the board form always resubmits both fields together).
  update public.student_school_picks
  set
    application_stage = new_stage,
    application_portal_url = case
      when new_portal_url ~ '^https://' then btrim(new_portal_url)
      else application_portal_url
    end
  where student_id = target_student_id
    and school_id = target_school_id
  returning id into updated_id;

  if updated_id is null then
    raise exception 'Save the school to your list first' using errcode = 'P0002';
  end if;
end;
$$;

-- Application board: the student's listed schools with pipeline state. Authorized
-- for admin, the owning student, or a linked parent.
create or replace function public.get_application_board(target_student_id uuid)
returns table (
  school_id uuid,
  school_name text,
  state text,
  city text,
  application_stage text,
  application_portal_url text,
  sao_deadline date,
  is_final_7 boolean,
  starred boolean,
  student_shortlisted boolean,
  admin_pick boolean
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
    school.id,
    school.name,
    school.state,
    school.city,
    pick.application_stage::text,
    pick.application_portal_url,
    pick.sao_deadline,
    coalesce(pick.is_final_7, false),
    coalesce(pick.starred, false),
    coalesce(pick.student_shortlisted, false),
    coalesce(pick.admin_pick, false)
  from public.student_school_picks as pick
  join public.schools as school on school.id = pick.school_id
  where pick.student_id = target_student_id
    and (pick.admin_pick or pick.starred or pick.student_shortlisted or pick.is_final_7)
  order by pick.sao_deadline asc nulls last, school.name;
end;
$$;

revoke execute on function public.set_application_stage(
  uuid, uuid, public.application_stage, text
) from public, anon;
grant execute on function public.set_application_stage(
  uuid, uuid, public.application_stage, text
) to authenticated;
revoke execute on function public.get_application_board(uuid) from public, anon;
grant execute on function public.get_application_board(uuid) to authenticated;
