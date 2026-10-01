import type { Metadata } from "next";
import { partners, site } from "@slswca/core/content";
import type { Partner } from "@slswca/core";
import { ImageSlot } from "@/components/ImageSlot";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink, Container, Display } from "@/components/ui";

export const metadata: Metadata = {
  title: "Partners",
  description: "The federation, brand and government partners powering Sri Lankan street workout and calisthenics.",
  alternates: { canonical: "/partners" },
};

function PartnerGrid({ items, tileBg }: { items: Partner[]; tileBg: string }) {
  return (
    <ul className="grid grid-cols-2 gap-5 nav:grid-cols-4">
      {items.map((p) => (
        <li key={p.slug} data-reveal className={`flex flex-col items-center gap-4 border px-6 py-7 text-center ${p.logo ? `border-line ${tileBg}` : "border-dashed border-line-strong"}`}>
          {p.logo ? (
            <ImageSlot src={p.logo} alt={p.name ?? ""} label={`${p.role} logo`} fit="contain" sizes="260px" className="h-[110px] w-full" />
          ) : (
            <a href="#partner-with-us" className="grid h-[110px] w-full place-items-center text-sm font-bold tracking-[0.06em] text-muted uppercase transition-colors hover:text-gold">
              Become our {p.role.replace(/ Partner$/, "").toLowerCase()} partner →
            </a>
          )}
          <p className="text-xs font-bold tracking-[0.1em] text-gold uppercase">{p.role}</p>
        </li>
      ))}
    </ul>
  );
}

export default function PartnersPage() {
  const wswcf = partners.find((p) => p.kind === "federation")!;
  return (
    <>
      <PageHeader eyebrow="Stronger together" title="Our" accent="Partners" measure="64ch">
        From creative collaborators who bring our vision to life, to hydration partners who keep our athletes fueled, and federations and
        government affiliates that support our mission — each partnership plays a vital role in our journey.
      </PageHeader>

      <section className="border-t border-line bg-maroon">
        <Container className="grid items-center gap-12 py-14 nav:grid-cols-[320px_1fr]">
          <ImageSlot src={wswcf.logo} alt={wswcf.name} label="WSWCF logo" fit="contain" sizes="320px" className="h-[200px]" />
          <div data-reveal className="flex flex-col gap-3.5">
            <p className="text-xs font-bold tracking-[0.14em] text-text/75 uppercase">Official member of</p>
            <Display className="text-[30px] leading-[1.05] nav:text-4xl">World Street Workout &amp; Calisthenics Federation</Display>
            <p className="m-0 text-[15px] leading-[1.7] text-text/85">
              As part of this global network, SLSWCA is committed to upholding the standards and values of the WSWCF while promoting the
              growth of street workout and calisthenics in Sri Lanka — connecting our athletes to the international community.
            </p>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-10 py-16">
        <Display className="text-[40px]" accent="Partners">Brand</Display>
        <PartnerGrid items={partners.filter((p) => p.kind === "brand")} tileBg="bg-surface" />
      </Container>

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-10 py-16">
          <Display className="text-[40px]" accent="Affiliates">Government</Display>
          <PartnerGrid items={partners.filter((p) => p.kind === "government")} tileBg="bg-bg" />
        </Container>
      </section>

      <Container id="partner-with-us" data-reveal className="flex flex-col items-center gap-5 py-[72px] text-center">
        <Display className="text-[clamp(36px,4.5vw,60px)]" accent="us">Partner with</Display>
        <p className="m-0 max-w-[54ch] leading-relaxed text-muted">
          Share our passion for fitness, health, and community? Join the partners powering Sri Lankan calisthenics.
        </p>
        <ButtonLink href={site.social.instagram}>Get in touch</ButtonLink>
      </Container>
    </>
  );
}
