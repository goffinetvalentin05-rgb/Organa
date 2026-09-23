/**
 * Accès Comptabilité offert, sans abonnement Stripe.
 *
 * Deux voies, toutes les deux côté serveur :
 * - le club est marqué fondateur (`profiles.is_founder`) ;
 * - l'e-mail du propriétaire du club figure dans ACCOUNTING_DEV_EMAILS.
 *
 * Les clubs clients restent sur l'add-on Stripe.
 */

const ENV_KEY = "ACCOUNTING_DEV_EMAILS";

export function accountingDevEmails(raw = process.env[ENV_KEY]): string[] {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAccountingDevEmail(
  email: string | null | undefined,
  raw = process.env[ENV_KEY]
): boolean {
  if (!email) return false;
  return accountingDevEmails(raw).includes(email.trim().toLowerCase());
}
