-- App settings: admin-editable key/value configuration.
-- First setting is the calendar booking link (previously env-only). Reads are
-- open to authenticated users (the booking link is surfaced to students and
-- parents); writes go only through the admin-gated setter below.

create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.app_settings enable row level security;

-- Any signed-in user may read settings; the booking link must be visible so
-- students and parents can reach the scheduling page. No write policy exists:
-- mutations run through admin_set_app_setting, which executes as definer.
create policy app_settings_select_authenticated
  on public.app_settings
  for select
  to authenticated
  using (true);

-- Admin-only upsert of a single setting. Generic on purpose so future settings
-- need no new RPC; per-value validation lives in the calling server action.
create or replace function public.admin_set_app_setting(
  setting_key text,
  setting_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  insert into public.app_settings (key, value, updated_at, updated_by)
  values (setting_key, setting_value, now(), auth.uid())
  on conflict (key) do update
  set
    updated_at = now(),
    updated_by = auth.uid(),
    value = excluded.value;
end;
$$;

revoke execute on function public.admin_set_app_setting(text, text) from public, anon;
grant execute on function public.admin_set_app_setting(text, text) to authenticated;
