# SLSWCA Platform

Website (and, soon, mobile app) for the Sri Lanka Street Workout & Calisthenics Association.

```
apps/web          Next.js 16 (App Router, Tailwind v4): the public site + /api/v1
packages/tokens   Design tokens (TS for React Native, CSS for Tailwind)
packages/core     zod schemas, shared types, site content
apps/mobile       (planned) Expo + Expo Router, consuming tokens/core + /api/v1
```

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # every gate: typecheck, lint, tests, DB/RLS tests, build (--fast skips build)
npm test           # vitest (core + web API)
npm run typecheck && npm run lint && npm run build
./scripts/test-db.sh   # migrations + RLS tests on local Postgres (no Docker needed)
```

Database: `supabase/migrations` (apply with `supabase db push` once the project exists). Payments: PayHere; see `.env.example`.

Copy `apps/web/.env.example` to `apps/web/.env.local` and configure one form-delivery channel (Resend or a webhook). In development, submissions are only logged.

See [AUDIT.md](AUDIT.md) for the original design audit + roadmap, and [docs/audit-2026-10.md](docs/audit-2026-10.md) for the live-site UI/UX + security audit.

## Running an event (committee)

1. Supabase → Table editor → `events` → insert a row: `slug` (e.g. `boc-2026-round-1`), `kind`, `title`, `body`,
   `venue`, `starts_at`, `fee_lkr` (0 = free), `capacity` (blank = unlimited), `categories` (e.g. `{Open,Women,U18}`),
   optional `registration_opens_at` / `registration_closes_at`, then set `status` = `published`.
2. It appears under **Coming up** on `/events` within a minute; members register at `/events/<slug>/register`.
3. Start lists and emergency contacts: `/admin?tab=registrations` → Export CSV.
4. Changing the waiver text? Update `packages/core/src/content/site.ts` and bump `waiver.version` and the events' `waiver_version`.
