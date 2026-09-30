# Deployment plan (agreed 2026-10)

Everything on free tiers. The old WordPress site stays live until switch-over.

| Job | Where |
|---|---|
| Website + API | Vercel (Hobby) — project Root Directory `apps/web`, "include files outside root" ON |
| Database, auth, storage | Supabase (free, Singapore/Mumbai region) |
| DNS | **HostGator** cPanel → Zone Editor (nameservers hgns1/hgns2.hostgator.com) until HostGator term ends |
| Email (@slswca.com, MX → mail.slswca.com) | **HostGator** until term ends — do not touch MX records |
| Domain registration | GoDaddy |
| Payments | PayHere (sandbox first) |

## 1. Accounts (client)
- [ ] GitHub organisation (e.g. `slswca`); add account to CLI with `gh auth login` / `gh auth switch`
- [ ] Supabase project → Project URL, publishable/anon key, service role key, DB connection string
- [ ] Vercel account (sign in with GitHub)
- [ ] PayHere sandbox merchant (sandbox.payhere.lk)

## 2. Test deploy on *.vercel.app
- [ ] Push repo to GitHub org; import into Vercel (settings above)
- [ ] `supabase db push` (migrations) + `supabase/seed.sql`
- [ ] Vercel env vars from `apps/web/.env.example` (`NEXT_PUBLIC_SITE_URL` = vercel URL for now, `PAYHERE_SANDBOX=true`)
- [ ] Supabase → Auth → URL configuration: add Vercel URL + `/auth/callback`; paste `supabase/templates/otp.html` into "Magic Link" and "Confirm signup" templates
- [ ] Sign in, `scripts/make-admin.sh <email>`, test: Academy form, sandbox contribution, test event + registration + ticket, admin tabs

## 3. Switch-over (HostGator cPanel → Zone Editor)
- [ ] Vercel → Domains: add `slswca.com` + `www.slswca.com`
- [ ] Zone Editor: `A slswca.com` → Vercel IP; `CNAME www` → Vercel target (use the exact values Vercel shows). Leave MX/mail records alone.
- [ ] `NEXT_PUBLIC_SITE_URL=https://slswca.com`, redeploy; add domain to Supabase auth URLs and PayHere
- [ ] Spot-check old URLs redirect (`/contact/`, `/battle-of-the-clubs-2024-battle-5-finals/`)
- [ ] Back up WordPress (cPanel → Backup) and keep the file

## 4. Before launch
- [ ] Resend: verify domain (DNS records in Zone Editor), set as Supabase custom SMTP
- [ ] Upstash Redis keys → Vercel; `ERROR_WEBHOOK_URL` (Discord/Slack)
- [ ] PayHere live approval → `PAYHERE_SANDBOX=false`
- [ ] Committee sign-off: waiver + privacy notice

## 5. Before the HostGator term renews
- [ ] Turn off HostGator auto-renew; note the date: ________
- [ ] Move email (Zoho Mail free / Cloudflare Email Routing) and DNS (Cloudflare / GoDaddy)
- [ ] Cancel HostGator
