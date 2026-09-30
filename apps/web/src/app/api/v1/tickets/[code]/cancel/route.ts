import { fail, ok, originAllowed } from "@/lib/http";
import { log } from "@/lib/observability";
import { authenticate } from "@/lib/supabase/server";

/** Member cancels their own registration (DB function enforces ownership + not-yet-started). */
export async function POST(req: Request, ctx: RouteContext<"/api/v1/tickets/[code]/cancel">) {
  const a = await authenticate(req);
  if (!a) return fail(401, "unauthorized", "Please sign in.");
  if (a.via === "cookie" && (!req.headers.get("origin") || !originAllowed(req))) return fail(403, "forbidden_origin", "Request origin not allowed.");
  const { code } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(code)) return fail(400, "bad_ticket", "Invalid ticket.");
  const { data, error } = await a.db.rpc("cancel_my_registration", { p_ticket: code });
  if (error) {
    log("error", "ticket.cancel_failed", { code: error.code });
    return fail(502, "cancel_failed", "Couldn't cancel. Please try again.");
  }
  if (!data) return fail(409, "not_cancellable", "This registration can't be cancelled.");
  log("info", "ticket.cancelled", { user: a.user.id });
  return ok({ cancelled: true });
}
