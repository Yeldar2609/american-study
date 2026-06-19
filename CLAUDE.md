# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual EN/RU consulting portal for Kazakh students applying to US boarding
schools. Next.js (App Router) + Supabase (SSR auth + Postgres with RLS),
deployed on Firebase App Hosting. Roles are `student`, `parent`, `admin`
(exactly one admin, enforced by a partial unique index). The detailed milestone
plan lives in `.omo/plans/american-study.md`; `README.md` documents env setup,
Supabase/Firebase configuration, and per-milestone manual test scripts.

## Commands

```bash
npm run dev            # next dev (http://localhost:3000)
npm run build          # next build
npm run lint           # biome check .
npm run format         # biome check --write . (autofix)
npm run typecheck      # tsc --noEmit
npm test               # vitest run (unit + integration, jsdom)
npm run test:watch     # vitest watch
npm run test:e2e       # builds, then runs Playwright (port 3100, mobile+desktop chromium)
```

Run a single unit test: `npm test -- tests/access.test.ts` (or `-t "name"` to
filter by test name). Run one e2e spec: `npx playwright test tests/e2e/m1.spec.ts`.

Database (local Supabase; requires Docker):

```bash
npm run db:start       # supabase start
npm run db:reset       # apply migrations + seed.sql from scratch
npm run db:test        # pgTAP schema/RLS tests in supabase/tests
npm run db:lint        # supabase db lint --local --fail-on error
```

School catalog import (validate without credentials):

```bash
npm run import:schools -- data/schools.csv --dry-run
```

Full verification gate before landing: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.

## Architecture

**Routing & i18n.** Every page is under `/[locale]/...` with `localePrefix:
"always"` (`/en`, `/ru`) — see `src/i18n/routing.ts`. Middleware lives in
`src/proxy.ts` (Next.js `proxy` convention, not `middleware.ts`): it chains the
next-intl middleware with `refreshSupabaseSession` so every request both
localizes and refreshes the Supabase session cookie. UI strings come only from
`messages/{en,ru}.json` via next-intl (`src/i18n/request.ts` loads them); never
hardcode user-facing copy. A user's `language` is stored in `public.users` and
drives redirects — the app routes you to *your* language, so `/ru/app` for an
EN-profile user redirects to `/en/app/<role>`.

**Auth & role guards (two enforcement layers).** Security is enforced both in
the server (Next.js) and the database (RLS) — keep both in sync.
- Server layer: `src/lib/auth/session.ts` exposes `requireUser` →
  `requireAuthenticatedUser` → `requireRole(locale, expected)`. Role pages
  (`src/app/[locale]/app/[role]/page.tsx`) call `requireRole`, which redirects
  mismatched roles/locales to the caller's correct home and sends profile-less
  accounts to `/setup-required`. Pure redirect/destination logic is isolated in
  `src/lib/auth/access.ts` (e.g. `authenticatedRoleDestination`,
  `safeRedirectPath`) and unit-tested without a live Supabase.
- Profiles are read only from `public.users` (`role`, `language`).
  `resolveUserProfile` takes a `ProfileStore` interface (dependency-injected) so
  it's testable; it also performs a one-time migration of legacy auth-metadata
  profiles into `public.users`.

**Supabase clients (three, by privilege).** Pick the right one:
- `src/lib/supabase/server.ts` — SSR client (cookie-bound), for user-scoped
  reads/writes under RLS. **Returns `null` when env is missing** — callers must
  handle null and surface a controlled configuration error, never crash.
- `src/lib/supabase/client.ts` — browser client.
- `src/lib/supabase/admin.ts` — service-role client, `import "server-only"`,
  bypasses RLS. Use only for admin/import server actions. Also returns `null`
  when unconfigured.

**Env.** All env access goes through `src/lib/env.ts` (zod-validated). Public
(`NEXT_PUBLIC_*`) vs private schemas are separate; empty strings are coerced to
undefined. Use `readPublicEnv`/`readPrivateEnv` and the `hasSupabaseConfig*`
helpers rather than reading `process.env` directly. Never put a service-role key
or secret in a `NEXT_PUBLIC_*` var or in `apphosting.yaml`.

**Workspace dashboard.** `src/components/app/role-dashboard.tsx` is the central
router for the authed app: a `section` search param
(`home|roadmap|schools|essays|bookings|people|applications|resources`) selects a
workspace component, with admin-only branches for `people` (StudentManager),
`applications`, and analytics on `home`. Trial-vs-paid gating is computed by
`resolveWorkspaceAccess` in `src/lib/workspace/feature-access.ts` (`empty` /
`not_found` / `locked` / `ready`); `paidOnly` workspaces render a locked teaser
for trial students.

**Data & server-action layout.** Domain logic is grouped under `src/lib/`:
`workspace/`, `admin/`, `dashboard/`, `analytics/`, `schools/`. The convention
is `*-queries.ts` / `*-data.ts` for reads and `*-actions.ts` (`"use server"`)
for mutations; pure transform/validation helpers (e.g. form parsers, match
logic) are split into their own files so they can be unit-tested in isolation.

**Database.** Schema, types, RLS, RPCs, and grants are timestamped migrations in
`supabase/migrations/` (e.g. `202606130001_types_and_schema.sql`). RLS is the
authoritative access boundary; privileged operations go through SECURITY DEFINER
RPCs (`*_secure_rpcs.sql`) rather than direct table writes. pgTAP tests in
`supabase/tests/` assert the schema contract and RLS policies. `supabase/seed.sql`
provisions four local accounts, all with password `LocalTest123!`. The schools
table uses a natural key of `lower(name, state, city)`; `data/schools.csv` is the
authoritative catalog with checksums/row-counts in `data/schools.provenance.json`,
imported via a single validating RPC.

## Conventions

- **Formatting/lint is Biome** (`biome.json`): double quotes, no semicolons,
  2-space indent, 100-col width. Run `npm run format` to autofix.
- **Strict TypeScript and lint rules are errors, not warnings:** `noExplicitAny`,
  `noNonNullAssertion`, and `useImportType` are enforced; tsconfig adds
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and
  `noPropertyAccessFromIndexSignature`. Write code accordingly (use `import type`,
  narrow instead of `!`, guard index access).
- Import alias `@/*` → `src/*`.
- Vitest runs single-threaded (`maxWorkers: 1`); tests live in `tests/` (unit in
  `tests/unit/`, e2e in `tests/e2e/`) and must not depend on a live Supabase —
  use the dependency-injection seams (e.g. `ProfileStore`) instead.

## gstack

- **Use the `/browse` skill from gstack for ALL web browsing.** It drives a fast
  headless Chromium for QA, dogfooding, and scraping.
- **NEVER use `mcp__claude-in-chrome__*` tools.** Always route browsing through
  `/browse` instead.

Available gstack skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`,
`/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`,
`/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`,
`/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`,
`/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`,
`/document-generate`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`,
`/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`,
`/learn`.
