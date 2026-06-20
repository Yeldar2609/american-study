# Timeline Update Process

_Date: 2026-06-20._

Application cycles repeat annually, so deadlines and milestones must be re-verified
every year. This is the owner + cadence + steps for keeping the timeline current.

## Owner & cadence

- **Owner:** the admin/consultant team.
- **Cadence:** once per cycle, **by 1 July** each year (ahead of the autumn
  application season), plus ad-hoc when a school announces a change.

## Steps

1. **Review templates.** Open `supabase/seed.sql` / `task_templates` and confirm
   each milestone's `default_offset_days` still reflects current best practice.
2. **Re-verify official deadlines.** For each school's `sao_deadline` and any
   program deadline shown as official, open the canonical source (school site /
   SSAT / SAO-Ravenna), confirm the date, and record **source, URL, verified
   date, confidence** (see [TIMELINE_SOURCES.md](./TIMELINE_SOURCES.md)).
3. **Flag stale dates.** Any date not re-confirmed this cycle is downgraded to
   `estimated` and surfaced as guidance, not a guarantee.
4. **Apply changes** via migrations (for template changes) or the admin UI (for
   per-student/per-school dates). Never edit production data by hand without a
   migration or an audited admin action.
5. **Record the review** in [RELEASE_NOTES.md](./RELEASE_NOTES.md) (date + who).

## Guardrails

- Do not hardcode future official dates as permanent in code.
- Treat curated offsets and official deadlines as separate (see
  [DATA_SOURCES.md](./DATA_SOURCES.md)); only the latter require external sources.
