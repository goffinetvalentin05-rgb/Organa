import { randomBytes } from "crypto";

/**
 * Helpers serveur autour des invitations club.
 *
 * Voir aussi :
 *   - app/api/club/invitations/         (CRUD côté owner)
 *   - app/api/invitations/[token]/      (acceptation publique semi-auth)
 *   - lib/email/invite-email.ts         (envoi du mail d'invitation)
 */

/**
 * Génère un token URL-safe à 32 octets (= 256 bits d'entropie).
 * Format base64url, ~43 caractères.
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Construit l'URL absolue d'acceptation d'une invitation.
 * Préfère la variable d'env `NEXT_PUBLIC_APP_URL` ; sinon retombe sur
 * `request` ou un placeholder relatif.
 */
export function buildInvitationUrl(token: string, origin?: string | null): string {
  const base =
    (origin && origin.trim()) ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://obillz.com";
  const cleaned = base.replace(/\/+$/, "");
  return `${cleaned}/invitations/${encodeURIComponent(token)}`;
}

/** Durée de validité par défaut d'une invitation (14 jours). */
export const INVITATION_EXPIRATION_DAYS = 14;

export function defaultInvitationExpiry(): Date {
  return new Date(Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
}

/** Format d'expiration humainement lisible pour l'email. */
export function humanExpiry(expiresAt: string | Date): string {
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return d.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
