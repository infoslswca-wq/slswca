import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { REGISTRATION_ERRORS, type RegistrationInput, type UpcomingEvent } from "@slswca/core/schemas";
import { log } from "./observability";
import { supabaseAdmin } from "./supabase/admin";
import { supabasePublic } from "./supabase/public";

const COLS =
  "slug, kind, title, tag, body, venue, starts_at, ends_at, fee_lkr, capacity, categories, registration_opens_at, registration_closes_at, waiver_version";

type Row = {
  slug: string; kind: "competition" | "workshop"; title: string; tag: string | null; body: string; venue: string | null;
  starts_at: string | null; ends_at: string | null; fee_lkr: number; capacity: number | null; categories: string[];
  registration_opens_at: string | null; registration_closes_at: string | null; waiver_version: string;
};

const map = (r: Row): UpcomingEvent => ({
  slug: r.slug, kind: r.kind, title: r.title, tag: r.tag, body: r.body, venue: r.venue, startsAt: r.starts_at, endsAt: r.ends_at,
  feeLkr: Number(r.fee_lkr), capacity: r.capacity, categories: r.categories ?? [], registrationOpensAt: r.registration_opens_at,
  registrationClosesAt: r.registration_closes_at, waiverVersion: r.waiver_version,
});

/** Published events that haven't started. Empty (not an error) if Supabase isn't configured or is down. */
export async function listUpcoming(): Promise<UpcomingEvent[]> {
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db
    .from("events")
    .select(COLS)
    .eq("status", "published")
    .or(`starts_at.is.null,starts_at.gt.${new Date().toISOString()}`)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(50);
  if (error) {
    log("error", "events.list_failed", { code: error.code });
    return [];
  }
  return (data as Row[]).map(map);
}

export async function getDbEvent(slug: string): Promise<UpcomingEvent | null> {
  const db = supabasePublic();
  if (!db) return null;
  const { data, error } = await db.from("events").select(COLS).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) {
    log("error", "events.get_failed", { code: error.code });
    return null;
  }
  return data ? map(data as Row) : null;
}

export async function availability(slug: string): Promise<{ capacity: number | null; taken: number } | null> {
  const db = supabasePublic();
  if (!db) return null;
  const { data, error } = await db.rpc("event_availability", { p_slug: slug }).maybeSingle<{ capacity: number | null; taken: number }>();
  return error || !data ? null : data;
}

export type RegState = "open" | "not_open" | "closed" | "full";

export function registrationState(e: UpcomingEvent, avail: { capacity: number | null; taken: number } | null, now = new Date()): RegState {
  if (e.registrationOpensAt && now < new Date(e.registrationOpensAt)) return "not_open";
  if (e.registrationClosesAt && now > new Date(e.registrationClosesAt)) return "closed";
  if (e.startsAt && now > new Date(e.startsAt)) return "closed";
  if (avail?.capacity != null && avail.taken >= avail.capacity) return "full";
  return "open";
}

export class RegistrationError extends Error {
  constructor(public code: string) {
    super(REGISTRATION_ERRORS[code] ?? "Registration failed.");
  }
}

/** Calls the atomic DB function with the service role (after the caller authenticated the user). */
export async function registerForEvent(userId: string, slug: string, input: RegistrationInput, orderId: string) {
  const db = supabaseAdmin();
  if (!db) throw new RegistrationError("REG_NOT_FOUND");
  let clubId: string | null = null;
  if (input.clubSlug) {
    const { data } = await db.from("clubs").select("id").eq("slug", input.clubSlug).maybeSingle();
    clubId = data?.id ?? null;
  }
  const { data, error } = await db
    .rpc("register_for_event", {
      p_user: userId,
      p_slug: slug,
      p_category: input.category || null,
      p_club: clubId,
      p_emergency_name: input.emergencyName,
      p_emergency_phone: input.emergencyPhone,
      p_adult_or_guardian: input.adultOrGuardian,
      p_order_id: orderId,
    })
    .single<{ registration_id: string; status: "confirmed" | "pending"; ticket_code: string; payment_id: string | null; amount: number }>();
  if (error) {
    const code = /REG_[A-Z_]+/.exec(error.message)?.[0];
    if (code) throw new RegistrationError(code);
    throw new Error(`db ${error.code}`);
  }
  return data;
}

export type Ticket = {
  code: string; status: string; category: string | null; eventTitle: string; eventSlug: string; startsAt: string | null;
  venue: string | null; holder: string | null; paymentStatus: string | null;
};

/** Ticket for the signed-in user (RLS-scoped client: you can only load your own). */
export async function getMyTicket(db: SupabaseClient, code: string): Promise<Ticket | null> {
  const { data, error } = await db
    .from("event_registrations")
    .select("ticket_code, status, category, user_id, event:events(title, slug, starts_at, venue), payment:payments(status)")
    .eq("ticket_code", code)
    .maybeSingle();
  if (error || !data) return null;
  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);
  type Ev = { title: string; slug: string; starts_at: string | null; venue: string | null };
  const ev = one(data.event as unknown as Ev | Ev[] | null);
  const { data: prof } = await db.from("profiles").select("full_name").eq("id", data.user_id).maybeSingle();
  return {
    code: data.ticket_code, status: data.status, category: data.category, eventTitle: ev?.title ?? "Event",
    eventSlug: ev?.slug ?? "", startsAt: ev?.starts_at ?? null, venue: ev?.venue ?? null, holder: prof?.full_name ?? null,
    paymentStatus: one(data.payment as unknown as { status: string } | { status: string }[] | null)?.status ?? null,
  };
}
