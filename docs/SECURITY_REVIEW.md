# Security Review

_Date: 2026-06-20, branch `fix/schools-timeline-polish-release`._

## Model

Two enforcement layers kept in sync: the **server** (Next.js role guards) and the
**database** (RLS + SECURITY DEFINER RPCs). RLS is the authoritative boundary.

### Identity & roles
- Roles `student | parent | admin` in `public.users.role`; profile read only from
  `public.users`. `protect_user_security_fields` trigger forbids non-admin /
  non-service-role from changing `id/email/role/created_at`.
- Server guards: `requireRole` → `authenticatedRoleDestination` redirect logic
  (`src/lib/auth/access.ts`), unit-tested without a live DB.

### RLS helpers
`private.is_admin()`, `private.current_user_role()`,
`private.can_access_student(id, require_paid)`, `private.has_paid_student_access()`,
`private.is_unlocked(id)`. Student/parent reads gate on `can_access_student`;
parents are read-only; mutations go through admin-only or paid-gated RPCs.

### Access matrix (high level)
- **Students:** own data only; trial students see only `admin_pick` target schools
  and cannot star; paid unlocks the full catalog/workspace.
- **Parents:** linked students only; read-only (RPCs reject parent writes).
- **Admins:** all agency data; mutations via SECURITY DEFINER RPCs.

## Secrets & env
- Env is zod-validated (`src/lib/env.ts`), public vs private schemas separated.
- Service-role client (`src/lib/supabase/admin.ts`) is `import "server-only"` and
  returns `null` when unconfigured; used only in admin/import server actions.
- `SUPABASE_SERVICE_ROLE_KEY` lives **only** in Cloud Secret Manager, referenced by
  `apphosting.yaml` as a `secret` (RUNTIME only) — never inline, never `NEXT_PUBLIC_`.
- `.env.local` is gitignored; no secrets committed.

## New surface this branch
- `current_schools`: RLS = authenticated read **active** rows, admin-only writes
  (additive, reference data).
- `/api/health`: reports config presence only, **no** DB round-trip, no secrets.
- `/api/version`: name/version/commit only — no sensitive data.
- Kazakh locale: additive enum value; no access-control impact.

## Risks & recommendations
| Risk | Severity | Recommendation |
|---|---|---|
| `activity_log` exists but is never written → no audit trail | Medium | Add an audited-action helper; log admin mutations |
| No rate limiting on `admin_import_schools` (bulk) | Low | Admin-only + small catalog today; add limits if opened up |
| No CSV/PDF export permission model yet | Low | Define export scopes before adding exports; never export chat |

## Verdict
No secrets exposed, RLS enforced, role guards layered, new surface is additive and
least-privilege. Address the audit-trail gap before features that depend on it.
