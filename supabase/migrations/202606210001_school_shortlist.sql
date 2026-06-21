-- Student schools experience: shortlist + interest + note on picks, a richer
-- catalog payload (full school detail fields), and looser save rules so trial
-- students can save/shortlist the schools their consultant assigned to them.

-- 1. New per-pick student columns ---------------------------------------------
alter table public.student_school_picks
  add column student_shortlisted boolean not null default false,
  add column student_interest_level text not null default 'exploring'
    check (student_interest_level in ('exploring', 'interested', 'shortlisted', 'not_interested')),
  add column student_note text,
  add column updated_at timestamptz not null default now();

create trigger student_school_picks_touch_updated_at
  before update on public.student_school_picks
  for each row execute function private.touch_updated_at();

create index student_school_picks_shortlist_idx
  on public.student_school_picks (student_id)
  where student_shortlisted;

-- 2. Save eligibility ---------------------------------------------------------
-- Paid students/admin can act on any school (via is_unlocked). Trial students
-- may save/shortlist ONLY the schools an admin recommended to them (admin_pick).
create or replace function private.can_student_save(
  target_student_id uuid,
  target_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_unlocked(target_student_id)
    or (
      exists (
        select 1
        from public.students as s
        where s.id = target_student_id
          and s.user_id = (select auth.uid())
      )
      and exists (
        select 1
        from public.student_school_picks as p
        where p.student_id = target_student_id
          and p.school_id = target_school_id
          and p.admin_pick
      )
    );
$$;

-- 3. Catalog payload: add full detail fields + the new student pick fields -----
-- RETURNS TABLE signature changes, so the function must be dropped and recreated.
drop function if exists public.get_school_catalog(uuid);

create function public.get_school_catalog(target_student_id uuid)
returns table (
  pick_id uuid,
  school_id uuid,
  school_name text,
  state text,
  city text,
  setting public.school_setting,
  student_body public.school_student_body,
  affiliation text,
  grades text,
  enrollment integer,
  pct_boarding numeric,
  pct_international numeric,
  boarding_tuition_usd integer,
  acceptance_rate_pct numeric,
  avg_ssat_pctile numeric,
  offers_financial_aid boolean,
  niche_grade text,
  niche_profile_url text,
  notes text,
  strengths text[],
  website_url text,
  match_percent integer,
  starred boolean,
  student_shortlisted boolean,
  student_interest_level text,
  student_note text,
  admin_pick boolean,
  is_final_7 boolean,
  match_reason text,
  sao_deadline date,
  status public.school_pick_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  student public.students%rowtype;
begin
  select candidate.*
  into student
  from public.students as candidate
  where candidate.id = target_student_id
    and (
      private.is_admin()
      or candidate.user_id = (select auth.uid())
      or exists (
        select 1
        from public.parents_students as link
        where link.student_id = candidate.id
          and link.parent_user_id = (select auth.uid())
      )
    );

  if not found then
    raise exception 'Student is not accessible' using errcode = '42501';
  end if;

  return query
  select
    pick.id,
    school.id,
    school.name,
    school.state,
    school.city,
    school.setting,
    school.student_body,
    school.affiliation,
    school.grades,
    school.enrollment,
    school.pct_boarding,
    school.pct_international,
    school.boarding_tuition_usd,
    school.acceptance_rate_pct,
    school.avg_ssat_pctile,
    school.offers_financial_aid,
    school.niche_grade,
    school.niche_profile_url,
    school.notes,
    school.strengths,
    school.website_url,
    coalesce(
      pick.match_percent_override,
      pick.match_percent,
      public.compute_match(target_student_id, school.id)
    ),
    coalesce(pick.starred, false),
    coalesce(pick.student_shortlisted, false),
    coalesce(pick.student_interest_level, 'exploring'),
    pick.student_note,
    coalesce(pick.admin_pick, false),
    coalesce(pick.is_final_7, false),
    pick.match_reason,
    pick.sao_deadline,
    coalesce(pick.status, 'researching'::public.school_pick_status)
  from public.schools as school
  left join public.student_school_picks as pick
    on pick.student_id = target_student_id
    and pick.school_id = school.id
  where private.is_admin()
    or student.package_state = 'paid'
    or pick.admin_pick
  order by
    coalesce(
      pick.match_percent_override,
      pick.match_percent,
      public.compute_match(target_student_id, school.id)
    ) desc,
    school.name;
end;
$$;

-- 4. Save / shortlist / interest mutations ------------------------------------
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

  insert into public.student_school_picks (student_id, school_id, match_percent, starred)
  values (
    target_student_id,
    target_school_id,
    public.compute_match(target_student_id, target_school_id),
    new_starred
  )
  on conflict (student_id, school_id)
  do update set starred = excluded.starred;
end;
$$;

create or replace function public.set_school_shortlist(
  target_student_id uuid,
  target_school_id uuid,
  new_shortlisted boolean
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
    raise exception 'Shortlisting requires a paid package or an assigned school'
      using errcode = '42501';
  end if;

  insert into public.student_school_picks (student_id, school_id, match_percent, student_shortlisted)
  values (
    target_student_id,
    target_school_id,
    public.compute_match(target_student_id, target_school_id),
    new_shortlisted
  )
  on conflict (student_id, school_id)
  do update set student_shortlisted = excluded.student_shortlisted;
end;
$$;

create or replace function public.set_school_interest(
  target_student_id uuid,
  target_school_id uuid,
  new_interest text
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
  if new_interest not in ('exploring', 'interested', 'shortlisted', 'not_interested') then
    raise exception 'Invalid interest level' using errcode = '22023';
  end if;
  if not private.can_student_save(target_student_id, target_school_id) then
    raise exception 'Updating interest requires a paid package or an assigned school'
      using errcode = '42501';
  end if;

  insert into public.student_school_picks (
    student_id, school_id, match_percent, student_interest_level
  )
  values (
    target_student_id,
    target_school_id,
    public.compute_match(target_student_id, target_school_id),
    new_interest
  )
  on conflict (student_id, school_id)
  do update set student_interest_level = excluded.student_interest_level;
end;
$$;

-- 5. Grants -------------------------------------------------------------------
revoke execute on function private.can_student_save(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_school_catalog(uuid) from public, anon;
revoke execute on function public.set_school_star(uuid, uuid, boolean) from public, anon;
revoke execute on function public.set_school_shortlist(uuid, uuid, boolean) from public, anon;
revoke execute on function public.set_school_interest(uuid, uuid, text) from public, anon;
grant execute on function public.get_school_catalog(uuid) to authenticated;
grant execute on function public.set_school_star(uuid, uuid, boolean) to authenticated;
grant execute on function public.set_school_shortlist(uuid, uuid, boolean) to authenticated;
grant execute on function public.set_school_interest(uuid, uuid, text) to authenticated;
