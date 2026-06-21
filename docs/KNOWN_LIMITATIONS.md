# Known Limitations

_Updated 2026-06-21, branch `fix/student-school-browse-shortlist`._

- **No CSV/PDF export of student data.** Admin can view applications/analytics, but
  there is no download/print export yet. (Chat content must never be exported.)
- **School detail is a `?school=<id>` panel, not a separate route.** This matches the
  section-based dashboard navigation; it is intentional, not a gap. See
  [SCHOOL_PICKING_FIX.md](./SCHOOL_PICKING_FIX.md).
- **School E2E tests not run here.** Playwright needs browsers + a build; the
  student browse/save/compare flows are covered by unit tests and manual/runtime
  smoke. RPC-level gating (trial-save, parent read-only) is enforced in the DB and
  covered by pgTAP suites that need Docker.
- **Tuition-range filter not added.** The "All schools" filters cover search, state,
  setting, student body, and financial aid; a tuition slider is future work.
- **Audit trail not populated.** `public.activity_log` exists in the schema but no
  code writes to it — admin actions are not yet audited. Recommend wiring an audited
  action helper before relying on it. See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md).
- **`current_schools` seed is curated, not official.** It is a starter set
  (`source='curated_seed'`), **not** an official Kazakhstan registry. The picker's
  free-text fallback covers anything missing. See [DATA_SOURCES.md](./DATA_SOURCES.md).
- **No admin UI to manage the current-school catalog.** Admins cannot yet
  add/deactivate `current_schools` rows from the UI (only via migration/SQL); the
  free-text fallback means this isn't blocking.
- **No dedicated universal-timeline UI.** The stage/template/task foundation exists;
  the unified view is future work. See [UNIVERSAL_TIMELINE.md](./UNIVERSAL_TIMELINE.md).
- **Docker not available in the build environment.** Local Supabase
  (`supabase start`, pgTAP) cannot run here; DB changes are applied to the linked
  live project via `supabase db push`. pgTAP suites still exist for CI/Docker hosts.
- **Student language is fixed to English.** By product decision students have no
  switcher; an admin cannot give a student a non-English UI. Parents/admins get
  EN/RU/KK.
- **`signup` route still present.** Auth is invite-only; the legacy signup route
  remains in the tree (admins create accounts). Not user-reachable in the intended
  flow.
