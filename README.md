# Tailred

Turn a side hustle into a running business — plan it, price it, track it, get paid.

Mobile-first Next.js 14 PWA. First persona: resellers. Full build brief lives at
`../Tailred_Files/Tailred_Build_Brief.md`; live progress dashboard at
`../Tailred_Files/Tailred_Progress.md`.

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind)
- Supabase (Auth, Postgres, Storage)
- Stripe Connect (payments — not wired up yet, v1 step 5)

## Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/` (in order) via the Supabase SQL editor,
   or `supabase db push` if using the CLI.
3. Copy `.env.local.example` to `.env.local` and fill in your project URL and
   anon key from Supabase → Project Settings → API.
4. `npm install && npm run dev`

## Status

Auth, business profile onboarding, and the dashboard shell are scaffolded but
**untested** — this repo has no live Supabase project connected yet. The build
will fail (`npm run build`) until `.env.local` has real values; that's expected,
not a bug.

## Structure

- `app/(auth)/login`, `app/(auth)/signup` — Supabase email/password auth
- `app/onboarding` — business profile form (writes to `business_profile`, logo to Storage)
- `app/dashboard/*` — inventory, invoices, business plan, budget calculator (stubs)
- `lib/supabase/` — browser/server/middleware Supabase clients
- `supabase/migrations/` — SQL schema, matches the data model in the build brief
