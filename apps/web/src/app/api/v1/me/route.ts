import { DeleteAccountInput, ProfileUpdate, type Me } from "@slswca/core/schemas";
import { BAD_JSON, TOO_LARGE, fail, ok, originAllowed, readJson } from "@/lib/http";
import { UnknownClub, loadMe, updateProfile } from "@/lib/me";
import { authenticate, supabaseAdmin, type Authed } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Cookie-authenticated writes must come from our own pages (CSRF). Browsers
 * always send Origin on fetch PATCH/DELETE, so a missing one is rejected too.
 * Bearer-token calls (mobile app) aren't exposed to CSRF.
 */
const csrfOk = (req: Request, a: Authed) => a.via === "bearer" || (req.headers.get("origin") !== null && originAllowed(req));

const unauthorized = () => fail(401, "unauthorized", "Please sign in.");

export async function GET(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  try {
    return ok<Me>(await loadMe(a.db, a.user));
  } catch (e) {
    console.error("[me] load failed", { err: (e as Error).message });
    return fail(502, "load_failed", "Couldn't load your account.");
  }
}

export async function PATCH(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  if (!csrfOk(req, a)) return fail(403, "forbidden_origin", "Request origin not allowed.");
  const body = await readJson(req, 4096);
  if (body === TOO_LARGE || body === BAD_JSON) return fail(400, "bad_request", "Malformed request.");
  const parsed = ProfileUpdate.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return fail(422, "validation_failed", "Please check the highlighted fields.", fields);
  }
  try {
    await updateProfile(a.db, a.user.id, parsed.data);
    return ok(await loadMe(a.db, a.user));
  } catch (e) {
    if (e instanceof UnknownClub) return fail(422, "validation_failed", "Unknown club.", { clubSlug: "Pick a club from the list." });
    console.error("[me] update failed", { err: (e as Error).message });
    return fail(502, "update_failed", "Couldn't save your profile.");
  }
}

/** Self-service account deletion (PDPA right to erasure). Payments stay, unlinked, for the accounts. */
export async function DELETE(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  if (!csrfOk(req, a)) return fail(403, "forbidden_origin", "Request origin not allowed.");
  const parsed = DeleteAccountInput.safeParse(await readJson(req, 1024));
  if (!parsed.success) return fail(422, "confirm_required", 'Type DELETE to confirm.');
  const admin = supabaseAdmin();
  if (!admin) return fail(503, "unavailable", "Account deletion is temporarily unavailable.");
  const { error } = await admin.auth.admin.deleteUser(a.user.id);
  if (error) {
    console.error("[me] delete failed", { err: error.message });
    return fail(502, "delete_failed", "Couldn't delete your account. Please contact us.");
  }
  return ok({ deleted: true });
}
