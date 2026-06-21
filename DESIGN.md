# Design System — American Study ("Modern Civic")

> Source of truth for every visual and UI decision in this repo. **Read this before
> any UI work.** Do not deviate without explicit user approval; in QA, flag code that
> does not match this file.
>
> Created 2026-06-21 via `/design-consultation` as a *codify + refine* of the shipped
> "Modern Civic" system (a single outside-voice design review was incorporated; Codex
> was unavailable on the machine). Values marked **as-built** already ship; values
> marked **(refine)** are adopted targets — see *Implementation status*.

## Product Context
- **What this is:** a bilingual (EN / RU / KK) consulting portal that guides Kazakh
  families through US boarding-school admissions.
- **Who it's for:** students (English-only UI), parents (read-mostly; RU/KK/EN), and
  admins/consultants (EN/RU/KK).
- **Space/industry:** education consulting / admissions. Trust-heavy, institutional —
  not a flashy consumer startup.
- **Project type:** authenticated web app (workspace dashboards) plus a small public /
  auth surface. Next.js App Router + Tailwind v4 + Supabase (RLS).

**North star:** *"Serious, trustworthy guidance — a calm, clear path from Kazakhstan to
a US boarding school."* Institutional competence and reassurance for families making a
high-stakes, emotional decision. Every decision below serves that.

## Aesthetic Direction
- **Direction:** Modern Civic — blue-dominant, flat, geometric. Reads "issued by an
  institution," not "generated."
- **Decoration level:** minimal. Typography and one accent rule do the work. No
  gradients, blobs, glassmorphism, or decorative imagery.
- **Mood:** calm, competent, reassuring. Warmth comes from blue tints and a barely-warm
  ground — never from extra hues.
- **Reference posture:** government / university / legal letterhead clarity, not a SaaS
  dashboard.

## Typography
- **Display + Body:** **Rubik** (Google, via `next/font`), subsets `latin` + `cyrillic`.
  Body weight 400; display weights 500/700/800 (use ≤700 in practice).
- **UI / labels:** Rubik (same family).
- **Data / tables:** Rubik with `font-variant-numeric: tabular-nums` on numeric columns.
- **Code:** n/a (no code surfaces).
- **Loading:** `next/font` self-hosted, `font-display: swap`.
- **HARD CONSTRAINT:** any UI font must ship **complete Cyrillic** — RU and KK headings
  depend on it. (Manrope was rejected for lacking Cyrillic.)

**Scale — Major Third (1.250), Cyrillic-tuned.** Base 16px. Define as Tailwind v4
`@theme` font-size tokens; stop hardcoding heading sizes in utilities. The tight ratio
keeps translated headings (Cyrillic runs ~15–25% longer, KK adds diacritics) from
wrapping; leading is deliberately generous because Cyrillic + Rubik's tall x-height read
poorly when cramped.

| Token | px / rem | Weight | Line-height | Tracking | Usage |
|---|---|---|---|---|---|
| `display` | 48 / 3rem | 700 | 1.1 | -0.02em | Hero / dashboard H1 (one per view) |
| `h1` | 39 / 2.441rem | 700 | 1.15 | -0.015em | Primary page title |
| `h2` | 31 / 1.953rem | 600 | 1.2 | -0.01em | Section header |
| `h3` | 25 / 1.563rem | 600 | 1.25 | -0.005em | Card title / subsection |
| `h4` | 20 / 1.25rem | 600 | 1.3 | 0 | Small headers, modal titles |
| `body-lg` | 18 / 1.125rem | 400 | 1.6 | 0 | Lead paragraphs |
| `body` | 16 / 1rem | 400 | 1.6 | 0 | Default body, form labels |
| `sm` | 14 / 0.875rem | 400 | 1.55 | 0 | Secondary text, table cells |
| `xs` | 12.8 / 0.8rem | 500 | 1.5 | +0.01em | Metadata, badges, timestamps |

**Rules:** headings cap at weight 700 (Rubik 800 makes Cyrillic caps Д/Ж/Щ too heavy);
negative tracking only ≥31px and only after verifying on Cyrillic, else 0; `xs` is weight
500 (Cyrillic muddies at 400 / 12–13px).

## Color
**Approach:** restrained — one blue family (three blues), red strictly minor, semantic
accents only.

**Light tokens** (`src/app/globals.css :root`) — **as-built** unless noted:
- `--background` `#ffffff` (cards). Content reading ground `#fcfcfb` *(refine R2)*.
- `--foreground` `#0f172a` (slate-900).
- `--brand` `#1d4ed8` (blue-700) — dominant trust color: primary actions, links, focus,
  active nav.
