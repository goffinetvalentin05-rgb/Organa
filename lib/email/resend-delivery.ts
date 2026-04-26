import { Resend } from "resend";

/**
 * Profil minimal pour décider de l'envoi (table profiles / configs équivalentes).
 * Les clés ne doivent jamais être exposées au client.
 */
export type ClubResendProfile = {
  company_name: string | null | undefined;
  company_email?: string | null;
  email_sender_name?: string | null;
  email_sender_email?: string | null;
  resend_api_key?: string | null;
  email_custom_enabled?: boolean | null;
};

export type ResendDelivery = {
  resend: Resend;
  from: string;
  mode: "custom" | "obillz";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlausibleEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

function displayClubName(name: string | null | undefined): string {
  const t = (name || "").trim();
  return t || "Club";
}

function productLabel(): string {
  return (process.env.RESEND_FROM_NAME || "Obillz").trim() || "Obillz";
}

function obillzFromAddress(clubName: string): string {
  const fromEmail = (process.env.RESEND_FROM_EMAIL || "contact@obillz.com").trim();
  return `${displayClubName(clubName)} via ${productLabel()} <${fromEmail}>`;
}

/**
 * Choisit le client Resend et l'adresse From.
 * - Custom : email_custom_enabled + clé + email expéditeur valides.
 * - Sinon : compte Obillz (RESEND_API_KEY) si défini.
 * @returns null seulement si aucune clé globale n'est disponible et le mode custom n'est pas utilisable.
 */
export function resolveResendFromProfile(
  profile: ClubResendProfile
): ResendDelivery | null {
  const clubName = displayClubName(profile.company_name);
  const customOn = profile.email_custom_enabled === true;
  const key = (profile.resend_api_key || "").trim();
  const customEmail = (profile.email_sender_email || "").trim();

  if (customOn && key && customEmail && isPlausibleEmail(customEmail)) {
    return {
      resend: new Resend(key),
      from: `${clubName} <${customEmail}>`,
      mode: "custom",
    };
  }

  const globalKey = (process.env.RESEND_API_KEY || "").trim();
  if (!globalKey) {
    return null;
  }

  return {
    resend: new Resend(globalKey),
    from: obillzFromAddress(clubName),
    mode: "obillz",
  };
}
