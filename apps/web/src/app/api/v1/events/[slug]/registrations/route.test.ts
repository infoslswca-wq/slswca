import { beforeEach, describe, expect, it, vi } from "vitest";

const upd = { eq: vi.fn(async () => ({ error: null })) };
const authed = { user: { id: "u1", email: "a@b.lk" }, db: { from: () => ({ update: () => upd }) }, via: "cookie" as "cookie" | "bearer" };
vi.mock("@/lib/supabase/server", () => ({ authenticate: vi.fn(async () => authed) }));
const ev = { slug: "boc-2026", title: "Battle 2026", feeLkr: 0 };
vi.mock("@/lib/events", async () => {
  const actual = await vi.importActual<typeof import("@/lib/events")>("@/lib/events");
  return { ...actual, getDbEvent: vi.fn(async () => ev), registerForEvent: vi.fn() };
});
import { RegistrationError, registerForEvent } from "@/lib/events";
import { _resetRateLimit } from "@/lib/rate-limit";
import { authenticate } from "@/lib/supabase/server";
import { POST } from "./route";

const good = { fullName: "Nimal Perera", phone: "+94771234567", emergencyName: "Amma", emergencyPhone: "+94771111111", waiver: true, adultOrGuardian: true };
const req = (body: unknown, h: Record<string, string> = { origin: "http://localhost:3000" }) =>
  new Request("http://localhost:3000/api/v1/events/boc-2026/registrations", { method: "POST", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(body) });
const ctx = { params: Promise.resolve({ slug: "boc-2026" }) };

beforeEach(() => {
  _resetRateLimit();
  ev.feeLkr = 0;
  vi.unstubAllEnvs();
  vi.mocked(registerForEvent).mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("POST /api/v1/events/[slug]/registrations", () => {
  it("requires sign-in", async () => {
    vi.mocked(authenticate).mockResolvedValueOnce(null);
    expect((await POST(req(good), ctx)).status).toBe(401);
  });
  it("requires waiver + consent + emergency contact", async () => {
    const res = await POST(req({ ...good, waiver: false, emergencyName: "" }), ctx);
    expect(res.status).toBe(422);
    const j = await res.json();
    expect(Object.keys(j.error.fields)).toEqual(expect.arrayContaining(["waiver", "emergencyName"]));
  });
  it("free event → confirmed ticket", async () => {
    vi.mocked(registerForEvent).mockResolvedValueOnce({ registration_id: "r", status: "confirmed", ticket_code: "abc", payment_id: null, amount: 0 });
    const res = await POST(req(good), ctx);
    expect(res.status).toBe(201);
    expect((await res.json()).data).toEqual({ status: "confirmed", ticketCode: "abc" });
  });
  it("paid event → signed PayHere checkout returning to the ticket", async () => {
    ev.feeLkr = 1500;
    vi.stubEnv("PAYHERE_MERCHANT_ID", "1211149");
    vi.stubEnv("PAYHERE_MERCHANT_SECRET", "S");
    vi.mocked(registerForEvent).mockResolvedValueOnce({ registration_id: "r", status: "pending", ticket_code: "tix", payment_id: "p", amount: 1500 });
    const j = await (await POST(req(good), ctx)).json();
    expect(j.data.status).toBe("pending");
    expect(j.data.checkout.fields).toMatchObject({ amount: "1500.00", currency: "LKR", first_name: "Nimal", last_name: "Perera" });
    expect(j.data.checkout.fields.return_url).toMatch(/\/account\/tickets\/tix$/);
    expect(j.data.checkout.fields.hash).toMatch(/^[A-F0-9]{32}$/);
  });
  it("paid event without PayHere configured → 503, nothing created", async () => {
    ev.feeLkr = 1500;
    expect((await POST(req(good), ctx)).status).toBe(503);
    expect(registerForEvent).not.toHaveBeenCalled();
  });
  it("maps DB errors to friendly 409s", async () => {
    vi.mocked(registerForEvent).mockRejectedValueOnce(new RegistrationError("REG_FULL"));
    const res = await POST(req(good), ctx);
    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toMatch(/full/i);
  });
  it("blocks cross-site cookie requests", async () => {
    expect((await POST(req(good, { origin: "https://evil.example" }), ctx)).status).toBe(403);
  });
});
