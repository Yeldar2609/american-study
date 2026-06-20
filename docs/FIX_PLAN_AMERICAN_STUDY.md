# Fix Plan — American Study

_Branch: `fix/schools-timeline-polish-release` · Date: 2026-06-20_

Prioritized plan executed on this branch, in order. Each item shipped as code,
a migration, or both. Companion docs are cross-linked where relevant.

## Done (in order)

1. **Current-school picker — catalog over free text.**
   Added `public.current_schools` catalog (migration
   `202606200002_current_school_picker.sql`) plus `students.current_school_id`
   (FK, `on delete set null`) and `students.is_independent_student`. Wired an
   accessible searchable combobox into the admin create + edit student forms,
   with a free-text fallback for schools not in the catalog. Legacy
   `students.current_school` text is preserved as a display/fallback value.
   See [SCHOOL_SELECTION.md](./SCHOOL_SELECTION.md).

2. **Curated current-school seed.**
   Seeded a starter set (American Study, Demo School, and several Astana
   schools) with `source = 'curated_seed'`. This is explicitly **not** an
   official Kazakhstan registry. See [DATA_SOURCES.md](./DATA_SOURCES.md).

3. **RLS for the new catalog.**
   `current_schools` is reference data: any authenticated user reads `active`
   rows (so the picker works for every role); admins read all rows and hold all
   write policies. See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md).

4. **Kazakh (kk) locale.**
   Added `kk` to the `user_language` enum (migration
   `202606200003_kazakh_language.sql`), to next-intl routing, and as
   `messages/kk.json`. The auth-user trigger now accepts `kk`.

5. **Locale policy: English-only students.**
   Students are locked to English with no language switcher; parents and admins
   may choose English / Russian / Kazakh. The switcher is hidden from students
   in the app sidebar. Enforced in the app layer.

6. **Ops endpoints.**
   Added `/api/health` (`status`, `supabaseConfigured`, `timestamp`) and
   `/api/version` (`name`, `version`, `commit` from `NEXT_PUBLIC_COMMIT_SHA`)
   for post-deploy verification. See [DEPLOYMENT.md](./DEPLOYMENT.md).

7. **Lint / EOL / build polish.**
   Resolved Biome lint findings and normalized line endings; reverified the
   local gate (lint, typecheck, 134 unit tests, production build all green).

8. **Documentation pass.**
   Authored this `docs/` set covering school selection, data provenance,
   timeline sourcing/update process, security, deployment, known limitations,
   and release notes.

## Applied to live

Migrations `202606200002` and `202606200003` are **already applied** to the
live Supabase project (ref `jekazsybbcdfwfyvcxnn`). See
[DEPLOYMENT.md](./DEPLOYMENT.md) for the rollout/verification runbook.

## Deferred / remaining

- **CSV / PDF export of student data** — not built yet.
- **Audit trail** — `activity_log` exists but is never written; no audit
  events are recorded yet.
- **Dedicated universal-timeline UI/table** — the roadmap workspace +
  `task_templates` remain the timeline mechanism. See
  [UNIVERSAL_TIMELINE.md](./UNIVERSAL_TIMELINE.md).
- **Rate limiting on bulk school import** — none today.
- **Authoritative current-schools registry** — replace the curated seed with a
  sourced dataset (name + URL + verified date + confidence per row).

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for the full honest list.
