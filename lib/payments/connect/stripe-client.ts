import Stripe from "stripe";

/**
 * Client Stripe de la plateforme Obillz, utilisé pour Stripe Connect des clubs.
 * Distinct de la logique d’abonnement SaaS (`lib/billing/*`) : même clé plateforme,
 * mais jamais mélangée avec les webhooks / Price Pro d’abonnement.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("REMPLACEZ")) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }
  return new Stripe(key);
}

export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key || key.includes("REMPLACEZ") || !key.startsWith("pk_")) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante");
  }
  return key;
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}
