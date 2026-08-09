/**
 * Réconciliation ponctuelle trial → expired.
 * Appelée UNIQUEMENT au moment de la transition locale (pas à chaque page).
 */

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  tierFromStripeMetadata,
  tierFromStripePriceId,
  type StripeBillingInterval,
} from "./stripePrices";
import { isStripeSubscriptionEntitled } from "./stripeStatusMap";
import { syncProfileFromStripe } from "./stripeSync";
import type { SubscriptionTier } from "./teamPlan";

export type TrialReconcileResult =
  | { action: "keep_active"; reason: string }
  | { action: "expire"; reason: string }
  | { action: "grace"; reason: string };

function customerIdOf(
  ref: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref.id ?? null;
}

/**
 * Avant d'écrire expired localement : vérifier Stripe une fois via email.
 * - Abonnement entitled trouvé (unique) → sync + keep_active
 * - Aucun → expire
 * - Stripe indisponible / ambigu → grace (ne pas écrire expired)
 */
export async function reconcileTrialExpiryBeforeExpire(params: {
  userId: string;
  email: string | null | undefined;
}): Promise<TrialReconcileResult> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.includes("REMPLACEZ")) {
    console.warn(
      "[BILLING][reconcileTrial] STRIPE_SECRET_KEY absente — grace (pas d'expire local)"
    );
    return { action: "grace", reason: "stripe_key_missing" };
  }

  if (!params.email?.trim()) {
    return { action: "expire", reason: "no_email_for_stripe_lookup" };
  }

  try {
    const stripe = new Stripe(stripeKey);
    const customers = await stripe.customers.list({
      email: params.email.trim(),
      limit: 5,
    });

    if (customers.data.length === 0) {
      return { action: "expire", reason: "no_stripe_customer" };
    }

    if (customers.data.length > 1) {
      console.warn(
        `[BILLING][reconcileTrial] plusieurs customers Stripe pour email — grace user_id=${params.userId}`
      );
      return { action: "grace", reason: "ambiguous_stripe_customers" };
    }

    const customer = customers.data[0];
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 20,
    });

    const entitled = subs.data.filter((s) =>
      isStripeSubscriptionEntitled(s.status)
    );

    // Préférer une sub dont metadata.user_id matche
    const matched =
      entitled.find((s) => s.metadata?.user_id === params.userId) ||
      (entitled.length === 1 ? entitled[0] : null);

    if (!matched && entitled.length > 1) {
      console.warn(
        `[BILLING][reconcileTrial] plusieurs subs entitled — grace user_id=${params.userId}`
      );
      return { action: "grace", reason: "ambiguous_stripe_subscriptions" };
    }

    if (!matched) {
      return { action: "expire", reason: "no_entitled_subscription" };
    }

    const priceRef = matched.items?.data?.[0]?.price;
    const priceId =
      typeof priceRef === "string" ? priceRef : priceRef?.id ?? null;
    const fromPrice = tierFromStripePriceId(priceId);
    const tier: SubscriptionTier =
      fromPrice?.tier ||
      (matched.metadata?.subscription_tier === "team" ? "team" : "standard");
    const interval: StripeBillingInterval =
      fromPrice?.interval ||
      (matched.metadata?.billing_interval === "monthly"
        ? "monthly"
        : "yearly");

    const sub = matched as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };

    await syncProfileFromStripe({
      userId: params.userId,
      billingCycle: interval,
      subscriptionTier: tier,
      stripeSubscriptionId: matched.id,
      stripeCustomerId: customerIdOf(matched.customer) || customer.id,
      active: true,
      subscriptionStartedAt: sub.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString()
        : null,
      subscriptionEndsAt: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      logContext: {
        source: "reconcile_trial_expiry",
        user_id: params.userId,
        subscription_id: matched.id,
        customer_id: customer.id,
      },
    });

    console.log(
      `[BILLING][reconcileTrial] sub Stripe rattachée user_id=${params.userId} sub=${matched.id}`
    );
    return { action: "keep_active", reason: "stripe_subscription_synced" };
  } catch (err) {
    console.error("[BILLING][reconcileTrial] erreur Stripe — grace", err);
    return { action: "grace", reason: "stripe_error" };
  }
}

/**
 * Si le profil est encore « trial » mais a déjà des IDs Stripe, aligne le statut en active
 * sans appeler l'API Stripe (webhook devrait déjà l'avoir fait).
 */
export async function healTrialStatusWhenStripeLinked(params: {
  userId: string;
  billingUserId: string;
  canWriteProfile: boolean;
}): Promise<void> {
  if (!params.canWriteProfile) return;
  if (params.billingUserId !== params.userId) return;

  try {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ subscription_status: "active", plan: "pro" })
      .eq("user_id", params.billingUserId)
      .eq("subscription_status", "trial");
  } catch (err) {
    console.warn("[BILLING][healTrialStatus] échec non bloquant", err);
  }
}
