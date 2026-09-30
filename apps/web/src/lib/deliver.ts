import "server-only";
import { log } from "./observability";
import type { AcademyInterestInput } from "@slswca/core/schemas";
import { supabaseAdmin } from "./supabase/admin";

type Lead = AcademyInterestInput & { id: string; receivedAt: string };

/**
 * Supabase (`academy_interest`) is the system of record when configured;
 * email/webhook is then a best-effort notification. Without Supabase, the
 * notification channel must succeed. In production with neither configured,
 * fail loudly rather than silently drop leads.
 */
export async function deliverAcademyInterest(data: Lead) {
  const stored = await storeLead(data);
  try {
    const notified = await notifyLead(data);
    if (!stored && !notified) {
      if (process.env.NODE_ENV === "production") throw new Error("no delivery channel configured");
      log("info", "academy.interest", { msg: "(no delivery configured)", id: data.id, pathway: data.pathway });
    }
  } catch (e) {
    if (!stored) throw e;
    log("error", "academy.interest", { msg: "notify failed (lead is stored)", id: data.id, err: (e as Error).message });
  }
}

async function storeLead(data: Lead) {
  const db = supabaseAdmin();
  if (!db) return false;
  const { error } = await db.from("academy_interest").insert({
    id: data.id,
    name: data.name,
    club: data.club || null,
    email: data.email || null,
    phone: data.phone || null,
    pathway: data.pathway,
    message: data.message || null,
    consent_at: data.receivedAt,
  });
  if (error) throw new Error(`db ${error.code}`);
  return true;
}

/** Returns true if a channel was configured and succeeded. */
async function notifyLead(data: Lead) {
  const { RESEND_API_KEY, ACADEMY_INBOX, FORM_WEBHOOK_URL, FORM_WEBHOOK_SECRET, MAIL_FROM } = process.env;

  if (RESEND_API_KEY && ACADEMY_INBOX) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM ?? "SLSWCA Academy <academy@slswca.com>",
        to: ACADEMY_INBOX.split(","),
        reply_to: data.email || undefined,
        subject: `Academy interest — ${data.pathway} — ${data.name}`,
        text: [
          `Name: ${data.name}`,
          `Pathway: ${data.pathway}`,
          `Club: ${data.club || "—"}`,
          `Email: ${data.email || "—"}`,
          `Phone: ${data.phone || "—"}`,
          "",
          data.message || "(no message)",
          "",
          `Ref ${data.id} · ${data.receivedAt}`,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`resend ${res.status}`);
    return true;
  }

  if (FORM_WEBHOOK_URL) {
    const res = await fetch(FORM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(FORM_WEBHOOK_SECRET && { "X-Webhook-Secret": FORM_WEBHOOK_SECRET }) },
      body: JSON.stringify({ type: "academy.interest", ...data }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
    return true;
  }
  return false;
}
