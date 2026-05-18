/**
 * Alias de compatibilité pour l’endpoint Stripe configuré en production :
 * https://obillz.com/api/webhook
 *
 * Implémentation unique : app/api/webhooks/stripe/route.ts
 */
export { POST, dynamic, runtime } from "../webhooks/stripe/route";
