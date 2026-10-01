import { jsonLd as safeJsonLd } from "@/lib/jsonld";
import Link from "next/link";
import type { UpcomingEvent } from "@slswca/core/schemas";
import { site } from "@slswca/core/content";
import type { RegState } from "@/lib/events";
import { eventDate, feeLabel } from "./UpcomingEventCard";
import { Container, Eyebrow } from "./ui";

const STATE_TEXT: Record<Exclude<RegState, "open">, string> = {
  not_open: "Registration opens soon",
  closed: "Registration closed",
  full: "Event full",
};

export function UpcomingEventDetail({ e, state, spotsLeft }: { e: UpcomingEvent; state: RegState; spotsLeft: number | null }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: e.title,
    description: e.body,
    ...(e.startsAt && { startDate: e.startsAt }),
    ...(e.endsAt && { endDate: e.endsAt }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(e.venue && { location: { "@type": "Place", name: e.venue, address: { "@type": "PostalAddress", addressCountry: "LK" } } }),
    organizer: { "@type": "SportsOrganization", name: site.fullName },
    isAccessibleForFree: e.feeLkr === 0,
    offers: { "@type": "Offer", price: e.feeLkr, priceCurrency: "LKR", availability: state === "full" ? "https://schema.org/SoldOut" : "https://schema.org/InStock" },
  };

  return (
    <>
      <Container className="rise grid items-start gap-12 pt-12 pb-16 nav:grid-cols-[1.3fr_0.7fr] nav:pt-16">
        <div className="flex flex-col gap-5">
          <nav aria-label="Breadcrumb" className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            <Link href="/events#upcoming" className="hover:text-gold">← Upcoming events</Link>
          </nav>
          <Eyebrow rule>{e.tag ?? (e.kind === "competition" ? "Competition" : "Workshop")}</Eyebrow>
          <h1 className="m-0 font-display text-[clamp(44px,6vw,80px)] leading-[0.95] uppercase">{e.title}</h1>
          <p className="m-0 max-w-[68ch] text-[17px] leading-[1.7] whitespace-pre-line text-muted">{e.body}</p>
          {e.categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Categories</p>
              <ul className="flex flex-wrap gap-2">
                {e.categories.map((c) => <li key={c} className="border border-line-strong px-3 py-[5px] text-xs font-semibold tracking-[0.04em] text-muted">{c}</li>)}
              </ul>
            </div>
          )}
        </div>

        <aside aria-label="Registration" className="flex flex-col gap-5 border border-line bg-surface p-6 nav:sticky nav:top-28">
          <dl className="flex flex-col gap-4 text-sm">
            {e.startsAt && <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">When</dt><dd className="m-0 mt-1 font-semibold"><time dateTime={e.startsAt}>{eventDate(e.startsAt)}</time></dd></div>}
            {e.venue && <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Where</dt><dd className="m-0 mt-1 font-semibold">{e.venue}</dd></div>}
            <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Entry</dt><dd className="m-0 mt-1 font-semibold">{feeLabel(e.feeLkr)}</dd></div>
            {spotsLeft !== null && state === "open" && (
              <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Spots left</dt><dd className="m-0 mt-1 font-semibold">{spotsLeft}</dd></div>
            )}
            {e.registrationClosesAt && state === "open" && (
              <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Registration closes</dt><dd className="m-0 mt-1 font-semibold">{eventDate(e.registrationClosesAt)}</dd></div>
            )}
          </dl>
          {state === "open" ? (
            <Link href={`/events/${e.slug}/register`} className="inline-flex min-h-11 items-center justify-center bg-gold px-6 py-[15px] text-sm font-bold tracking-[0.06em] text-bg uppercase transition-colors hover:bg-text">
              Register{e.feeLkr > 0 ? ` · ${feeLabel(e.feeLkr)}` : ""}
            </Link>
          ) : (
            <p className="m-0 border border-line-strong px-4 py-3 text-center text-sm font-bold tracking-[0.06em] text-muted uppercase">{STATE_TEXT[state]}</p>
          )}
          <p className="m-0 text-xs leading-relaxed text-faint">You&apos;ll need a free SLSWCA account. Your ticket appears in your account and the app.</p>
        </aside>
      </Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </>
  );
}
