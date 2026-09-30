import { log } from "@/lib/observability";
import { fail, ok } from "@/lib/http";
import { payhereConfig, verifyNotify } from "@/lib/payhere";
import { applyPayHereNotify } from "@/lib/payments";

/**
 * PayHere server-to-server callback (application/x-www-form-urlencoded).
 * Trust comes only from the md5sig (merchant secret) + amount/currency match
 * against our own record — never from the request origin.
 */
export async function POST(req: Request) {
  const cfg = payhereConfig();
  if (!cfg) return fail(503, "payments_unavailable", "Not configured.");

  const text = await req.text();
  if (text.length > 8192) return fail(413, "payload_too_large", "Too large.");
  const p = Object.fromEntries(new URLSearchParams(text));

  if (!verifyNotify(cfg, p)) {
    log("warn", "payhere.notify", { msg: "bad signature", order: p.order_id?.slice(0, 50) });
    return fail(400, "bad_signature", "Invalid signature.");
  }

  try {
    const outcome = await applyPayHereNotify(p);
    if (outcome === "amount_mismatch" || outcome === "not_found")
      log("error", "payhere.notify", { msg: "rejected", order: p.order_id, outcome });
    return ok({ outcome });
  } catch (e) {
    log("error", "payhere.notify", { msg: "failed", order: p.order_id, err: (e as Error).message });
    return fail(500, "notify_failed", "Try again."); // PayHere will retry
  }
}
