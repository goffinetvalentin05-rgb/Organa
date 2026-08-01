/**
 * Lancement public Obillz Associations.
 *
 * Passer à `true` pour rouvrir inscription / connexion publiques et les CTA Auth.
 * Aucune migration ni suppression de code : simple interrupteur.
 */
export const ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED = false;

export const ASSOCIATIONS_COMING_SOON_QUERY = "comingSoon";

export const ASSOCIATIONS_WAITLIST_SUBJECT = "Intérêt pour Obillz Associations";

export const ASSOCIATIONS_WAITLIST_HREF = `mailto:contact@obillz.com?subject=${encodeURIComponent(
  ASSOCIATIONS_WAITLIST_SUBJECT
)}`;

export const ASSOCIATIONS_COMING_SOON_HREF = `/associations?${ASSOCIATIONS_COMING_SOON_QUERY}=1`;

/**
 * Auth Associations accessible publiquement ?
 * - Lancement ouvert → oui
 * - Sinon inscription bloquée
 * - Connexion autorisée uniquement pour récupérer une session espace
 *   (`?next=/associations/espace…`) afin de ne pas bloquer les comptes existants
 */
export function isAssociationsPublicAuthOpen(
  pathname: string,
  searchParams?: URLSearchParams | { get(name: string): string | null }
): boolean {
  if (ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED) return true;

  if (pathname === "/associations/inscription") return false;

  if (pathname === "/associations/connexion") {
    const next = searchParams?.get("next");
    return Boolean(next && next.startsWith("/associations/espace"));
  }

  return true;
}
