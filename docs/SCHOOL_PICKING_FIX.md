# School Picking Fix

_2026-06-21, branch `fix/student-school-browse-shortlist`. See
[STUDENT_SCHOOL_VISIBILITY_AUDIT.md](./STUDENT_SCHOOL_VISIBILITY_AUDIT.md) for root cause._

## Database — `202606210001_school_shortlist.sql`

- `student_school_picks` gains `student_shortlisted`, `student_interest_level`
  (`exploring|interested|shortlisted|not_interested`), `student_note`, `updated_at`
  (+ touch trigger, partial index).
- `private.can_student_save(student, school)` — true if the student is unlocked
  (paid/admin) **or** owns the record and the school is an `admin_pick` for them.
  This is the trial-student loosening.
- `get_school_catalog` dropped + recreated returning the full detail set
  (boarding/international %, acceptance rate, SSAT, niche grade/URL, notes,
  affiliation, grades) plus `student_shortlisted/interest_level/note`. Visibility
  rule unchanged: trial → `admin_pick` only; paid/admin → all.
- `set_school_star` now gates on `can_student_save`. New `set_school_shortlist`
  and `set_school_interest` follow the same rule. Parents are rejected; the
  student/admin boundary and paid-vs-recommended boundary are enforced in the DB.

## Data layer

- `src/lib/workspace/school-catalog.ts`: schema/type/parser extended with all
  detail fields + pick state; `SchoolCatalogFilters` adds `aid`; `filterSchoolCatalog`
  filters by financial aid. Missing fields parse to `null` (rendered "Not listed yet").
- `src/lib/workspace/school-actions.ts`: `setSchoolStarAction`,
  `setSchoolShortlistAction`, `setSchoolInterestAction` (shared guard; parents blocked).

## UI

- `schools-workspace.tsx`: helpful states (no generic load error for access states),
  a `?school=<id>` **detail view**, count tiles, and sections — Recommended, Saved,
  Shortlist, Final (when present), All (paid grid + filters; trial = locked preview CTA).
  Compare works for trial within the recommended set.
- `school-card.tsx`: text-labeled **Save/Saved**, **Shortlist/In shortlist**,
  **View details**, **Website**, recommended/final badges.
- `school-detail.tsx` (new): every field with graceful "Not listed yet", match reason,
  breakdown (paid/admin), save/shortlist/roadmap/website/Niche actions, back link.
- `school-comparison.tsx`: richer rows (location, enrollment, status, saved,
  shortlisted); match-factor rows only when unlocked.
- `student-schools-summary.tsx` (new): dashboard card with recommended/saved/shortlist
  counts, next deadline, and a "Review your schools" / "Waiting for consultant picks" CTA.

## How to debug an empty school list

1. Trial student + no admin picks → expected "Waiting for consultant picks". Add picks
   in the admin People → student → Schools view (set a school's "Recommended").
2. Paid student + empty → check `package_state = 'paid'` and that `get_school_catalog`
   returns rows (RLS/RPC). `/api/health` confirms Supabase is configured.
3. Generic load error → a real RPC/parse error, not an access state.

## Copy

Student-facing copy is English only and uses plain terms (Recommended, Saved,
Shortlist, Final list, "Why it fits", "Application deadline", "Boarding tuition").
Internal terms (`admin_pick`, `package_state`, RPC names) never appear in the UI.
