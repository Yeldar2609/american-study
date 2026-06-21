# Release Notes

## 2026-06-21 — Student school browse, save, shortlist, compare, full detail

Branch: `fix/student-school-browse-shortlist` (merged to `main` `65d0993`).

### Added
- **Student schools experience.** Sectioned page (Recommended / Saved / Shortlist /
  Final / All), labeled card actions (Save, Shortlist, View details, Website), a full
  `?school=<id>` **detail view** (every field, graceful "Not listed yet"), and a
  dashboard schools card (counts + next deadline + CTA).
- **Shortlist + interest.** `student_school_picks` gains `student_shortlisted`,
  `student_interest_level`, `student_note`, `updated_at`; new `set_school_shortlist`
  / `set_school_interest` actions/RPCs.
- **Trial students can save/shortlist/compare** the schools their consultant assigned
  (gated by `private.can_student_save`); the full searchable database stays paid/admin.
- **Richer catalog + aid filter.** `get_school_catalog` now returns the full detail
  set; "All schools" adds a financial-aid filter.

### Database (applied to live project `jekazsybbcdfwfyvcxnn`)
- `202606210001_school_shortlist.sql`

### Quality gate
lint ✅ · typecheck ✅ · 136 unit tests ✅ · production build ✅ · local boot smoke ✅.

### Deploy
Code merged to `main` (`65d0993`) and pushed; migration applied to live DB. The
production rollout requires a fresh `firebase login --reauth` (the CLI token expired)
— see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 2026-06-20 — Current-school picker, Kazakh locale, ops endpoints

Branch: `fix/schools-timeline-polish-release`.

### Added
- **Current-school picker.** New `current_schools` catalog and an accessible
  searchable combobox in the admin create/edit student forms — search by
  name/city/code, an **Independent student** option, and a free-text fallback for
  schools not in the catalog. Backed by `students.current_school_id` +
  `is_independent_student` (legacy `current_school` text retained).
  See [SCHOOL_SELECTION.md](./SCHOOL_SELECTION.md).
- **Kazakh language (kk).** Full `messages/kk.json`, `user_language` enum value,
  routing locale. `/kk` verified rendering Kazakh.
- **Ops endpoints.** `/api/health` and `/api/version`.

### Changed
- **Locale policy.** Students are **English-only with no language switcher**
  (provisioned `en`, switcher hidden). Parents/admins choose **EN / RU / KK** via a
  redesigned 3-language switcher.
- **Lint/EOL.** Pinned LF via `.gitattributes` so Biome passes cross-platform
  (no source content change).

### Database (applied to live project `jekazsybbcdfwfyvcxnn`)
- `202606200002_current_school_picker.sql`
- `202606200003_kazakh_language.sql`

### Quality gate
lint ✅ · typecheck ✅ · 134 unit tests ✅ · production build ✅ · runtime smoke
(`/api/health`, `/api/version`, `/en` `/ru` `/kk`) ✅.

### Known limitations
See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) (no CSV/PDF export, audit log not
populated, curated current-school seed, no dedicated universal-timeline UI).

### Timeline review log
- 2026-06-20 — initial documentation of the timeline sourcing + annual update
  process (no deadline data re-verified this pass). See
  [TIMELINE_UPDATE_PROCESS.md](./TIMELINE_UPDATE_PROCESS.md).
