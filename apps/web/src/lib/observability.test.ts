import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetReporting, reportError, scrub } from "./observability";

beforeEach(() => {
  _resetReporting();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe("observability", () => {
  it("redacts sensitive fields and truncates long strings", () => {
    const s = scrub({ email: "a@b.lk", Authorization: "Bearer x", md5sig: "ABC", route: "/x", note: "y".repeat(600) });
    expect(s).toMatchObject({ email: "[redacted]", Authorization: "[redacted]", md5sig: "[redacted]", route: "/x" });
    expect(String(s.note).length).toBeLessThan(510);
  });

  it("posts to the webhook once per minute per error", async () => {
    vi.stubEnv("ERROR_WEBHOOK_URL", "https://hooks.example/x");
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await reportError(new Error("boom"), { route: "/a" });
    await reportError(new Error("boom"), { route: "/a" });
    await reportError(new Error("other"), { route: "/a" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("never throws even if the webhook is down", async () => {
    vi.stubEnv("ERROR_WEBHOOK_URL", "https://hooks.example/x");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    await expect(reportError(new Error("x"))).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
