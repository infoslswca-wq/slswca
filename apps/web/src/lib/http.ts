import { NextResponse } from "next/server";
import type { ApiErr, ApiOk } from "@slswca/core/schemas";

export const ok = <T>(data: T, status = 200) => NextResponse.json<ApiOk<T>>({ ok: true, data }, { status });

export const fail = (status: number, code: string, message: string, fields?: Record<string, string>, headers?: HeadersInit) =>
  NextResponse.json<ApiErr>({ ok: false, error: { code, message, ...(fields && { fields }) } }, { status, headers });

/**
 * Client IP for rate limiting. Only headers set by the platform in front of us
 * can be trusted; anything else is attacker-controlled and would let a bot
 * dodge limits by sending a new fake IP each request.
 *  - TRUSTED_IP_HEADER=cf-connecting-ip   when behind Cloudflare
 *  - default: x-real-ip (Vercel overwrites it), then the first x-forwarded-for hop
 */
export function clientIp(req: Request) {
  const trusted = process.env.TRUSTED_IP_HEADER?.toLowerCase();
  if (trusted) return req.headers.get(trusted)?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * CSRF defence for browser requests: if an Origin header is present it must be
 * ours. Native mobile clients send no Origin; they'll authenticate with a token
 * once accounts exist.
 */
export function originAllowed(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set(
    [new URL(req.url).origin, process.env.NEXT_PUBLIC_SITE_URL, ...(process.env.ALLOWED_ORIGINS ?? "").split(",")]
      .filter(Boolean)
      .map((o) => o!.trim().replace(/\/$/, "")),
  );
  return allowed.has(origin);
}

/** Read a JSON body with a hard size cap (prevents memory abuse). */
export async function readJson(req: Request, maxBytes = 16_384): Promise<unknown | typeof TOO_LARGE | typeof BAD_JSON> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return TOO_LARGE;
  const text = await req.text();
  if (text.length > maxBytes) return TOO_LARGE;
  try {
    return JSON.parse(text);
  } catch {
    return BAD_JSON;
  }
}
export const TOO_LARGE = Symbol("too-large");
export const BAD_JSON = Symbol("bad-json");
