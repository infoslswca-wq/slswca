import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clubs, waiver } from "@slswca/core/content";
import { RegistrationForm } from "@/components/RegistrationForm";
import { eventDate, feeLabel } from "@/components/UpcomingEventCard";
import { Container, Display, Eyebrow } from "@/components/ui";
import { availability, getDbEvent, registrationState } from "@/lib/events";
import { loadMe } from "@/lib/me";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Register", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ params, searchParams }: PageProps<"/events/[slug]/register">) {
  const { slug } = await params;
  const { cancelled } = await searchParams;
  const db = await supabaseServer();
  const { data } = (await db?.auth.getUser()) ?? { data: { user: null } };
  if (!db || !data.user) redirect(`/login?next=/events/${slug}/register`);

  const event = await getDbEvent(slug);
  if (!event) notFound();
  const state = registrationState(event, await availability(slug));
  const me = await loadMe(db, data.user);
  const existing = me.registrations.find((r) => r.eventSlug === slug && r.status !== "cancelled");

  return (
    <Container className="grid items-start gap-12 py-12 nav:grid-cols-[0.8fr_1.2fr] nav:py-16">
      <div className="rise flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
          <Link href={`/events/${slug}`} className="hover:text-gold">← {event.title}</Link>
        </nav>
        <Eyebrow rule>Registration</Eyebrow>
        <Display as="h1" className="text-[clamp(40px,5vw,64px)] leading-[0.95]">{event.title}</Display>
        <p className="m-0 text-muted">
          {event.startsAt && eventDate(event.startsAt)}
          {event.venue && ` · ${event.venue}`}
        </p>
        <p className="m-0 font-display text-2xl uppercase">{feeLabel(event.feeLkr)}</p>
      </div>

      {existing?.ticketCode ? (
        <div className="flex flex-col items-start gap-4 border border-gold bg-surface px-6 py-8">
          <p className="m-0 font-display text-2xl uppercase">You&apos;re registered</p>
          <p className="m-0 text-sm text-muted">Status: {existing.status}.</p>
          <Link href={`/account/tickets/${existing.ticketCode}`} className="bg-gold px-6 py-3 text-sm font-bold tracking-[0.06em] text-bg uppercase hover:bg-text">View ticket</Link>
        </div>
      ) : state !== "open" ? (
        <div className="border border-line bg-surface px-6 py-8">
          <p className="m-0 font-display text-2xl uppercase">{state === "full" ? "Event full" : state === "not_open" ? "Not open yet" : "Registration closed"}</p>
        </div>
      ) : (
        <RegistrationForm
          slug={slug}
          paid={event.feeLkr > 0}
          feeLabel={feeLabel(event.feeLkr)}
          categories={event.categories}
          clubs={clubs.map((c) => ({ slug: c.slug, name: c.name }))}
          initial={{ fullName: me.fullName ?? "", phone: me.phone ?? "", clubSlug: me.club?.slug ?? "" }}
          waiver={waiver.points as unknown as string[]}
          cancelled={cancelled === "1"}
        />
      )}
    </Container>
  );
}
