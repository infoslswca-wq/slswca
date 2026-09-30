/**
 * Structured logging + error reporting.
 *  - Every event is one JSON line on stdout/stderr (Vercel / any log drain can index it).
 *  - Errors can also go to ERROR_WEBHOOK_URL (Slack or Discord incoming webhook),
 *    de-duplicated so a failing route doesn't flood the channel.
 * Never pass request bodies, cookies or tokens here: callers log ids, not PII.
 */
type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const SENSITIVE = /(authorization|cookie|token|secret|password|md5sig|hash|email|phone)/i;

export function scrub(fields: Fields): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SENSITIVE.test(k)) out[k] = "[redacted]";
    else if (typeof v === "string") out[k] = v.length > 500 ? `${v.slice(0, 500)}…` : v;
    else out[k] = v;
  }
  return out;
}

export function log(level: Level, event: string, fields: Fields = {}) {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...scrub(fields) });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.info)(line);
}

const recent = new Map<string, number>();
const DEDUPE_MS = 60_000;

export async function reportError(err: unknown, context: Fields = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  const digest = typeof err === "object" && err && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  const fields = { message: e.message, name: e.name, digest, ...context };
  log("error", "error", { ...fields, stack: e.stack?.split("\n").slice(0, 6).join(" | ") });

  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) return;
  const key = `${e.name}:${e.message}:${context.route ?? ""}`;
  const now = Date.now();
  if ((recent.get(key) ?? 0) > now - DEDUPE_MS) return;
  recent.set(key, now);
  if (recent.size > 500) for (const [k, t] of recent) if (t < now - DEDUPE_MS) recent.delete(k);

  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const text = `🔴 SLSWCA ${env}: ${e.name}: ${e.message}\n${Object.entries(scrub(context)).map(([k, v]) => `${k}: ${v}`).join("\n")}${digest ? `\ndigest: ${digest}` : ""}`;
  try {
    // `text` for Slack, `content` for Discord.
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, content: text.slice(0, 1900) }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Reporting must never throw.
  }
}

export function _resetReporting() {
  recent.clear();
}
