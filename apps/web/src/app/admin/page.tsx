import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { funds } from "@slswca/core/content";
import { Pathway } from "@slswca/core/schemas";
import { LeadHandledToggle } from "@/components/LeadHandledToggle";
import { Container, Display, Eyebrow, cn } from "@/components/ui";
import { listContributions, listLeads, listMembers, listRegistrations, requireAdminPage } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "leads", label: "Academy leads" },
  { key: "registrations", label: "Registrations" },
  { key: "contributions", label: "Contributions" },
  { key: "members", label: "Members" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const d = (s: string) => new Date(s).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;
const th = "border-b border-line px-4 py-3 text-left text-[11px] font-bold tracking-[0.1em] text-faint uppercase whitespace-nowrap";
const td = "border-b border-line px-4 py-3 align-top text-sm";

function Chip({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={on ? "page" : undefined}
      className={cn("border px-3 py-1.5 text-xs font-bold tracking-[0.05em] uppercase transition-colors", on ? "border-gold bg-gold text-bg" : "border-line text-muted hover:border-line-strong hover:text-text")}>
      {children}
    </Link>
  );
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdminPage();
  if (!admin) notFound(); // non-admins get a plain 404
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "leads";
  const pathway = Pathway.options.find((p) => p === sp.pathway);
  const status = sp.status === "handled" ? true : sp.status === "all" ? undefined : false;

  const [leads, contributions, members] = await Promise.all([
    listLeads(admin.db, tab === "leads" ? { pathway, handled: status } : {}),
    listContributions(admin.db),
    tab === "members" ? listMembers(admin.db) : Promise.resolve([]),
  ]);
  const registrations = tab === "registrations" ? await listRegistrations(admin.db, typeof sp.event === "string" ? sp.event : undefined) : [];
  const regEvents = [...new Map(registrations.map((r) => [r.eventSlug, r.event])).entries()];
  const openLeads = tab === "leads" && status === false && !pathway ? leads.length : (await listLeads(admin.db, { handled: false })).length;
  const paid = contributions.filter((c) => c.status === "success");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const thisMonth = paid.filter((c) => c.createdAt >= monthStart).reduce((s, c) => s + c.amount, 0);
  const monthly = paid.filter((c) => c.recurring).length;

  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ tab, pathway, status: sp.status as string | undefined, ...o }).filter(([, v]) => v) as [string, string][]);
    return `/admin?${p}`;
  };

  return (
    <Container className="flex flex-col gap-10 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow rule>Committee</Eyebrow>
          <Display as="h1" className="text-[clamp(40px,5vw,64px)]" accent="desk">Admin</Display>
        </div>
        <p className="text-[13px] text-faint">Signed in as {admin.user.email}</p>
      </div>

      <dl className="grid grid-cols-2 gap-6 nav:grid-cols-4">
        {[
          ["Open leads", String(openLeads)],
          ["Raised this month", lkr(thisMonth)],
          ["Total raised", lkr(paid.reduce((s, c) => s + c.amount, 0))],
          ["Monthly supporters", String(monthly)],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 border-l-2 border-gold py-1 pl-5">
            <dd className="m-0 font-display text-[32px] leading-none">{v}</dd>
            <dt className="text-[12px] font-semibold tracking-[0.1em] text-muted uppercase">{k}</dt>
          </div>
        ))}
      </dl>

      <nav aria-label="Admin sections" className="flex flex-wrap items-center justify-between gap-4 border-b border-line">
        <ul className="flex gap-6">
          {TABS.map((t) => (
            <li key={t.key}>
              <Link href={`/admin?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
                className={cn("-mb-px block border-b-2 py-3 text-sm font-bold tracking-[0.06em] uppercase", tab === t.key ? "border-gold text-text" : "border-transparent text-muted hover:text-gold")}>
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
        <a href={`/api/v1/admin/export?type=${tab}${tab === "registrations" && typeof sp.event === "string" ? `&event=${encodeURIComponent(sp.event)}` : ""}`} className="mb-2 border border-line-strong px-4 py-2 text-xs font-bold tracking-[0.06em] uppercase hover:border-gold hover:text-gold">
          Export CSV
        </a>
      </nav>

      {tab === "leads" && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Chip href={qs({ status: undefined })} on={status === false}>New</Chip>
            <Chip href={qs({ status: "handled" })} on={status === true}>Handled</Chip>
            <Chip href={qs({ status: "all" })} on={status === undefined}>All</Chip>
            <span className="mx-2 w-px bg-line" />
            <Chip href={qs({ pathway: undefined })} on={!pathway}>Any pathway</Chip>
            {Pathway.options.map((p) => <Chip key={p} href={qs({ pathway: p })} on={pathway === p}>{p}</Chip>)}
          </div>
          {leads.length === 0 ? (
            <p className="border border-dashed border-line-strong px-6 py-10 text-center text-sm text-muted">No leads here.</p>
          ) : (
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="bg-surface"><tr><th className={th}>Received</th><th className={th}>Name</th><th className={th}>Pathway</th><th className={th}>Contact</th><th className={th}>Message</th><th className={th}>Status</th></tr></thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className={l.handled ? "opacity-60" : undefined}>
                      <td className={cn(td, "whitespace-nowrap text-muted")}>{d(l.createdAt)}</td>
                      <td className={td}><p className="m-0 font-semibold">{l.name}</p>{l.club && <p className="m-0 text-xs text-muted">{l.club}</p>}</td>
                      <td className={cn(td, "whitespace-nowrap")}>{l.pathway}</td>
                      <td className={td}>
                        {l.email && <a href={`mailto:${l.email}`} className="block text-gold hover:underline">{l.email}</a>}
                        {l.phone && <a href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="block text-muted hover:text-text">{l.phone}</a>}
                      </td>
                      <td className={cn(td, "max-w-[360px] whitespace-pre-line text-muted")}>{l.message || "—"}</td>
                      <td className={td}><LeadHandledToggle id={l.id} handled={l.handled} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "registrations" && (
        <section className="flex flex-col gap-5">
          {regEvents.length > 1 || sp.event ? (
            <div className="flex flex-wrap gap-2">
              <Chip href="/admin?tab=registrations" on={!sp.event}>All events</Chip>
              {regEvents.map(([slug, title]) => <Chip key={slug} href={`/admin?tab=registrations&event=${slug}`} on={sp.event === slug}>{title}</Chip>)}
            </div>
          ) : null}
          {registrations.length === 0 ? <p className="border border-dashed border-line-strong px-6 py-10 text-center text-sm text-muted">No registrations yet. Create events in Supabase → Table editor → events (status = published).</p> : (
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead className="bg-surface"><tr><th className={th}>Event</th><th className={th}>Athlete</th><th className={th}>Category</th><th className={th}>Club</th><th className={th}>Emergency contact</th><th className={th}>Status</th></tr></thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.ticketCode ?? `${r.eventSlug}-${r.createdAt}`} className={r.status === "cancelled" ? "opacity-50" : undefined}>
                      <td className={td}><p className="m-0 font-semibold">{r.event}</p><p className="m-0 text-xs text-muted">{d(r.createdAt)}</p></td>
                      <td className={td}><p className="m-0 font-semibold">{r.athlete ?? "—"}</p>{r.phone && <p className="m-0 text-xs text-muted">{r.phone}</p>}</td>
                      <td className={td}>{r.category ?? "—"}</td>
                      <td className={td}>{r.club ?? "Independent"}</td>
                      <td className={td}>{r.emergencyName ?? "—"}{r.emergencyPhone && <p className="m-0 text-xs text-muted">{r.emergencyPhone}</p>}</td>
                      <td className={cn(td, "text-xs font-bold tracking-[0.1em] uppercase", r.status === "confirmed" ? "text-gold" : r.status === "pending" ? "text-muted" : "text-danger")}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "contributions" && (
        contributions.length === 0 ? <p className="border border-dashed border-line-strong px-6 py-10 text-center text-sm text-muted">No contributions yet.</p> : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-surface"><tr><th className={th}>Date</th><th className={th}>Donor</th><th className={th}>Fund</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}>Order</th></tr></thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.orderId}>
                    <td className={cn(td, "whitespace-nowrap text-muted")}>{d(c.createdAt)}</td>
                    <td className={td}><p className="m-0 font-semibold">{c.donor}{c.anonymous && <span className="ml-2 text-[11px] font-bold text-faint uppercase">anon</span>}</p><p className="m-0 text-xs text-muted">{c.email}</p></td>
                    <td className={td}>{funds.find((f) => f.key === c.fund)?.label ?? c.fund}</td>
                    <td className={cn(td, "whitespace-nowrap font-semibold")}>{lkr(c.amount)}{c.recurring && <span className="text-muted"> / mo</span>}</td>
                    <td className={cn(td, "text-xs font-bold tracking-[0.1em] uppercase", c.status === "success" ? "text-gold" : c.status === "pending" ? "text-muted" : "text-danger")}>{c.status}</td>
                    <td className={cn(td, "font-mono text-xs text-faint")}>{c.orderId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "members" && (
        members.length === 0 ? <p className="border border-dashed border-line-strong px-6 py-10 text-center text-sm text-muted">No members yet.</p> : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[800px] border-collapse">
              <thead className="bg-surface"><tr><th className={th}>Joined</th><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Club</th><th className={th}>Role</th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className={cn(td, "whitespace-nowrap text-muted")}>{d(m.since)}</td>
                    <td className={cn(td, "font-semibold")}>{m.name ?? "—"}</td>
                    <td className={cn(td, "text-muted")}>{m.email ?? "—"}</td>
                    <td className={td}>{m.club ?? "Independent"}</td>
                    <td className={cn(td, "text-xs font-bold tracking-[0.1em] uppercase", m.role === "admin" ? "text-gold" : "text-muted")}>{m.role}{m.coachTier && ` · ${m.coachTier}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <p className="text-xs leading-relaxed text-faint">
        This page contains personal data. Don&apos;t screenshot or share exports outside the committee. Exports are logged.
      </p>
    </Container>
  );
}
