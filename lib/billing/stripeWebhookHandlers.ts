/**
 * Traitement des événements Stripe (logique pure + appels sync Supabase).
 */

import type Stripe from "stripe";
import {
  tierFromStripeMetadata,
  tierFromStripePriceId,
  type StripeBillingInterval,
} from "./stripePrices";
import {
  findUserIdByStripeRefs,
  syncProfileFromStripe,
} from "./stripeSync";
import type { SubscriptionTier } from "./teamPlan";

function subscriptionPriceId(
  subscription: Stripe.Subscription
): string | null {
  const item = subscription.items?.data?.[0];
  if (!item) return null;
  if (typeof item.price === "string") return item.price;
  return item.price?.id ?? null;
}

function resolveTierAndInterval(params: {
  priceId: string | null;
  metadata?: Stripe.Metadata | null;
  fallbackTier?: SubscriptionTier;
  fallbackInterval?: StripeBillingInterval;
}): { tier: SubscriptionTier; interval: StripeBillingInterval } {
  const fromPrice = tierFromStripePriceId(params.priceId);
  if (fromPrice) {
    return { tier: fromPrice.tier, interval: fromPrice.interval };
  }

  const fromMeta = tierFromStripeMetadata(
    params.metadata as Record<string, string> | undefined
  );

  return {
    tier:
      fromMeta ??
      params.fallbackTier ??
      "standard",
    interval:
      (params.metadata?.billing_interval as StripeBillingInterval) ||
      params.fallbackInterval ||
      "yearly",
  };
}

function isSubscriptionActive(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

export async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId =
    session.client_reference_id ||
    session.metadata?.user_id ||
    null;

  if (!userId) {
    console.error(
      "[WEBHOOK][stripe] checkout.session.completed sans user_id",
      session.id
    );
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  let subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  let priceId: string | null = null;
  let subscription: Stripe.Subscription | null = null;

  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
    priceId = subscriptionPriceId(subscription);
    subscriptionId = subscription.id;
  }

  const { tier, interval } = resolveTierAndInterval({
    priceId,
    metadata: session.metadata,
    fallbackTier:
      (session.metadata?.subscription_tier as SubscriptionTier) || "standard",
    fallbackInterval:
      (session.metadata?.billing_interval as StripeBillingInterval) || "yearly",
  });

  await syncProfileFromStripe({
    userId,
    billingCycle: interval,
    subscriptionTier: tier,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    active: true,
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = await findUserIdByStripeRefs({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    metadataUserId: subscription.metadata?.user_id ?? null,
  });

  if (!userId) {
    console.warn(
      "[WEBHOOK][stripe] subscription.updated: user introuvable",
      subscription.id
    );
    return;
  }

  const priceId = subscriptionPriceId(subscription);
  const { tier, interval } = resolveTierAndInterval({
    priceId,
    metadata: subscription.metadata,
  });

  await syncProfileFromStripe({
    userId,
    billingCycle: interval,
    subscriptionTier: tier,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    active: isSubscriptionActive(subscription.status),
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = await findUserIdByStripeRefs({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    metadataUserId: subscription.metadata?.user_id ?? null,
  });

  if (!userId) {
    console.warn(
      "[WEBHOOK][stripe] subscription.deleted: user introuvable",
      subscription.id
    );
    return;
  }

  const priceId = subscriptionPriceId(subscription);
  const { tier, interval } = resolveTierAndInterval({
    priceId,
    metadata: subscription.metadata,
  });

  await syncProfileFromStripe({
    userId,
    billingCycle: interval,
    subscriptionTier: tier,
    stripeSubscriptionId: subscription.id,
    active: false,
  });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  };
  const sub = legacy.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  return null;
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id ?? null;

  const userId = await findUserIdByStripeRefs({
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
  });

  if (!userId) return;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_tier, billing_cycle")
    .eq("user_id", userId)
    .maybeSingle();

  const billingCycle =
    (profile?.billing_cycle as StripeBillingInterval) || "monthly";
  const subscriptionTier: SubscriptionTier =
    profile?.subscription_tier === "team" ? "team" : "standard";

  await syncProfileFromStripe({
    userId,
    billingCycle,
    subscriptionTier,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    active: false,
  });
}
