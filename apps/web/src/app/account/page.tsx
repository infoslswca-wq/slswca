import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { clubs, funds, tiers } from "@slswca/core/content";
import { memberNumber } from "@slswca/core/schemas";
import { AccountActions } from "@/components/AccountActions";
import { ProfileForm } from "@/components/ProfileForm";
import { ButtonLink, Container, Display, Eyebrow } from "@/components/ui";
import { loadMe } from "@/lib/me";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
// Per-member page: never prerender, even when built without Supabase env.
export const dynamic = "force-dynamic";

const date = (d: string) => new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
const statusCls: Record<string, string> = { success: "text-gold", confirmed: "text-gold", pending: "text-muted" };

export default async function AccountPage() {
  const db = await supabaseServer();
  const { data } = (await db?.auth.getUser()) ?? { data: { user: null } };
  if (!db || !data.user) redirect("/login?next=/account");
  const me = await loadMe(db, data.user);
  const tier = tiers.find((t) => t.key === me.coachTier);

  return (
    <Container className="flex flex-col gap-14 py-14 nav:py-[72px]">
      <div className="rise grid items-start gap-10 nav:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-4">
          <Eyebrow rule>Member</Eyebrow>
          <Display as="h1" className="text-[clamp(44px,5.5vw,72px)] leading-[0.95]">
            {me.fullName ? `Hey, ${me.fullName.split(" ")[0]}` : "Welcome"}
          </Display>
          <p className="m-0 text-muted">{me.email}</p>
        </div>

        {/* Digital membership card — the app will show the same card with a QR code. */}
        <section aria-label="Membership card" className="relative overflow-hidden border border-gold bg-surface p-6">
          <div aria-hidden className="absolute -top-10 -right-10 size-40 rotate-45 bg-maroon/60" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.14em] text-gold uppercase">SLSWCA member</span>
              {tier && <span className="bg-maroon px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase">{tier.title}</span>}
            </div>
            <p className="m-0 font-display text-3xl uppercase">{me.fullName ?? "Add your name"}</p>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Member no.</dt><dd className="m-0 mt-1 font-semibold">{memberNumber(me.id)}</dd></div>
              <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Since</dt><dd className="m-0 mt-1 font-semibold">{date(me.memberSince)}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Club</dt><dd className="m-0 mt-1 font-semibold">{me.club?.name ?? "Independent"}</dd></div>
            </dl>
          </div>
        </section>
      </div>

      <section aria-labelledby="profile-h" className="grid gap-10 border-t border-line pt-12 nav:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-3">
          <h2 id="profile-h" className="m-0 font-display text-[32px] uppercase">Profile</h2>
          <p className="m-0 text-sm leading-relaxed text-muted">Your name and club appear on your membership card and on event registrations.</p>
        </div>
        <ProfileForm initial={{ fullName: me.fullName ?? "", phone: me.phone ?? "", clubSlug: me.club?.slug ?? "" }} clubs={clubs.map((c) => ({ slug: c.slug, name: c.name }))} />
      </section>

      <section aria-labelledby="reg-h" className="grid gap-10 border-t border-line pt-12 nav:grid-cols-[0.8fr_1.2fr]">
        <h2 id="reg-h" className="m-0 font-display text-[32px] uppercase">Registrations</h2>
        {me.registrations.length ? (
          <ul className="flex flex-col border border-line">
            {me.registrations.map((r) => (
              <li key={r.ticketCode ?? r.eventTitle} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0">
                <div><p className="m-0 font-semibold">{r.eventTitle}</p>{r.startsAt && <p className="m-0 text-[13px] text-muted">{date(r.startsAt)}</p>}</div>
                <span className={`text-xs font-bold tracking-[0.1em] uppercase ${statusCls[r.status] ?? "text-faint"}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong px-6 py-8">
            <p className="m-0 text-sm text-muted">No registrations yet. Event sign-ups open here as the next Battle and workshops are announced.</p>
            <ButtonLink href="/events" variant="secondary">See events</ButtonLink>
          </div>
        )}
      </section>

      <section aria-labelledby="con-h" className="grid gap-10 border-t border-line pt-12 nav:grid-cols-[0.8fr_1.2fr]">
        <h2 id="con-h" className="m-0 font-display text-[32px] uppercase">Contributions</h2>
        {me.contributions.length ? (
          <ul className="flex flex-col border border-line">
            {me.contributions.map((c) => (
              <li key={c.orderId} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0">
                <div>
                  <p className="m-0 font-semibold">LKR {c.amount.toLocaleString("en-LK")}{c.recurring ? " / month" : ""}</p>
                  <p className="m-0 text-[13px] text-muted">{funds.find((f) => f.key === c.fund)?.label} · {date(c.createdAt)} · {c.orderId}</p>
                </div>
                <span className={`text-xs font-bold tracking-[0.1em] uppercase ${statusCls[c.status] ?? "text-faint"}`}>{c.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong px-6 py-8">
            <p className="m-0 text-sm text-muted">You haven&apos;t contributed yet. Every rupee goes into workshops, park equipment and the national team.</p>
            <ButtonLink href="/contribute" variant="secondary">Contribute</ButtonLink>
          </div>
        )}
      </section>

      <AccountActions />
    </Container>
  );
}
