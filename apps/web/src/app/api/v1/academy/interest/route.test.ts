import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit } from "@/lib/rate-limit";
import { POST } from "./route";

const URL_ = "http://localhost:3000/api/v1/academy/interest";
const good = { name: "Kasun Perera", email: "k@example.com", pathway: "Coaching", consent: true };
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(URL_, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "1.2.3.4", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  _resetRateLimit();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("POST /api/v1/academy/interest", () => {
  it("accepts a valid submission", async () => {
    const res = await POST(req(good));
    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });
  it("returns field errors on invalid input", async () => {
    const res = await POST(req({ ...good, email: "", pathway: "Nope" }));
    expect(res.status).toBe(422);
    const j = await res.json();
    expect(j.error.fields).toHaveProperty("pathway");
  });
  it("rejects cross-origin browser requests", async () => {
    const res = await POST(req(good, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });
  it("rejects non-JSON and oversized bodies", async () => {
    expect((await POST(req(good, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(req({ ...good, message: "x".repeat(20_000) }))).status).toBe(413);
    expect((await POST(req("{not json"))).status).toBe(400);
  });
  it("fakes success when honeypot is filled", async () => {
    const res = await POST(req({ ...good, website: "http://spam" }));
    expect(res.status).toBe(201);
    expect(console.info).not.toHaveBeenCalled();
  });
  it("rate limits after 5 per window", async () => {
    for (let i = 0; i < 5; i++) expect((await POST(req(good))).status).toBe(201);
    const res = await POST(req(good));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });
});
