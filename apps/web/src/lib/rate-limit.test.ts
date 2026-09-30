import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit, rateLimit } from "./rate-limit";

beforeEach(() => {
  _resetRateLimit();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("rateLimit", () => {
  it("in-memory: allows `limit` then blocks until the window resets", async () => {
    for (let i = 0; i < 3; i++) expect((await rateLimit("k", 3, 1000, 0)).ok).toBe(true);
    expect((await rateLimit("k", 3, 1000, 10)).ok).toBe(false);
    expect((await rateLimit("k", 3, 1000, 1001)).ok).toBe(true);
  });

  it("uses Upstash when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://x.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    const f = vi.fn(async () => Response.json([{ result: 6 }, { result: 1 }]));
    vi.stubGlobal("fetch", f);
    const r = await rateLimit("ip", 5, 60_000, 120_000);
    expect(r.ok).toBe(false);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.upstash.io/pipeline");
    expect(JSON.parse(String(init.body))[0]).toEqual(["INCR", "rl:ip:2"]);
  });

  it("fails open to memory when Upstash is down", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://x.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect((await rateLimit("ip2", 5, 60_000)).ok).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });
});
