create or replace function public.admin_update_school_pick(
  target_student_id uuid,
  target_school_id uuid,
  new_admin_pick boolean,
  new_is_final_7 boolean,
  new_match_percent_override integer,
  new_match_reason text,
  new_sao_deadline date,
  new_status public.school_pick_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  final_count integer;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if new_match_percent_override is not null
    and new_match_percent_override not between 0 and 100
  then
    raise exception 'Match override must be between 0 and 100' using errcode = '22023';
  end if;

  if new_is_final_7 then
    select count(*)::integer
    into final_count
    from public.student_school_picks
    where student_id = target_student_id
      and is_final_7
      and school_id <> target_school_id;

    if final_count >= 7 then
      raise exception 'Final seven already contains seven schools' using errcode = '23514';
    end if;
  end if;

  insert into public.student_school_picks (
    student_id,
    school_id,
    match_percent,
    match_percent_override,
    admin_pick,
    is_final_7,
    match_reason,
    sao_deadline,
    status
  )
  values (
    target_student_id,
    target_school_id,
    public.compute_match(target_student_id, target_school_id),
    new_match_percent_override,
    new_admin_pick or new_is_final_7,
    new_is_final_7,
    nullif(btrim(new_match_reason), ''),
    new_sao_deadline,
    new_status
  )
  on conflict (student_id, school_id)
  do update set
    match_percent_override = excluded.match_percent_override,
    admin_pick = excluded.admin_pick,
    is_final_7 = excluded.is_final_7,
    match_reason = excluded.match_reason,
    sao_deadline = excluded.sao_deadline,
    status = excluded.status;
end;
$$;

revoke execute on function public.admin_update_school_pick(
  uuid,
  uuid,
  boolean,
  boolean,
  integer,
  text,
  date,
  public.school_pick_status
) from public, anon;
grant execute on function public.admin_update_school_pick(
  uuid,
  uuid,
  boolean,
  boolean,
  integer,
  text,
  date,
  public.school_pick_status
) to authenticated;
