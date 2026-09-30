import { fail, ok } from "@/lib/http";
import { NotConfigured, paymentStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Status for the "thanks" screen. Order ids are unguessable; only status/amount are exposed. */
export async function GET(req: Request) {
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
