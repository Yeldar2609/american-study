-- Richer school profiles + partner check-in tracking.
-- Public profile fields (shown to students/parents on the school detail page) and
-- two admin-only operational fields (is_partner, last_checked_in). Admins read/
-- write all of these via the schools_admin_* RLS policies (no new RPCs needed);
-- the public catalog RPC still omits the admin-only fields. NOTE: paid students
-- can already select public.schools directly under schools_select_paid_or_admin,
-- so the admin-only operational columns are hidden in the UI but not
-- column-isolated — fine for operational data, can move to an admin-only side
-- table later if true column isolation is required.

-- Public profile facets.
alter table public.schools add column if not exists founded_year integer
  check (founded_year is null or founded_year between 1600 and 2100);
alter table public.schools add column if not exists religious_affiliation text;
alter table public.schools add column if not exists student_teacher_ratio text;
alter table public.schools add column if not exists ap_courses text[] not null default '{}';
alter table public.schools add column if not exists ib_offered boolean;
alter table public.schools add column if not exists languages_offered text[] not null default '{}';
alter table public.schools add column if not exists clubs text[] not null default '{}';
alter table public.schools add column if not exists admissions_email text;
alter table public.schools add column if not exists admissions_phone text;
alter table public.schools add column if not exists avg_class_size integer
  check (avg_class_size is null or avg_class_size >= 0);
alter table public.schools add column if not exists college_matriculation text;
alter table public.schools add column if not exists accreditation text;
alter table public.schools add column if not exists notable_alumni text;
alter table public.schools add column if not exists campus_acres integer
  check (campus_acres is null or campus_acres >= 0);
alter table public.schools add column if not exists financial_aid_notes text;

-- Admin-only operational fields for monthly partner-school check-ins.
alter table public.schools add column if not exists is_partner boolean not null default false;
alter table public.schools add column if not exists last_checked_in date;

-- Speeds the "partner schools due for a check-in" query.
create index if not exists schools_partner_checkin_idx
  on public.schools (last_checked_in)
  where is_partner;

-- Public profile extras for the school detail page. Kept separate from
-- get_school_catalog (the list RPC) so the catalog list query stays lean; the
-- detail page fetches these on demand. Returns ONLY public fields — never the
-- admin-only operational columns. Guarded by the same student-access predicate
-- as the catalog, so trial students (who cannot select public.schools directly)
-- still see them via this SECURITY DEFINER RPC.
create or replace function public.get_school_extras(
  target_student_id uuid,
  target_school_id uuid
)
returns table (
  founded_year integer,
  religious_affiliation text,
  student_teacher_ratio text,
  ap_courses text[],
  ib_offered boolean,
  languages_offered text[],
  clubs text[],
  admissions_email text,
  admissions_phone text,
  avg_class_size integer,
  college_matriculation text,
  accreditation text,
  notable_alumni text,
  campus_acres integer,
  financial_aid_notes text,
  sports text[],
  extracurriculars text[],
  about text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_access_student(target_student_id) then
    raise exception 'Student is not accessible' using errcode = '42501';
  end if;

  return query
  select
    s.founded_year,
    s.religious_affiliation,
    s.student_teacher_ratio,
    s.ap_courses,
    s.ib_offered,
    s.languages_offered,
    s.clubs,
    s.admissions_email,
    s.admissions_phone,
    s.avg_class_size,
    s.college_matriculation,
    s.accreditation,
    s.notable_alumni,
    s.campus_acres,
    s.financial_aid_notes,
    s.sports,
    s.extracurriculars,
    s.about
  from public.schools as s
  where s.id = target_school_id;
end;
$$;

revoke execute on function public.get_school_extras(uuid, uuid) from public, anon;
grant execute on function public.get_school_extras(uuid, uuid) to authenticated;
