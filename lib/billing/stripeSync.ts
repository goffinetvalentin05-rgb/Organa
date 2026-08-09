/**
 * Synchronisation profil Supabase ↔ abonnement Stripe (webhooks, service role).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "./teamPlan";
import type { StripeBillingInterval } from "./stripePrices";

export class StripeWebhookSyncError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  /** true = données irrécupérables : ack Stripe (2xx), pas de retry */
  readonly permanent: boolean;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    options?: { permanent?: boolean }
  ) {
    super(message);
    this.name = "StripeWebhookSyncError";
    this.code = code;
    this.details = details;
    this.permanent = options?.permanent ?? isPermanentSyncCode(code);
  }
}

/** Codes où un retry Stripe ne peut pas résoudre le problème tout seul. */
export const PERMANENT_SYNC_CODES = new Set([
  "USER_ID_MISSING",
  "AMBIGUOUS_EMAIL",
  "SUBSCRIPTION_MISSING",
  "CHECKOUT_NOT_PAID",
]);

export function isPermanentSyncCode(code: string): boolean {
  return PERMANENT_SYNC_CODES.has(code);
}

export interface StripeSubscriptionSyncInput {
  userId: string;
  billingCycle: StripeBillingInterval;
  subscriptionTier: SubscriptionTier;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  active: boolean;
  /** Dates Stripe (ISO) — sinon calcul local */
  subscriptionStartedAt?: string | null;
  subscriptionEndsAt?: string | null;
  /** Contexte log (event.id, etc.) */
  logContext?: Record<string, unknown>;
}

function logSync(
  level: "log" | "warn" | "error",
  message: string,
  ctx?: Record<string, unknown>
) {
  const payload = ctx ? ` ${JSON.stringify(ctx)}` : "";
  console[level](`[BILLING][stripeSync] ${message}${payload}`);
}

function computeLocalPeriodEnds(
  billingCycle: StripeBillingInterval,
  from: Date
): Date {
  const endsAt = new Date(from);
  if (billingCycle === "yearly") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1);
  }
  return endsAt;
}

/**
 * Met à jour le profil club (owner) après un événement Stripe.
 * Vérifie qu'au moins une ligne est modifiée — sinon throw.
 */
export async function syncProfileFromStripe(
  input: StripeSubscriptionSyncInput
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();
  const ctx = {
    user_id: input.userId,
    ...input.logContext,
  };

  if (input.active) {
    const startedAt = input.subscriptionStartedAt
      ? new Date(input.subscriptionStartedAt)
      : now;
    const endsAt = input.subscriptionEndsAt
      ? new Date(input.subscriptionEndsAt)
      : computeLocalPeriodEnds(input.billingCycle, startedAt);

    const updateData: Record<string, unknown> = {
      subscription_status: "active",
      billing_cycle: input.billingCycle,
      subscription_started_at: startedAt.toISOString(),
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

    const { data, error } = await admin
      .from("profiles")
      .update(updateData)
      .eq("user_id", input.userId)
      .select("user_id");

    if (error) {
      logSync("error", "Activation échouée", { ...ctx, error: error.message });
      throw new StripeWebhookSyncError(
        "SUPABASE_UPDATE_FAILED",
        "Erreur lors de l'activation de l'abonnement",
        { ...ctx, error: error.message }
      );
    }

    if (!data?.length) {
      logSync("error", "Activation: 0 ligne touchée", ctx);
      throw new StripeWebhookSyncError(
        "PROFILE_NOT_FOUND",
        `Aucun profil profiles pour user_id=${input.userId}`,
        ctx
      );
    }

    logSync("log", "Activé", {
      ...ctx,
      tier: input.subscriptionTier,
      cycle: input.billingCycle,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      stripe_customer_id: input.stripeCustomerId ?? null,
    });
    return;
  }

  // Expiration : on conserve les IDs Stripe (traçabilité) et subscription_tier
  const expireData: Record<string, unknown> = {
    subscription_status: "expired",
    billing_cycle: null,
    plan: "free",
  };

  // Ré-affirmer les IDs s'ils sont fournis (idempotence / backfill partiel)
  if (input.stripeSubscriptionId) {
    expireData.stripe_subscription_id = input.stripeSubscriptionId;
  }
  if (input.stripeCustomerId) {
    expireData.stripe_customer_id = input.stripeCustomerId;
  }

  const { data, error } = await admin
    .from("profiles")
    .update(expireData)
    .eq("user_id", input.userId)
    .select("user_id");

  if (error) {
    logSync("error", "Expiration échouée", { ...ctx, error: error.message });
    throw new StripeWebhookSyncError(
      "SUPABASE_UPDATE_FAILED",
      "Erreur lors de la désactivation de l'abonnement",
      { ...ctx, error: error.message }
    );
  }

  if (!data?.length) {
    logSync("error", "Expiration: 0 ligne touchée", ctx);
    throw new StripeWebhookSyncError(
      "PROFILE_NOT_FOUND",
      `Aucun profil profiles pour user_id=${input.userId}`,
      ctx
    );
  }

  logSync("log", "Expiré (IDs Stripe conservés)", {
    ...ctx,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
  });
}

/**
 * Trouve le user_id Obillz à partir d'un abonnement / customer Stripe.
 * Ne fait PAS de fallback email (voir findUserIdByCustomerEmail).
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

/**
 * Fallback email non ambigu uniquement.
 * 1) Auth Admin ?email= (exactement 1 user)
 * 2) profiles.company_email (exactement 1 profil)
 */
export async function findUserIdByCustomerEmail(
  email: string | null | undefined
): Promise<string | null> {
  if (!email?.trim()) return null;
  const normalized = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new StripeWebhookSyncError(
      "ENV_MISSING",
      "Supabase admin non configuré pour lookup email"
    );
  }

  const url = new URL(`${supabaseUrl}/auth/v1/admin/users`);
  url.searchParams.set("email", normalized);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });

  if (res.ok) {
    const body = (await res.json()) as {
      users?: Array<{ id: string; email?: string }>;
    };
    const users = (body.users || []).filter(
      (u) => u.email?.toLowerCase() === normalized
    );
    if (users.length === 1) return users[0].id;
    if (users.length > 1) {
      throw new StripeWebhookSyncError(
        "AMBIGUOUS_EMAIL",
        `Plusieurs auth.users pour email=${normalized}`,
        { email: normalized, count: users.length }
      );
    }
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("company_email", normalized);

  if (error) {
    throw new StripeWebhookSyncError(
      "SUPABASE_LOOKUP_FAILED",
      error.message,
      { email: normalized }
    );
  }

  const unique = [...new Set((profiles || []).map((p) => p.user_id))];
  if (unique.length === 1) return unique[0];
  if (unique.length > 1) {
    throw new StripeWebhookSyncError(
      "AMBIGUOUS_EMAIL",
      `Plusieurs profiles.company_email pour email=${normalized}`,
      { email: normalized, count: unique.length }
    );
  }

  return null;
}
