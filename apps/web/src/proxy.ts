import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and gates /account.
 * This is an optimistic check only; pages and APIs re-verify the user themselves.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return request.nextUrl.pathname.startsWith("/account")
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();

  if (!data.user && request.nextUrl.pathname.startsWith("/account")) {
    const to = new URL("/login", request.url);
    to.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(to);
  }
  if (data.user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/account", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/login", "/api/v1/me"],
};
