# Universal Timeline

_Date: 2026-06-20._

## Concept

A "universal timeline" is a single, stage-driven view of a student's whole journey
— diagnostic → list building → finalized → application → submitted — where every
milestone (tasks, essays, recommendations, bookings, deadlines) appears on one
chronological track with clear next-action and overdue states.

## How it maps to the current model

The pieces already exist; they are not yet unified into one dedicated timeline UI:

- **Stages:** `students.stage` (`student_stage` enum) drives the journey phase.
- **Milestone definitions:** `public.task_templates` (`stage`, `section`,
  `default_offset_days`, `applies_to`) — the reusable backbone of a timeline.
- **Per-student items:** `public.application_tasks` (`due_date`, `status`) plus
  `essays`, `recommendations`, `bookings`, and `student_school_picks.sao_deadline`.
- **Surfaces:** the roadmap workspace and dashboard already show stage, progress,
  next milestone, and overdue counts.

## Status & future work

A standalone aggregated "universal timeline" component (one merged, sorted feed of
all milestone types with overdue highlighting) is **not built in this pass**. The
foundation (templates + dated tasks + stage) is in place; building the unified view
is tracked in [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md). Sourcing rules for any
dates it surfaces are in [TIMELINE_SOURCES.md](./TIMELINE_SOURCES.md).
