/**
 * Constantes et helpers pour les limites des plans
 */

export const MAX_CLIENTS_FREE = 2;
export const MAX_DOCS_PER_MONTH_FREE = 3;

export interface LimitInfo {
  max: number;
  current: number;
  plan: "free" | "pro";
  resource: "clients" | "documents";
}

/**
 * Vérifie si une limite est atteinte
 */
export function isLimitReached(info: LimitInfo): boolean {
  if (info.plan === "pro") {
    return false; // Pro n'a pas de limite
  }
  return info.current >= info.max;
}

/**
 * Génère un message d'erreur pour une limite atteinte
 */
export function getLimitErrorMessage(resource: "clients" | "documents", plan: "free" | "pro"): string {
  if (plan === "pro") {
    return "Erreur inattendue"; // Ne devrait jamais arriver
  }

  if (resource === "clients") {
    return `Limite atteinte : Le plan gratuit permet un maximum de ${MAX_CLIENTS_FREE} clients. Passez au plan Pro pour créer plus de clients.`;
  } else {
    return `Limite atteinte : Le plan gratuit permet un maximum de ${MAX_DOCS_PER_MONTH_FREE} documents (factures + devis) par mois. Passez au plan Pro pour créer plus de documents.`;
  }
}























