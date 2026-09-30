import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkoutHash, formatAmount, mapStatus, newOrderId, notifySignature, verifyNotify } from "./payhere";
import { canTransition } from "./payments";

const cfg = { merchantId: "1211149", merchantSecret: "TEST_SECRET", sandbox: true };
const MD5 = (s: string) => createHash("md5").update(s).digest("hex").toUpperCase();

describe("payhere", () => {
  it("formats amounts with 2dp and no separators", () => {
    expect(formatAmount(1000)).toBe("1000.00");
    expect(formatAmount(2500.5)).toBe("2500.50");
    expect(() => formatAmount(0)).toThrow();
    expect(() => formatAmount(NaN)).toThrow();
  });

  it("computes the checkout hash per PayHere spec", () => {
    const expected = MD5("1211149" + "ORDER1" + "1000.00" + "LKR" + MD5("TEST_SECRET"));
    expect(checkoutHash(cfg, "ORDER1", 1000)).toBe(expected);
  });

  const notify = (over: Record<string, string> = {}) => {
    const base = { merchant_id: "1211149", order_id: "ORDER1", payhere_amount: "1000.00", payhere_currency: "LKR", status_code: "2", payment_id: "320025", ...over };
    return { ...base, md5sig: notifySignature(cfg, base), ...over };
  };

  it("accepts a correctly signed notify", () => {
    expect(verifyNotify(cfg, notify())).toBe(true);
    expect(verifyNotify(cfg, { ...notify(), md5sig: notify().md5sig.toLowerCase() })).toBe(true);
  });

  it("rejects tampered amount, status, merchant or missing signature", () => {
    const n = notify();
    expect(verifyNotify(cfg, { ...n, payhere_amount: "1.00" })).toBe(false);
    expect(verifyNotify(cfg, { ...n, status_code: "2", order_id: "ORDER2" })).toBe(false);
    expect(verifyNotify(cfg, { ...n, merchant_id: "999" })).toBe(false);
    expect(verifyNotify(cfg, { ...n, md5sig: undefined } as unknown as Record<string, string>)).toBe(false);
    expect(verifyNotify({ ...cfg, merchantSecret: "OTHER" }, n)).toBe(false);
  });

  it("maps status codes", () => {
    expect(mapStatus("2")).toBe("success");
    expect(mapStatus("-3")).toBe("chargedback");
    expect(mapStatus("9")).toBeNull();
  });

  it("never downgrades a successful payment", () => {
    expect(canTransition("pending", "success")).toBe(true);
    expect(canTransition("success", "pending")).toBe(false);
    expect(canTransition("success", "failed")).toBe(false);
    expect(canTransition("success", "chargedback")).toBe(true);
    expect(canTransition("chargedback", "success")).toBe(false);
  });

  it("generates PayHere-safe order ids", () => {
    const id = newOrderId("C");
    expect(id).toMatch(/^[A-Z0-9-]{8,50}$/);
    expect(newOrderId("C")).not.toBe(id);
  });
});
