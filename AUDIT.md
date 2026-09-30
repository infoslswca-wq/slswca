# SLSWCA — Design & Site Audit + Roadmap

Audit date: 2026-09-30. Sources: `design_handoff_slswca/` (Claude Design hi-fi HTML), the live slswca.com (WordPress), and the build in this repo.

Status: ✅ done in this repo · 🔜 next up · 🧑‍⚖️ needs a decision or input from the client

---

## 1. Current live site (slswca.com)

| # | Finding | Severity | Status |
|---|---|---|---|
| L1 | Homepage is a single banner image and two social links. No nav, no copy, nothing for search engines to index. | Critical | ✅ replaced by the new site |
| L2 | Battle/workshop "galleries" on WordPress were Instagram embeds (15 reels/posts), not hosted photos. | High | ✅ moved to `/events/[slug]` with click-to-load embeds; all 9 old URLs 301/308 → new pages |
| L3 | `/events-and-competitions` URL | Med | ✅ 301 → `/events` |

## 2. Design audit (Claude Design handoff)

### Visual / brand
| # | Finding | Status |
|---|---|---|
| D1 | `logo.png` is 1920×1080 with about 60% transparent padding. At the specified "60px tall", the wordmark actually shows at about 25px, and it relied on CSS `filter: invert(1)`. | ✅ cropped and pre-inverted to `logo-light.png`, shown at 32–36px |
| D2b | Two workshop dates were inferred from WordPress URLs ("september-25" = Sep 2025 or 25 Sep?). | ✅ removed; 🧑‍⚖️ confirm exact dates for Sep & Oct (women's) workshops |
| D2 | Every photo is a placeholder. The site has no real photography at all, and that's the biggest gap in visual quality. | 🧑‍⚖️ need a photo shoot or the BOC/workshop archive (R1) |
| D3 | Partner mapping was guessed by the designer. Ministry and Sports-Medicine logos have no confirmed names. Clothing, Energy, H2O and Security partners have no logos. | 🧑‍⚖️ confirm (R2). Unknown names are left blank rather than invented. |
| D4 | The home page "Backed by" row shows two empty placeholder tiles (Energy, Clothing). Empty tiles on a trust section look unfinished. | 🔜 hide unconfirmed partners before launch (R2) |
| D5 | The copyright colour `#6B665C` on `#131210` is 3.3:1, below WCAG AA (4.5:1). It was also used for the certificate-authority paragraph. | ✅ new `faint` token `#8A8478` (5.0:1) |
| D6 | Design has no favicon, OG image, 404 page or privacy page | ✅ generated from the logo mark / added |

### UX
| # | Finding | Status |
|---|---|---|
| U1 | "Join us" leads to Instagram/WhatsApp. There's no real membership or club-join flow. | 🧑‍⚖️ define membership (R4) |
| U2 | "Partner with us → Get in touch" goes to Instagram. Sponsors expect an email or form. | 🔜 add a partner enquiry form (reuses the API pattern) |
| U3 | "Find a club" shows club names only, with no city, contact or training spot, so a visitor can't actually find one. | 🧑‍⚖️ collect club details (R3) |
| U4 | The events page is all past events (2024 BOC, 2025 workshops) and has no "upcoming" state or dates for the battles. | 🔜 add `upcoming` section + dates (R5) |
| U5 | The Academy form wasn't wired to anything, had no consent, no spam protection and no field-level errors | ✅ API + zod validation + honeypot + rate limit + consent + inline errors |
| U6 | The pathway picker used plain buttons with no radio semantics | ✅ `role=radiogroup` / `aria-checked` |
| U7 | The mobile menu had no `aria-expanded`, no Escape to close and no skip link | ✅ |
| U8 | Scroll-reveal hid the hero until JS loaded, so slow mobile connections saw a blank first screen | ✅ hero uses CSS-only animation; other reveals only hide content when scripting is enabled |
| U9 | Club chips have a hover state but aren't links, which looks clickable but does nothing | 🔜 make them link to club pages once R3 lands |
| U10 | There's no Sinhala or Tamil version | 🧑‍⚖️ decide on i18n (R8) |

## 3. Engineering, security & SEO

| # | Item | Status |
|---|---|---|
| S1 | Security headers: CSP, HSTS (preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP; `x-powered-by` removed | ✅ `next.config.ts` |
| S2 | API hardening: same-origin check (CSRF), JSON-only, 16 KB body cap, per-IP rate limit, zod validation, honeypot, `no-store` | ✅ tested (`route.test.ts`) |
| S3 | The rate limiter was in-memory (per instance) and trusted a spoofable `cf-connecting-ip` header | ✅ shared Upstash Redis limiter (fails open to memory), trusted-IP header is explicit via `TRUSTED_IP_HEADER` |
| S4 | CSP uses `'unsafe-inline'` for scripts so pages can stay static | 🔜 move to nonce CSP when auth/accounts ship |
| S5 | Secrets live only in env vars; `.env*` is git-ignored; `.env.example` is documented | ✅ |
| S6 | Privacy notice (Sri Lanka PDPA No. 9 of 2022) and consent checkbox | ✅ draft. 🧑‍⚖️ legal/committee review |
| S7 | Dependency audit: 0 vulnerabilities (bumped sharp/vitest) | ✅; 🔜 Dependabot + CI |
| S8 | SEO: per-page metadata, canonical URLs, sitemap, robots, OG image, `SportsOrganization` JSON-LD | ✅ |
| S9 | Fonts self-hosted via `next/font` (no Google request at runtime, CSP `font-src 'self'`) | ✅ |
| S10 | CI (typecheck, lint, test, build) on every PR | ✅ local `npm run check` (all gates + DB tests); 🔜 wire into CI once the repo has a remote |
| S11 | Error monitoring and uptime checks | ✅ structured JSON logs, `onRequestError` → Slack/Discord webhook (PII-scrubbed, deduped), friendly error page; `/api/v1/health` for uptime pings. 🔜 Sentry if volume grows |
| S12 | Analytics: privacy-friendly and cookieless (Plausible / Vercel Analytics) | 🧑‍⚖️ |

## 4. Mobile-app readiness (built in from day one)

- **Monorepo** (`apps/*`, `packages/*`): the Expo app goes in `apps/mobile` and imports the same packages.
- **`@slswca/tokens`**: colours, fonts, spacing, motion as TS (for React Native) plus the CSS mirror (for Tailwind). A test fails if the two drift apart.
- **`@slswca/core`**: zod schemas (Event, Club, Partner, AcademyInterest, CoachTier…), typed content, and the `ApiResult` envelope. Web and app validate with identical rules.
- **Versioned API `/api/v1/*`**: `events`, `clubs`, `partners` (public, cached), `academy/interest` (POST), `health`. The mobile app consumes these, not the HTML.
- CSRF check skips requests with no `Origin` (native apps). Once accounts exist, mobile will authenticate with bearer tokens.

---

## Roadmap — executed one by one

| # | Task | Owner | Status |
|---|---|---|---|
| 0 | Scaffold Next.js 16 monorepo, port all 4 pages pixel-faithfully, wire the Academy form, add security/SEO baseline | dev | ✅ |
| R1 | Real photography: pick 10–15 images from the BOC/workshop archive → `public/photos`, fill the `ImageSlot`s | client → dev | 🧑‍⚖️ |
| R2 | Confirm partner names, logos and roles; hide unconfirmed ones | client → dev | 🧑‍⚖️ |
| R3 | Club directory: city, instagram, training spot → `/clubs/[slug]` pages | client → dev | 🧑‍⚖️ |
| R4 | Backend: **Supabase** (decided 2026-09-30). Schema + RLS for members, clubs, events, registrations, payments, contributions and Academy leads, tested on local Postgres (`scripts/test-db.sh`). Academy leads are stored in Supabase. | dev | ✅ code · 🧑‍⚖️ create the Supabase project + keys |
| R5 | Events as data (CMS/DB), with upcoming events and registration | dev | after R4 |
| R6 | WordPress galleries → `/events/[slug]` (story, venue, clubs, Instagram media, SportsEvent JSON-LD, prev/next), legacy redirects kept in sync by test | dev | ✅ |
| R6b | Real photo galleries: Instagram embeds only show what was posted; upload event photos to Supabase Storage for proper galleries + hero images | client → dev | 🧑‍⚖️ needs photos (R1) |
| R7 | Deploy: Vercel (or Cloudflare) + DNS cutover plan, form delivery env (Resend or webhook), CI | dev + client | 🔜 |
| R8 | i18n (Sinhala / Tamil) | client decision | 🧑‍⚖️ |
| R9 | Payments: **PayHere** (decided 2026-09-30). Signed checkout, verified notify webhook (signature + amount match + no status downgrade), `/contribute` one-off/monthly page, thanks page. | dev | ✅ code · 🧑‍⚖️ PayHere sandbox merchant account, then live approval |
| R9b | End-to-end PayHere sandbox test (needs a public notify URL: deploy preview or tunnel) | dev | 🔜 after sandbox keys |
| R11 | Member accounts: email one-time code (+ optional Google), `/login`, `/account` (membership card, profile, registrations, contributions, sign out, self-service delete), `/api/v1/me` for web cookie **or** mobile Bearer token, CSRF rules, session refresh in `proxy.ts` | dev | ✅ code · 🧑‍⚖️ paste `supabase/templates/otp.html` into the hosted project's email templates |
| R11b | Custom SMTP for auth emails (Supabase's built-in sender is rate-limited to a few emails/hour, fine for testing only). Resend works. | dev + client | 🔜 before launch |
| R12 | Committee admin view `/admin`: Academy leads (filter, mark handled with who/when stamp), contributions, members, summary stats, formula-safe CSV exports (logged). Non-admins get 404. DB: admins can only flip `handled`, never edit submissions. `scripts/make-admin.sh` bootstraps the first admin. | dev | ✅ code · 🧑‍⚖️ needs Supabase project to use |
| R10 | Mobile app: Expo scaffold in `apps/mobile`, 5-tab shell with mock data, reusing tokens + core | dev | after R4 |
