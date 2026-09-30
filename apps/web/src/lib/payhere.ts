import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * PayHere Checkout API helpers (https://support.payhere.lk/api-&-mobile-sdk/checkout-api).
 *
 * Checkout hash = UPPER(md5(merchant_id + order_id + amount + currency + UPPER(md5(merchant_secret))))
 * Notify sig    = UPPER(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(md5(merchant_secret))))
 * `amount` must be formatted with exactly two decimals and no thousands separator.
 */

const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex").toUpperCase();

export type PayHereConfig = { merchantId: string; merchantSecret: string; sandbox: boolean };

export function payhereConfig(env = process.env): PayHereConfig | null {
  const merchantId = env.PAYHERE_MERCHANT_ID;
  const merchantSecret = env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) return null;
  return { merchantId, merchantSecret, sandbox: env.PAYHERE_SANDBOX !== "false" };
}

export const checkoutUrl = (c: PayHereConfig) =>
  c.sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";

export const formatAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalid amount");
  return amount.toFixed(2);
};

export function checkoutHash(c: PayHereConfig, orderId: string, amount: number, currency = "LKR") {
  return md5(c.merchantId + orderId + formatAmount(amount) + currency + md5(c.merchantSecret));
}

export function notifySignature(
  c: PayHereConfig,
  p: { order_id: string; payhere_amount: string; payhere_currency: string; status_code: string },
) {
  return md5(c.merchantId + p.order_id + p.payhere_amount + p.payhere_currency + p.status_code + md5(c.merchantSecret));
}

export function verifyNotify(c: PayHereConfig, p: Record<string, string>) {
  if (p.merchant_id !== c.merchantId) return false;
  const required = ["order_id", "payhere_amount", "payhere_currency", "status_code", "md5sig"] as const;
  if (required.some((k) => typeof p[k] !== "string")) return false;
  const expected = Buffer.from(notifySignature(c, p as never));
  const got = Buffer.from(String(p.md5sig).toUpperCase());
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** PayHere status_code → our payment_status enum. */
export function mapStatus(code: string) {
  switch (code) {
    case "2": return "success";
    case "0": return "pending";
    case "-1": return "cancelled";
    case "-2": return "failed";
    case "-3": return "chargedback";
    default: return null;
  }
}

/** Unguessable, PayHere-safe order id (they allow up to 50 chars). */
export const newOrderId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();
