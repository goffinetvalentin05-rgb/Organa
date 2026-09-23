import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapStripeSubscriptionStatus } from "./stripeStatusMap";
import { isAccountingPriceId } from "./stripePrices";

type SubscriptionLike = {
  metadata?: Stripe.Metadata | null;
  status?: Stripe.Subscription.Status;
  items?: { data?: Array<{ price?: string | Stripe.Price | null }> };
  current_period_end?: number;
};

export function isAccountingAddonMetadata(
  metadata?: Stripe.Metadata | Record<string, string> | null
): boolean {
  return metadata?.obillz_addon === "accounting";
}

function itemPriceId(price: string | Stripe.Price | null | undefined): string | null {
  if (!price) return null;
  if (typeof price === "string") return price;
  return price.id ?? null;
}

/**
 * Abonnement distinct de la formule Obillz.
 * Un checkout Comptabilité ne doit jamais remplacer l'abonnement principal.
 */
export function isAccountingAddonSubscription(
  subscription: SubscriptionLike,
  extraMetadata?: Stripe.Metadata | Record<string, string> | null
): boolean {
  if (isAccountingAddonMetadata(extraMetadata)) return true;
  if (isAccountingAddonMetadata(subscription.metadata)) return true;
  const priceIds = (subscription.items?.data ?? [])
    .map((item) => itemPriceId(item.price))
    .filter((id): id is string => Boolean(id));
  return priceIds.length > 0 && priceIds.every((id) => isAccountingPriceId(id));
}

function periodEndIso(subscription: SubscriptionLike): string | null {
  const item = subscription.items?.data?.[0] as { current_period_end?: number } | undefined;
  const unix = subscription.current_period_end ?? item?.current_period_end;
  if (!unix || !Number.isFinite(unix)) return null;
  return new Date(unix * 1000).toISOString();
}

export async function syncAccountingAddon(params: {
  clubId: string;
  subscription: Stripe.Subscription;
  stripeCustomerId: string | null;
}): Promise<void> {
  const decision = mapStripeSubscriptionStatus(params.subscription.status);
  const status = !decision.entitled
    ? "canceled"
    : params.subscription.status === "past_due"
      ? "past_due"
      : "active";
  const priceId = itemPriceId(params.subscription.items?.data?.[0]?.price);

  const admin = createAdminClient();
  const { error } = await admin.from("club_addons").upsert(
    {
      club_id: params.clubId,
      addon_key: "accounting",
      status,
      stripe_subscription_id: params.subscription.id,
      stripe_customer_id: params.stripeCustomerId,
      stripe_price_id: priceId,
      current_period_end: periodEndIso(params.subscription),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "club_id,addon_key" }
  );
  if (error) throw error;
}
