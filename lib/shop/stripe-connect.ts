/**
 * Compatibilité Boutique : le compte Stripe Connect appartient au club.
 * La logique vit dans `lib/payments/connect/*`.
 */
export { getStripe, appBaseUrl } from "@/lib/payments/connect/stripe-client";
export {
  mapPaymentAccount,
  getClubStripeAccount,
  snapshotFromAccount,
  syncStripeAccountRow,
  refreshStripeAccount,
} from "@/lib/payments/connect/accounts";
