import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateMandatoryDashboardMfa } from "@/lib/auth/mfa-gate";

/**
 * Middleware Next.js — garde d’accès au tableau de bord et aux API « dashboard ».
 *
 * 1. Rafraîchissement de session Supabase (cookies).
 * 2. Tableau de bord : session obligatoire + MFA TOTP obligatoire (AAL2).
 * 3. API authentifiées : même règle MFA (403 JSON) sauf routes publiques / exemptions.
 */

const MFA_PROTECTED_PREFIX = "/tableau-de-bord";
const MFA_SETUP_PATH = "/tableau-de-bord/securite/mfa/configurer";
const MFA_VERIFY_PATH = "/tableau-de-bord/securite/mfa/verifier";

/** Routes accessibles pendant le flux MFA (pas de boucle de redirection). */
function isMfaFlowPath(pathname: string): boolean {
  return pathname === MFA_SETUP_PATH || pathname === MFA_VERIFY_PATH;
}

function isPublicApiPath(pathname: string): boolean {
  if (pathname.startsWith("/api/public/")) return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname === "/api/registrations") return true;
  return false;
}

/** Endpoints API où le contrôle MFA est relâché (bootstrap UI minimale). */
function isMfaExemptApi(pathname: string): boolean {
  if (pathname === "/api/me") return true;
  if (pathname === "/api/me/permissions") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

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

  /* --------- API : MFA obligatoire si session présente --------- */
  if (pathname.startsWith("/api/")) {
    if (isPublicApiPath(pathname)) {
      return response;
    }
    if (!user) {
      return response;
    }
    if (isMfaExemptApi(pathname)) {
      return response;
    }

    const decision = await evaluateMandatoryDashboardMfa(supabase, user);
    if (decision.action === "allow") {
      return response;
    }

    const mfaStep =
      decision.action === "redirect_setup"
        ? "setup"
        : decision.action === "redirect_verify"
          ? "verify"
          : "error";

    return NextResponse.json(
      {
        error: "Double authentification requise.",
        code: "MFA_REQUIRED",
        mfaStep,
        ...(decision.action === "error"
          ? { details: decision.message }
          : {}),
      },
      { status: 403 }
    );
  }

  /* --------- Pages auth : éviter doublon si déjà connecté --------- */
  if (
    user &&
    (pathname === "/connexion" || pathname === "/inscription")
  ) {
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
  }

  /* --------- Tableau de bord : session + MFA --------- */
  const isDashboard = pathname.startsWith(MFA_PROTECTED_PREFIX);
  if (!user && isDashboard) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isDashboard && !isMfaFlowPath(pathname)) {
    const decision = await evaluateMandatoryDashboardMfa(supabase, user);

    if (decision.action === "allow") {
      return response;
    }

    if (decision.action === "error") {
      const url = new URL(MFA_SETUP_PATH, request.url);
      url.searchParams.set("mfa_err", "service");
      return NextResponse.redirect(url);
    }

    const dest =
      decision.action === "redirect_setup" ? MFA_SETUP_PATH : MFA_VERIFY_PATH;
    const url = new URL(dest, request.url);

    const qs = request.nextUrl.search ?? "";
    const fullPath = qs ? `${pathname}${qs}` : pathname;
    if (fullPath && fullPath !== dest) {
      url.searchParams.set("next", fullPath);
    }

    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/connexion",
    "/inscription",
    "/api/:path*",
  ],
};
