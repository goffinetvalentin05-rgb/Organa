/**
 * Cookie navigateur : club actif pour l’UI (complète la heuristique serveur).
 * Non HttpOnly — uniquement pour guider getAuthContext() côté serveur.
 */
export const OBILLZ_ACTIVE_CLUB_COOKIE = "obillz_active_club_id";

export function setActiveClubCookieClient(clubId: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 400;
  document.cookie = `${OBILLZ_ACTIVE_CLUB_COOKIE}=${encodeURIComponent(
    clubId
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
