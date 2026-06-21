# Student School Visibility — Audit

_2026-06-21, branch `fix/student-school-browse-shortlist`._

## Symptom

Students could not reliably see, open, save, or browse schools.

## Root cause (verified in code, pre-fix)

| Where | Problem |
|---|---|
| `schools-workspace.tsx` (old `:46`) | The `"locked"` access state returned a **generic `loadError`** message — students saw "could not be loaded" instead of a helpful state. |
| `schools-workspace.tsx` (old `:117`) | `readOnly={role === "parent" \|\| access.packageState === "trial"}` — **every trial student** was read-only, so no save/compare. |
| `schools-workspace.tsx` (old `:105`, `:60`) | Filters and compare/breakdown were gated to `paid`/`admin` only. |
| `school-card.tsx` (old `:37`) | The favorite action rendered only when `!readOnly && role === "student"`, was a **bare heart icon** (no label), and there was **no detail view** at all. |
| `set_school_star` RPC (`:148`) | Hard `raise 'requires a paid package'` — trial students could not save even their assigned schools. |
| `get_school_catalog` RPC | Returned a thin payload; the TS parser ignored `grades` and the schema lacked boarding/international %, acceptance rate, SSAT, niche URL, notes — so a full profile could not be shown. |

## What data already existed

- `public.schools` has every detail field (setting, body, grades, enrollment, pct_boarding, pct_international, tuition, acceptance_rate, avg_ssat, financial aid, niche grade/URL, notes, website).
- `student_school_picks` had `starred`, `admin_pick`, `is_final_7`, `match_percent(_override)`, `match_reason`, `sao_deadline`, `status`.
- Trial visibility rule was already correct: `get_school_catalog` returns only `admin_pick` schools for trial, all for paid/admin.

## Access model (target, now implemented)

| Role / state | Sees | Can do |
|---|---|---|
| Trial student | Consultant-recommended schools only | View full detail, **save**, **shortlist**, **compare** (within recommended); locked preview for full DB |
| Paid student | Full database | Search, filter, view detail, save, shortlist, compare (≤3), see breakdown |
| Parent | Linked student's lists | View detail + compare; **no** mutations |
| Admin | All schools, per selected student | Add/remove picks, final-7, match override/reason, deadline, status; view student saved/shortlisted counts + lists |

## Changes needed (all delivered — see [SCHOOL_PICKING_FIX.md](./SCHOOL_PICKING_FIX.md))

1. Migration `202606210001_school_shortlist.sql`: shortlist/interest/note columns; `private.can_student_save` (paid OR own recommended); expanded `get_school_catalog`; `set_school_star` loosened; new `set_school_shortlist` / `set_school_interest`.
2. Data layer: richer catalog parser/type + `aid` filter; favorite/shortlist/interest server actions.
3. UI: helpful empty/locked states, sectioned student page (Recommended / Saved / Shortlist / Final / All), labeled card actions, a full school detail view, compare for trial, dashboard schools card, admin counts.
