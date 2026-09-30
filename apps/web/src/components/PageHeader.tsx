import type { ReactNode } from "react";
import { Container, Eyebrow } from "./ui";

export function PageHeader({ eyebrow, title, accent, children, measure = "60ch" }: {
  eyebrow: string; title: ReactNode; accent: ReactNode; children: ReactNode; measure?: string;
}) {
  return (
    <Container className="rise flex flex-col gap-4 pt-14 pb-12 nav:pt-[72px]">
      <Eyebrow rule>{eyebrow}</Eyebrow>
      <h1 className="m-0 font-display text-[clamp(48px,6vw,80px)] leading-[0.95] uppercase">
        {title} <span className="text-gold">{accent}</span>
      </h1>
      <p className="m-0 text-[17px] leading-relaxed text-muted" style={{ maxWidth: measure }}>{children}</p>
    </Container>
  );
}
