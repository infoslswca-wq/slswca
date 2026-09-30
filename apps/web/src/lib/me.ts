import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Me, ProfileUpdate } from "@slswca/core/schemas";

type One<T> = T | T[] | null; // PostgREST embeds can come back as object or array
const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Load the signed-in member's view. `db` must be the user's RLS-scoped client. */
export async function loadMe(db: SupabaseClient, user: User): Promise<Me> {
  const [profile, contribs, regs] = await Promise.all([
    db.from("profiles").select("full_name, phone, role, coach_tier, created_at, club:clubs(slug, name)").eq("id", user.id).maybeSingle(),
    db
      .from("contributions")
      .select("fund, created_at, payment:payments(order_id, amount, recurring, status)")
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("event_registrations")
      .select("status, ticket_code, created_at, event:events(title, slug, starts_at)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  for (const r of [profile, contribs, regs]) if (r.error) throw new Error(`db ${r.error.code}`);

  const p = profile.data;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: p?.full_name ?? null,
    phone: p?.phone ?? null,
    club: one(p?.club as One<{ slug: string; name: string }>),
    role: (p?.role as Me["role"]) ?? "member",
    coachTier: (p?.coach_tier as Me["coachTier"]) ?? null,
    memberSince: p?.created_at ?? user.created_at,
    contributions: (contribs.data ?? []).flatMap((c) => {
      const pay = one(c.payment as One<{ order_id: string; amount: number; recurring: boolean; status: string }>);
      return pay
        ? [{ orderId: pay.order_id, amount: Number(pay.amount), recurring: pay.recurring, status: pay.status, fund: c.fund, createdAt: c.created_at }]
        : [];
    }),
    registrations: (regs.data ?? []).map((r) => {
      const ev = one(r.event as One<{ title: string; slug: string; starts_at: string | null }>);
      return { eventTitle: ev?.title ?? "Event", eventSlug: ev?.slug ?? null, startsAt: ev?.starts_at ?? null, status: r.status, ticketCode: r.ticket_code };
    }),
  };
}

export class UnknownClub extends Error {}

export async function updateProfile(db: SupabaseClient, userId: string, input: ProfileUpdate) {
  let clubId: string | null = null;
  if (input.clubSlug) {
    const { data, error } = await db.from("clubs").select("id").eq("slug", input.clubSlug).maybeSingle();
    if (error) throw new Error(`db ${error.code}`);
    if (!data) throw new UnknownClub();
    clubId = data.id;
  }
  // Column grants mean only these three fields can change, whatever we send.
  const { error } = await db
    .from("profiles")
    .update({ full_name: input.fullName, phone: input.phone || null, club_id: clubId })
    .eq("id", userId);
  if (error) throw new Error(`db ${error.code}`);
}
