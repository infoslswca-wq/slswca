import { log } from "@/lib/observability";
import { AcademyInterestInput } from "@slswca/core/schemas";
import { deliverAcademyInterest } from "@/lib/deliver";
import { BAD_JSON, TOO_LARGE, clientIp, fail, ok, originAllowed, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!originAllowed(req)) return fail(403, "forbidden_origin", "Request origin not allowed.");
  if (!req.headers.get("content-type")?.includes("application/json"))
    return fail(415, "unsupported_media_type", "Send JSON.");

  const rl = await rateLimit(`academy:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.ok)
    return fail(429, "rate_limited", "Too many submissions. Please try again later.", undefined, {
      "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
    });

  const body = await readJson(req);
  if (body === TOO_LARGE) return fail(413, "payload_too_large", "Submission is too large.");
  if (body === BAD_JSON) return fail(400, "bad_json", "Malformed request.");

  const parsed = AcademyInterestInput.safeParse(body);
  if (!parsed.success) {
    // Honeypot tripped: pretend success so bots learn nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return ok({ id: crypto.randomUUID() }, 201);
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return fail(422, "validation_failed", "Please check the highlighted fields.", fields);
  }

  const id = crypto.randomUUID();
  try {
    await deliverAcademyInterest({ ...parsed.data, id, receivedAt: new Date().toISOString() });
  } catch (e) {
    log("error", "academy.interest", { msg: "delivery failed", id, err: (e as Error).message });
    return fail(502, "delivery_failed", "We couldn't record your interest right now. Please try again, or message us on Instagram.");
  }
  return ok({ id }, 201);
}
