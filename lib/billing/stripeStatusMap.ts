/**
 * Mapping Stripe Subscription.status → accès Obillz (profiles.subscription_status).
 *
 * Convention Obillz : "trial" | "active" | "expired"
 * - "trial" = essai gratuit local (pas un statut Stripe)
 * - "active" = accès écriture complet
 * - "expired" = lecture seule / paiement requis
 */

import type Stripe from "stripe";

export type ObillzSubscriptionStatus = "active" | "expired";

export type StripeAccessDecision = {
  /** Statut à persister dans profiles.subscription_status */
  obillzStatus: ObillzSubscriptionStatus;
  /** true = accès produit complet (équivalent canWrite) */
  entitled: boolean;
  /** Raison courte pour les logs */
  reason: string;
};

/**
 * Décide de l’accès Obillz à partir du statut d’abonnement Stripe.
 *
 * past_due : Stripe retente encore le paiement → on conserve l’accès (grace).
 * unpaid   : Stripe a abandonné les retries → on retire l’accès.
 * incomplete : checkout non finalisé → pas d’accès payant.
 */
export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): StripeAccessDecision {
  switch (status) {
    case "active":
      return {
        obillzStatus: "active",
        entitled: true,
        reason: "stripe_active",
      };
    case "trialing":
      // Essai Stripe (carte enregistrée) ≠ essai gratuit Obillz local
      return {
        obillzStatus: "active",
        entitled: true,
        reason: "stripe_trialing",
      };
    case "past_due":
      return {
        obillzStatus: "active",
        entitled: true,
        reason: "stripe_past_due_grace",
      };
    case "unpaid":
      return {
        obillzStatus: "expired",
        entitled: false,
        reason: "stripe_unpaid",
      };
    case "canceled":
      return {
        obillzStatus: "expired",
        entitled: false,
        reason: "stripe_canceled",
      };
    case "incomplete":
      return {
        obillzStatus: "expired",
        entitled: false,
        reason: "stripe_incomplete",
      };
    case "incomplete_expired":
      return {
        obillzStatus: "expired",
        entitled: false,
        reason: "stripe_incomplete_expired",
      };
    case "paused":
      return {
        obillzStatus: "expired",
        entitled: false,
        reason: "stripe_paused",
      };
    default:
      return {
        obillzStatus: "expired",
        entitled: false,
        reason: `stripe_unknown_${String(status)}`,
      };
  }
}

export function isStripeSubscriptionEntitled(
  status: Stripe.Subscription.Status
): boolean {
  return mapStripeSubscriptionStatus(status).entitled;
}