- `--brand-strong` `#1e40af` (blue-800) — hover / active.
- `--brand-soft` `#eff6ff` (blue-50) — soft fills, focus wash, "guidance / consultant
  note" zones.
- `--danger-text` `#dc2626` (red-600) — red **text + meaningful icons only**; ≥14px &
  weight ≥500.
- `--danger-fill` `#ef4444` (red-500) — **fills / large numerals / notification dot only**.
- `--hairline` `#e7ecf5` — borders (carry structure).
- `--elevation` `0 4px 14px -8px rgb(15 23 42 / 18%)` — the single elevation shadow.

**Semantic:** success = emerald (600 text / 50 wash), warning = amber (600 / 50), error =
the red tokens above, info = the blue tokens.

**Rules:** only the named blues — never blue-500 / sky / indigo / etc. Red is never a card
left-border (slop). No second brand color; warmth comes from blue tints + the warm ground.

**Dark mode (PLAN — documented, not built).** Token remap behind `.dark`. Elevation by
**surface lightness, not shadow**; off-white text, not pure white; desaturated accent.

| Token | Light | Dark | Note |
|---|---|---|---|
| `--background` | #ffffff | #0b1220 | Navy base, not black |
| `--surface` (new) | #ffffff | #111a2e | Cards sit above background |
| `--surface-2` (new) | #f8fafc | #16223b | Raised / popovers |
| `--foreground` | #0f172a | #e6edf7 | Off-white (avoids halation) |
| `--muted-foreground` | #475569 | #9fb0c9 | ≥4.5:1 on background |
| `--brand` | #1d4ed8 | #5b8cf0 | Desaturated/lightened to read on dark |
| `--brand-strong` | #1e40af | #7aa4f5 | Hover/active |
| `--brand-soft` | #eff6ff | rgba(91,140,240,.12) | Translucent tint, not near-white |
| `--hairline` | #e7ecf5 | #243352 | Borders carry hierarchy |
| `--danger-text` | #dc2626 | #f87171 | red-400 lifts to AA on dark |

Re-verify **every** AA pair in dark (light-mode contrast does not transfer). Selection =
`--brand` at ~30% alpha. Students stay light; offer dark to admins/parents.

## Spacing
- **Base unit:** 4px.
- **Density:** comfortable.
- **Scale:** `space-1`(4) `2`(8) `3`(12) `4`(16) `5`(20) `6`(24) `8`(32) `10`(40)
  `12`(48) `16`(64) `20`(80) `24`(96).
- **Rules:** card padding 24 desktop / 16 mobile; grid gaps 16–24; section vertical rhythm
  48 → 64; form field gap 16; **≥8px between adjacent touch targets**.

## Layout
- **Approach:** hybrid — grid-disciplined app shell (sidebar + workspace), light editorial
  for the public / auth surface.
- **Max content width:** `max-w-6xl` (~72rem) for workspace content.
- **Sidebar:** `w-72` desktop; horizontal-scroll nav on mobile.
- **Border-radius hierarchy** *(refine R1 — keep current generous radii, standardize
  controls, enforce step-down):*
  - 4px — inline tags / chips
  - **12px** (`rounded-xl`) — controls: buttons, inputs, dropdowns *(standardize here)*
  - **16px** (`rounded-2xl`) — status banners, modals
  - **24px** (`rounded-3xl`) — cards *(as-built, kept — reads warmer for families)*
  - `full` — avatars, badges, notification dot, pills only
  - **Rule:** nested radius steps **down**, never up (a 24px card never holds a child with
    a larger radius; controls inside are 12px).

## Motion
- **Approach:** minimal-functional — motion *confirms*, never entertains. If a stakeholder
  notices it, it's too much.
- **Easing:** `--ease-out` `cubic-bezier(0.25,0.1,0.25,1)` (default / entrances);
  `--ease-in-out` `cubic-bezier(0.4,0,0.2,1)` (moves / color); `--ease-in`
  `cubic-bezier(0.4,0,1,1)` (exits only). No springs, bounce, or overshoot.
- **Duration:** `fast` 120ms (hover / focus / color), `base` 180ms (buttons / dropdowns /
  tabs / accordions), `slow` 240ms (modals / drawers). **Ceiling 240ms.**
- **Animate:** opacity, transform, background-color, border-color, box-shadow; height for
  accordions (carefully).
