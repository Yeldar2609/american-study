# Repo Audit — American Study

_Audited 2026-06-20 on branch `fix/schools-timeline-polish-release` (from `main` @ `67c5f11`)._
_Remote verified: `https://github.com/Yeldar2609/american-study.git` — **not** `navigator`._

## 1. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, `latest`), React 19, TypeScript (strict) |
| i18n | `next-intl`, `localePrefix: "always"`, locales `en`/`ru` (→ adding `kk`) |
| Backend | Supabase (SSR auth + Postgres + RLS), service-role for admin actions |
| Lint/format | Biome (double quotes, no semicolons, 2-space, 100 col) |
| Tests | Vitest (133 unit/integration), Playwright (e2e), pgTAP (DB) |
| Deploy | Firebase App Hosting (`american-study-web-app`, backend `american-study`, europe-west4) |
| Package manager | npm (Node 22.x) |

## 2. Baseline command results (pre-change)

| Command | Result | Notes |
|---|---|---|
| `npm install` | ✅ | clean |
| `npm run typecheck` | ✅ | no errors |
| `npm test` | ✅ | 26 files, **133 tests pass** |
| `npm run build` | ✅ | production build succeeds |
| `npm run lint` | ❌ → ✅ **fixed** | Biome failed only on **CRLF line endings** in the Windows working tree (committed blobs are LF; `git status` was clean). Fixed durably via `.gitattributes` (`* text=auto eol=lf`) + `core.autocrlf=false` + `npm run format`. No source content changed. |

## 3. Routing & auth

- Every page under `/[locale]/...`; middleware in `src/proxy.ts` chains next-intl + `refreshSupabaseSession`.
- Role guards: `requireRole` → `authenticatedRoleDestination` (`src/lib/auth/access.ts`). A user's stored `users.language` drives redirects (you are routed to *your* language).
- Roles: `student`, `parent`, `admin`. **Invite-only / admin-managed** (signup + Google removed in `67c5f11`; single-admin index dropped in `202606200001_multi_admin`).
- Three Supabase clients by privilege: `server.ts` (RLS, cookie), `client.ts` (browser), `admin.ts` (`server-only`, service-role). All return `null` when env missing.

## 4. Database (20 migrations, RLS-first)

- `students` stores **current school as free text** (`current_school text`) — **no FK, no catalog**. Edited only by admin via `admin_update_student_profile` RPC and `createStudentAction` (direct insert).
- Target schools: `schools` + `student_school_picks` (starred/admin_pick/is_final_7/match%). `get_school_catalog` RPC + `compute_match` engine.
- RLS helpers: `private.is_admin()`, `private.can_access_student(id, require_paid)`, `private.has_paid_student_access()`, `private.is_unlocked(id)`.
- `user_language` enum = `('en','ru')`; `handle_new_auth_user` hard-codes `('en','ru')`.

## 5. Current school-picking architecture

- **Current school (KZ):** free-text input in `student-profile-fields.tsx` / `create-student-form.tsx`; parsed by `student-form.ts` / `student-profile-form.ts` (`currentSchool: optionalText`). **No search, no validation, duplicates allowed.** → Replaced by a real catalog + searchable picker (Phase 2A).
- **Target schools:** fully working. `schools-workspace.tsx:117` gates with `readOnly={role==="parent" || access.packageState==="trial"}`. Trial students see only `admin_pick` schools; RLS + `set_school_star` RPC enforce paid-to-star; parents read-only; admin controls (final-7, match override, deadline, status) all present. **Not broken — verify + test only.**

## 6. Admin architecture

Create student (+ optional parent), edit profile, set package state, manage school picks, tasks/docs/essays, analytics dashboard, school CSV import RPC. **No CSV/PDF export of student data; `activity_log` table exists but is never written.**

## 7. Deployment config

- `apphosting.yaml`: public Supabase URL + publishable key inline; `SUPABASE_SERVICE_ROLE_KEY` via Cloud Secret Manager (RUNTIME only) — correct.
- Live URL: `https://american-study--american-study-web-app.europe-west4.hosted.app`
- CLI state: Supabase CLI **linked** to `jekazsybbcdfwfyvcxnn` (prod); Firebase CLI logged in as `yeldar@american-study.com`. **Docker absent** → DB work targets live DB via `supabase db push`.

## 8. Gaps / blockers addressed in this branch

| Area | Finding | Action |
|---|---|---|
| Lint | CRLF breaks Biome on Windows | ✅ `.gitattributes` + format |
| Current school | free text, no catalog | Phase 2A: `current_schools` table + picker + backward-compat |
| Locale | no `kk`; switcher shown to everyone | Phase 3: add `kk`; students EN-only no switcher; parents RU/EN/KK |
| Ops | no `/api/health`, `/api/version` | Phase 5: add both |
| Docs | sparse | Phases 6–9: full docs set |

## 9. Security posture (summary; full review in SECURITY_REVIEW.md)

Strong: RLS-first, SECURITY DEFINER RPCs, `server-only` admin client, null-on-missing-env, service-role never in client/`apphosting.yaml`. Watch items: `activity_log` unused (no audit trail), no CSV/PDF export permissions yet.

## 10. Fix order

1. Line-ending/lint fix ✅ → 2. `current_schools` migration + backend → 3. picker UI + integration → 4. `kk` locale + student/parent policy → 5. health/version → 6. green gate → 7. apply migrations to live DB → 8. polish → 9. docs → 10. commit/push/deploy/verify.
