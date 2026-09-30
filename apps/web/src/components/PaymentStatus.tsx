"use client";

import { useEffect, useState } from "react";
import type { ApiResult } from "@slswca/core/schemas";
import { ButtonLink, Display } from "./ui";

type S = { status: string; amount: number; recurring: boolean };

/**
 * PayHere redirects the donor here before (or after) its server notify lands,
 * so poll briefly for the confirmed status.
 */
export function PaymentStatus({ order }: { order: string }) {
  const [s, setS] = useState<S | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!order) return;
    let tries = 0;
    let t: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const r = (await (await fetch(`/api/v1/payments/status?order=${encodeURIComponent(order)}`)).json()) as ApiResult<S>;
        if (r.ok) {
          setS(r.data);
          if (r.data.status !== "pending") return;
        }
      } catch {}
      if (++tries < 10) t = setTimeout(poll, 2000);
      else setGaveUp(true);
    };
    poll();
    return () => clearTimeout(t);
  }, [order]);

  if (s?.status === "success")
    return (
      <>
        <Display as="h1" className="text-[clamp(48px,6vw,80px)]" accent="you.">Thank</Display>
        <p className="m-0 max-w-[56ch] text-lg leading-relaxed text-muted">
          Your {s.recurring ? "monthly " : ""}contribution of LKR {Number(s.amount).toLocaleString("en-LK")} is confirmed. A receipt is on its
          way to your email.
        </p>
        <ButtonLink href="/">Back home</ButtonLink>
      </>
    );

  if (s && s.status !== "pending")
    return (
      <>
        <Display as="h1" className="text-[clamp(40px,5vw,64px)]">Payment not completed</Display>
        <p className="m-0 max-w-[56ch] text-muted">Nothing was charged. You can try again whenever you like.</p>
        <ButtonLink href="/contribute">Try again</ButtonLink>
      </>
    );

  return (
    <>
      <Display as="h1" className="text-[clamp(40px,5vw,64px)]" accent="payment…">Confirming your</Display>
      <p role="status" className="m-0 max-w-[56ch] text-muted">
        {gaveUp || !order
          ? "This is taking longer than usual. If you were charged, your receipt will arrive by email — no need to pay again."
          : "Hang tight — this usually takes a few seconds."}
      </p>
    </>
  );
}
