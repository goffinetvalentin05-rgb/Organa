/**
 * Résolution des Price IDs Stripe (variables d'environnement + repli legacy).
 */

import type { SubscriptionTier } from "./teamPlan";

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

/** Alias historiques (anciens noms d'env : 39 / 390 CHF) */
const LEGACY_STANDARD_ENV_ALIASES: Record<StripeBillingInterval, string[]> = {
  monthly: ["STRIPE_PRICE_MONTHLY"],
  yearly: ["STRIPE_PRICE_YEARLY"],
};

/** Price IDs historiques (formule unique 39/390 CHF = Standard) */
const LEGACY_STANDARD_PRICES: Record<StripeBillingInterval, string> = {
  monthly: "price_1TQTaxHvElMyrvJkVltPcQUp",
  yearly: "price_1TQTbbHvElMyrvJkmsJXnHKW",
};

export interface StripePriceResolution {
  tier: SubscriptionTier;
  interval: StripeBillingInterval;
}

function isConfiguredPriceId(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  if (v.includes("REMPLACEZ") || v.includes("TODO") || v.includes("PLACEHOLDER")) {
    return false;
  }
  return v.startsWith("price_");
}

function buildPriceIdMap(): Map<string, StripePriceResolution> {
  const map = new Map<string, StripePriceResolution>();

  for (const interval of ["monthly", "yearly"] as const) {
    map.set(LEGACY_STANDARD_PRICES[interval], { tier: "standard", interval });
  }

  for (const plan of ["standard", "team"] as const) {
    for (const interval of ["monthly", "yearly"] as const) {
      const envKeys = [
        ENV_KEYS[plan][interval],
        ...(plan === "standard" ? LEGACY_STANDARD_ENV_ALIASES[interval] : []),
      ];
      for (const envKey of envKeys) {
        const priceId = process.env[envKey];
        if (isConfiguredPriceId(priceId)) {
          map.set(priceId, { tier: plan, interval });
        }
      }
    }
  }

  return map;
}

let cachedPriceMap: Map<string, StripePriceResolution> | null = null;

function getPriceIdMap(): Map<string, StripePriceResolution> {
  if (!cachedPriceMap) {
    cachedPriceMap = buildPriceIdMap();
  }
  return cachedPriceMap;
}

/** Invalide le cache (tests ou rechargement env en dev). */
export function resetStripePriceIdCache(): void {
  cachedPriceMap = null;
}

/**
 * Retourne le Price ID Stripe ou null si non configuré (formule Équipe).
 */
export function resolveStripePriceId(
  plan: StripeProductPlan,
  interval: StripeBillingInterval
): string | null {
  const envKeys = [
    ENV_KEYS[plan][interval],
    ...(plan === "standard" ? LEGACY_STANDARD_ENV_ALIASES[interval] : []),
  ];
  for (const envKey of envKeys) {
    const fromEnv = process.env[envKey];
    if (isConfiguredPriceId(fromEnv)) {
      return fromEnv;
    }
  }

  if (plan === "standard") {
    return LEGACY_STANDARD_PRICES[interval];
  }

  return null;
}

/**
 * Déduit la formule Obillz et le cycle à partir d'un Price ID Stripe.
 */
export function tierFromStripePriceId(
  priceId: string | null | undefined
): StripePriceResolution | null {
  if (!priceId) return null;
  return getPriceIdMap().get(priceId) ?? null;
}

/**
 * Déduit la formule depuis les métadonnées checkout / subscription Stripe.
 */
export function tierFromStripeMetadata(
  metadata: Record<string, string> | null | undefined
): SubscriptionTier | null {
  const raw = metadata?.subscription_tier;
  if (raw === "team" || raw === "standard") return raw;
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
