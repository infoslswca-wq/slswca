import type { MetadataRoute } from "next";
import { allEvents } from "@slswca/core/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://slswca.com";
  return ["", "/events", "/partners", "/academy", "/contribute", "/privacy", ...allEvents.map((e) => `/events/${e.slug}`)].map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" }));
}
