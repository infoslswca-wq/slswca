import { ButtonLink, Container, Display } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60dvh] flex-col items-start justify-center gap-6 py-24">
      <p className="text-xs font-bold tracking-[0.14em] text-gold uppercase">404</p>
      <Display as="h1" className="text-[clamp(48px,6vw,80px)]" accent="off the bar.">Slipped</Display>
      <p className="m-0 max-w-[52ch] text-muted">That page doesn&apos;t exist — it may have moved when we rebuilt the site.</p>
      <ButtonLink href="/">Back home</ButtonLink>
    </Container>
  );
}
