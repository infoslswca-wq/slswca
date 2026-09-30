import { log } from "./observability";

/**
 * Fixed-window rate limiter.
 *  - With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN: shared across all
 *    serverless instances (required on Vercel, where each instance has its own memory).
 *  - Otherwise: in-memory, per instance (fine for local dev or a single Node server).
 * If Redis errors, we fall back to the in-memory counter rather than blocking
 * real users (fail-open), and log it.
 */
export type RateResult = { ok: boolean; remaining: number; reset: number };

type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

export function memoryLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
  const hit = store.get(key);
  if (!hit || hit.reset <= now) {
    store.set(key, { count: 1, reset: now + windowMs });
    if (store.size > 10_000) for (const [k, v] of store) if (v.reset <= now) store.delete(k);
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }
  hit.count++;
  return { ok: hit.count <= limit, remaining: Math.max(0, limit - hit.count), reset: hit.reset };
}

async function redisLimit(url: string, token: string, key: string, limit: number, windowMs: number, now: number): Promise<RateResult> {
  const bucket = Math.floor(now / windowMs);
  const k = `rl:${key}:${bucket}`;
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", k], ["PEXPIRE", k, String(windowMs)]]),
    signal: AbortSignal.timeout(1500),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const [incr] = (await res.json()) as [{ result?: number; error?: string }];
  if (typeof incr?.result !== "number") throw new Error(`upstash ${incr?.error ?? "bad response"}`);
  const reset = (bucket + 1) * windowMs;
  return { ok: incr.result <= limit, remaining: Math.max(0, limit - incr.result), reset };
}

export async function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return await redisLimit(url, token, key, limit, windowMs, now);
    } catch (e) {
      log("warn", "ratelimit.redis_unavailable", { err: (e as Error).message });
    }
  }
  return memoryLimit(key, limit, windowMs, now);
}

export function _resetRateLimit() {
  store.clear();
}
