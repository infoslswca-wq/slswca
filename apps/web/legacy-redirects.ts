/**
 * Old WordPress post paths → new event slugs. Kept as plain data so
 * next.config.ts can import it; legacy-redirects.test.ts checks it against content.
 */
export const legacyEventRedirects: Record<string, string> = {
  "battle-of-the-clubs-2024-battle-5-finals": "boc-2024-battle-5-finals",
  "battle-of-the-clubs-2024-battle-4-quarters": "boc-2024-battle-4-quarters",
  "battle-of-the-clubs-2024-battle-3": "boc-2024-battle-3",
  "battle-of-the-clubs-2024-battle-2": "boc-2024-battle-2",
  "battle-of-the-clubs-2024-battle-1": "boc-2024-battle-1",
  "calisthenics-workshop-december-21st-2025": "workshop-2025-12-south",
  "calisthenics-workshop-october-25": "workshop-2025-10-women",
  "calisthenics-workshop-october-12-2025": "workshop-2025-10-colombo",
  "calisthenics-workshop-september-25": "workshop-2025-09-colombo",
};
