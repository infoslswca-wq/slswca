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
npm test           # vitest (core + web API)
npm run typecheck && npm run lint && npm run build
```

Copy `apps/web/.env.example` to `apps/web/.env.local` and configure one form-delivery channel (Resend or a webhook). In development, submissions are only logged.

See [AUDIT.md](AUDIT.md) for the design/site audit and the roadmap.
