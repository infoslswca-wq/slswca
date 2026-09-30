import { beforeEach, describe, expect, it, vi } from "vitest";

const authed = { user: { id: "u1", email: "a@b.lk", created_at: "2026-01-01" }, db: {}, via: "cookie" as "cookie" | "bearer" };
vi.mock("@/lib/supabase/server", () => ({
  authenticate: vi.fn(async () => authed),
  supabaseAdmin: vi.fn(() => ({ auth: { admin: { deleteUser: vi.fn(async () => ({ error: null })) } } })),
}));
vi.mock("@/lib/me", () => ({
  loadMe: vi.fn(async () => ({ id: "u1" })),
  updateProfile: vi.fn(async () => {}),
  UnknownClub: class extends Error {},
}));
import { authenticate } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/me";
import { DELETE, GET, PATCH } from "./route";

const U = "http://localhost:3000/api/v1/me";
const r = (method: string, body?: unknown, h: Record<string, string> = {}) =>
  new Request(U, { method, headers: { "content-type": "application/json", ...h }, body: body ? JSON.stringify(body) : undefined });

beforeEach(() => {
  authed.via = "cookie";
  vi.mocked(updateProfile).mockClear();
});

describe("/api/v1/me", () => {
  it("401 when signed out", async () => {
    vi.mocked(authenticate).mockResolvedValueOnce(null);
    expect((await GET(r("GET"))).status).toBe(401);
  });
  it("returns the member", async () => {
    expect((await GET(r("GET"))).status).toBe(200);
  });
  it("PATCH with cookie auth requires same-origin", async () => {
    expect((await PATCH(r("PATCH", { fullName: "Nimal" }))).status).toBe(403); // no Origin
    expect((await PATCH(r("PATCH", { fullName: "Nimal" }, { origin: "https://evil.example" }))).status).toBe(403);
    expect(updateProfile).not.toHaveBeenCalled();
    expect((await PATCH(r("PATCH", { fullName: "Nimal" }, { origin: "http://localhost:3000" }))).status).toBe(200);
  });
  it("PATCH with bearer auth (mobile) needs no Origin", async () => {
    authed.via = "bearer";
    expect((await PATCH(r("PATCH", { fullName: "Nimal" }))).status).toBe(200);
  });
  it("PATCH validates input", async () => {
    const res = await PATCH(r("PATCH", { fullName: "" }, { origin: "http://localhost:3000" }));
    expect(res.status).toBe(422);
  });
  it("DELETE requires typed confirmation", async () => {
    const o = { origin: "http://localhost:3000" };
    expect((await DELETE(r("DELETE", { confirm: "yes" }, o))).status).toBe(422);
    expect((await DELETE(r("DELETE", { confirm: "DELETE" }, o))).status).toBe(200);
  });
});
