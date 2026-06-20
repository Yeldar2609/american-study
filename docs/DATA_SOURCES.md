# Data Sources & Provenance

_Date: 2026-06-20_

This document records where each dataset comes from and how trustworthy it is.
The guiding rule: **be explicit about curated vs authoritative**, and never let
a curated placeholder be mistaken for an official source.

## Datasets

### Target schools — `public.schools` (authoritative)

- **Source of record:** `data/schools.csv`, committed to the repo.
- **Integrity:** checksums, exact row counts, and normalization notes recorded
  in `data/schools.provenance.json`.
- **Natural key:** `lower(name, state, city)`.
- **Import path:** a single validating RPC; validate without credentials via
  `npm run import:schools -- data/schools.csv --dry-run`.
- **Status:** **Authoritative** for the target-school catalog. Treated as the
  M2 catalog of US boarding schools.

### Current schools — `public.current_schools` (curated, NOT official)

- **Source tag:** `source = 'curated_seed'` on every seeded row.
- **Contents:** a starter set — American Study, Demo School, and several Astana
  schools (NIS Physics-Math, Haileybury Astana, Miras, QSI, Astana
  International School, NIS Chemistry-Biology, Lyceum No. 60, Gymnasium No. 5).
- **Status:** **Curated, not authoritative.** This is **not** an official
  Kazakhstan school registry — it exists so the picker is usable on day one.
- **Per-row provenance fields:** `source` and `source_url` (`https://…` when
  set) already exist on the table; future authoritative imports should populate
  them.
- **Independent students:** represented by `students.is_independent_student`,
  not by a catalog row.

See [SCHOOL_SELECTION.md](./SCHOOL_SELECTION.md) for the picker design.

### Timeline / deadline facts

Covered separately. See [TIMELINE_SOURCES.md](./TIMELINE_SOURCES.md) and
[TIMELINE_UPDATE_PROCESS.md](./TIMELINE_UPDATE_PROCESS.md).

## Curated vs authoritative — at a glance

| Dataset                   | Source                  | Status        |
| ------------------------- | ----------------------- | ------------- |
| Target schools            | `data/schools.csv`      | Authoritative |
| Current schools (seed)    | `curated_seed`          | Curated       |
| Application deadlines      | per task template / RPC | Mixed — verify |

## Rule: every official date carries its provenance

Any date presented to users as an **official** application/program deadline
**must** carry four fields:

1. **Source name** — the issuing organization (e.g. "SSAT", "SAO/Ravenna",
   the specific school).
2. **Source URL** — the canonical page the date was read from.
3. **Verified date** — when a human last confirmed the value against the source.
4. **Confidence** — `confirmed` (read from the source) vs `estimated`
   (carried over / inferred; flag for review).

A date without these four fields is **curated**, not authoritative, and must be
presented as guidance — not as a guaranteed deadline. Do **not** hardcode
future official dates as permanent; treat them as time-boxed and re-verify
annually per [TIMELINE_UPDATE_PROCESS.md](./TIMELINE_UPDATE_PROCESS.md).
