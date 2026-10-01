/**
 * Serialise JSON-LD for a <script> tag. JSON.stringify alone lets a value like
 * "</script><script>…" break out of the tag (stored XSS via event text), so
 * escape the characters that can end or confuse the script context.
 */
export function jsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
