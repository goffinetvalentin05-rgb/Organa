import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OBILLZ_ACTIVE_CLUB_COOKIE } from "@/lib/auth/active-club";

/**
 * Modèle des rôles dans un club.
 * - owner    : propriétaire du club, droits complets, ne peut pas être supprimé en dernier.
 * - admin    : gestion complète sauf actions critiques de propriété.
 * - committee: opérationnel (saisies financières, événements, plannings, etc.).
 * - member   : lecture seule sur les données du club.
 */
export type ClubRole = "owner" | "admin" | "committee" | "member";

export const STAFF_ROLES: ClubRole[] = ["owner", "admin", "committee"];
export const ADMIN_ROLES: ClubRole[] = ["owner", "admin"];

export interface Membership {
  clubId: string;
  userId: string;
  role: ClubRole;
  /** ISO date d’acceptation (tri du club « courant » par défaut). */
  acceptedAt?: string | null;
}

export interface AuthContext {
  user: {
    id: string;
    email: string | null;
  };
  /** Liste des memberships actifs de l'utilisateur courant. */
  memberships: Membership[];
  /**
   * Membership actif "par défaut" (le seul si un seul club, sinon le premier).
   * À termes l'app supportera la sélection explicite via cookie/header.
   */
  current: Membership | null;
}

/**
 * Récupère l'utilisateur authentifié et ses memberships.
 * Retourne null si non authentifié (sans redirection).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: rows, error: mErr } = await supabase
    .from("club_memberships")
    .select("club_id, user_id, role, accepted_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (mErr) {
    console.error("[RBAC] Erreur lecture memberships:", mErr);
    return {
      user: { id: user.id, email: user.email ?? null },
      memberships: [],
      current: null,
    };
  }

  const memberships: Membership[] = (rows || []).map((r) => ({
    clubId: r.club_id as string,
    userId: r.user_id as string,
    role: r.role as ClubRole,
    acceptedAt: (r.accepted_at as string | null) ?? null,
  }));

  // Club « perso » créé à l’inscription : owner avec club_id = auth.uid().
  // Un invité a AUSSI ce membership + celui du vrai club → ne pas toujours
  // préférer le perso sinon il ne voit aucune donnée du club.
  const personalOwner = memberships.find(
    (m) => m.clubId === user.id && m.role === "owner"
  );
  const externalMemberships = memberships.filter((m) => m.clubId !== user.id);

  let current: Membership | null = null;

  try {
    const jar = await cookies();
    const pref = jar.get(OBILLZ_ACTIVE_CLUB_COOKIE)?.value;
    if (pref && memberships.some((m) => m.clubId === pref)) {
      current = memberships.find((m) => m.clubId === pref) ?? null;
    }
  } catch {
    // cookies() indisponible (hors requête Next)
  }

  if (!current) {
    if (externalMemberships.length > 0) {
      externalMemberships.sort((a, b) => {
        const ta = a.acceptedAt ? Date.parse(a.acceptedAt) : 0;
        const tb = b.acceptedAt ? Date.parse(b.acceptedAt) : 0;
        return tb - ta;
      });
      current = externalMemberships[0] ?? null;
    } else {
      current = personalOwner ?? memberships[0] ?? null;
    }
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    memberships,
    current,
  };
}

/**
 * Variante avec redirection auto vers /connexion si non auth.
 * À utiliser dans les pages serveur.
 */
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/connexion");
  }
  return ctx;
}

/**
 * Vérifie qu'un utilisateur a un rôle au moins équivalent à p_required
 * sur le club p_clubId. Retourne le membership si OK, lève sinon.
 *
 * Note importante : on s'appuie sur les RLS pour la vraie sécurité.
 * Cette fonction est un raccourci pour court-circuiter tôt et renvoyer
 * une 403 propre au client.
 */
export function hasRole(
  membership: Membership | null | undefined,
  allowed: ClubRole[]
): boolean {
  if (!membership) return false;
  return allowed.includes(membership.role);
}

export function findMembership(
  ctx: AuthContext | null | undefined,
  clubId: string
): Membership | null {
  if (!ctx) return null;
  return ctx.memberships.find((m) => m.clubId === clubId) ?? null;
}

/**
 * Récupère le membership de l'utilisateur courant sur un club donné.
 * Retourne null si non membre.
 */
export async function getMembership(clubId: string): Promise<Membership | null> {
  const ctx = await getAuthContext();
  return findMembership(ctx, clubId);
}

/**
 * À utiliser dans les API routes : retourne soit { ctx, membership } si OK,
 * soit { error: NextResponse } prêt à être renvoyé.
 *
 * Exemple :
 *   const guard = await requireClubRole(clubId, ['owner','admin']);
 *   if ('error' in guard) return guard.error;
 *   const { membership } = guard;
 */
export async function requireClubRole(
  clubId: string,
  allowed: ClubRole[] = STAFF_ROLES
): Promise<
  | {
      ctx: AuthContext;
      membership: Membership;
    }
  | {
      error: Response;
    }
> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return {
      error: new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { "content-type": "application/json" } }
      ),
    };
  }
  const membership = findMembership(ctx, clubId);
  if (!membership) {
    return {
      error: new Response(
        JSON.stringify({ error: "Accès refusé : non membre du club" }),
        { status: 403, headers: { "content-type": "application/json" } }
      ),
    };
  }
  if (!hasRole(membership, allowed)) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Accès refusé : rôle insuffisant",
          required: allowed,
          actual: membership.role,
        }),
        { status: 403, headers: { "content-type": "application/json" } }
      ),
    };
  }
  return { ctx, membership };
}

/**
 * Variante compatible Next.js Pages Server : renvoie le current.clubId
 * pour le user courant ou redirige sur /connexion.
 *
 * Utilisée à la place de l'ancien getCurrentUser() pour pousser le code
 * existant à passer par le club_id explicite.
 */
export async function requireCurrentClub(): Promise<{
  user: AuthContext["user"];
  clubId: string;
  role: ClubRole;
}> {
  const ctx = await requireAuthContext();
  if (!ctx.current) {
    // L'utilisateur est authentifié mais n'a aucun membership actif.
    // Cas très rare (devrait être impossible grâce au trigger d'inscription).
    redirect("/connexion?reason=no-club");
  }
  return {
    user: ctx.user,
    clubId: ctx.current.clubId,
    role: ctx.current.role,
  };
}
