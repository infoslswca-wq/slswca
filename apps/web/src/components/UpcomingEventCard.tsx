import Link from "next/link";
import type { UpcomingEvent } from "@slswca/core/schemas";
import { cn } from "./ui";

export const eventDate = (iso: string) =>
  new Date(iso).toLocaleString("en-LK", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Colombo" });

export function feeLabel(fee: number) {
  return fee > 0 ? `LKR ${fee.toLocaleString("en-LK")}` : "Free";
}

export function UpcomingEventCard({ e }: { e: UpcomingEvent }) {
  return (
    <li data-reveal className="flex flex-col gap-4 border border-gold/60 bg-bg p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-[0.12em] text-gold uppercase">{e.kind === "competition" ? "Competition" : "Workshop"}</span>
        <span className={cn("px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase", e.feeLkr > 0 ? "border border-line-strong text-text" : "bg-maroon")}>
          {feeLabel(e.feeLkr)}
        </span>
      </div>
      <h3 className="m-0 font-display text-[26px] leading-[1.05] uppercase">{e.title}</h3>
      <p className="m-0 text-sm text-muted">
        {e.startsAt && <time dateTime={e.startsAt}>{eventDate(e.startsAt)}</time>}
        {e.startsAt && e.venue && " · "}
        {e.venue}
      </p>
      <Link href={`/events/${e.slug}`} className="mt-auto inline-flex min-h-11 items-center justify-center self-start bg-gold px-6 py-3 text-sm font-bold tracking-[0.06em] text-bg uppercase transition-colors hover:bg-text">
        Details &amp; register
      </Link>
    </li>
  );
}
