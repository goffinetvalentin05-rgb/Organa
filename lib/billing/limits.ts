/**
 * Constantes et helpers pour les limites
 *
 * NOUVEAU MODÈLE (Trial + Subscription):
 * - Trial (7 jours): Accès COMPLET, pas de limites
 * - Abonnement actif: Accès COMPLET, pas de limites
 * - Essai expiré: Mode LECTURE SEULE (pas de création/modification)
 *
 * Les anciennes constantes sont conservées pour rétrocompatibilité
 * mais ne sont plus utilisées dans la logique principale.
 */

import { SubscriptionStatus } from "./subscription";

// ============================================
// Anciennes constantes (DÉPRÉCIÉES)
// Conservées pour rétrocompatibilité uniquement
// ============================================

/** @deprecated Plus de limites dans le nouveau modèle */
export const MAX_CLIENTS_FREE = Infinity;
/** @deprecated Plus de limites dans le nouveau modèle */
export const MAX_DOCS_PER_MONTH_FREE = Infinity;
/** @deprecated Plus de limites dans le nouveau modèle */
export const MAX_EVENTS_FREE = Infinity;
/** @deprecated Plus de limites dans le nouveau modèle */
export const MAX_PLANNINGS_FREE = Infinity;

// ============================================
// Types
// ============================================

export interface LimitInfo {
  max: number;
  current: number;
  plan: "free" | "pro";
  resource: "clients" | "documents" | "events" | "plannings";
}

// ============================================
// Nouvelles fonctions
// ============================================

/**
 * Vérifie si l'utilisateur peut effectuer une action selon son statut d'abonnement
 *
 * @param subscriptionStatus Le statut de l'abonnement
 * @returns true si l'action est autorisée
 */
export function canPerformAction(subscriptionStatus: SubscriptionStatus): boolean {
  // Trial et Active = accès complet
  // Expired = lecture seule
  return subscriptionStatus === "trial" || subscriptionStatus === "active";
}

/**
 * Génère un message d'erreur pour un abonnement expiré
 */
export function getSubscriptionExpiredMessage(): string {
  return "Votre période d'essai est terminée. Abonnez-vous pour continuer à utiliser toutes les fonctionnalités.";
}

/**
 * Génère un message d'erreur pour une action bloquée
 *
 * @param action L'action tentée (ex: "créer un client")
 */
export function getActionBlockedMessage(action?: string): string {
  const actionText = action ? `L'action "${action}"` : "Cette action";
  return `${actionText} nécessite un abonnement actif. Votre période d'essai est terminée.`;
}

// ============================================
// Anciennes fonctions (DÉPRÉCIÉES - rétrocompatibilité)
// ============================================

/**
 * @deprecated Utilisez canPerformAction() avec le statut d'abonnement
 */
export function isLimitReached(info: LimitInfo): boolean {
  // Dans le nouveau modèle, il n'y a plus de limites numériques
  // Retourne toujours false car les limites sont gérées par le statut d'abonnement
  return false;
}

/**
 * @deprecated Utilisez getSubscriptionExpiredMessage() ou getActionBlockedMessage()
 */
export function getLimitErrorMessage(
  resource: "clients" | "documents" | "events" | "plannings",
  plan: "free" | "pro"
): string {
  // Nouveau message unifié
  return getSubscriptionExpiredMessage();
}
































