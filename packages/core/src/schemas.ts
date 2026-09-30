import { z } from "zod";

/**
 * Shared domain schemas. The web API validates with these and the mobile app
 * will import the same types, so request/response shapes can't drift.
 */

export const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const Club = z.object({
  slug: Slug,
  name: z.string().min(1),
  city: z.string().optional(),
});
export type Club = z.infer<typeof Club>;

export const PartnerKind = z.enum(["federation", "brand", "government"]);
export const Partner = z.object({
  slug: Slug,
  kind: PartnerKind,
  role: z.string(), // e.g. "Clothing Partner"
  name: z.string().optional(), // unknown until client confirms
  logo: z.string().optional(), // path under /public
  url: z.url().optional(),
  confirmed: z.boolean(), // mapping verified with client
});
export type Partner = z.infer<typeof Partner>;

export const InstagramMedia = z.object({
  kind: z.enum(["reel", "p"]),
  id: z.string().regex(/^[A-Za-z0-9_-]{5,40}$/),
});
export type InstagramMedia = z.infer<typeof InstagramMedia>;
export const instagramUrl = (m: InstagramMedia) => `https://www.instagram.com/${m.kind}/${m.id}/`;

export const EventKind = z.enum(["competition", "workshop"]);
export const Event = z.object({
  slug: Slug,
  kind: EventKind,
  title: z.string(),
  tag: z.string(), // short label, e.g. "DEC '25 · SOUTH" or "Finals"
  number: z.string().optional(), // battle number "05"
  date: z.iso.date().optional(),
  venue: z.string().optional(),
  body: z.string(),
  clubs: z.array(z.string()).default([]),
  /** Old WordPress path (without slashes), 301-redirected to /events/[slug]. */
  legacySlug: Slug.optional(),
  media: z.array(InstagramMedia).default([]),
  image: z.string().optional(),
  series: z.string().optional(), // e.g. "boc-2024"
  free: z.boolean().default(false),
});
export type Event = z.infer<typeof Event>;

export const Pathway = z.enum(["Coaching", "Officiating", "Athlete Development"]);
export type Pathway = z.infer<typeof Pathway>;

export const CoachTier = z.enum(["tier-3", "tier-2", "tier-1", "master"]);
export type CoachTier = z.infer<typeof CoachTier>;

/** Sri Lankan or international phone, loosely: digits, spaces, +, -, (). */
const phone = z
  .string()
  .trim()
  .max(24)
  .regex(/^\+?[0-9\s\-()]{7,24}$/, "Enter a valid phone number.");

/** Academy "register interest" submission — shared by web form and app. */
export const AcademyInterestInput = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    club: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.email("Enter a valid email.").trim().max(254).optional().or(z.literal("")),
    phone: phone.optional().or(z.literal("")),
    pathway: Pathway,
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    consent: z.literal(true, { error: "Please agree so we can contact you." }),
    // Honeypot: real users never fill this. Bots do.
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .refine((v) => Boolean(v.email || v.phone), {
    message: "Please provide an email or phone number.",
    path: ["email"],
  });
export type AcademyInterestInput = z.infer<typeof AcademyInterestInput>;

/** Standard API envelope for /api/v1 — mobile clients rely on this shape. */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};
export type ApiResult<T> = ApiOk<T> | ApiErr;

// ---------------------------------------------------------------- contributions

export const ContributionFund = z.enum(["general", "youth", "equipment", "team_travel"]);
export type ContributionFund = z.infer<typeof ContributionFund>;

export const CONTRIBUTION_PRESETS_LKR = [1000, 2500, 5000] as const;
export const CONTRIBUTION_MIN_LKR = 100;
export const CONTRIBUTION_MAX_LKR = 1_000_000;

/** Contribution checkout request — web /contribute and the app's Contribute tab. */
export const ContributionInput = z.object({
  amount: z
    .number({ error: "Enter an amount." })
    .int("Whole rupees only.")
    .min(CONTRIBUTION_MIN_LKR, `Minimum is LKR ${CONTRIBUTION_MIN_LKR}.`)
    .max(CONTRIBUTION_MAX_LKR, "For large gifts please contact us directly."),
  recurring: z.boolean().default(false),
  fund: ContributionFund.default("general"),
  firstName: z.string().trim().min(1, "Required.").max(60),
  lastName: z.string().trim().min(1, "Required.").max(60),
  email: z.email("Enter a valid email.").trim().max(254),
  phone: phone,
  anonymous: z.boolean().default(false),
  consent: z.literal(true, { error: "Please agree to continue." }),
});
export type ContributionInput = z.infer<typeof ContributionInput>;

/** What the server returns: a signed form the client POSTs to PayHere. */
export type CheckoutSession = {
  orderId: string;
  action: string; // PayHere checkout URL
  fields: Record<string, string>;
};

// ---------------------------------------------------------------- accounts

export const OtpEmail = z.object({ email: z.email("Enter a valid email.").trim().toLowerCase().max(254) });
export const OtpCode = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email.");

/** Fields a member may change on their own profile (mirrors DB column grants). */
export const ProfileUpdate = z.object({
  fullName: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: phone.optional().or(z.literal("")),
  clubSlug: Slug.optional().or(z.literal("")),
});
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;

export type Me = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  club: { slug: string; name: string } | null;
  role: "member" | "coach" | "admin";
  coachTier: CoachTier | null;
  memberSince: string;
  contributions: { orderId: string; amount: number; recurring: boolean; status: string; fund: string; createdAt: string }[];
  registrations: { eventTitle: string; eventSlug: string | null; startsAt: string | null; status: string; ticketCode: string | null }[];
};

/** Short, human-readable member number derived from the account id. */
export const memberNumber = (id: string) => `SL-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const DeleteAccountInput = z.object({ confirm: z.literal("DELETE", { error: 'Type DELETE to confirm.' }) });

// ---------------------------------------------------------------- event registration

/** Registration request (web form and the app's registration flow). */
export const RegistrationInput = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  phone: phone,
  category: z.string().trim().max(60).optional().or(z.literal("")),
  clubSlug: Slug.optional().or(z.literal("")),
  emergencyName: z.string().trim().min(2, "Who should we call in an emergency?").max(120),
  emergencyPhone: phone,
  waiver: z.literal(true, { error: "Please accept the waiver to register." }),
  adultOrGuardian: z.literal(true, { error: "Please confirm this." }),
});
export type RegistrationInput = z.infer<typeof RegistrationInput>;

/** Stable error codes from the register_for_event DB function. */
export const REGISTRATION_ERRORS: Record<string, string> = {
  REG_NOT_FOUND: "This event isn't open for registration.",
  REG_NOT_OPEN: "Registration hasn't opened yet.",
  REG_CLOSED: "Registration has closed.",
  REG_FULL: "Sorry, this event is full.",
  REG_ALREADY_REGISTERED: "You're already registered for this event.",
  REG_BAD_CATEGORY: "Pick a category from the list.",
  REG_CONSENT_REQUIRED: "Please confirm you're 18+ or have a guardian's consent.",
};

export type UpcomingEvent = {
  slug: string;
  kind: "competition" | "workshop";
  title: string;
  tag: string | null;
  body: string;
  venue: string | null;
  startsAt: string | null;
  endsAt: string | null;
  feeLkr: number;
  capacity: number | null;
  categories: string[];
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  waiverVersion: string;
};

export type RegistrationResult =
  | { status: "confirmed"; ticketCode: string }
  | { status: "pending"; ticketCode: string; checkout: CheckoutSession };
