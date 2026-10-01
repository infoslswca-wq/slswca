import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-6 nav:px-10", className)} {...p} />;
}

export function Eyebrow({ children, rule = false, className }: { children: ReactNode; rule?: boolean; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] text-gold uppercase", className)}>
      {rule && <span aria-hidden className="inline-block h-0.5 w-7 bg-gold" />}
      <span>{children}</span>
    </p>
  );
}

/** Two-tone display heading: `accent` renders in gold. */
export function Display({
  as: Tag = "h2",
  children,
  accent,
  className,
}: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  accent?: ReactNode;
  className?: string;
}) {
  return (
    <Tag className={cn("m-0 font-display uppercase leading-none", className)}>
      {children}
      {accent && (
        <>
          {" "}
          <span className="text-gold">{accent}</span>
        </>
      )}
    </Tag>
  );
}

export function SectionHead({ title, accent, meta }: { title: ReactNode; accent?: ReactNode; meta?: ReactNode }) {
  return (
    <div data-reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <Display accent={accent} className="text-[36px] nav:text-[44px]">
        {title}
      </Display>
      {meta && <p className="text-[13px] font-bold tracking-[0.1em] text-muted uppercase">{meta}</p>}
    </div>
  );
}

const btnBase =
  "inline-flex min-h-11 items-center justify-center px-7 py-[15px] text-sm font-bold tracking-[0.06em] uppercase transition-colors duration-150";
const variants = {
  primary: "bg-gold text-bg hover:bg-text",
  secondary: "border border-line-strong text-text hover:border-gold hover:text-gold",
};

type ButtonLinkProps = { href: string; variant?: keyof typeof variants; children: ReactNode; className?: string };

export function ButtonLink({ href, variant = "primary", children, className }: ButtonLinkProps) {
  const cls = cn(btnBase, variants[variant], className);
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button className={cn(btnBase, variants[variant], "cursor-pointer disabled:cursor-wait disabled:opacity-60", className)} {...p} />;
}

export function TextLink({ href, children, small = false, className }: { href: string; children: ReactNode; small?: boolean; className?: string }) {
  const cls = cn(
    "relative inline-block self-start border-b-2 border-gold font-bold tracking-[0.06em] text-text uppercase transition-colors hover:text-gold after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']",
    small ? "pb-[3px] text-[13px]" : "pb-1 text-sm",
    className,
  );
  const inner = (
    <>
      {children} <span aria-hidden>→</span>
    </>
  );
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}
