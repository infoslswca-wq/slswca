import "server-only";
import type { ContributionInput } from "@slswca/core/schemas";
import { formatAmount, mapStatus } from "./payhere";
import { supabaseAdmin } from "./supabase/admin";

export class NotConfigured extends Error {}

type PaymentStatus = NonNullable<ReturnType<typeof mapStatus>>;

export async function createContribution(input: ContributionInput, orderId: string, userId: string | null = null) {
  const db = supabaseAdmin();
  if (!db) throw new NotConfigured("supabase");
  const { data: payment, error } = await db
    .from("payments")
    .insert({ order_id: orderId, purpose: "contribution", user_id: userId, amount: input.amount, recurring: input.recurring })
    .select("id")
    .single();
  if (error) throw new Error(`db payments ${error.code}`);
  const { error: e2 } = await db.from("contributions").insert({
    payment_id: payment.id,
    user_id: userId,
    fund: input.fund,
    donor_name: `${input.firstName} ${input.lastName}`,
    donor_email: input.email,
    donor_phone: input.phone,
    anonymous: input.anonymous,
  });
  if (e2) {
    await db.from("payments").delete().eq("id", payment.id); // don't leave an orphan pending payment
    throw new Error(`db contributions ${e2.code}`);
  }
  return payment.id as string;
}

/**
 * Which transitions a notify may cause. A late/replayed "pending" or "failed"
 * must never overwrite a success; only a chargeback may follow a success.
 */
export function canTransition(from: PaymentStatus, to: PaymentStatus) {
  if (from === to) return false;
  if (from === "success") return to === "chargedback";
  if (from === "chargedback") return false;
  return true;
}

export type NotifyOutcome = "updated" | "ignored" | "not_found" | "amount_mismatch";

export async function applyPayHereNotify(p: Record<string, string>): Promise<NotifyOutcome> {
  const db = supabaseAdmin();
  if (!db) throw new NotConfigured("supabase");
  const next = mapStatus(p.status_code);
  if (!next) return "ignored";

  const { data: pay, error } = await db
    .from("payments")
    .select("id, amount, currency, status")
    .eq("order_id", p.order_id)
    .maybeSingle();
  if (error) throw new Error(`db ${error.code}`);
  if (!pay) return "not_found";
  // The signature proves PayHere sent it; this proves it's for what we asked.
  if (formatAmount(Number(pay.amount)) !== p.payhere_amount || pay.currency !== p.payhere_currency) return "amount_mismatch";
  if (!canTransition(pay.status as PaymentStatus, next)) return "ignored";

  const { md5sig: _sig, ...raw } = p; // don't persist the signature
  void _sig;
  const { error: e2 } = await db
    .from("payments")
    .update({
      status: next,
      provider_payment_id: p.payment_id ?? null,
      method: p.method ?? null,
      status_message: p.status_message?.slice(0, 500) ?? null,
      raw_notify: raw,
    })
    .eq("id", pay.id)
    .eq("status", pay.status); // optimistic lock against concurrent notifies
  if (e2) throw new Error(`db ${e2.code}`);
  return "updated";
}

export async function paymentStatus(orderId: string) {
  const db = supabaseAdmin();
  if (!db) throw new NotConfigured("supabase");
  const { data, error } = await db.from("payments").select("status, amount, recurring").eq("order_id", orderId).maybeSingle();
  if (error) throw new Error(`db ${error.code}`);
  return data as { status: PaymentStatus; amount: number; recurring: boolean } | null;
}
