-- Multiple admins/staff. The app originally enforced exactly one admin via a
-- partial unique index. Per product decision, admins/staff are now created and
-- managed by an existing admin (invite-only), so the single-admin constraint is
-- dropped. RLS and the protect_user_security_fields trigger still gate who may
-- change roles (admins / service role only).
drop index if exists public.users_single_admin_idx;
