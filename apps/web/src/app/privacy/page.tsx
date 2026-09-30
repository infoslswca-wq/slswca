import type { Metadata } from "next";
import { site } from "@slswca/core/content";
import { PageHeader } from "@/components/PageHeader";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

// DRAFT — have the committee / legal adviser review against the
// Personal Data Protection Act No. 9 of 2022 (Sri Lanka) before launch.
export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Your data" title="Privacy" accent="notice">
        How {site.fullName} handles the details you share with us.
      </PageHeader>
      <Container className="max-w-[80ch] pb-20">
        <div className="flex flex-col gap-6 border-t border-line pt-10 leading-[1.7] text-muted [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-text [&_h2]:uppercase">
          <h2>What we collect</h2>
          <p>When you register interest in the Academy we collect your name, club, email, phone/WhatsApp number, chosen pathway and any message you write.</p>
          <h2>Why</h2>
          <p>Only to contact you about Academy programme intakes, officiating courses and selection trials. We don&apos;t sell your data or use it for advertising.</p>
          <h2>How long</h2>
          <p>We keep submissions for up to 24 months, then delete them unless you&apos;ve joined a programme.</p>
          <h2>Your rights</h2>
          <p>You can ask to see, correct or delete your data at any time by messaging us on Instagram or WhatsApp.</p>
          <h2>Cookies</h2>
          <p>This site uses no tracking or advertising cookies.</p>
        </div>
      </Container>
    </>
  );
}
