/** Only allow same-site relative paths as post-login destinations (no open redirects). */
export function safeNext(next: unknown, fallback = "/account") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || /[\r\n]/.test(next)) return fallback;
  return next;
}
