import { log } from "@/lib/observability";
import { listContributions, listLeads, listMembers, listRegistrations, requireAdminApi } from "@/lib/admin";
import { toCsv } from "@/lib/csv";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

const COLUMNS = {
  leads: ["createdAt", "name", "pathway", "club", "email", "phone", "message", "handled", "handledAt"],
  contributions: ["createdAt", "orderId", "donor", "email", "phone", "fund", "amount", "recurring", "status", "method", "anonymous"],
  members: ["since", "name", "email", "phone", "club", "role", "coachTier"],
  registrations: ["event", "createdAt", "athlete", "phone", "category", "club", "status", "emergencyName", "emergencyPhone", "ticketCode"],
} as const;

export async function GET(req: Request) {
  const r = await requireAdminApi(req);
  if ("error" in r) return r.error === 401 ? fail(401, "unauthorized", "Please sign in.") : fail(404, "not_found", "Not found.");

  const type = new URL(req.url).searchParams.get("type");
  if (!type || !(type in COLUMNS)) return fail(400, "bad_type", "Unknown export.");
  const t = type as keyof typeof COLUMNS;
  const event = new URL(req.url).searchParams.get("event") ?? undefined;

  const rows =
    t === "leads" ? await listLeads(r.a.db)
    : t === "contributions" ? await listContributions(r.a.db)
    : t === "registrations" ? await listRegistrations(r.a.db, event)
    : await listMembers(r.a.db);
  log("info", "admin.export", { type, by: r.a.user.id, rows: rows.length }); // audit trail for PII exports

  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows as unknown as Record<string, unknown>[], [...COLUMNS[t]]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="slswca-${t}${event ? `-${event}` : ""}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
