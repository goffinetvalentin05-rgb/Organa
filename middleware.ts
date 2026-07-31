import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateMandatoryDashboardMfa } from "@/lib/auth/mfa-gate";
import { OBILLZ_ACTIVE_CLUB_COOKIE } from "@/lib/auth/active-club";
import {
  homeForProduct,
  loginForProduct,
  resolveOrgForProduct,
  type ObillzProduct,
} from "@/lib/auth/product-access";

/**
 * Middleware Next.js — session, MFA, séparation Sport / Associations.
 *
 * Sport     : /tableau-de-bord/** (hors flux MFA partagé)
 * Associations : /associations/espace/**
 * MFA TOTP  : /tableau-de-bord/securite/mfa/* (partagé, next=… vers le bon home)
 */

const SPORT_HOME = "/tableau-de-bord";
const ASSOCIATION_HOME = "/associations/espace";
const MFA_SETUP_PATH = "/tableau-de-bord/securite/mfa/configurer";
const MFA_VERIFY_PATH = "/tableau-de-bord/securite/mfa/verifier";

function isMfaFlowPath(pathname: string): boolean {
  return pathname === MFA_SETUP_PATH || pathname === MFA_VERIFY_PATH;
}

function isSportAppPath(pathname: string): boolean {
  return pathname.startsWith(SPORT_HOME) && !isMfaFlowPath(pathname);
}

function isAssociationAppPath(pathname: string): boolean {
  return pathname.startsWith(ASSOCIATION_HOME);
}

function isPublicApiPath(pathname: string): boolean {
  if (pathname.startsWith("/api/public/")) return true;
  if (pathname === "/api/webhook" || pathname.startsWith("/api/webhooks/")) {
    return true;
  }
  if (pathname === "/api/registrations") return true;
  if (pathname.startsWith("/api/invitations/")) return true;
  if (pathname === "/api/associations/inscription") return true;
  if (pathname === "/api/auth/post-login") return true;
  return false;
}

function isMfaExemptApi(pathname: string): boolean {
  if (pathname === "/api/me") return true;
  if (pathname === "/api/me/permissions") return true;
  return false;
}

function setActiveClubCookie(
  response: NextResponse,
  clubId: string
): void {
  response.cookies.set(OBILLZ_ACTIVE_CLUB_COOKIE, clubId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
  });
}

async function enforceProductGate(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  required: ObillzProduct
): Promise<NextResponse> {
  const preferred = request.cookies.get(OBILLZ_ACTIVE_CLUB_COOKIE)?.value;
  const org = await resolveOrgForProduct(supabase, userId, required, preferred);

  if (org) {
    if (preferred !== org.clubId) {
      setActiveClubCookie(response, org.clubId);
    }
    return response;
  }

  const other: ObillzProduct = required === "sport" ? "association" : "sport";
  const otherOrg = await resolveOrgForProduct(supabase, userId, other, preferred);
  if (otherOrg) {
    const dest = NextResponse.redirect(
      new URL(homeForProduct(other), request.url)
    );
    setActiveClubCookie(dest, otherOrg.clubId);
    return dest;
  }

  return NextResponse.redirect(
    new URL(`${loginForProduct(required)}?reason=no-org`, request.url)
  );
}

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

  /* --------- Pages auth : déjà connecté → home du MÊME produit seulement --------- */
  if (
    user &&
    (pathname === "/connexion" ||
      pathname === "/inscription" ||
      pathname === "/associations/connexion" ||
      pathname === "/associations/inscription")
  ) {
    const intended: ObillzProduct =
      pathname.startsWith("/associations/") ? "association" : "sport";
    const preferred = request.cookies.get(OBILLZ_ACTIVE_CLUB_COOKIE)?.value;
    const org = await resolveOrgForProduct(
      supabase,
      user.id,
      intended,
      preferred
    );

    if (org) {
      const redirectRes = NextResponse.redirect(
        new URL(homeForProduct(intended), request.url)
      );
      setActiveClubCookie(redirectRes, org.clubId);
      return redirectRes;
    }

    // Connecté mais sans org du tunnel courant : laisser la page Auth
    // (aucun envoi silencieux vers l'autre produit).
    return response;
  }

  /* --------- MFA partagé (tous produits) --------- */
  if (user && isMfaFlowPath(pathname)) {
    return response;
  }

  /* --------- Sport app --------- */
  if (isSportAppPath(pathname)) {
    if (!user) {
      const url = new URL(loginForProduct("sport"), request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const decision = await evaluateMandatoryDashboardMfa(supabase, user);
    if (decision.action !== "allow") {
      if (decision.action === "error") {
        const url = new URL(MFA_SETUP_PATH, request.url);
        url.searchParams.set("mfa_err", "service");
        url.searchParams.set("next", pathname);
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

    return enforceProductGate(request, response, supabase, user.id, "sport");
  }

  /* --------- Associations app --------- */
  if (isAssociationAppPath(pathname)) {
    if (!user) {
      const url = new URL(loginForProduct("association"), request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const decision = await evaluateMandatoryDashboardMfa(supabase, user);
    if (decision.action !== "allow") {
      if (decision.action === "error") {
        const url = new URL(MFA_SETUP_PATH, request.url);
        url.searchParams.set("mfa_err", "service");
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      const dest =
        decision.action === "redirect_setup" ? MFA_SETUP_PATH : MFA_VERIFY_PATH;
      const url = new URL(dest, request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return enforceProductGate(
      request,
      response,
      supabase,
      user.id,
      "association"
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/tableau-de-bord",
    "/tableau-de-bord/:path*",
    "/connexion",
    "/inscription",
    "/associations/connexion",
    "/associations/inscription",
    "/associations/espace",
    "/associations/espace/:path*",
    "/deconnexion",
    "/api/:path*",
  ],
};
