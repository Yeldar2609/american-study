# American Study

Bilingual EN/RU consulting portal for Kazakh students applying to US boarding
schools. Milestone 1 provides the production application foundation: localized
public and auth pages, Supabase SSR auth wiring, server-side role guards,
responsive role previews, and a polished locked feature state.

## Requirements

- Node.js 22
- npm 10+
- A Supabase project for live authentication

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The public pages and fixture-only previews work
without secrets. Auth actions show a controlled configuration error until the
Supabase variables are supplied.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |
| `NEXT_PUBLIC_APP_URL` | Canonical app origin used for auth callbacks and password reset redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations and CSV imports |

Never add a Supabase secret or service-role key to a `NEXT_PUBLIC_*` variable.
Do not add `SUPABASE_SERVICE_ROLE_KEY` to `apphosting.yaml`; configure it as a
Firebase App Hosting backend secret.

`apphosting.yaml` provides the canonical app origin, browser-safe Supabase URL,
and publishable key at both build time and runtime.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```

## Supabase Setup

1. Create a Supabase project and copy its project URL and publishable key.
2. Enable email/password in Supabase Auth.
3. Keep the Google provider disabled for this phase. The Google button is
   intentionally inert while email/password remains available.
4. Add these local URLs to Supabase Auth's allowed redirect URLs:
   `http://localhost:3000/auth/callback`,
   `http://localhost:3000/en/update-password`, and
   `http://localhost:3000/ru/update-password`.
5. Apply the migrations under `supabase/migrations`, then configure
   `SUPABASE_SERVICE_ROLE_KEY` only in the server runtime.
6. The application reads role and language only from `public.users`. Accounts
   without a provisioned profile remain on the setup-required screen.

The authoritative M2 catalog is committed as `data/schools.csv`, with source
checksums, exact row counts, and normalization notes in
`data/schools.provenance.json`. Validate it without credentials:

```bash
npm run import:schools -- data/schools.csv --dry-run
```

Live CLI imports require `NEXT_PUBLIC_SUPABASE_URL` and the server-only
`SUPABASE_SERVICE_ROLE_KEY`; the validated batch is written in one database
RPC. The append-only authoritative-school migration provides the database
password path when a service-role key is unavailable.

## Firebase App Hosting

1. Create an App Hosting backend for this repository and wait for Firebase to
   assign its HTTPS backend URL.
2. Set `NEXT_PUBLIC_APP_URL` in `apphosting.yaml` to the exact backend origin,
   without a trailing slash.
3. Trigger a new rollout so Next.js embeds the production origin during the
   build.
4. In Supabase Auth URL configuration, set the Site URL to the same origin and
   allow these exact production redirects:
   `<APP_URL>/auth/callback`, `<APP_URL>/en/update-password`, and
   `<APP_URL>/ru/update-password`.
5. If a custom domain becomes canonical, update `NEXT_PUBLIC_APP_URL`, the
   Supabase Site URL, and all three allowed redirects, then trigger another
   rollout.

The committed App Hosting configuration contains public values only. Do not add
a Supabase secret key or service-role key to `apphosting.yaml`.

## Milestone 1 Manual Tests

- Open `/en` and `/ru`; verify every visible string uses the selected language.
- Use the switcher on `/en/login`; verify `/ru/login` and Russian copy.
- Verify the Google button is disabled in EN and RU while email/password fields
  remain usable.
- With configured Supabase, verify email login, signup confirmation, reset,
  logout, and session persistence.
- Provision each valid role in `public.users` and verify `/[locale]/app`
  dispatches to the matching shell.
- Open a different role URL directly; verify the server redirects to the user's
  assigned role.
- Check student, parent, and admin previews at 320px, 390px, 768px, and 1440px.
- Navigate by keyboard; verify visible focus, labeled fields, and one unlock CTA.

## Future Milestone Checks

### M2: Data, RLS, and Admin Profiles

- Apply migrations from a clean Supabase project.
- Run `npm exec supabase -- test db` and verify all pgTAP schema/RLS checks pass.
- Log in with the local fixtures from `supabase/seed.sql`; every fixture uses
  password `LocalTest123!`.
- Dry-run `data/schools.csv`; verify 70 accepted rows, zero rejected rows, and
  the checksum recorded in `data/schools.provenance.json`.
- Create linked student and parent users; edit every centralized student field.
- Test anonymous, owner, linked-parent, unrelated-user, and admin database access.

### M3: Trial Experience

- Confirm trial users can read only their diagnostic summary and 8-15 admin picks.
- Request every locked route and data endpoint directly; confirm server/RLS denial.
- Confirm all locked teasers are translated and use one unlock CTA.

### M4: Matching and Paid Schools

- Verify five equal sub-scores, deterministic rounding, missing inputs, and override.
- Filter the paid school database, star schools, compare picks, and finalize seven.
- Toggle trial/paid and confirm immediate UI and server access changes.

### M5: Roadmap and Tasks

- Move general and per-school tasks through every allowed status.
- Verify YouTube embeds, Drive links, progress, overdue state, and SAO deadlines.

### M6: Essays and Bookings

- Move essays through all statuses and show consultant feedback plus Drive links.
- Open each of the five call types through the configured Calendar booking page.

### M7: Parent, Outreach, and Deploy

- Switch between linked students and verify progress and overdue totals.
- Compare admin applied-school data with the exported CSV.
- Deploy preview and production to Firebase App Hosting; verify each backend's
  environment and Supabase auth redirects.

The detailed execution plan is in `.omo/plans/american-study.md`.
