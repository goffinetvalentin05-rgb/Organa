/**
 * Résolution des Price IDs Stripe (variables d'environnement + repli legacy).
 */

export type StripeProductPlan = "standard" | "team";
export type StripeBillingInterval = "monthly" | "yearly";

const ENV_KEYS: Record<StripeProductPlan, Record<StripeBillingInterval, string>> = {
  standard: {
    monthly: "STRIPE_PRICE_STANDARD_MONTHLY",
    yearly: "STRIPE_PRICE_STANDARD_YEARLY",
  },
  team: {
    monthly: "STRIPE_PRICE_TEAM_MONTHLY",
    yearly: "STRIPE_PRICE_TEAM_YEARLY",
  },
};

/** Price IDs historiques (formule unique 39/390 CHF = Standard) */
const LEGACY_STANDARD_PRICES: Record<StripeBillingInterval, string> = {
  monthly: "price_1TQTaxHvElMyrvJkVltPcQUp",
  yearly: "price_1TQTbbHvElMyrvJkmsJXnHKW",
};

function isConfiguredPriceId(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  if (v.includes("REMPLACEZ") || v.includes("TODO") || v.includes("PLACEHOLDER")) {
    return false;
  }
  return v.startsWith("price_");
}

/**
 * Retourne le Price ID Stripe ou null si non configuré (formule Équipe).
 */
export function resolveStripePriceId(
  plan: StripeProductPlan,
  interval: StripeBillingInterval
): string | null {
  const envKey = ENV_KEYS[plan][interval];
  const fromEnv = process.env[envKey];
  if (isConfiguredPriceId(fromEnv)) {
    return fromEnv;
  }

  if (plan === "standard") {
    return LEGACY_STANDARD_PRICES[interval];
  }

  // TODO: configurer STRIPE_PRICE_TEAM_MONTHLY et STRIPE_PRICE_TEAM_YEARLY dans .env.local
  return null;
}

export function missingTeamPriceEnvKeys(): string[] {
  const missing: string[] = [];
  for (const key of Object.values(ENV_KEYS.team)) {
    if (!isConfiguredPriceId(process.env[key])) {
      missing.push(key);
    }
  }
  return missing;
}
