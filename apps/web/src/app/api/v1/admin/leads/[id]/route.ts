import { z } from "zod";
import { requireAdminApi, setLeadHandled } from "@/lib/admin";
import { fail, ok, originAllowed, readJson } from "@/lib/http";

const Body = z.object({ handled: z.boolean() });

export async function PATCH(req: Request, ctx: RouteContext<"/api/v1/admin/leads/[id]">) {
  const r = await requireAdminApi(req);
  if ("error" in r) return r.error === 401 ? fail(401, "unauthorized", "Please sign in.") : fail(404, "not_found", "Not found.");
  if (r.a.via === "cookie" && (!req.headers.get("origin") || !originAllowed(req))) return fail(403, "forbidden_origin", "Request origin not allowed.");

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return fail(400, "bad_id", "Invalid id.");
  const body = Body.safeParse(await readJson(req, 256));
  if (!body.success) return fail(422, "validation_failed", "Send { handled: boolean }.");

  try {
    const found = await setLeadHandled(r.a.db, id, body.data.handled);
    return found ? ok({ id, handled: body.data.handled }) : fail(404, "not_found", "Lead not found.");
  } catch (e) {
    console.error("[admin.leads] update failed", { id, err: (e as Error).message });
    return fail(502, "update_failed", "Couldn't update the lead.");
  }
}
