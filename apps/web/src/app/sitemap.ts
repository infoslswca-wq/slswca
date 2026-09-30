import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://slswca.com";
  return ["", "/events", "/partners", "/academy", "/privacy"].map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" }));
}
