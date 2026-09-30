import type { Metadata } from "next";
import { ContributionForm } from "@/components/ContributionForm";
import { PageHeader } from "@/components/PageHeader";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Support Sri Lankan street workout — fund youth programmes, park equipment and national team travel.",
  alternates: { canonical: "/contribute" },
};

const promises = [
  { title: "Secure checkout", body: "Payments are processed by PayHere, a licensed Sri Lankan payment gateway. Your card details never reach our servers." },
  { title: "Your choice of fund", body: "Pick where it goes — youth programmes, park equipment or national team travel — and it's ring-fenced." },
  { title: "Receipt every time", body: "An emailed receipt for every contribution, one-off or monthly." },
];

export default async function ContributePage({ searchParams }: PageProps<"/contribute">) {
  const { cancelled } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Support the movement" title="Build the" accent="bar.">
        SLSWCA is volunteer-run. Every rupee goes into free workshops, public training equipment and getting Sri Lanka&apos;s athletes onto the
        world stage.
      </PageHeader>
      <section className="border-t border-line">
        <Container className="grid items-start gap-14 py-16 nav:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col border border-line">
              {promises.map((f) => (
                <li key={f.title} className="border-b border-line px-6 py-5 last:border-b-0">
                  <h2 className="m-0 font-display text-xl uppercase">{f.title}</h2>
                  <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
            <p className="m-0 border-l-2 border-gold pl-[18px] text-[13px] leading-relaxed text-muted">
              Monthly contributions can be cancelled anytime. Message us on Instagram or WhatsApp and we&apos;ll stop it the same day.
            </p>
          </div>
          <ContributionForm cancelled={cancelled === "1"} />
        </Container>
      </section>
    </>
  );
}
