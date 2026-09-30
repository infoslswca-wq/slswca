import type { CoachTier, Pathway } from "../schemas";

export const pathways: { num: string; key: Pathway; title: string; body: string; points: string[] }[] = [
  {
    num: "01", key: "Coaching", title: "Coaching Certification",
    body: "A four-tier pathway for coaches and instructors. Earn each tier by completing its programme and assessment — from your first coaching credential to national-level recognition.",
    points: ["Tier 3 Trainee → Tier 1 Senior Coach", "Master Coach — conferred honour", "Certificates sealed & signed by SLSWCA"],
  },
  {
    num: "02", key: "Officiating", title: "Officiating Certification",
    body: "Judge and referee certification for SLSWCA-sanctioned competitions, aligned with WSWCF officiating standards — so every battle is scored to the international rulebook.",
    points: ["Judge certification", "Referee certification", "WSWCF-aligned standards"],
  },
  {
    num: "03", key: "Athlete Development", title: "Athlete Development",
    body: "Structured training pathways for competitive athletes, leading to national selection and international representation for Sri Lanka under the WSWCF.",
    points: ["Structured training pathways", "National selection trials", "International WSWCF representation"],
  },
];

export const tiers: { key: CoachTier; tag: string; title: string; body: string; honour?: boolean }[] = [
  { key: "tier-3", tag: "TIER 3 · ENTRY", title: "Trainee Coach", body: "Your entry into coaching. Complete the trainee programme and assessment to earn your first SLSWCA credential." },
  { key: "tier-2", tag: "TIER 2 · EARNED", title: "Junior Coach", body: "Build on the fundamentals — lead sessions under supervision and progress up towards Tier 1." },
  { key: "tier-1", tag: "TIER 1 · HIGHEST", title: "Senior Coach", body: "The top academic tier — full coaching authority. Senior Coaches run programmes and mentor coaches across the association." },
  { key: "master", tag: "CONFERRED HONOUR", title: "Master Coach", honour: true, body: "The highest recognition in Sri Lankan calisthenics — not an academic tier, but conferred by the Association for exceptional expertise, contribution and standing. Master Coaches govern the Academy’s technical standards." },
];
