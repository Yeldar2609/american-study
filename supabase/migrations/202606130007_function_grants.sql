revoke execute on all functions in schema public from public, anon;

grant execute on function public.get_my_diagnostic_summary() to authenticated;
grant execute on function public.get_my_matched_schools() to authenticated;
grant execute on function public.set_school_pick_starred(uuid, boolean) to authenticated;
grant execute on function public.compute_match(uuid, uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_set_student_package_state(
  uuid,
  public.package_state
) to authenticated;

alter default privileges in schema public
  revoke execute on functions from public, anon;
