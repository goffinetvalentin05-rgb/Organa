/**
 * Synchronisation profil Supabase ↔ abonnement Stripe (webhooks, service role).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "./teamPlan";
import type { StripeBillingInterval } from "./stripePrices";

export interface StripeSubscriptionSyncInput {
  userId: string;
  billingCycle: StripeBillingInterval;
  subscriptionTier: SubscriptionTier;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  active: boolean;
}

/**
 * Met à jour le profil club (owner) après un événement Stripe.
 */
export async function syncProfileFromStripe(
  input: StripeSubscriptionSyncInput
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();

  if (input.active) {
    const endsAt = new Date(now);
    if (input.billingCycle === "yearly") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }

    const updateData: Record<string, unknown> = {
      subscription_status: "active",
      billing_cycle: input.billingCycle,
      subscription_started_at: now.toISOString(),
      subscription_ends_at: endsAt.toISOString(),
      plan: "pro",
      subscription_tier: input.subscriptionTier,
    };

    if (input.stripeSubscriptionId) {
      updateData.stripe_subscription_id = input.stripeSubscriptionId;
    }
    if (input.stripeCustomerId) {
      updateData.stripe_customer_id = input.stripeCustomerId;
    }

    const { error } = await admin
      .from("profiles")
      .update(updateData)
      .eq("user_id", input.userId);

    if (error) {
      console.error("[BILLING][stripeSync] Activation échouée", error);
      throw new Error("Erreur lors de l'activation de l'abonnement");
    }

    console.log(
      `[BILLING][stripeSync] Activé user_id=${input.userId} tier=${input.subscriptionTier} cycle=${input.billingCycle}`
    );
    return;
  }

  // Expiration : on conserve subscription_tier (historique produit) mais on bloque l'accès payant
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "expired",
      billing_cycle: null,
      plan: "free",
    })
    .eq("user_id", input.userId);

  if (error) {
    console.error("[BILLING][stripeSync] Expiration échouée", error);
    throw new Error("Erreur lors de la désactivation de l'abonnement");
  }

  console.log(`[BILLING][stripeSync] Expiré user_id=${input.userId}`);
}

/**
 * Trouve le user_id Obillz à partir d'un abonnement ou customer Stripe.
 */
export async function findUserIdByStripeRefs(params: {
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  metadataUserId?: string | null;
}): Promise<string | null> {
  if (params.metadataUserId) return params.metadataUserId;

  const admin = createAdminClient();

  if (params.stripeSubscriptionId) {
    const { data } = await admin
      .from("profiles")
      .select("user_id")
      .eq("stripe_subscription_id", params.stripeSubscriptionId)
      .maybeSingle();
    if (data?.user_id) return data.user_id;
  }

  if (params.stripeCustomerId) {
    const { data } = await admin
      .from("profiles")
      .select("user_id")
      .eq("stripe_customer_id", params.stripeCustomerId)
      .maybeSingle();
    if (data?.user_id) return data.user_id;
  }

  return null;
}
