"use client";

import { ButtonLink, Container, Display } from "@/components/ui";

/** Friendly page for unexpected errors. The server-side error is already reported via instrumentation.ts. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex min-h-[60dvh] flex-col items-start justify-center gap-6 py-24">
      <p className="text-xs font-bold tracking-[0.14em] text-gold uppercase">Something broke</p>
      <Display as="h1" className="text-[clamp(44px,6vw,72px)]" accent="rep.">Failed</Display>
      <p className="m-0 max-w-[52ch] text-muted">
        That&apos;s on us, not you. Try again, and if it keeps happening message us on Instagram.
        {error.digest && <span className="mt-2 block text-xs text-faint">Reference: {error.digest}</span>}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="min-h-11 cursor-pointer bg-gold px-7 py-[15px] text-sm font-bold tracking-[0.06em] text-bg uppercase hover:bg-text">
          Try again
        </button>
        <ButtonLink href="/" variant="secondary">Back home</ButtonLink>
      </div>
    </Container>
  );
}
