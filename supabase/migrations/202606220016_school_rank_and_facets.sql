-- Top US boarding-school catalog expansion support.
-- Adds an ADMIN-ONLY niche_rank plus public-facing sports/extracurriculars/about
-- facets to schools. niche_rank is deliberately NOT exposed by get_school_catalog
-- (the student/parent/admin catalog RPC), so it never reaches the student or
-- parent UI; admins read/set it only through the admin-gated RPCs below.

alter table public.schools add column if not exists niche_rank integer
  check (niche_rank is null or niche_rank >= 1);
alter table public.schools add column if not exists sports text[] not null default '{}';
alter table public.schools add column if not exists extracurriculars text[] not null default '{}';
alter table public.schools add column if not exists about text;

-- Extend the bulk importer to carry the new facets (rank stays optional; the
-- public seed loads names + locations and leaves rank null for admins to fill).
create or replace function public.admin_import_schools(import_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  imported_count integer;
begin
  if (select auth.role()) is distinct from 'service_role' and not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if jsonb_typeof(import_rows) <> 'array' then
    raise exception 'School import payload must be a JSON array'
      using errcode = '22023';
  end if;

  insert into public.schools (
    name,
    state,
    city,
    setting,
    student_body,
    affiliation,
    grades,
    enrollment,
    pct_boarding,
    pct_international,
    boarding_tuition_usd,
    acceptance_rate_pct,
    avg_ssat_pctile,
    offers_financial_aid,
    niche_grade,
    niche_rank,
    strengths,
    sports,
    extracurriculars,
    about,
    website_url,
    niche_profile_url,
    notes
  )
  select
    row.name,
    row.state,
    row.city,
    row.setting,
    row.student_body,
    row.affiliation,
    row.grades,
    row.enrollment,
    row.pct_boarding,
    row.pct_international,
    row.boarding_tuition_usd,
    row.acceptance_rate_pct,
    row.avg_ssat_pctile,
    row.offers_financial_aid,
    row.niche_grade,
    row.niche_rank,
    coalesce(row.strengths, '{}'),
    coalesce(row.sports, '{}'),
    coalesce(row.extracurriculars, '{}'),
    row.about,
    row.website_url,
    row.niche_profile_url,
    row.notes
  from jsonb_to_recordset(import_rows) as row (
    name text,
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
    niche_rank integer,
    strengths text[],
    sports text[],
    extracurriculars text[],
    about text,
    website_url text,
    niche_profile_url text,
    notes text
  )
  on conflict (natural_key)
  do update set
    setting = excluded.setting,
    student_body = excluded.student_body,
    affiliation = excluded.affiliation,
    grades = excluded.grades,
    enrollment = excluded.enrollment,
    pct_boarding = excluded.pct_boarding,
    pct_international = excluded.pct_international,
    boarding_tuition_usd = excluded.boarding_tuition_usd,
    acceptance_rate_pct = excluded.acceptance_rate_pct,
    avg_ssat_pctile = excluded.avg_ssat_pctile,
    offers_financial_aid = excluded.offers_financial_aid,
    niche_grade = excluded.niche_grade,
    -- Only overwrite rank/facets when the incoming row actually provides them,
    -- so a names-only seed re-import never wipes ranks an admin has filled in.
    niche_rank = coalesce(excluded.niche_rank, public.schools.niche_rank),
    strengths = excluded.strengths,
    sports = case when excluded.sports = '{}' then public.schools.sports else excluded.sports end,
    extracurriculars = case
      when excluded.extracurriculars = '{}' then public.schools.extracurriculars
      else excluded.extracurriculars
    end,
    about = coalesce(excluded.about, public.schools.about),
    website_url = excluded.website_url,
    niche_profile_url = excluded.niche_profile_url,
    notes = excluded.notes;

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

revoke execute on function public.admin_import_schools(jsonb) from public, anon;
grant execute on function public.admin_import_schools(jsonb) to authenticated, service_role;

-- Admin-only: set/clear a school's Niche rank.
create or replace function public.admin_set_school_rank(target_school_id uuid, new_rank integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if new_rank is not null and new_rank < 1 then
    raise exception 'Rank must be a positive integer' using errcode = '22000';
  end if;
  update public.schools set niche_rank = new_rank where id = target_school_id;
end;
$$;

revoke execute on function public.admin_set_school_rank(uuid, integer) from public, anon;
grant execute on function public.admin_set_school_rank(uuid, integer) to authenticated;

-- Admin-only catalog with rank (the ONLY surface that exposes niche_rank).
create or replace function public.admin_list_schools()
returns table (
  school_id uuid,
  name text,
  state text,
  city text,
  niche_grade text,
  niche_rank integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select s.id, s.name, s.state, s.city, s.niche_grade, s.niche_rank
  from public.schools as s
  order by s.niche_rank asc nulls last, s.name;
end;
$$;

revoke execute on function public.admin_list_schools() from public, anon;
grant execute on function public.admin_list_schools() to authenticated;
