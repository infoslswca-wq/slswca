import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { memberNumber } from "@slswca/core/schemas";
import { TicketActions } from "@/components/TicketActions";
import { eventDate } from "@/components/UpcomingEventCard";
import { Container } from "@/components/ui";
import { getMyTicket } from "@/lib/events";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: PageProps<"/account/tickets/[code]">) {
  const { code } = await params;
  if (!/^[a-f0-9]{24}$/.test(code)) notFound();
  const db = await supabaseServer();
  const { data } = (await db?.auth.getUser()) ?? { data: { user: null } };
  if (!db || !data.user) redirect(`/login?next=/account/tickets/${code}`);
  const t = await getMyTicket(db, code); // RLS: only your own tickets resolve
  if (!t) notFound();

  const confirmed = t.status === "confirmed";
  const qr = confirmed
    ? await QRCode.toString(`SLSWCA:${t.code}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#131210", light: "#F5F1E8" } })
    : null;

  return (
    <Container className="flex flex-col items-center gap-8 py-12 nav:py-16">
      <nav aria-label="Breadcrumb" className="self-start text-xs font-bold tracking-[0.1em] text-muted uppercase">
        <Link href="/account" className="hover:text-gold">← My account</Link>
      </nav>
      <article aria-label="Event ticket" className="w-full max-w-md border border-gold bg-surface">
        <div className="flex flex-col gap-2 border-b border-dashed border-line-strong p-6">
          <p className="m-0 text-[11px] font-bold tracking-[0.14em] text-gold uppercase">SLSWCA ticket</p>
          <h1 className="m-0 font-display text-3xl leading-[1.05] uppercase">{t.eventTitle}</h1>
          <p className="m-0 text-sm text-muted">{t.startsAt && eventDate(t.startsAt)}{t.venue && ` · ${t.venue}`}</p>
        </div>
        <div className="flex flex-col items-center gap-4 p-6">
          {qr ? (
            <div role="img" aria-label="Check-in QR code" className="w-56 bg-text p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          ) : (
            <div className="grid h-56 w-56 place-items-center border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {t.status === "pending" ? "Waiting for payment confirmation. This page updates automatically." : "This registration was cancelled."}
            </div>
          )}
          <dl className="grid w-full grid-cols-2 gap-4 text-sm">
            <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Athlete</dt><dd className="m-0 mt-1 font-semibold">{t.holder ?? "—"}</dd></div>
            <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Member</dt><dd className="m-0 mt-1 font-semibold">{memberNumber(data.user.id)}</dd></div>
            {t.category && <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Category</dt><dd className="m-0 mt-1 font-semibold">{t.category}</dd></div>}
            <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Status</dt><dd className={`m-0 mt-1 font-bold uppercase ${confirmed ? "text-gold" : "text-muted"}`}>{t.status}</dd></div>
          </dl>
          <p className="m-0 font-mono text-xs tracking-[0.2em] text-faint">{t.code.toUpperCase().match(/.{1,4}/g)?.join(" ")}</p>
        </div>
      </article>
      <TicketActions code={t.code} status={t.status} eventSlug={t.eventSlug} />
    </Container>
  );
}
