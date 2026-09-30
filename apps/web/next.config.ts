import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Static CSP so pages stay statically rendered (nonce CSP would force dynamic
 * rendering on every route). Next.js inlines bootstrap scripts, hence
 * 'unsafe-inline' for script-src. We render no user-generated HTML, which is
 * what keeps this acceptable. Revisit (nonce + dynamic) when auth ships.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@slswca/core", "@slswca/tokens"],
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API responses are never cached by intermediaries.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  async redirects() {
    // Preserve old WordPress URLs so existing links / SEO don't 404.
    return [
      { source: "/events-and-competitions", destination: "/events", permanent: true },
      // NOTE: battle/workshop gallery posts (/battle-of-the-clubs-2024-*, /calisthenics-workshop-*)
      // still live on WordPress. Migrate them before DNS cutover — see AUDIT.md.
    ];
  },
};

export default nextConfig;
