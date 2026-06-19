# Demo Removal Report

Task 1 inventory and remediation for the American Study production app.

| Artifact found | Location | Resolution |
| --- | --- | --- |
| Public role preview route | `src/app/[locale]/preview/[role]/page.tsx` | Deleted. The production route table no longer contains `/preview`. |
| Student-app preview CTA | `src/components/landing/hero.tsx` | Replaced with a real in-page link to the localized product journey. |
| Preview-only component branches | `role-dashboard.tsx`, `app-sidebar.tsx`, `student-manager.tsx`, `create-student-form.tsx`, `locked-card.tsx` | Deleted. Components now serve authenticated production behavior only. |
| Hardcoded progress values `78`, `64`, and `58` | `src/components/app/role-dashboard.tsx` | Replaced with approved-task progress calculated from real `application_tasks` counts returned by Supabase. |
| Fake student name and greeting | `messages/en.json`, `messages/ru.json` | Replaced with the authenticated user's real `users.full_name`. |
| Fake active-student and overdue counts | Translation catalogs and role dashboard | Replaced with real student/task aggregates. |
| Fake next task and deadline | Translation catalogs and role dashboard | Replaced with the earliest real non-approved application task and localized date formatting. |
| Fake diagnostic themes | Translation catalogs and role dashboard | Replaced with real `students.diagnostic_summary`; missing summaries render a localized empty state. |
| Milestone/preview section copy | Translation catalogs and role dashboard | Replaced with localized empty states or a locked state for trial accounts. |
| Non-functional unlock query-string CTA | `src/components/locked-card.tsx` | Removed. The card now gives an honest localized instruction to contact the consultant. |
| Six local fixture accounts | `supabase/seed.sql` | Reduced to four test accounts: admin, trial student, paid student, and linked paid parent. |
| Canned local diagnostic summaries | `supabase/seed.sql` | Removed. New test students start with `null` summaries. |
| Trial-parent and unrelated-user seed records used by RLS tests | `supabase/seed.sql` | Moved into rollback-scoped pgTAP setup in `supabase/tests/001_rls_access.test.sql`. |
| Preview-driven Playwright tests | `tests/e2e/m1.spec.ts` | Replaced with real EN/RU landing, auth, routing, responsive, 404, and accessibility checks. |
| Preview references in setup documentation | `README.md` | Replaced with authenticated dashboard and four-account seed instructions. |
| Inline landing steps | `src/components/landing/hero.tsx` | Retained: translated static product-process labels, not user or database data. |
| Inline navigation items and icon map | `src/components/app/app-sidebar.tsx` | Retained: static route configuration, not rendered fixture data. |
| Role, locale, CSV-header, and US-state constants | `src/lib/**` | Retained: validated domain/reference data, not mocks. |
| `mock_interview` booking type | Core schema migration | Retained: real business booking category for mock-interview calls. |
| `sample_youtube_id` column | Expanded schema migration | Retained: real optional reference-video field; no sample row is seeded. |
| HTML `placeholder` attribute and translated email hint | Input/auth components and catalogs | Retained: real form accessibility/UX behavior, not placeholder records. |
| Vitest `mockResolvedValue` calls | Unit tests | Retained: narrow failure-path test doubles; no production code imports them. |
| CSV files under `tests/fixtures` | Import tests | Retained: isolated parser test inputs; production catalog remains `data/schools.csv`. |
| Vitest mocker dependency | `package-lock.json` | Retained: transitive test-runner dependency. |
| Production server functions returning constants | Production `src` audit | None found. Constant returns are typed configuration/error outcomes or real empty results. |

## Production data path

- `public.get_dashboard_students()` applies explicit role filtering and returns accessible students.
- Task progress, overdue counts, and next tasks come from `public.application_tasks`.
- Trial student task details are not returned; their paid-only workspaces render locked states.
- Student names come from `public.users`.
- Diagnostic summaries come from `public.students`.
- Empty databases render localized empty states instead of fabricated rows.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm test` - 58 tests passed
- `npm run build`
- `npm run test:e2e` - 14 mobile/desktop EN/RU scenarios passed
- Axe found no serious or critical accessibility violations on EN/RU landing and login pages.

The SQL migration could not be pushed from this machine because the Supabase CLI
access token is not configured. The local pgTAP command also requires a running
local Supabase database.
