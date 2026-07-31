import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { OBILLZ_ACTIVE_CLUB_COOKIE } from "@/lib/auth/active-club";
import { loginForProduct } from "@/lib/auth/product-access";

export const runtime = "nodejs";

/**
 * GET /deconnexion?next=/connexion
 *
 * Déconnexion serveur fiable depuis le flux MFA (évite un signOut client
 * qui peut rester bloqué et empêcher la redirection).
 */
function safeNextPath(raw: string | null): string {
  if (
    raw === "/connexion" ||
    raw === "/associations/connexion" ||
    raw === "/inscription" ||
    raw === "/associations/inscription" ||
    raw === "/associations" ||
    raw === "/"
  ) {
    return raw;
  }
  return loginForProduct("sport");
}

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, request.url);

  const response = NextResponse.redirect(redirectUrl);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[deconnexion] signOut:", err);
    }
  }

  response.cookies.set(OBILLZ_ACTIVE_CLUB_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
