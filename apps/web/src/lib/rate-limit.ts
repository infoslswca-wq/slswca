/**
 * Fixed-window rate limiter. In-memory, so it's per server instance: fine for a
 * single Node server, but on serverless/multi-instance swap `store` for a shared
 * one (Upstash Redis / Vercel KV) behind the same interface.
 */
type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const hit = store.get(key);
  if (!hit || hit.reset <= now) {
    store.set(key, { count: 1, reset: now + windowMs });
    if (store.size > 10_000) for (const [k, v] of store) if (v.reset <= now) store.delete(k);
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }
  hit.count++;
  return { ok: hit.count <= limit, remaining: Math.max(0, limit - hit.count), reset: hit.reset };
}

export function _resetRateLimit() {
  store.clear();
}
