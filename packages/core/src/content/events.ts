import type { Event } from "../schemas";

export const battles: Event[] = [
  {
    slug: "boc-2024-battle-5-finals", kind: "competition", series: "boc-2024", number: "05", tag: "Finals",
    title: "Battle 5 — The Finals", venue: "Arcade Independence", free: false,
    mediaUrl: "https://slswca.com/battle-of-the-clubs-2024-battle-5-finals/",
    body: "The moment it had all been building towards — the Finals at Arcade Independence. Four clubs fought their way to the final stage, and in a thrilling conclusion to SLSWCA’s first ever Battle of the Clubs, Powertain Calisthenics rose above the rest to be crowned the inaugural champions.",
    clubs: ["Powertain Calisthenics", "Arcade Calisthenics", "Fitness for Life", "NSBM Calisthenics Club"],
  },
  {
    slug: "boc-2024-battle-4-quarters", kind: "competition", series: "boc-2024", number: "04", tag: "Quarters",
    title: "Battle 4 — Quarterfinals", venue: "Arcade Independence", free: false,
    mediaUrl: "https://slswca.com/battle-of-the-clubs-2024-battle-4-quarters/",
    body: "The competition moved to Arcade Independence for the Quarterfinals, with six clubs earning their place on the stage. Powertain Calisthenics emerged victorious.",
    clubs: ["Soul Lifters", "Arcade Calisthenics", "Powertain Calisthenics", "NSBM Calisthenics Club", "Fitness for Life", "Kalos Sthenos"],
  },
  {
    slug: "boc-2024-battle-3", kind: "competition", series: "boc-2024", number: "03", tag: "Round 3",
    title: "Battle 3 — Street Pump", venue: "Street Pump", free: false,
    mediaUrl: "https://slswca.com/battle-of-the-clubs-2024-battle-3/",
    body: "Battle of the Clubs heated up at Street Pump with five clubs stepping up to compete. The competition was intense across the board, but when the dust settled, Soul Lifters stood tall with a well-deserved victory.",
    clubs: ["Soul Lifters", "Calisthenics LK", "Kalos Sthenos", "Street Pump", "Calisthenics Cartel"],
  },
  {
    slug: "boc-2024-battle-2", kind: "competition", series: "boc-2024", number: "02", tag: "Round 2",
    title: "Battle 2 — Mount Beach", free: false,
    mediaUrl: "https://slswca.com/battle-of-the-clubs-2024-battle-2/",
    body: "Round 2 returned to the shores of Mount Beach with four clubs taking the stage. After an intense showdown, Fitness for Life and Powertain rose to the top in a thrilling draw, matching each other point for point.",
    clubs: ["Fitness for Life", "Powertain Calisthenics", "Mount Beach CC", "Visal Gymnastx"],
  },
  {
    slug: "boc-2024-battle-1", kind: "competition", series: "boc-2024", number: "01", tag: "Opener",
    title: "Battle 1 — The Opener", free: false,
    mediaUrl: "https://slswca.com/battle-of-the-clubs-2024-battle-1/",
    body: "The Battle of the Clubs kicked off with an electrifying first round between Arcade Calisthenics and NSBM Calisthenics Club. After a fiercely contested showdown, NSBM claimed a well-deserved victory, setting the stage for an exciting competition.",
    clubs: ["Arcade Calisthenics", "NSBM Calisthenics Club"],
  },
];

export const workshops: Event[] = [
  {
    slug: "workshop-2025-12-south", kind: "workshop", tag: "DEC ’25 · SOUTH", title: "South Workshop",
    date: "2025-12-21", venue: "Makahiya Fitness", free: true, clubs: [],
    mediaUrl: "https://slswca.com/calisthenics-workshop-december-21st-2025/",
    body: "SLSWCA closed out 2025 with its first venture into the south, in partnership with Makahiya Fitness. Four skills on the curriculum — handstand, muscle-up, pistol squat, and L-sit — and energy that was a sign of things to come.",
  },
  {
    slug: "workshop-2025-10-women", kind: "workshop", tag: "OCT ’25 · WOMEN’S", title: "Calisthenics for Women",
    date: "2025-10-25", venue: "Myrus Colombo Center", free: true, clubs: [],
    mediaUrl: "https://slswca.com/calisthenics-workshop-october-25/",
    body: "The first ever session exclusively for women, held at Myrus Colombo Center. Handstands, pull-ups, and muscle-ups — designed for ladies who want to challenge their limits and discover their strength. Free and open to all levels.",
  },
  {
    slug: "workshop-2025-10-colombo", kind: "workshop", tag: "OCT ’25 · COLOMBO", title: "October Workshop",
    date: "2025-10-12", venue: "Myrus Colombo Center", free: true, clubs: [],
    mediaUrl: "https://slswca.com/calisthenics-workshop-october-12-2025/",
    body: "A return to Myrus Colombo for the second community workshop, building on the fundamentals of handstands and muscle-ups. Walk-in format — athletes could drop in anytime to train, learn, and improve their movement.",
  },
  {
    slug: "workshop-2025-09-colombo", kind: "workshop", tag: "SEP ’25 · COLOMBO", title: "First Community Workshop",
    date: "2025-09-25", venue: "Myrus Colombo Center", free: true, clubs: [],
    mediaUrl: "https://slswca.com/calisthenics-workshop-september-25/",
    body: "SLSWCA’s first community workshop at Myrus Colombo, focused on two fundamental skills: handstands and muscle-ups. Free and open to the community — reflecting SLSWCA’s commitment to growing calisthenics across Sri Lanka.",
  },
];
