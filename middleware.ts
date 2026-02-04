import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 🔒 Routes protégées
  if (!user && pathname.startsWith("/tableau-de-bord")) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  // 🔁 Déjà connecté → pas accès à connexion / inscription
  if (
    user &&
    (pathname === "/connexion" || pathname === "/inscription")
  ) {
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/tableau-de-bord/:path*", "/connexion", "/inscription"],
};




















