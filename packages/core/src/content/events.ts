import type { Event } from "../schemas";

export const battles: Event[] = [
  {
    slug: "boc-2024-battle-5-finals", kind: "competition", series: "boc-2024", number: "05", tag: "Finals",
    title: "Battle 5 — The Finals", venue: "Arcade Independence", free: false,
    legacySlug: "battle-of-the-clubs-2024-battle-5-finals",
    media: [{ kind: "p", id: "DFYZr0js0J9" },{ kind: "reel", id: "DGX0NhZoFb9" }],
    body: "The moment it had all been building towards — the Finals at Arcade Independence. Four clubs fought their way to the final stage, and in a thrilling conclusion to SLSWCA’s first ever Battle of the Clubs, Powertain Calisthenics rose above the rest to be crowned the inaugural champions.",
    clubs: ["Powertain Calisthenics", "Arcade Calisthenics", "Fitness for Life", "NSBM Calisthenics Club"],
  },
  {
    slug: "boc-2024-battle-4-quarters", kind: "competition", series: "boc-2024", number: "04", tag: "Quarters",
    title: "Battle 4 — Quarterfinals", venue: "Arcade Independence", free: false,
    legacySlug: "battle-of-the-clubs-2024-battle-4-quarters",
    media: [{ kind: "reel", id: "DEi28efBnK1" }],
    body: "The competition moved to Arcade Independence for the Quarterfinals, with six clubs earning their place on the stage. Powertain Calisthenics emerged victorious.",
    clubs: ["Soul Lifters", "Arcade Calisthenics", "Powertain Calisthenics", "NSBM Calisthenics Club", "Fitness for Life", "Kalos Sthenos"],
  },
  {
    slug: "boc-2024-battle-3", kind: "competition", series: "boc-2024", number: "03", tag: "Round 3",
    title: "Battle 3 — Street Pump", venue: "Street Pump", free: false,
    legacySlug: "battle-of-the-clubs-2024-battle-3",
    media: [{ kind: "reel", id: "DCCqURVBEFY" },{ kind: "reel", id: "DCSPXBAvfAg" }],
    body: "Battle of the Clubs heated up at Street Pump with five clubs stepping up to compete. The competition was intense across the board, but when the dust settled, Soul Lifters stood tall with a well-deserved victory.",
    clubs: ["Soul Lifters", "Calisthenics LK", "Kalos Sthenos", "Street Pump", "Calisthenics Cartel"],
  },
  {
    slug: "boc-2024-battle-2", kind: "competition", series: "boc-2024", number: "02", tag: "Round 2",
    title: "Battle 2 — Mount Beach", free: false,
    legacySlug: "battle-of-the-clubs-2024-battle-2",
    media: [{ kind: "reel", id: "DBKHkPrvf-W" }],
    body: "Round 2 returned to the shores of Mount Beach with four clubs taking the stage. After an intense showdown, Fitness for Life and Powertain rose to the top in a thrilling draw, matching each other point for point.",
    clubs: ["Fitness for Life", "Powertain Calisthenics", "Mount Beach CC", "Visal Gymnastx"],
  },
  {
    slug: "boc-2024-battle-1", kind: "competition", series: "boc-2024", number: "01", tag: "Opener",
    title: "Battle 1 — The Opener", free: false,
    legacySlug: "battle-of-the-clubs-2024-battle-1",
    media: [{ kind: "reel", id: "C_i8lZiya3J" },{ kind: "reel", id: "C_1ApzGOekD" },{ kind: "reel", id: "DAY5tIzSS1m" }],
    body: "The Battle of the Clubs kicked off with an electrifying first round between Arcade Calisthenics and NSBM Calisthenics Club. After a fiercely contested showdown, NSBM claimed a well-deserved victory, setting the stage for an exciting competition.",
    clubs: ["Arcade Calisthenics", "NSBM Calisthenics Club"],
  },
];

export const workshops: Event[] = [
  {
    slug: "workshop-2025-12-south", kind: "workshop", tag: "DEC ’25 · SOUTH", title: "South Workshop",
    date: "2025-12-21", venue: "Makahiya Fitness", free: true, clubs: [],
    legacySlug: "calisthenics-workshop-december-21st-2025",
    media: [{ kind: "reel", id: "DYLW7yhhsNA" },{ kind: "p", id: "DShHSC3DMM0" }],
    body: "SLSWCA closed out 2025 with its first venture into the south, in partnership with Makahiya Fitness. Four skills on the curriculum — handstand, muscle-up, pistol squat, and L-sit — and energy that was a sign of things to come.",
  },
  {
    slug: "workshop-2025-10-women", kind: "workshop", tag: "OCT ’25 · WOMEN’S", title: "Calisthenics for Women",
 venue: "Myrus Colombo Center", free: true, clubs: [],
    legacySlug: "calisthenics-workshop-october-25",
    media: [{ kind: "reel", id: "DQj4m3cEtcf" }],
    body: "The first ever session exclusively for women, held at Myrus Colombo Center. Handstands, pull-ups, and muscle-ups — designed for ladies who want to challenge their limits and discover their strength. Free and open to all levels.",
  },
  {
    slug: "workshop-2025-10-colombo", kind: "workshop", tag: "OCT ’25 · COLOMBO", title: "October Workshop",
    date: "2025-10-12", venue: "Myrus Colombo Center", free: true, clubs: [],
    legacySlug: "calisthenics-workshop-october-12-2025",
    media: [{ kind: "reel", id: "DPjjUH0Enoa" },{ kind: "reel", id: "DP0-_sKkkqo" }],
    body: "A return to Myrus Colombo for the second community workshop, building on the fundamentals of handstands and muscle-ups. Walk-in format — athletes could drop in anytime to train, learn, and improve their movement.",
  },
  {
    slug: "workshop-2025-09-colombo", kind: "workshop", tag: "SEP ’25 · COLOMBO", title: "First Community Workshop",
 venue: "Myrus Colombo Center", free: true, clubs: [],
    legacySlug: "calisthenics-workshop-september-25",
    media: [{ kind: "reel", id: "DO-QG_WDPjC" }],
    body: "SLSWCA’s first community workshop at Myrus Colombo, focused on two fundamental skills: handstands and muscle-ups. Free and open to the community — reflecting SLSWCA’s commitment to growing calisthenics across Sri Lanka.",
  },
];

export const allEvents: Event[] = [...battles, ...workshops];
export const eventBySlug = (slug: string) => allEvents.find((e) => e.slug === slug);
