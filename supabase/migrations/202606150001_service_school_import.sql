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
    strengths,
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
    coalesce(row.strengths, '{}'),
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
    strengths text[],
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
    strengths = excluded.strengths,
    website_url = excluded.website_url,
    niche_profile_url = excluded.niche_profile_url,
    notes = excluded.notes;

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

revoke execute on function public.admin_import_schools(jsonb) from public, anon;
grant execute on function public.admin_import_schools(jsonb) to authenticated, service_role;
