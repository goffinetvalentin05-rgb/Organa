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
  findUserIdByCustomerEmail,
  findUserIdByStripeRefs,
  StripeWebhookSyncError,
  syncProfileFromStripe,
} from "./stripeSync";
import { mapStripeSubscriptionStatus } from "./stripeStatusMap";
import type { SubscriptionTier } from "./teamPlan";

export type StripeEventContext = {
  eventId: string;
  eventType: string;
};

function logHandler(
  level: "log" | "warn" | "error",
  message: string,
  ctx: Record<string, unknown>
) {
  console[level](`[WEBHOOK][stripe] ${message} ${JSON.stringify(ctx)}`);
}

function subscriptionPriceId(
  subscription: Stripe.Subscription
): string | null {
  const item = subscription.items?.data?.[0];
  if (!item) return null;
  if (typeof item.price === "string") return item.price;
  return item.price?.id ?? null;
}

function customerIdOf(
  ref: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if ("deleted" in ref && ref.deleted) return ref.id ?? null;
  return ref.id ?? null;
}

function unixToIso(unix: number | null | undefined): string | null {
  if (!unix || !Number.isFinite(unix)) return null;
  return new Date(unix * 1000).toISOString();
}

/** current_period_* peut être sur la sub ou le first item selon API Stripe */
function subscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  let start = unixToIso(sub.current_period_start);
  let end = unixToIso(sub.current_period_end);

  if (!start || !end) {
    const item = subscription.items?.data?.[0] as
      | (Stripe.SubscriptionItem & {
          current_period_start?: number;
          current_period_end?: number;
        })
      | undefined;
    start = start || unixToIso(item?.current_period_start);
    end = end || unixToIso(item?.current_period_end);
  }

  return { start, end };
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
    tier: fromMeta ?? params.fallbackTier ?? "standard",
    interval:
      (params.metadata?.billing_interval as StripeBillingInterval) ||
      params.fallbackInterval ||
      "yearly",
  };
}

async function resolveUserIdForSubscription(params: {
  subscription: Stripe.Subscription;
  stripe: Stripe;
  allowEmailFallback: boolean;
  eventCtx: StripeEventContext;
}): Promise<string> {
  const { subscription, stripe, allowEmailFallback, eventCtx } = params;
  const customerId = customerIdOf(subscription.customer);

  const fromRefs = await findUserIdByStripeRefs({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    metadataUserId: subscription.metadata?.user_id ?? null,
  });

  if (fromRefs) return fromRefs;

  if (!allowEmailFallback) {
    throw new StripeWebhookSyncError(
      "USER_NOT_FOUND",
      "Impossible d'identifier le profil Obillz pour cet abonnement",
      {
        event_id: eventCtx.eventId,
        event_type: eventCtx.eventType,
        subscription_id: subscription.id,
        customer_id: customerId,
      }
    );
  }

  let email: string | null = null;
  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer && customer.deleted)) {
      email = customer.email ?? null;
    }
  }

  const fromEmail = await findUserIdByCustomerEmail(email);
  if (fromEmail) {
    logHandler("warn", "user_id résolu via email (fallback)", {
      event_id: eventCtx.eventId,
      event_type: eventCtx.eventType,
      user_id: fromEmail,
      subscription_id: subscription.id,
      customer_id: customerId,
    });
    return fromEmail;
  }

  throw new StripeWebhookSyncError(
    "USER_NOT_FOUND",
    "Impossible d'identifier le profil Obillz (metadata + email)",
    {
      event_id: eventCtx.eventId,
      event_type: eventCtx.eventType,
      subscription_id: subscription.id,
      customer_id: customerId,
      email: email ? "(présent)" : null,
    }
  );
}

