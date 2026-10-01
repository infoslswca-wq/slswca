import { clientIp, fail, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { NotConfigured, paymentStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Status for the "thanks" screen. Order ids are unguessable; only status/amount are exposed. */
export async function GET(req: Request) {
  // The thanks page polls ~10x; cap guessing of order ids.
  if (!(await rateLimit(`paystatus:${clientIp(req)}`, 60, 10 * 60_000)).ok) return fail(429, "rate_limited", "Slow down.");
  const order = new URL(req.url).searchParams.get("order") ?? "";
  if (!/^[A-Z0-9-]{8,50}$/.test(order)) return fail(400, "bad_order", "Invalid order.");
  try {
    const s = await paymentStatus(order);
    return s ? ok(s) : fail(404, "not_found", "Order not found.");
  } catch (e) {
    if (e instanceof NotConfigured) return fail(503, "payments_unavailable", "Not configured.");
    throw e;
  }
}
