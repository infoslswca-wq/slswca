import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { authenticate, supabaseAdmin, supabaseServer } from "./supabase/server";

type One<T> = T | T[] | null;
const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function isAdmin(db: SupabaseClient, userId: string) {
  const { data } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

/** For server components: the admin's RLS-scoped client, or null (caller should 404). */
export async function requireAdminPage(): Promise<{ db: SupabaseClient; user: User } | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.auth.getUser();
  if (!data.user || !(await isAdmin(db, data.user.id))) return null;
  return { db, user: data.user };
}

/** For API routes (cookie or Bearer). */
export async function requireAdminApi(req: Request) {
  const a = await authenticate(req);
  if (!a) return { error: 401 as const };
  if (!(await isAdmin(a.db, a.user.id))) return { error: 404 as const }; // don't reveal the endpoint
  return { a };
}

export type Lead = {
  id: string; name: string; club: string | null; email: string | null; phone: string | null;
  pathway: string; message: string | null; handled: boolean; handledAt: string | null; createdAt: string;
};

export async function listLeads(db: SupabaseClient, f: { pathway?: string; handled?: boolean } = {}): Promise<Lead[]> {
  let q = db
    .from("academy_interest")
    .select("id, name, club, email, phone, pathway, message, handled, handled_at, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (f.pathway) q = q.eq("pathway", f.pathway);
  if (f.handled !== undefined) q = q.eq("handled", f.handled);
  const { data, error } = await q;
  if (error) throw new Error(`db ${error.code}`);
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, club: r.club, email: r.email, phone: r.phone, pathway: r.pathway,
    message: r.message, handled: r.handled, handledAt: r.handled_at, createdAt: r.created_at,
  }));
}

export async function setLeadHandled(db: SupabaseClient, id: string, handled: boolean) {
  const { data, error } = await db.from("academy_interest").update({ handled }).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(`db ${error.code}`);
  return Boolean(data);
}

export type AdminContribution = {
  orderId: string; donor: string; email: string; phone: string | null; fund: string; anonymous: boolean;
  amount: number; recurring: boolean; status: string; method: string | null; createdAt: string;
};

export async function listContributions(db: SupabaseClient): Promise<AdminContribution[]> {
  const { data, error } = await db
    .from("contributions")
    .select("fund, donor_name, donor_email, donor_phone, anonymous, created_at, payment:payments(order_id, amount, recurring, status, method)")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`db ${error.code}`);
  return (data ?? []).flatMap((c) => {
    const p = one(c.payment as One<{ order_id: string; amount: number; recurring: boolean; status: string; method: string | null }>);
    if (!p) return [];
    return [{
      orderId: p.order_id, donor: c.donor_name, email: c.donor_email, phone: c.donor_phone, fund: c.fund,
      anonymous: c.anonymous, amount: Number(p.amount), recurring: p.recurring, status: p.status, method: p.method, createdAt: c.created_at,
    }];
  });
}

export type AdminMember = { id: string; name: string | null; email: string | null; phone: string | null; club: string | null; role: string; coachTier: string | null; since: string };

export async function listMembers(db: SupabaseClient): Promise<AdminMember[]> {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, phone, role, coach_tier, created_at, club:clubs(name)")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`db ${error.code}`);
  // Emails live in auth.users (not exposed to RLS clients) — read with the service role,
  // only after the caller has been verified as an admin.
  const emails = new Map<string, string>();
  const svc = supabaseAdmin();
  if (svc) {
    for (let page = 1; page <= 10; page++) {
      const { data: u, error: e } = await svc.auth.admin.listUsers({ page, perPage: 1000 });
      if (e) break;
      u.users.forEach((x) => x.email && emails.set(x.id, x.email));
      if (u.users.length < 1000) break;
    }
  }
  return (data ?? []).map((m) => ({
    id: m.id, name: m.full_name, email: emails.get(m.id) ?? null, phone: m.phone,
    club: one(m.club as One<{ name: string }>)?.name ?? null, role: m.role, coachTier: m.coach_tier, since: m.created_at,
  }));
}
