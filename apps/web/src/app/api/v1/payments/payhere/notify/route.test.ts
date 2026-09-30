import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payments", () => ({ applyPayHereNotify: vi.fn(async () => "updated") }));
import { applyPayHereNotify } from "@/lib/payments";
import { notifySignature } from "@/lib/payhere";
import { POST } from "./route";

const cfg = { merchantId: "1211149", merchantSecret: "TEST_SECRET", sandbox: true };
const post = (p: Record<string, string>) =>
  new Request("http://localhost/api/v1/payments/payhere/notify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(p).toString(),
  });
const signed = () => {
  const b = { merchant_id: "1211149", order_id: "C-1", payhere_amount: "2500.00", payhere_currency: "LKR", status_code: "2" };
  return { ...b, md5sig: notifySignature(cfg, b) };
};

beforeEach(() => {
  vi.stubEnv("PAYHERE_MERCHANT_ID", cfg.merchantId);
  vi.stubEnv("PAYHERE_MERCHANT_SECRET", cfg.merchantSecret);
  vi.mocked(applyPayHereNotify).mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("PayHere notify", () => {
  it("applies a valid, signed notify", async () => {
    const res = await POST(post(signed()));
    expect(res.status).toBe(200);
    expect(applyPayHereNotify).toHaveBeenCalledOnce();
  });
  it("rejects a forged notify without touching the DB", async () => {
    const res = await POST(post({ ...signed(), payhere_amount: "1.00" }));
    expect(res.status).toBe(400);
    expect(applyPayHereNotify).not.toHaveBeenCalled();
  });
  it("returns 500 so PayHere retries on DB failure", async () => {
    vi.mocked(applyPayHereNotify).mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(post(signed()))).status).toBe(500);
  });
});