async function syncSubscriptionToProfile(params: {
  stripe: Stripe;
  subscription: Stripe.Subscription;
  eventCtx: StripeEventContext;
  allowEmailFallback: boolean;
  /** Force active même si mapping dit autrement (ex. checkout completed) */
  forceActive?: boolean;
}): Promise<void> {
  const {
    stripe,
    subscription,
    eventCtx,
    allowEmailFallback,
    forceActive,
  } = params;

  // incomplete = paiement pas encore finalisé. Ne pas écrire expired
  // (évite une course avec checkout.session.completed).
  if (!forceActive && subscription.status === "incomplete") {
    logHandler("log", "subscription incomplete — ignore volontaire", {
      event_id: eventCtx.eventId,
      event_type: eventCtx.eventType,
      subscription_id: subscription.id,
      customer_id: customerIdOf(subscription.customer),
    });
    return;
  }

  const userId = await resolveUserIdForSubscription({
    subscription,
    stripe,
    allowEmailFallback,
    eventCtx,
  });

  const customerId = customerIdOf(subscription.customer);
  const priceId = subscriptionPriceId(subscription);
  const { tier, interval } = resolveTierAndInterval({
    priceId,
    metadata: subscription.metadata,
  });
  const decision = mapStripeSubscriptionStatus(subscription.status);
  const active = forceActive ? true : decision.entitled;
  const period = subscriptionPeriod(subscription);

  const logContext = {
    event_id: eventCtx.eventId,
    event_type: eventCtx.eventType,
    user_id: userId,
    customer_id: customerId,
    subscription_id: subscription.id,
    stripe_status: subscription.status,
    mapping: decision.reason,
    sync_active: active,
  };

  logHandler("log", "sync subscription → profile", logContext);

  await syncProfileFromStripe({
    userId,
    billingCycle: interval,
    subscriptionTier: tier,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    active,
    subscriptionStartedAt: period.start,
    subscriptionEndsAt: period.end,
    logContext,
  });
}

export async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventCtx: StripeEventContext
): Promise<void> {
  let subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  let subscription: Stripe.Subscription | null = null;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
    subscriptionId = subscription.id;
  }

  const userId =
    session.client_reference_id ||
    session.metadata?.user_id ||
    subscription?.metadata?.user_id ||
    null;

  const customerId = customerIdOf(session.customer);

  if (!userId) {
    logHandler("error", "checkout.session.completed sans user_id", {
      event_id: eventCtx.eventId,
      event_type: eventCtx.eventType,
      session_id: session.id,
      customer_id: customerId,
      subscription_id: subscriptionId,
    });
    throw new StripeWebhookSyncError(
      "USER_ID_MISSING",
      "checkout.session.completed sans client_reference_id ni metadata.user_id",
      {
        event_id: eventCtx.eventId,
        session_id: session.id,
        customer_id: customerId,
        subscription_id: subscriptionId,
      }
    );
  }

  if (!subscription) {
    logHandler("error", "checkout.session.completed sans subscription", {
      event_id: eventCtx.eventId,
      session_id: session.id,
      user_id: userId,
    });
    throw new StripeWebhookSyncError(
      "SUBSCRIPTION_MISSING",
      "checkout.session.completed sans subscription ID",
      {
        event_id: eventCtx.eventId,
        session_id: session.id,
        user_id: userId,
      }
    );
  }

  const priceId = subscriptionPriceId(subscription);
  const { tier, interval } = resolveTierAndInterval({
    priceId,
    metadata: session.metadata ?? subscription.metadata,
    fallbackTier:
      (session.metadata?.subscription_tier as SubscriptionTier) || "standard",
    fallbackInterval:
      (session.metadata?.billing_interval as StripeBillingInterval) ||
      "yearly",
  });

  const decision = mapStripeSubscriptionStatus(subscription.status);
  // Checkout réussi : activer si session payée ou statut Stripe déjà entitled.
  const shouldActivate =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required" ||
    decision.entitled;

  if (!shouldActivate) {
    logHandler("error", "checkout.session.completed non activable", {
      event_id: eventCtx.eventId,
      session_id: session.id,
      user_id: userId,
      payment_status: session.payment_status,
      stripe_status: subscription.status,
    });
    throw new StripeWebhookSyncError(
      "CHECKOUT_NOT_PAID",
      "checkout.session.completed sans paiement exploitable",
      {
        event_id: eventCtx.eventId,
        session_id: session.id,
        user_id: userId,
        payment_status: session.payment_status,
        stripe_status: subscription.status,
      }
    );
  }

  const period = subscriptionPeriod(subscription);
  const logContext = {
    event_id: eventCtx.eventId,
    event_type: eventCtx.eventType,
    session_id: session.id,
    user_id: userId,
    customer_id: customerId,
    subscription_id: subscription.id,
    payment_status: session.payment_status,
    stripe_status: subscription.status,
  };

  logHandler("log", "checkout.session.completed", logContext);

  await syncProfileFromStripe({
    userId,
    billingCycle: interval,
    subscriptionTier: tier,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    active: true,
    subscriptionStartedAt: period.start,
    subscriptionEndsAt: period.end,
    logContext,
  });
}

