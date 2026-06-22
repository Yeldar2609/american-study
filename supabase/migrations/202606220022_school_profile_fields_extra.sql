-- More public school-profile facets for the student-facing detail page.
-- Eight additional PUBLIC fields (head of school, endowment, application fee,
-- average SAT, students of color, faculty count, athletic conference, dorm
-- count). All are surfaced through get_school_extras alongside the existing
-- facets; the admin-only operational columns (niche_rank/is_partner/
-- last_checked_in) are still never returned by the RPC. Admins read/write these
-- directly via the existing schools_select_paid_or_admin RLS path (no new RPC).

alter table public.schools add column if not exists head_of_school text;
alter table public.schools add column if not exists endowment_usd bigint
  check (endowment_usd is null or endowment_usd >= 0);
alter table public.schools add column if not exists application_fee_usd integer
  check (application_fee_usd is null or application_fee_usd >= 0);
alter table public.schools add column if not exists avg_sat integer
  check (avg_sat is null or avg_sat between 400 and 1600);
alter table public.schools add column if not exists percent_students_of_color integer
  check (percent_students_of_color is null or percent_students_of_color between 0 and 100);
alter table public.schools add column if not exists faculty_count integer
  check (faculty_count is null or faculty_count >= 0);
alter table public.schools add column if not exists athletic_conference text;
alter table public.schools add column if not exists dorm_count integer
  check (dorm_count is null or dorm_count >= 0);

-- Recreate the public extras RPC so it also returns the new facets. The return
-- signature changes, so drop before recreate. Still guarded by
-- can_access_student and still SELECTs ONLY public columns.
drop function if exists public.get_school_extras(uuid, uuid);

create function public.get_school_extras(
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
  about text,
  head_of_school text,
  endowment_usd bigint,
  application_fee_usd integer,
  avg_sat integer,
  percent_students_of_color integer,
  faculty_count integer,
  athletic_conference text,
  dorm_count integer
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
    s.about,
    s.head_of_school,
    s.endowment_usd,
    s.application_fee_usd,
    s.avg_sat,
    s.percent_students_of_color,
    s.faculty_count,
    s.athletic_conference,
    s.dorm_count
  from public.schools as s
  where s.id = target_school_id;
end;
$$;

revoke execute on function public.get_school_extras(uuid, uuid) from public, anon;
grant execute on function public.get_school_extras(uuid, uuid) to authenticated;
