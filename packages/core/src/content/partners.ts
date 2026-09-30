import type { Partner } from "../schemas";

// `confirmed: false` = logo/role mapping was guessed by design; verify with client.
export const partners: Partner[] = [
  { slug: "wswcf", kind: "federation", role: "World Federation", name: "World Street Workout & Calisthenics Federation", logo: "/partners/wswcf.png", confirmed: true },
  { slug: "clothing", kind: "brand", role: "Clothing Partner", confirmed: false },
  { slug: "energy", kind: "brand", role: "Energy Partner", confirmed: false },
  { slug: "tezzeract", kind: "brand", role: "Creative Partner", name: "Tezzeract", logo: "/partners/tezzeract.jpeg", confirmed: false },
  { slug: "h2o", kind: "brand", role: "H2O Partner", confirmed: false },
  { slug: "us-foundation", kind: "brand", role: "Pillaring Partner", name: "US Foundation", logo: "/partners/us-foundation.png", confirmed: false },
  { slug: "ministry", kind: "government", role: "Primary Government Affiliate", logo: "/partners/ministry.jpeg", confirmed: false },
  { slug: "uda", kind: "government", role: "Government Venue Provider", name: "Urban Development Authority", logo: "/partners/uda.jpg", confirmed: false },
  { slug: "cmc", kind: "government", role: "Municipal Partner", name: "Colombo Municipal Council", logo: "/partners/cmc.png", confirmed: false },
  { slug: "sports-medicine", kind: "government", role: "Medical Advisory Body", logo: "/partners/sports-medicine.jpeg", confirmed: false },
  { slug: "security", kind: "government", role: "National Security Partner", confirmed: false },
];