export async function handleSubscriptionCreated(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventCtx: StripeEventContext
): Promise<void> {
  // Filet de sécurité : email fallback autorisé si metadata absente
  await syncSubscriptionToProfile({
    stripe,
    subscription,
    eventCtx,
    allowEmailFallback: true,
  });
}

export async function handleSubscriptionUpdated(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventCtx: StripeEventContext
): Promise<void> {
  await syncSubscriptionToProfile({
    stripe,
    subscription,
    eventCtx,
    allowEmailFallback: false,
  });
}

export async function handleSubscriptionDeleted(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventCtx: StripeEventContext
): Promise<void> {
  const userId = await resolveUserIdForSubscription({
    subscription,
    stripe,
    allowEmailFallback: false,
    eventCtx,
  });

  const customerId = customerIdOf(subscription.customer);
  const priceId = subscriptionPriceId(subscription);
  const { tier, interval } = resolveTierAndInterval({
    priceId,
    metadata: subscription.metadata,
  });
  const period = subscriptionPeriod(subscription);

  const logContext = {
    event_id: eventCtx.eventId,
    event_type: eventCtx.eventType,
    user_id: userId,
    customer_id: customerId,
    subscription_id: subscription.id,
  };

  logHandler("log", "subscription.deleted → expired (IDs conservés)", logContext);

  await syncProfileFromStripe({
    userId,
    billingCycle: interval,
    subscriptionTier: tier,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    active: false,
    subscriptionStartedAt: period.start,
    subscriptionEndsAt: period.end,
    logContext,
  });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  };
  const sub = legacy.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) return sub.id;

  // API récente : parent.subscription_details / lines
  const parent = (
    invoice as Stripe.Invoice & {
      parent?: {
        subscription_details?: { subscription?: string | { id: string } };
      } | null;
    }
  ).parent;
  const nested = parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && "id" in nested) return nested.id;

  return null;
}

/**
 * Filet de réconciliation idempotent après paiement réussi.
 */
export async function handleInvoicePaymentSucceeded(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  eventCtx: StripeEventContext
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  const customerId = customerIdOf(invoice.customer);

  if (!subscriptionId) {
    // Facture one-off hors abonnement — ignore volontairement (sûr)
    logHandler("log", "invoice.payment_succeeded ignoré (pas de subscription)", {
      event_id: eventCtx.eventId,
      event_type: eventCtx.eventType,
      invoice_id: invoice.id,
      customer_id: customerId,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncSubscriptionToProfile({
    stripe,
    subscription,
    eventCtx,
    allowEmailFallback: true,
  });
}

/**
 * Ne bloque PAS immédiatement l'accès.
 * Stripe retente le paiement ; le statut passe souvent à past_due puis
 * éventuellement unpaid via customer.subscription.updated.
 * Ici : log + no-op d'accès (idempotent, sûr).
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventCtx: StripeEventContext
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  const customerId = customerIdOf(invoice.customer);

  logHandler("warn", "invoice.payment_failed — accès non révoqué (grace Stripe)", {
    event_id: eventCtx.eventId,
    event_type: eventCtx.eventType,
    invoice_id: invoice.id,
    customer_id: customerId,
    subscription_id: subscriptionId,
    attempt_count: invoice.attempt_count ?? null,
  });

  // Volontairement aucune expiration ici.
  // subscription.updated (past_due → unpaid) pilote le retrait d'accès.
}
