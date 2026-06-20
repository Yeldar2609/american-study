# Timeline Sources

_Date: 2026-06-20._

How application/program timeline facts enter the product and how trustworthy each
class of date is. See also [DATA_SOURCES.md](./DATA_SOURCES.md) and
[TIMELINE_UPDATE_PROCESS.md](./TIMELINE_UPDATE_PROCESS.md).

## Where timeline data lives

- **`public.task_templates`** — reusable milestones (`stage`, `section`,
  `title_en/ru`, `description_en/ru`, `default_offset_days`, `applies_to`). These
  define the *shape* of a student's journey (relative offsets, not fixed dates).
- **`public.application_tasks`** — the per-student instantiation, including a
  concrete `due_date` and `status`.
- **`student_school_picks.sao_deadline`** — per-school application deadline set by
  an admin.

## Classes of date

| Class | Example | Storage | Status |
|---|---|---|---|
| Relative offset | "Request recommendations 60 days before deadline" | `task_templates.default_offset_days` | Curated, stable |
| Per-student due date | a task's `due_date` | `application_tasks.due_date` | Admin-set, operational |
| Official school/program deadline | a school's SAO deadline | `student_school_picks.sao_deadline` | **Must be verified** |

## Rule for official deadlines

Any date shown to users as an **official** deadline must carry: **source name,
source URL, verified date, confidence** (`confirmed` vs `estimated`). A date
lacking these is **guidance**, not a guarantee. Do **not** hardcode future
official dates as permanent — they are time-boxed and re-verified annually
(see [TIMELINE_UPDATE_PROCESS.md](./TIMELINE_UPDATE_PROCESS.md)).

> Today the relative offsets are curated and stable; concrete deadlines are
> admin-entered per student/school. There is no automated feed of official
> deadlines — they are entered and verified by staff.
