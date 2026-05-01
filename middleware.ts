import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware Next.js — gardien de l'accès au tableau de bord.
 *
 * Responsabilités :
 *   1. Refresh de la session Supabase via cookies.
 *   2. Redirection /connexion si non authentifié sur une route protégée.
 *   3. Redirection /tableau-de-bord si authentifié sur /connexion ou /inscription.
 *   4. Enforcement MFA (AAL2) après période de grâce pour les rôles sensibles
 *      (owner / admin / committee). La logique fine de grâce est calculée
 *      ici de manière LÉGÈRE (sans appel SQL coûteux) ; la vérification
 *      complète passe ensuite côté Server Component si nécessaire.
 */

// Routes publiques accessibles sans authentification (en plus des assets).
// Les routes /api/public/** et /api/webhooks/** sont également publiques.
const PUBLIC_ROUTES = new Set([
  "/",
  "/connexion",
  "/inscription",
  "/tarifs",
  "/conditions-utilisation",
  "/politique-confidentialite",
  "/politique-cookies",
  "/cookies",
  "/mentions-legales",
  "/privacy",
  "/desinscription",
]);

const PUBLIC_PREFIXES = [
  "/api/public/",
  "/api/webhooks/",
  "/api/registrations", // POST public anti-spam (rate-limit côté route)
  "/p/", // pages d'inscription publique aux plannings
  "/desinscription/",
  "/inscription/", // [code] = inscription via QR
];

const MFA_PROTECTED_PREFIX = "/tableau-de-bord";
const MFA_SETUP_PATH = "/tableau-de-bord/securite/mfa";
const MFA_VERIFY_PATH = "/tableau-de-bord/securite/mfa/verifier";

const MFA_GRACE_PERIOD_DAYS = 7;
// Date d'entrée en vigueur de la politique MFA. Les comptes créés AVANT
// bénéficient de la grâce calculée à partir de cette date.
const MFA_POLICY_EFFECTIVE_DATE = new Date(
  process.env.MFA_POLICY_EFFECTIVE_DATE ?? "2026-05-01T00:00:00Z"
);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
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

  // 1) Routes protégées : exiger une session.
  const isDashboard = pathname.startsWith(MFA_PROTECTED_PREFIX);
  if (!user && isDashboard) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2) Bloquer l'accès aux pages d'auth si déjà connecté.
  if (
    user &&
    (pathname === "/connexion" || pathname === "/inscription")
  ) {
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
  }

  // 3) Enforcement MFA (uniquement sur le dashboard, pour les comptes auth).
  if (user && isDashboard && !pathname.startsWith("/tableau-de-bord/securite")) {
    const decision = await evaluateMfaForRequest(supabase, user);
    if (decision.action === "redirect_setup") {
      return NextResponse.redirect(new URL(MFA_SETUP_PATH, request.url));
    }
    if (decision.action === "redirect_verify") {
      return NextResponse.redirect(new URL(MFA_VERIFY_PATH, request.url));
    }
    // Sinon on laisse passer (warn éventuel sera géré côté UI).
  }

  return response;
}

/**
 * Évalue rapidement la politique MFA pour la requête en cours.
 * On évite tout SELECT lourd : on lit juste les facteurs de l'utilisateur
 * (déjà mis en cache par Supabase) et son AAL.
 */
async function evaluateMfaForRequest(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; created_at?: string | null }
): Promise<{ action: "allow" | "redirect_setup" | "redirect_verify" }> {
  try {
    // Récupérer le rôle dans le club courant. On prend le membership le plus
    // privilégié pour décider (owner > admin > committee > member).
    const { data: memberships } = await supabase
      .from("club_memberships")
      .select("role")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    const roles = (memberships || []).map((m) => m.role as string);
    const sensitive =
      roles.includes("owner") ||
      roles.includes("admin") ||
      roles.includes("committee");
    if (!sensitive) {
      return { action: "allow" };
    }

    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") {
      return { action: "allow" };
    }

    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const verifiedTotps = (factorsData?.totp ?? []).filter(
      (f) => f.status === "verified"
    );

    if (verifiedTotps.length > 0) {
      // L'utilisateur a un TOTP enrôlé mais la session n'est pas encore AAL2
      return { action: "redirect_verify" };
    }

    // Pas de TOTP → vérifier la grâce
    const created = user.created_at ? new Date(user.created_at) : new Date();
    const reference =
      created < MFA_POLICY_EFFECTIVE_DATE ? MFA_POLICY_EFFECTIVE_DATE : created;
    const graceEnd = new Date(
      reference.getTime() + MFA_GRACE_PERIOD_DAYS * 24 * 3600 * 1000
    );
    if (new Date() > graceEnd) {
      return { action: "redirect_setup" };
    }
    return { action: "allow" };
  } catch (err) {
    console.error("[MIDDLEWARE][MFA] Erreur évaluation, fallback allow:", err);
    return { action: "allow" };
  }
}

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/connexion",
    "/inscription",
  ],
};
