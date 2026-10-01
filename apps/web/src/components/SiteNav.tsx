"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@slswca/core/content";
import { cn } from "./ui";

export function SiteNav() {
  const pathname = usePathname();
  // Menu remembers the path it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const signedIn = useSignedIn();
  const account = signedIn === null ? null : signedIn ? { href: "/account", label: "Account" } : { href: "/login", label: "Sign in" };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/92 backdrop-blur-md">
      <nav aria-label="Main" className="relative flex items-center justify-between gap-6 px-6 py-[18px] nav:px-10">
        <Link href="/" className="flex min-h-11 items-center" aria-label="SLSWCA home">
          <Image src="/logo-light.png" alt="" width={154} height={36} priority sizes="154px" className="h-8 w-auto nav:h-9" />
        </Link>

        <ul className="hidden items-center gap-7 text-sm font-semibold tracking-[0.04em] whitespace-nowrap uppercase menu:flex">
          {site.nav.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn("transition-colors", isActive(l.href) ? "text-text" : "text-muted hover:text-gold")}
              >
                {l.label}
              </Link>
            </li>
          ))}
          {account && (
            <li>
              <Link
                href={account.href}
                aria-current={isActive(account.href) ? "page" : undefined}
                className={cn("transition-colors", isActive(account.href) ? "text-text" : "text-muted hover:text-gold")}
              >
                {account.label}
              </Link>
            </li>
          )}
          <li>
            <Link href="/#join" className="bg-gold px-5 py-2.5 font-bold tracking-[0.06em] text-bg transition-colors hover:bg-text">
              Join us
            </Link>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-11 cursor-pointer place-items-center border border-line-strong text-xl leading-none text-text menu:hidden"
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>

        <ul
          id="mobile-menu"
          hidden={!open}
          className="absolute inset-x-0 top-full z-60 flex flex-col border-b border-line bg-bg menu:hidden"
        >
          {[...site.nav, ...(account ? [account] : []), { href: "/#join", label: "Join us" }].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) && l.href !== "/#join" ? "page" : undefined}
                className={cn(
                  "block border-t border-line px-6 py-4 text-[15px] font-bold tracking-[0.06em] uppercase",
                  l.href === "/#join" ? "text-gold" : isActive(l.href) ? "text-text" : "text-muted",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/** null = auth not configured (hide the link); otherwise whether a session exists. */
function useSignedIn() {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return; // auth off: don't ship the client at all
    let unsub: (() => void) | undefined;
    let cancelled = false;
    import("@/lib/supabase/browser").then(({ supabaseBrowser }) => {
      const sb = supabaseBrowser();
      if (!sb || cancelled) return;
      sb.auth.getSession().then(({ data }) => !cancelled && setState(Boolean(data.session)));
      const { data } = sb.auth.onAuthStateChange((_e, session) => setState(Boolean(session)));
      unsub = () => data.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);
  return state;
}
