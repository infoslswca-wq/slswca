import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";
import { supabaseAdmin } from "./admin";

/** RLS-scoped client for the signed-in user (cookie session). */
export async function supabaseServer(): Promise<SupabaseClient | null> {
  const env = supabasePublicEnv();
  if (!env) return null;
  const store = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there; proxy.ts refreshes them.
        }
      },
    },
  });
}

export type Authed = { user: User; db: SupabaseClient; via: "cookie" | "bearer" };

/**
 * Resolve the caller for an API request.
 *  - `Authorization: Bearer <access_token>` → mobile app
 *  - Supabase session cookie                 → website
 * `getUser()` validates the token with Supabase Auth (never trust a JWT unverified).
 * The returned `db` runs as that user, so RLS applies to every query.
 */
export async function authenticate(req: Request): Promise<Authed | null> {
  const env = supabasePublicEnv();
  if (!env) return null;

  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    const db = createClient(env.url, env.key, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await db.auth.getUser(bearer);
    return error || !data.user ? null : { user: data.user, db, via: "bearer" };
  }

  const db = await supabaseServer();
  if (!db) return null;
  const { data, error } = await db.auth.getUser();
  return error || !data.user ? null : { user: data.user, db, via: "cookie" };
}

export { supabaseAdmin };
