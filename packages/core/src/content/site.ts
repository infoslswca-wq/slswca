export const site = {
  name: "SLSWCA",
  fullName: "Sri Lanka Street Workout & Calisthenics Association",
  tagline: "Street built. Nation strong.",
  description:
    "The Sri Lanka Street Workout & Calisthenics Association unites the island's clubs and athletes — building strength, discipline, and community from the streets up.",
  founded: 2024,
  city: "Colombo",
  social: {
    instagram: "https://www.instagram.com/slswca/",
    whatsapp: "https://whatsapp.com/channel/0029Vb7XBVpGpLHOb1asc03V",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events & Competitions" },
    { href: "/partners", label: "Partners" },
    { href: "/academy", label: "Academy" },
    { href: "/contribute", label: "Contribute" },
  ],
} as const;

export const funds = [
  { key: "general", label: "Where it's needed most", body: "Lets the committee direct support to the most urgent need." },
  { key: "youth", label: "Youth programmes", body: "Free workshops and coaching for young athletes across the island." },
  { key: "equipment", label: "Park equipment", body: "Pull-up bars, dip bars and parallettes for public outdoor spots." },
  { key: "team_travel", label: "National team travel", body: "Getting Sri Lanka's athletes to WSWCF international competitions." },
] as const;
