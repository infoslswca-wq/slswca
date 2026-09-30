import { ContributionInput, type CheckoutSession } from "@slswca/core/schemas";
import { funds } from "@slswca/core/content";
import { BAD_JSON, TOO_LARGE, clientIp, fail, ok, originAllowed, readJson } from "@/lib/http";
import { checkoutHash, checkoutUrl, formatAmount, newOrderId, payhereConfig } from "@/lib/payhere";
import { NotConfigured, createContribution } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { authenticate } from "@/lib/supabase/server";

/** Creates a pending contribution and returns a signed PayHere checkout form. */
export async function POST(req: Request) {
  if (!originAllowed(req)) return fail(403, "forbidden_origin", "Request origin not allowed.");
  if (!req.headers.get("content-type")?.includes("application/json")) return fail(415, "unsupported_media_type", "Send JSON.");

  const rl = rateLimit(`contrib:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return fail(429, "rate_limited", "Too many attempts. Please try again later.");

  const body = await readJson(req);
  if (body === TOO_LARGE) return fail(413, "payload_too_large", "Request is too large.");
  if (body === BAD_JSON) return fail(400, "bad_json", "Malformed request.");

  const parsed = ContributionInput.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return fail(422, "validation_failed", "Please check the highlighted fields.", fields);
  }

  const cfg = payhereConfig();
  if (!cfg) return fail(503, "payments_unavailable", "Online contributions aren't open yet. Please check back soon.");

  const d = parsed.data;
  const orderId = newOrderId("C");
  const member = await authenticate(req).catch(() => null); // optional: link to account if signed in
  try {
    await createContribution(d, orderId, member?.user.id ?? null);
  } catch (e) {
    if (e instanceof NotConfigured) return fail(503, "payments_unavailable", "Online contributions aren't open yet. Please check back soon.");
    console.error("[contributions] create failed", { orderId, err: (e as Error).message });
    return fail(502, "create_failed", "We couldn't start your contribution. Please try again.");
  }

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const notifyBase = (process.env.PAYHERE_NOTIFY_BASE_URL ?? site).replace(/\/$/, "");
  const fund = funds.find((f) => f.key === d.fund)?.label ?? "General";

  const fields: Record<string, string> = {
    merchant_id: cfg.merchantId,
    return_url: `${site}/contribute/thanks?order=${encodeURIComponent(orderId)}`,
    cancel_url: `${site}/contribute?cancelled=1`,
    notify_url: `${notifyBase}/api/v1/payments/payhere/notify`,
    order_id: orderId,
    items: `SLSWCA contribution — ${fund}`,
    currency: "LKR",
    amount: formatAmount(d.amount),
    first_name: d.firstName,
    last_name: d.lastName,
    email: d.email,
    phone: d.phone,
    // PayHere requires address fields; we don't collect a postal address.
    address: "N/A",
    city: "N/A",
    country: "Sri Lanka",
    custom_1: "contribution",
    custom_2: d.fund,
    hash: checkoutHash(cfg, orderId, d.amount),
    ...(d.recurring && { recurrence: "1 Month", duration: "Forever" }),
  };

  return ok<CheckoutSession>({ orderId, action: checkoutUrl(cfg), fields }, 201);
}
