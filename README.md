# American Study

Bilingual EN/RU consulting portal for Kazakh students applying to US boarding
schools. Milestone 1 provides the production application foundation: localized
public and auth pages, Supabase SSR auth wiring, server-side role guards,
responsive role previews, and a polished locked feature state.

## Requirements

- Node.js 22
- npm 10+
- A Supabase project for live authentication
- Google OAuth configured in Google Cloud and Supabase for live Google sign-in

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
| `NEXT_PUBLIC_APP_URL` | Canonical app origin used for auth callbacks |

Never add a Supabase secret or service-role key to a `NEXT_PUBLIC_*` variable.
Google client credentials belong in Google Cloud and Supabase dashboards, not
in this application's environment file.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```

## Supabase And Google Setup

1. Create a Supabase project and copy its project URL and publishable key.
2. Enable email/password in Supabase Auth.
3. Create a Google OAuth client for a web application.
4. Add Supabase's Google callback URL to Google Cloud. For local Supabase this is
   `http://127.0.0.1:54321/auth/v1/callback`; hosted projects show their callback
   URL in the provider settings.
5. Add the Google client ID and secret to the Supabase Google provider.
6. Add `http://localhost:3000/auth/callback` and the Vercel callback origin to
   Supabase's allowed redirect URLs.
7. Set `app_metadata.role` to exactly `student`, `parent`, or `admin` for M1.
   M2 replaces this temporary role source with the authoritative `users` table.

To roll back provider changes, disable Google in Supabase Auth, remove the added
redirect origins, and revoke the Google OAuth client secret.

## Milestone 1 Manual Tests

- Open `/en` and `/ru`; verify every visible string uses the selected language.
- Use the switcher on `/en/login`; verify `/ru/login` and Russian copy.
- Submit email login, signup, reset, and Google login with no env; verify the
  translated controlled error, not an exception page.
- With configured Supabase, verify login, signup confirmation, reset, Google
  callback, logout, and session persistence.
- Set each valid role in trusted app metadata and verify `/[locale]/app`
  dispatches to the matching shell.
- Open a different role URL directly; verify the server redirects to the user's
  assigned role.
- Check student, parent, and admin previews at 320px, 390px, 768px, and 1440px.
- Navigate by keyboard; verify visible focus, labeled fields, and one unlock CTA.

## Future Milestone Checks

### M2: Data, RLS, and Admin Profiles

- Apply migrations from a clean Supabase project.
- Import the supplied school CSV and reconcile accepted and rejected row counts.
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
- Deploy preview and production to Vercel; verify separate env and auth redirects.

The detailed execution plan is in `.omo/plans/american-study.md`.
