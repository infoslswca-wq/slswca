import type { Metadata } from "next";
import { pathways, tiers } from "@slswca/core/content";
import { AcademyInterestForm } from "@/components/AcademyInterestForm";
import { ImageSlot } from "@/components/ImageSlot";
import { ButtonLink, Container, Display, Eyebrow, SectionHead, cn } from "@/components/ui";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "SLSWCA Academy — coaching, officiating and athlete development pathways aligned with WSWCF standards. Register your interest.",
  alternates: { canonical: "/academy" },
};

export default function AcademyPage() {
  return (
    <>
      <Container className="grid items-center gap-12 pt-14 pb-14 nav:grid-cols-[1.1fr_0.9fr] nav:pt-[72px]">
        <div className="rise flex min-w-0 flex-col gap-[18px]">
          <Eyebrow rule>Training · Education · Certification</Eyebrow>
          <h1 className="m-0 font-display text-[clamp(48px,6vw,80px)] leading-[0.95] uppercase">
            SLSWCA <span className="text-gold">Academy</span>
          </h1>
          <p className="m-0 max-w-[56ch] text-[17px] leading-relaxed text-muted">
            The official training, education and certification arm of the Association — developing coaches, instructors, judges, referees
            and athletes to nationally and internationally recognised standards, with a direct pathway to WSWCF international competition.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <ButtonLink href="#pathways">Explore pathways</ButtonLink>
            <ButtonLink href="#apply" variant="secondary">Register interest</ButtonLink>
          </div>
        </div>
        <div className="rise rise-2 relative mr-4 min-w-0 nav:mr-0">
          <div aria-hidden className="absolute inset-[16px_-16px_-16px_16px] border border-line-strong" />
          <ImageSlot parallax={0.05} label="Academy — coaching session" className="relative z-10 h-[320px] nav:h-[420px]" />
        </div>
      </Container>

      <section id="pathways" className="border-t border-line">
        <Container className="flex flex-col gap-10 py-16">
          <SectionHead title="Three" accent="Pathways" meta="Aligned with WSWCF standards" />
          <ul className="grid gap-6 nav:grid-cols-3">
            {pathways.map((p) => (
              <li key={p.key} data-reveal className="flex flex-col gap-4 border border-line bg-surface px-7 py-8">
                <div aria-hidden className="font-display text-[44px] leading-none text-surface [-webkit-text-stroke:1px_var(--color-gold)]">{p.num}</div>
                <h3 className="m-0 font-display text-2xl leading-[1.1] uppercase">{p.title}</h3>
                <p className="m-0 text-sm leading-[1.7] text-muted">{p.body}</p>
                <ul className="mt-auto flex flex-col gap-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-baseline gap-2.5 text-[13px] font-semibold">
                      <span aria-hidden className="text-gold">—</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-10 py-16">
          <SectionHead title="The Coaching" accent="Ladder" meta="Four tiers" />
          <ol className="grid border border-line nav:grid-cols-4">
            {tiers.map((t, i) => (
              <li
                key={t.key}
                data-reveal
                className={cn(
                  "flex flex-col gap-3 px-6 py-7",
                  i < tiers.length - 1 && "border-b border-line nav:border-r nav:border-b-0",
                  t.honour ? "bg-maroon" : "bg-bg",
                )}
              >
                <p className={cn("text-[11px] font-bold tracking-[0.12em]", t.honour ? "text-text" : "text-gold")}>{t.tag}</p>
                <h3 className="m-0 font-display text-[22px] uppercase">{t.title}</h3>
                <p className={cn("m-0 text-[13px] leading-[1.65]", t.honour ? "text-text/85" : "text-muted")}>{t.body}</p>
              </li>
            ))}
          </ol>
          <p className="m-0 max-w-[80ch] text-[13px] leading-relaxed text-faint">
            Every certificate issued by the Academy carries the SLSWCA name and seal, signed by the Association&apos;s officers. No certificate
            may be issued under the SLSWCA name by any individual, club or entity not formally authorised by the Academy.
          </p>
        </Container>
      </section>

      <section id="apply" className="border-t border-line">
        <Container className="grid items-start gap-14 py-[72px] nav:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal className="flex min-w-0 flex-col gap-[18px]">
            <Eyebrow>Register your interest</Eyebrow>
            <Display className="text-[36px] nav:text-[44px]" accent="pathway">Start your</Display>
            <p className="m-0 text-[15px] leading-[1.7] text-muted">
              Tell us who you are and which pathway you&apos;re interested in. The Academy will contact you when the next programme intake,
              officiating course, or selection trial opens.
            </p>
            <ul className="flex flex-col gap-2.5 border-l-2 border-gold pl-[18px] text-[13px] leading-relaxed text-muted">
              <li><strong className="text-text">Coaching</strong> — programme intakes announced per tier</li>
              <li><strong className="text-text">Officiating</strong> — courses run ahead of sanctioned competitions</li>
              <li><strong className="text-text">Athlete Development</strong> — trials for national selection</li>
            </ul>
          </div>
          <AcademyInterestForm />
        </Container>
      </section>
    </>
  );
}
