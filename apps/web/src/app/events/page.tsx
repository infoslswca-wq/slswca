import type { Metadata } from "next";
import { battles, workshops } from "@slswca/core/content";
import { ImageSlot } from "@/components/ImageSlot";
import { PageHeader } from "@/components/PageHeader";
import { Container, SectionHead, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Events & Competitions",
  description: "Battle of the Clubs — Sri Lanka's inter-club calisthenics league — and free community workshops across the island.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  return (
    <>
      <PageHeader eyebrow="SLSWCA calendar" title="Events &" accent="Competitions">
        From the inaugural Battle of the Clubs to free community workshops across the island — this is where Sri Lankan calisthenics happens.
      </PageHeader>

      <section id="battles" aria-labelledby="battles-h" className="border-t border-line">
        <Container className="flex flex-col gap-10 py-14">
          <SectionHead title={<span id="battles-h">Battle of the Clubs</span>} accent="2024" meta="Champions: Powertain Calisthenics" />
          <ol className="flex flex-col gap-8">
            {battles.map((b) => (
              <li key={b.slug} data-reveal className="grid items-start gap-6 border-t border-line pt-8 nav:grid-cols-[120px_340px_1fr] nav:gap-8">
                <div className="flex items-baseline gap-4 nav:flex-col nav:gap-1.5">
                  <div aria-hidden className="font-display text-[52px] leading-none text-line [-webkit-text-stroke:1px_var(--color-gold)]">{b.number}</div>
                  <div className="text-xs font-bold tracking-[0.1em] text-gold uppercase">{b.tag}</div>
                </div>
                <ImageSlot label={b.venue ? `${b.title} — ${b.venue}` : b.title} className="h-[220px]" />
                <div className="flex flex-col gap-3">
                  <h3 className="m-0 font-display text-[26px] tracking-[0.02em] uppercase">{b.title}</h3>
                  <p className="m-0 text-[15px] leading-[1.7] text-muted">{b.body}</p>
                  <ul className="flex flex-wrap gap-2" aria-label="Competing clubs">
                    {b.clubs.map((c) => (
                      <li key={c} className="border border-line-strong px-3 py-[5px] text-xs font-semibold tracking-[0.04em] text-muted">{c}</li>
                    ))}
                  </ul>
                  <TextLink small href={`/events/${b.slug}`}>{b.media.length ? "View gallery" : "Read more"}</TextLink>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="workshops" aria-labelledby="workshops-h" className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-10 py-16">
          <SectionHead title={<><span id="workshops-h">Calisthenics</span></>} accent="Workshops" meta="Free · All levels · Walk-in" />
          <ul className="grid gap-7 nav:grid-cols-2">
            {workshops.map((w) => (
              <li key={w.slug} data-reveal className="flex flex-col border border-line bg-bg">
                <ImageSlot label={`${w.title} — ${w.venue}`} className="h-[240px] border-0 border-b" />
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="m-0 font-display text-[22px] uppercase">{w.title}</h3>
                    <span className="bg-maroon px-2.5 py-[5px] text-[11px] font-bold tracking-[0.08em] whitespace-nowrap">
                      {w.date ? <time dateTime={w.date}>{w.tag}</time> : w.tag}
                    </span>
                  </div>
                  <p className="m-0 text-sm leading-[1.7] text-muted">{w.body}</p>
                  <TextLink small href={`/events/${w.slug}`}>{w.media.length ? "View media" : "Read more"}</TextLink>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
