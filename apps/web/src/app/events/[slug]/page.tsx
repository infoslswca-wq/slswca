import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allEvents, eventBySlug, site } from "@slswca/core/content";
import { InstagramEmbed } from "@/components/InstagramEmbed";
import { ButtonLink, Container, Eyebrow } from "@/components/ui";

export const dynamicParams = false;
export const generateStaticParams = () => allEvents.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const e = eventBySlug((await params).slug);
  if (!e) return {};
  return { title: e.title, description: e.body.slice(0, 160), alternates: { canonical: `/events/${e.slug}` } };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" });

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const e = eventBySlug((await params).slug);
  if (!e) notFound();
  const siblings = allEvents.filter((x) => x.kind === e.kind);
  const i = siblings.indexOf(e);
  const [newer, older] = [siblings[i - 1], siblings[i + 1]];
  const back = e.kind === "competition" ? "/events#battles" : "/events#workshops";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: e.title,
    description: e.body,
    ...(e.date && { startDate: e.date }),
    eventStatus: "https://schema.org/EventScheduled",
    ...(e.venue && { location: { "@type": "Place", name: e.venue, address: { "@type": "PostalAddress", addressCountry: "LK" } } }),
    organizer: { "@type": "SportsOrganization", name: site.fullName },
    isAccessibleForFree: e.free,
  };

  return (
    <>
      <Container className="rise flex flex-col gap-5 pt-12 pb-12 nav:pt-16">
        <nav aria-label="Breadcrumb" className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
          <Link href={back} className="hover:text-gold">← {e.kind === "competition" ? "Battle of the Clubs 2024" : "Workshops"}</Link>
        </nav>
        <Eyebrow rule>{e.kind === "competition" ? `Battle ${e.number} · ${e.tag}` : e.tag}</Eyebrow>
        <h1 className="m-0 font-display text-[clamp(44px,6vw,80px)] leading-[0.95] uppercase">{e.title}</h1>
        <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          {e.venue && <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Venue</dt><dd className="m-0 mt-1 font-semibold">{e.venue}</dd></div>}
          {e.date && <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Date</dt><dd className="m-0 mt-1 font-semibold"><time dateTime={e.date}>{fmt(e.date)}</time></dd></div>}
          <div><dt className="text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Entry</dt><dd className="m-0 mt-1 font-semibold">{e.free ? "Free · walk-in" : "Club competition"}</dd></div>
        </dl>
        <p className="m-0 max-w-[68ch] text-[17px] leading-[1.7] text-muted">{e.body}</p>
        {e.clubs.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Competing clubs">
            {e.clubs.map((c) => <li key={c} className="border border-line-strong px-3 py-[5px] text-xs font-semibold tracking-[0.04em] text-muted">{c}</li>)}
          </ul>
        )}
      </Container>

      {e.media.length > 0 && (
        <section aria-labelledby="media-h" className="border-t border-line bg-surface">
          <Container className="flex flex-col gap-8 py-14">
            <h2 id="media-h" className="m-0 font-display text-[32px] uppercase">From the <span className="text-gold">floor</span></h2>
            <ul className="grid gap-6 sm:grid-cols-2 nav:grid-cols-3">
              {e.media.map((m, n) => (
                <li key={m.id} data-reveal className="min-w-0 bg-bg">
                  <InstagramEmbed media={m} title={e.media.length > 1 ? `${e.title} · ${n + 1}` : e.title} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <Container className="flex flex-wrap items-center justify-between gap-6 border-t border-line py-10">
        {older ? <Link href={`/events/${older.slug}`} className="text-sm font-bold tracking-[0.06em] uppercase hover:text-gold">← {older.title}</Link> : <span />}
        {newer ? <Link href={`/events/${newer.slug}`} className="text-sm font-bold tracking-[0.06em] uppercase hover:text-gold">{newer.title} →</Link> : <ButtonLink href="/events" variant="secondary">All events</ButtonLink>}
      </Container>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
