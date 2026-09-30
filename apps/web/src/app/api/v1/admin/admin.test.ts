import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { result: { a: { user: { id: "admin" }, db: {}, via: "cookie" } } as Record<string, unknown> };
vi.mock("@/lib/admin", () => ({
  requireAdminApi: vi.fn(async () => state.result),
  setLeadHandled: vi.fn(async () => true),
  listLeads: vi.fn(async () => [{ name: "=cmd", pathway: "Coaching", createdAt: "2026-10-01" }]),
  listContributions: vi.fn(async () => []),
  listMembers: vi.fn(async () => []),
  listRegistrations: vi.fn(async () => []),
}));
import { setLeadHandled } from "@/lib/admin";
import { PATCH } from "./leads/[id]/route";
import { GET } from "./export/route";

const ID = "3f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f";
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });
const patch = (body: unknown, h: Record<string, string> = { origin: "http://localhost:3000" }) =>
  new Request(`http://localhost:3000/api/v1/admin/leads/${ID}`, { method: "PATCH", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(body) });

beforeEach(() => {
  state.result = { a: { user: { id: "admin" }, db: {}, via: "cookie" } };
  vi.mocked(setLeadHandled).mockClear();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("admin API", () => {
  it("hides endpoints from non-admins (404) and asks signed-out users to sign in (401)", async () => {
    state.result = { error: 404 };
    expect((await PATCH(patch({ handled: true }), ctx())).status).toBe(404);
    state.result = { error: 401 };
    expect((await GET(new Request("http://localhost:3000/api/v1/admin/export?type=leads"))).status).toBe(401);
  });
  it("marks a lead handled", async () => {
    const res = await PATCH(patch({ handled: true }), ctx());
    expect(res.status).toBe(200);
    expect(setLeadHandled).toHaveBeenCalledWith({}, ID, true);
  });
  it("rejects cross-site, bad ids and bad bodies", async () => {
    expect((await PATCH(patch({ handled: true }, { origin: "https://evil.example" }), ctx())).status).toBe(403);
    expect((await PATCH(patch({ handled: true }), ctx("1; drop table"))).status).toBe(400);
    expect((await PATCH(patch({ handled: "yes" }), ctx())).status).toBe(422);
    expect(setLeadHandled).not.toHaveBeenCalled();
  });
  it("exports CSV as an attachment, formula-safe", async () => {
    const res = await GET(new Request("http://localhost:3000/api/v1/admin/export?type=leads"));
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="slswca-leads-/);
    expect(await res.text()).toContain("'=cmd");
    expect((await GET(new Request("http://localhost:3000/api/v1/admin/export?type=secrets"))).status).toBe(400);
  });
});
