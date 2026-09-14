import type Stripe from "stripe";
import { SUPPORTERS_STRIPE_PURPOSE } from "./types";
import { activateSupporterFromPayment, markSupporterCheckoutTerminal } from "./activate";
import { hydrateStripeCheckoutSession } from "@/lib/quotes/stripe-membership";

export function isSupportersCheckoutSession(
  session: Pick<Stripe.Checkout.Session, "metadata">
): boolean {
  return session.metadata?.obillz_purpose === SUPPORTERS_STRIPE_PURPOSE;
}

export function isSupportersStripeEvent(event: Stripe.Event): boolean {
  const obj = event.data.object as {
    metadata?: Record<string, string> | null;
  };
  return obj?.metadata?.obillz_purpose === SUPPORTERS_STRIPE_PURPOSE;
}

export async function handleSupporterCheckoutSession(
  stripe: Stripe,
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  connectedAccount: string | null
): Promise<void> {
  const hydrated = await hydrateStripeCheckoutSession(
    stripe,
    session,
    connectedAccount
  );

  const clubId = hydrated.metadata?.club_id;
  const supporterId = hydrated.metadata?.supporter_id;
  if (!clubId || !supporterId) {
    throw new Error("Metadata supporters manquante sur la session Checkout");
  }
  if (hydrated.metadata?.connected_account_id && connectedAccount) {
    if (hydrated.metadata.connected_account_id !== connectedAccount) {
      throw new Error("Session Checkout / compte Connect incohérents");
    }
  }

  const paid =
    hydrated.payment_status === "paid" ||
    event.type === "checkout.session.async_payment_succeeded";
  if (!paid) return;

  const paymentIntentId =
    typeof hydrated.payment_intent === "string"
      ? hydrated.payment_intent
      : hydrated.payment_intent?.id ?? null;

  await activateSupporterFromPayment({
    supporterId,
    clubId,
    expectedAccountId: hydrated.metadata?.connected_account_id || null,
    eventAccountId: connectedAccount,
    sessionId: hydrated.id,
    paymentIntentId,
    amountCents: hydrated.amount_total ?? 0,
  });
}

export async function handleSupporterCheckoutTerminal(
  session: Stripe.Checkout.Session,
  status: "cancelled" | "expired"
): Promise<void> {
  if (!isSupportersCheckoutSession(session)) return;
  await markSupporterCheckoutTerminal({ sessionId: session.id, status });
}
