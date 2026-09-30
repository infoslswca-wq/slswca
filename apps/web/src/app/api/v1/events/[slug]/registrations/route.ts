import { RegistrationInput, type CheckoutSession, type RegistrationResult } from "@slswca/core/schemas";
import { RegistrationError, getDbEvent, registerForEvent } from "@/lib/events";
import { BAD_JSON, TOO_LARGE, fail, ok, originAllowed, readJson } from "@/lib/http";
import { log } from "@/lib/observability";
import { checkoutHash, checkoutUrl, formatAmount, newOrderId, payhereConfig } from "@/lib/payhere";
import { rateLimit } from "@/lib/rate-limit";
import { authenticate } from "@/lib/supabase/server";

/** Register the signed-in member for an event. Free → confirmed; paid → PayHere checkout. */
export async function POST(req: Request, ctx: RouteContext<"/api/v1/events/[slug]/registrations">) {
  const a = await authenticate(req);
  if (!a) return fail(401, "unauthorized", "Please sign in to register.");
  if (a.via === "cookie" && (!req.headers.get("origin") || !originAllowed(req))) return fail(403, "forbidden_origin", "Request origin not allowed.");

  const rl = await rateLimit(`reg:${a.user.id}`, 10, 10 * 60_000);
  if (!rl.ok) return fail(429, "rate_limited", "Too many attempts. Please try again later.");

  const body = await readJson(req, 4096);
  if (body === TOO_LARGE || body === BAD_JSON) return fail(400, "bad_request", "Malformed request.");
  const parsed = RegistrationInput.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return fail(422, "validation_failed", "Please check the highlighted fields.", fields);
  }

  const { slug } = await ctx.params;
  const event = await getDbEvent(slug);
  if (!event) return fail(404, "not_found", "This event isn't open for registration.");
  const cfg = payhereConfig();
  if (event.feeLkr > 0 && !cfg) return fail(503, "payments_unavailable", "Online payment for this event isn't available yet.");

  const d = parsed.data;
  // Keep the member's card current (column grants limit this to name/phone/club).
  await a.db.from("profiles").update({ full_name: d.fullName, phone: d.phone }).eq("id", a.user.id);

  const orderId = newOrderId("R");
  let reg;
  try {
    reg = await registerForEvent(a.user.id, slug, d, orderId);
  } catch (e) {
    if (e instanceof RegistrationError) return fail(409, e.code.toLowerCase(), e.message);
    log("error", "registration.failed", { slug, err: (e as Error).message });
    return fail(502, "registration_failed", "Couldn't complete your registration. Please try again.");
  }
  log("info", "registration.created", { slug, status: reg.status, user: a.user.id });

  if (reg.status === "confirmed") return ok<RegistrationResult>({ status: "confirmed", ticketCode: reg.ticket_code }, 201);

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const notifyBase = (process.env.PAYHERE_NOTIFY_BASE_URL ?? site).replace(/\/$/, "");
  const [first, ...rest] = d.fullName.split(/\s+/);
  const amount = Number(reg.amount);
  const checkout: CheckoutSession = {
    orderId,
    action: checkoutUrl(cfg!),
    fields: {
      merchant_id: cfg!.merchantId,
      return_url: `${site}/account/tickets/${reg.ticket_code}`,
      cancel_url: `${site}/events/${slug}/register?cancelled=1`,
      notify_url: `${notifyBase}/api/v1/payments/payhere/notify`,
      order_id: orderId,
      items: `Registration — ${event.title}`.slice(0, 100),
      currency: "LKR",
      amount: formatAmount(amount),
      first_name: first,
      last_name: rest.join(" ") || first,
      email: a.user.email ?? "",
      phone: d.phone,
      address: "N/A",
      city: "N/A",
      country: "Sri Lanka",
      custom_1: "registration",
      custom_2: slug,
      hash: checkoutHash(cfg!, orderId, amount),
    },
  };
  return ok<RegistrationResult>({ status: "pending", ticketCode: reg.ticket_code, checkout }, 201);
}
