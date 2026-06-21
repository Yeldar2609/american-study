# School Selection

_Date: 2026-06-20_

The app models **two distinct school concepts**. Keep them separate — they
answer different questions, live in different tables, and have different access
rules.

## 1. Current school (where the student studies now)

The Kazakh school the student currently attends. Used for the student profile,
not for matching or application workflow.

**Storage**

- `public.current_schools` — catalog of selectable schools.
- `public.students.current_school_id` — FK to the catalog (`on delete set null`).
- `public.students.is_independent_student` — boolean for students not attached
  to any school.
- `public.students.current_school` — legacy free-text column, **kept** as a
  display/fallback for schools not in the catalog.

**`current_schools` columns:** `id`, `name`, `city`, `region`, `country`
(default `'Kazakhstan'`), `type` (default `'school'`), `code`, `active`
(default `true`), `source`, `source_url` (must be `https://…` when set),
`created_at`, `updated_at`. Natural key: `lower(name)` + `lower(coalesce(city,''))`,
so re-seeds upsert instead of duplicating.

### Picker design

An accessible, searchable combobox in the **admin create + edit student**
forms. Behavior:

- Search the catalog by name/city; pick a row → sets `current_school_id`.
- **"Can't find my school"** free-text fallback → writes the legacy
  `current_school` text, leaving `current_school_id` null.
- **"Independent student"** → sets `is_independent_student = true`. This is a
  flag, **not** a catalog row.

The admin profile RPC `admin_update_student_profile` persists
`current_school_id`, `current_school`, and `is_independent_student` atomically.

### Backward compatibility

The legacy `current_school` text is never dropped. Existing students keep their
text value as a fallback; new selections prefer `current_school_id`. Display
should fall back: catalog name → legacy text → independent flag.

### RLS

`current_schools` is reference data:

- **Any authenticated user** may `select` rows where `active = true` (so the
  picker works for every role).
- **Admins** may read inactive rows and hold all write policies
  (insert/update/delete).

### Provenance

The seed is **curated** (`source = 'curated_seed'`) — a usable starter set, not
an official Kazakhstan registry. See [DATA_SOURCES.md](./DATA_SOURCES.md).

## 2. Target schools (US boarding schools the student applies to)

The application catalog used for matching and the application workflow.
**Significantly extended 2026-06-21** — see
[SCHOOL_PICKING_FIX.md](./SCHOOL_PICKING_FIX.md) and
[STUDENT_SCHOOL_VISIBILITY_AUDIT.md](./STUDENT_SCHOOL_VISIBILITY_AUDIT.md).

**Storage:** `public.schools` (catalog) + `public.student_school_picks`
(`starred`, `student_shortlisted`, `student_interest_level`, `student_note`,
`admin_pick`, `is_final_7`, `match_percent`). Reads go through the
`get_school_catalog` RPC (now returns the full detail set); `compute_match`
produces match scores.

### Access rules (target schools)

| Audience      | What they can do                                                                    |
| ------------- | ----------------------------------------------------------------------------------- |
| Trial student | See only `admin_pick` schools; **can save, shortlist, compare** them; full detail.  |
| Paid student  | Full searchable catalog; save, shortlist, compare (≤3), match breakdown.            |
| Parent        | Read-only (view detail + compare; no mutations).                                    |
| Admin         | Set final-7, override match %, deadline/status; see student saved/shortlisted lists. |

The trial save/shortlist boundary is enforced by `private.can_student_save`
(paid/admin, or own `admin_pick` school) inside the `set_school_*` RPCs. Parents
are rejected in the RPC. Server + database layers stay in sync. See
[SECURITY_REVIEW.md](./SECURITY_REVIEW.md).

### Student experience

Sectioned schools page (Recommended / Saved / Shortlist / Final / All), labeled
card actions (Save, Shortlist, View details, Website), a full `?school=<id>`
detail view with graceful "Not listed yet" for missing fields, and a dashboard
schools summary card. Student-facing copy is English only.

## Related

- [DATA_SOURCES.md](./DATA_SOURCES.md) — provenance of both catalogs.
- [TIMELINE_SOURCES.md](./TIMELINE_SOURCES.md) — deadline sourcing for targets.
