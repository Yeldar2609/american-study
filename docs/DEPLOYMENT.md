# Deployment

_Date: 2026-06-20._

## Topology

- **Frontend/runtime:** Firebase **App Hosting**, project `american-study-web-app`,
  backend `american-study` (region `europe-west4`, runtime nodejs), connected to the
  GitHub repo `Yeldar2609/american-study`. Live URL:
  `https://american-study--american-study-web-app.europe-west4.hosted.app`.
- **Backend data:** Supabase project `jekazsybbcdfwfyvcxnn` ("American Study").

## Environment variables

Configured in `apphosting.yaml`:
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public, BUILD + RUNTIME.
- `SUPABASE_SERVICE_ROLE_KEY` — **secret** via Cloud Secret Manager, RUNTIME only.
  Never inline, never `NEXT_PUBLIC_`.
- Optional `NEXT_PUBLIC_COMMIT_SHA` — surfaced by `/api/version` when set.

## Database migrations

Apply **before** deploying code (changes here are additive, so old code stays
compatible during the window):

```bash
npx supabase migration list --linked   # confirm pending
npx supabase db push                    # apply to linked prod project
```

The CLI is linked to `jekazsybbcdfwfyvcxnn`. Local Docker is **not** required (and
isn't available here) — `db push` targets the remote directly.

## Rollout

App Hosting auto-creates a rollout when the connected **live branch** (main) is
updated on GitHub. To deploy: merge the feature branch into `main`, push, and the
backend builds + rolls out. A rollout can also be triggered manually:

```bash
firebase apphosting:rollouts:create american-study --project american-study-web-app
```

## Post-deploy verification

1. `GET /api/health` → `{"status":"ok","supabaseConfigured":true,...}`
2. `GET /api/version` → name/version (and commit if `NEXT_PUBLIC_COMMIT_SHA` set).
3. Load `/en`, `/ru`, `/kk` (200; Kazakh renders, not a fallback).
4. Admin login → create/edit a student → current-school picker (search,
   "Independent", free-text fallback) saves.
5. Parent login → language switcher offers EN/RU/KK; student login → no switcher.

## Pre-deploy gate

`npm run lint && npm run typecheck && npm test && npm run build` (all green as of
this release). E2E (`npm run test:e2e`) requires Playwright browsers + a build.
