import { battles, clubs, partners, site, workshops } from "@slswca/core/content";
import { ImageSlot } from "@/components/ImageSlot";
import { ButtonLink, Container, Display, Eyebrow, TextLink } from "@/components/ui";

const stats = [
  { value: clubs.length, label: "Member clubs" },
  { value: battles.length, label: "Battles fought" },
  { value: workshops.length, label: "Free workshops" },
  { value: site.founded, label: "Founded" },
];

const marquee = "Strength ✕ Discipline ✕ Community ✕ Sri Lanka ✕ Street Workout ✕ Calisthenics ✕ ".repeat(2);

const backedBy = ["wswcf", "ministry", "energy", "clothing"].map((s) => partners.find((p) => p.slug === s)!);

export default function HomePage() {
  return (
    <>
      <Container className="grid items-center gap-12 pt-14 pb-16 nav:grid-cols-[1.1fr_0.9fr] nav:pt-[72px]">
        <div className="rise flex flex-col gap-6">
          <Eyebrow rule>Official member of the WSWCF</Eyebrow>
          <h1 className="m-0 font-display text-[clamp(56px,7vw,96px)] leading-[0.95] tracking-[0.01em] uppercase">
            Street built.
            <br />
            <span className="text-gold">Nation strong.</span>
          </h1>
          <p className="m-0 max-w-[52ch] text-lg leading-relaxed text-muted">{site.description}</p>
          <div className="flex flex-wrap gap-3.5">
            <ButtonLink href="/events">See events</ButtonLink>
            <ButtonLink href="#clubs" variant="secondary">Find a club</ButtonLink>
          </div>
        </div>
        <div className="rise rise-2 relative mr-4 min-w-0 nav:mr-0">
          <div aria-hidden className="absolute inset-[16px_-16px_-16px_16px] border border-line-strong" />
          <ImageSlot parallax={0.05} priority label="Hero photo — athlete mid-move" className="relative z-10 h-[360px] nav:h-[520px]" />
          <div className="absolute -bottom-3.5 -left-3.5 z-20 bg-maroon px-[18px] py-2.5 font-display text-[15px] tracking-[0.1em] uppercase">
            Est. {site.founded} · {site.city}
          </div>
        </div>
      </Container>

      <div className="overflow-hidden border-y border-bg bg-gold py-3" aria-hidden>
        <div className="flex w-max animate-marquee font-display text-xl tracking-[0.12em] whitespace-nowrap text-bg uppercase">
          <span className="pr-8">{marquee}</span>
          <span className="pr-8">{marquee}</span>
        </div>
      </div>

      <Container className="grid grid-cols-2 gap-6 py-14 nav:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} data-reveal className="flex flex-col gap-1 border-l-2 border-gold py-1 pl-5">
            <div data-countup={s.value} className="font-display text-[44px] leading-none">
              {s.value}
            </div>
            <div className="text-[13px] font-semibold tracking-[0.1em] text-muted uppercase">{s.label}</div>
          </div>
        ))}
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="grid items-center gap-12 py-[72px] nav:grid-cols-[0.9fr_1.1fr]">
          <ImageSlot label="Battle of the Clubs — finals crowd" className="h-[280px] nav:h-[400px]" />
          <div data-reveal className="flex flex-col gap-[18px]">
            <Eyebrow>Flagship competition</Eyebrow>
            <Display className="text-[40px] nav:text-5xl">Battle of the Clubs</Display>
            <p className="m-0 leading-[1.7] text-muted">
              Sri Lanka&apos;s first inter-club calisthenics league. Five battles across the island — from Mount Beach to Arcade
              Independence — where the nation&apos;s best clubs go head to head. Powertain Calisthenics took the inaugural 2024 crown.
            </p>
            <TextLink href="/events#battles">Follow the battles</TextLink>
          </div>
        </Container>
      </section>

      <Container className="grid items-center gap-12 py-[72px] nav:grid-cols-[1.1fr_0.9fr]">
        <div data-reveal className="flex flex-col gap-[18px]">
          <Eyebrow>Free &amp; open to all levels</Eyebrow>
          <Display className="text-[40px] nav:text-5xl">Community Workshops</Display>
          <p className="m-0 leading-[1.7] text-muted">
            Handstands, muscle-ups, pistol squats, L-sits — hands-on sessions led by the community, from Colombo to the south coast.
            Walk in, train, learn, and level up. Every workshop is free.
          </p>
          <TextLink href="/events#workshops">Upcoming workshops</TextLink>
        </div>
        <ImageSlot label="Workshop — group training session" className="order-first h-[280px] nav:order-none nav:h-[380px]" />
      </Container>

      <section id="clubs" className="bg-maroon">
        <Container data-reveal className="flex flex-col gap-9 py-[72px]">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            <Display className="text-[40px] nav:text-5xl">Member Clubs</Display>
            <p className="text-sm font-semibold text-text/75">Eleven clubs. One association.</p>
          </div>
          <ul className="flex flex-wrap gap-3">
            {clubs.map((c) => (
              <li
                key={c.slug}
                className="border border-text/35 px-[22px] py-3 font-display text-[17px] tracking-[0.06em] uppercase transition-colors hover:border-text hover:bg-text hover:text-maroon"
              >
                {c.name}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="flex flex-col gap-8 py-[72px]">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <Display className="text-[40px] nav:text-5xl">Backed by</Display>
          <TextLink href="/partners">All partners</TextLink>
        </div>
        <ul className="grid grid-cols-2 gap-4 nav:grid-cols-4">
          {backedBy.map((p) => (
            <li key={p.slug} data-reveal className="flex flex-col items-center gap-3.5 border border-line bg-surface p-6 text-center">
              <ImageSlot src={p.logo} alt={p.name ?? p.role} label={`${p.role} logo`} fit="contain" sizes="240px" className="h-[90px] w-full" />
              <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">{p.role}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section id="join" className="border-t border-line bg-surface">
        <Container data-reveal className="flex flex-col items-center gap-[22px] py-[88px] text-center">
          <Display className="text-[clamp(40px,5vw,72px)]" accent="waiting.">
            The bar is
          </Display>
          <p className="m-0 max-w-[56ch] text-[17px] leading-relaxed text-muted">
            Whether you&apos;re chasing your first pull-up or your first world title — there&apos;s a club, a workshop, and a community
            here for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <ButtonLink href={site.social.instagram}>Follow on Instagram</ButtonLink>
            <ButtonLink href={site.social.whatsapp} variant="secondary">WhatsApp channel</ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
