import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEMBERSHIP_STRIPE_PURPOSE } from "./payment-method";

export async function markMembershipPaidFromStripe(params: {
  documentId: string;
  clubId: string;
  expectedAccountId: string | null;
  eventAccountId: string | null;
  sessionId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  amountCents: number;
}): Promise<void> {
  if (
    params.expectedAccountId &&
    params.eventAccountId &&
    params.expectedAccountId !== params.eventAccountId
  ) {
    throw new Error("Session cotisation / compte Connect incohérents");
  }

  const supabase = createAdminClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select(
      "id, user_id, type, status, payment_method, total_ttc, stripe_payment_intent_id, stripe_checkout_session_id"
    )
    .eq("id", params.documentId)
    .eq("user_id", params.clubId)
    .eq("type", "quote")
    .maybeSingle();

  if (error || !document) {
    throw new Error("Cotisation introuvable pour le paiement Stripe");
  }
  if (document.payment_method !== "stripe") {
    throw new Error("Cotisation non marquée comme paiement Stripe");
  }

  if (
    document.status === "accepte" &&
    document.stripe_payment_intent_id &&
    params.paymentIntentId &&
    document.stripe_payment_intent_id === params.paymentIntentId
  ) {
    return;
  }
  if (document.status === "accepte") {
    return;
  }

  const paidAt = new Date().toISOString().slice(0, 10);
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: "accepte",
      date_paiement: paidAt,
      stripe_checkout_session_id: params.sessionId || document.stripe_checkout_session_id,
      stripe_payment_intent_id: params.paymentIntentId,
      stripe_charge_id: params.chargeId,
    })
    .eq("id", document.id)
    .eq("user_id", params.clubId)
    .neq("status", "accepte");

  if (updateError) throw updateError;
}

export function isMembershipStripeEvent(event: Stripe.Event): boolean {
  const obj = event.data.object as {
    metadata?: Record<string, string> | null;
  };
  return obj?.metadata?.obillz_purpose === MEMBERSHIP_STRIPE_PURPOSE;
}

export async function handleMembershipCheckoutSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  connectedAccount: string | null
): Promise<void> {
  if (session.metadata?.obillz_purpose !== MEMBERSHIP_STRIPE_PURPOSE) return;

  const clubId = session.metadata?.club_id;
  const documentId = session.metadata?.document_id;
  if (!clubId || !documentId) {
    throw new Error("Metadata cotisation manquante sur la session Checkout");
  }

  const paid =
    session.payment_status === "paid" ||
    event.type === "checkout.session.async_payment_succeeded";
  if (!paid) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await markMembershipPaidFromStripe({
    documentId,
    clubId,
    expectedAccountId: session.metadata.connected_account_id || null,
    eventAccountId: connectedAccount,
    sessionId: session.id,
    paymentIntentId,
    chargeId: null,
    amountCents: session.amount_total ?? 0,
  });
}
