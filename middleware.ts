import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname === "/dashboard" || pathname === "/dashboard/";
  const isBilling = pathname === "/dashboard/billing" || pathname.startsWith("/dashboard/billing/");

  // The Developer Studio is public for a one-generation guest demo. Other workspace
  // routes remain gated and send visitors back to the dashboard paywall.
  if (pathname.startsWith("/dashboard") && !user && !isDashboard && !isBilling) {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    target.search = "";
    target.searchParams.set("gate", pathname);
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/signup"] };
