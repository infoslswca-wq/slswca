/** Public Supabase settings (safe to expose: access is enforced by RLS). */
export function supabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}
export const authEnabled = () => supabasePublicEnv() !== null;
export const googleAuthEnabled = () => authEnabled() && process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";
