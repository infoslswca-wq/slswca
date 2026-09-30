import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { authEnabled, googleAuthEnabled } from "@/lib/supabase/env";
import { safeNext } from "@/lib/safe-next";
import { Container, Display, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  return (
    <Container className="grid items-start gap-14 py-16 nav:grid-cols-[1fr_1fr] nav:py-24">
      <div className="rise flex flex-col gap-5">
        <Eyebrow rule>Members</Eyebrow>
        <Display as="h1" className="text-[clamp(48px,6vw,80px)] leading-[0.95]" accent="in.">Sign</Display>
        <p className="m-0 max-w-[48ch] text-[17px] leading-relaxed text-muted">
          One account for the website and the SLSWCA app: your membership card, contributions, event registrations and Academy progress.
        </p>
        <p className="m-0 text-[13px] text-faint">No password needed. We&apos;ll email you a one-time code.</p>
      </div>
      {authEnabled() ? (
        <LoginForm next={safeNext(sp.next)} google={googleAuthEnabled()} linkError={sp.error === "link"} />
      ) : (
        <div className="border border-line bg-surface px-8 py-10">
          <p className="m-0 font-display text-2xl uppercase">Accounts open soon</p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-muted">Member sign-in isn&apos;t switched on yet. Follow us on Instagram for the launch.</p>
        </div>
      )}
    </Container>
  );
}
