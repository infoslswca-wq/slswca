import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "./env";

/** Anonymous, cookie-less client for public reads (published events). RLS applies. */
let client: SupabaseClient | null | undefined;
export function supabasePublic(): SupabaseClient | null {
  if (client !== undefined) return client;
  const env = supabasePublicEnv();
  client = env ? createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}
