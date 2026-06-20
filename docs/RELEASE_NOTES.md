# Release Notes

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
