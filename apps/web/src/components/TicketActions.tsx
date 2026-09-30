"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApiResult } from "@slswca/core/schemas";

export function TicketActions({ code, status, eventSlug }: { code: string; status: string; eventSlug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // While PayHere's confirmation is in flight, refresh every few seconds (max ~1 min).
  useEffect(() => {
    if (status !== "pending") return;
    let n = 0;
    const t = setInterval(() => (++n > 15 ? clearInterval(t) : router.refresh()), 4000);
    return () => clearInterval(t);
  }, [status, router]);

  async function cancel() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/v1/tickets/${code}/cancel`, { method: "POST" }).catch(() => null);
    const json = res ? ((await res.json()) as ApiResult<unknown>) : null;
    setBusy(false);
    if (!json?.ok) return setError(json && !json.ok ? json.error.message : "Couldn't reach the server.");
    router.refresh();
  }

  if (status === "cancelled")
    return eventSlug ? <Link href={`/events/${eventSlug}/register`} className="text-sm font-bold tracking-[0.06em] text-gold uppercase hover:text-text">Register again →</Link> : null;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {status === "confirmed" && <p className="m-0 max-w-sm text-sm text-muted">Show this QR code at check-in. A screenshot works too.</p>}
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="cursor-pointer text-[13px] text-faint underline underline-offset-2 hover:text-danger">
          Cancel my registration
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-muted">Give up your spot?</span>
          <button type="button" disabled={busy} onClick={cancel} className="min-h-11 cursor-pointer bg-danger px-4 py-2 text-xs font-bold tracking-[0.06em] text-text uppercase disabled:opacity-60">
            {busy ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="min-h-11 cursor-pointer border border-line-strong px-4 py-2 text-xs font-bold tracking-[0.06em] uppercase">Keep it</button>
        </div>
      )}
      {status === "confirmed" && confirming && <p className="m-0 max-w-sm text-xs text-faint">Refunds for paid events are handled by the committee. Message us after cancelling.</p>}
      {error && <p role="alert" className="m-0 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
