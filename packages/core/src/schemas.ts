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
  mediaUrl: z.url().optional(),
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
