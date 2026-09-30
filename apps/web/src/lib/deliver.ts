import type { AcademyInterestInput } from "@slswca/core/schemas";

/**
 * Where submissions go. Pluggable until a backend is chosen:
 *  - RESEND_API_KEY + ACADEMY_INBOX  → email via Resend
 *  - FORM_WEBHOOK_URL                → POST JSON (Google Apps Script, Make, Zapier, Slack…)
 *  - neither, in development         → logged to the server console
 *  - neither, in production          → error (fail loudly rather than drop leads)
 */
export async function deliverAcademyInterest(data: AcademyInterestInput & { id: string; receivedAt: string }) {
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
    return;
  }

  if (FORM_WEBHOOK_URL) {
    const res = await fetch(FORM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(FORM_WEBHOOK_SECRET && { "X-Webhook-Secret": FORM_WEBHOOK_SECRET }) },
      body: JSON.stringify({ type: "academy.interest", ...data }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[academy.interest] (no delivery configured)", { id: data.id, pathway: data.pathway });
    return;
  }
  throw new Error("no delivery channel configured");
}
