-- Public landing page consultation form (clone of american-study.com's lead form).
-- Anonymous visitors submit name + phone (+ optional email/grade); the lead lands
-- in the admin panel and notifies the admin. Inserts go ONLY through the SECURITY
-- DEFINER RPC below (anon has no direct table access); admins read/triage via RLS.

create table public.consultation_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  phone text not null check (length(btrim(phone)) between 3 and 40),
  email text check (email is null or length(btrim(email)) between 3 and 160),
  grade text check (grade is null or length(btrim(grade)) <= 40),
  locale text not null default 'ru' check (locale in ('en', 'ru', 'kk')),
  source text not null default 'landing' check (length(btrim(source)) between 1 and 40),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.consultation_leads enable row level security;

-- Only admins may read or triage leads. No anon/authenticated table policies:
-- the public insert is mediated entirely by submit_consultation_lead (definer).
create policy consultation_leads_admin_select on public.consultation_leads
  for select using ((select private.is_admin()));
create policy consultation_leads_admin_update on public.consultation_leads
  for update using ((select private.is_admin())) with check ((select private.is_admin()));

-- Public lead intake. Validates + trims, inserts the lead, and notifies admins.
create or replace function public.submit_consultation_lead(
  lead_name text,
  lead_phone text,
  lead_email text default null,
  lead_grade text default null,
  lead_locale text default 'ru'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := btrim(lead_name);
  clean_phone text := btrim(lead_phone);
  clean_email text := nullif(btrim(coalesce(lead_email, '')), '');
  clean_grade text := nullif(btrim(coalesce(lead_grade, '')), '');
  clean_locale text := lower(btrim(coalesce(lead_locale, 'ru')));
begin
  if clean_name = '' or length(clean_name) > 120 then
    raise exception 'A name is required' using errcode = '22000';
  end if;
  if clean_phone = '' or length(clean_phone) > 40 then
    raise exception 'A phone number is required' using errcode = '22000';
  end if;
  if clean_email is not null and length(clean_email) > 160 then
    raise exception 'Email is too long' using errcode = '22000';
  end if;
  if clean_grade is not null then
    clean_grade := left(clean_grade, 40);
  end if;
  if clean_locale not in ('en', 'ru', 'kk') then
    clean_locale := 'ru';
  end if;

  insert into public.consultation_leads (full_name, phone, email, grade, locale, source)
  values (clean_name, clean_phone, clean_email, clean_grade, clean_locale, 'landing');

  insert into public.notifications (user_id, type, title_en, title_ru, body_en, body_ru, link)
  select
    u.id,
    'lead',
    'New consultation request',
    'Новая заявка на консультацию',
    clean_name || ' — ' || clean_phone,
    clean_name || ' — ' || clean_phone,
    '/en/app/admin?section=leads'
  from public.users as u
  where u.role = 'admin';
end;
$$;

revoke execute on function public.submit_consultation_lead(text, text, text, text, text) from public;
grant execute on function public.submit_consultation_lead(text, text, text, text, text) to anon, authenticated;

-- Admin triage: mark a lead handled / unhandled.
create or replace function public.admin_set_lead_handled(target_lead_id uuid, new_handled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  update public.consultation_leads set handled = new_handled where id = target_lead_id;
end;
$$;

revoke execute on function public.admin_set_lead_handled(uuid, boolean) from public, anon;
grant execute on function public.admin_set_lead_handled(uuid, boolean) to authenticated;