- **Do NOT animate:** layout width/top/left, font-size, page load beyond one ≤150ms
  content fade, or the **notification dot** (static — a pulsing red dot reads like an
  alarm in a trust product).
- **Hover lift:** ≤2px `translateY` + existing elevation; no scale on cards.
- **Reduced motion:** `prefers-reduced-motion: reduce` → durations ~1ms, kill transforms.

## Components (as-built — conform to these)
- **Button** (`src/components/ui/button.tsx`, cva): base `min-h-11` (44px) `rounded-xl`
  `px-5 text-sm font-bold`, focus `ring-4 ring-blue-200`. Variants: `primary`
  blue-700→blue-800; `secondary` slate-100/slate-800; `outline` border-slate-200 →
  hover border-blue-400; `ghost` slate-700 → slate-100; `danger` red-600→red-700. Sizes:
  `default` 44px, `large` `min-h-13` (52px) `px-6 text-base`, `icon` `size-11`.
- **Card** (`ui/card.tsx`): `rounded-3xl border border-slate-200 bg-white
  shadow-[var(--elevation)]`.
- **Input** (`ui/input.tsx`): `min-h-12` (48px) `rounded-xl border-slate-200 px-4
  text-base`, placeholder slate-400, focus `border-blue-600 ring-4 ring-blue-200`. Always
  pair with a **visible `<label>`** — never placeholder-as-label.
- **Badge** (`ui/badge.tsx`): `rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold
  uppercase tracking-wider text-blue-700`.
- **Progress** (`ui/progress.tsx`).
- **Status banner** (action feedback): inline `role="status"` — emerald-50 / emerald-800
  on success, red-50 / red-700 on error. **No toast library** in this codebase.
- **Civic-seal accent** *(refine R3 — adopt):* one 3px `--brand` rule per view — a top
  border on a key card **or** a left rule on the active nav item / current admissions
  step. Blue only, used sparingly. Reads like official letterhead.

## Accessibility (hard rules)
- WCAG **AA** minimum. Body ≥16px; captions ≥12px and weight ≥500 (Cyrillic legibility).
- Tightest pair is red-on-white `#dc2626`/`#fff` = 4.83:1 → danger **text** only ≥14px &
  weight ≥500; never red on blue-soft without re-checking contrast.
- No muted-gray text on blue-soft grounds.
- Focus visible on every interactive element. On blue controls add `outline-offset` so the
  ring reads (a blue ring on a blue button otherwise disappears).
- Touch targets ≥44px **and** ≥8px apart.
- No color-only encoding (always pair with a label or icon).
- Honor `prefers-reduced-motion`.

## Internationalization (hard rules)
- Three locales EN / RU / KK with **strict message-key parity** (enforced by
  `tests/i18n.test.ts`). All copy comes from `messages/{en,ru,kk}.json` — never hardcode
  user-facing strings (enforced by `tests/i18n-runtime.test.ts`).
- Students are **English-only** (no switcher); parents/admins switch EN/RU/KK.
- **Never size labels / buttons / tabs to English** — Cyrillic (especially KK) runs
  ~15–25% longer. Test the longest language; no single-line truncation on primary actions.
- Any UI font must be Cyrillic-complete (see Typography).

## Implementation status
- **As-built (no action):** color tokens, Rubik typography, the five UI primitives, focus
  rings, AA + 44px targets, reduced-motion, i18n parity.
- **Apply in a follow-up (code changes):** type-scale `@theme` tokens, spacing `@theme`
  tokens, motion tokens + their usages, warm-paper content ground (`#fcfcfb` content /
  `#fff` cards), civic-seal accent, control-radius standardization + step-down nesting.
- **Plan only (not scheduled):** dark-mode token remap.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-21 | Codified shipped "Modern Civic" into DESIGN.md + refinements | `/design-consultation` (codify + refine); single outside-voice review |
| 2026-06-21 | R1: keep generous radii (cards 24px), standardize controls at 12px, step-down nesting | Warmer for families; avoids a large visible change for modest gain |
| 2026-06-21 | R2: adopt warm-paper content ground `#fcfcfb` (cards stay `#fff`) | Escapes cold all-blue-on-white without a new brand hue |
| 2026-06-21 | R3: adopt civic-seal 3px blue accent (one per view) | "Issued by an institution" signal, on-identity |
| 2026-06-20 | Modern Civic rebrand (blue-dominant, Rubik) shipped | prior `/design-shotgun` variant C |
