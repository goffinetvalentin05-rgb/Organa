import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MEMBERSHIP_STRIPE_PURPOSE,
  isMembershipPaidStatus,
  membershipPurposeFromMetadata,
} from "./payment-method";

const MEMBERSHIP_DOC_SELECT =
  "id, user_id, type, status, payment_method, total_ttc, stripe_payment_intent_id, stripe_checkout_session_id";

type MembershipDocumentRow = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  payment_method: string | null;
  total_ttc: number | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
};

function logMembership(message: string, payload: Record<string, unknown>) {
  console.log(`[MEMBERSHIP][stripe] ${message} ${JSON.stringify(payload)}`);
}

function metadataPreview(metadata?: Record<string, string> | null) {
  if (!metadata) return null;
  return {
    obillz_purpose: metadata.obillz_purpose ?? null,
    type: metadata.type ?? null,
    document_id: metadata.document_id ?? null,
    club_id: metadata.club_id ?? null,
    connected_account_id: metadata.connected_account_id ?? null,
  };
}

function chargeIdFromExpanded(
  paymentIntent: Stripe.PaymentIntent | string | null | undefined
): string | null {
  if (!paymentIntent || typeof paymentIntent === "string") return null;
  const charge = paymentIntent.latest_charge;
  if (typeof charge === "string") return charge;
  if (charge && typeof charge === "object" && "id" in charge) {
    return charge.id;
  }
  return null;
}

function paymentIntentIdOf(
  paymentIntent: Stripe.PaymentIntent | string | null | undefined
): string | null {
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

export function isMembershipCheckoutSession(
  session: Pick<Stripe.Checkout.Session, "metadata">
): boolean {
  return membershipPurposeFromMetadata(session.metadata);
}

export function isMembershipStripeEvent(event: Stripe.Event): boolean {
  const obj = event.data.object as {
    metadata?: Record<string, string> | null;
  };
  return membershipPurposeFromMetadata(obj?.metadata);
}

export async function hydrateStripeCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  connectedAccount: string | null
): Promise<Stripe.Checkout.Session> {
  const accountId =
    connectedAccount || session.metadata?.connected_account_id || null;
  const retrieve = (acct: string | null) =>
    stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ["payment_intent", "payment_intent.latest_charge"] },
      acct ? { stripeAccount: acct } : undefined
    );

  try {
    return await retrieve(accountId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "hydrate_failed";
    if (accountId) {
      try {
        return await retrieve(null);
      } catch {
        logMembership("hydrate_failed", {
          session_id: session.id,
          event_account: connectedAccount,
          error: message,
        });
        return session;
      }
    }
    logMembership("hydrate_failed", {
      session_id: session.id,
      event_account: connectedAccount,
      error: message,
    });
    return session;
  }
}

export async function findMembershipDocument(params: {
  documentId?: string | null;
  clubId?: string | null;
  sessionId?: string | null;
}): Promise<MembershipDocumentRow | null> {
  const supabase = createAdminClient();

  if (params.documentId) {
    let query = supabase
      .from("documents")
      .select(MEMBERSHIP_DOC_SELECT)
      .eq("id", params.documentId)
      .eq("type", "quote");
    if (params.clubId) query = query.eq("user_id", params.clubId);
    const { data, error } = await query.maybeSingle();
    if (error) {
      logMembership("document_lookup_error", {
        document_id: params.documentId,
        club_id: params.clubId ?? null,
        error: error.message,
      });
    } else if (data) {
      return data as MembershipDocumentRow;
    }
  }

  if (params.sessionId) {
    const { data, error } = await supabase
      .from("documents")
      .select(MEMBERSHIP_DOC_SELECT)
      .eq("stripe_checkout_session_id", params.sessionId)
      .eq("type", "quote")
      .maybeSingle();
    if (error) {
      logMembership("document_lookup_by_session_error", {
        session_id: params.sessionId,
        error: error.message,
      });
    } else if (data) {
      return data as MembershipDocumentRow;
    }
  }

  return null;
}

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
    logMembership("account_mismatch", {
      document_id: params.documentId,
      expected_account: params.expectedAccountId,
      event_account: params.eventAccountId,
    });
    throw new Error("Session cotisation / compte Connect incohérents");
  }

  const document = await findMembershipDocument({
    documentId: params.documentId,
    clubId: params.clubId,
    sessionId: params.sessionId,
  });

  if (!document) {
    logMembership("document_missing", {
      document_id: params.documentId,
      club_id: params.clubId,
      session_id: params.sessionId,
    });
    throw new Error("Cotisation introuvable pour le paiement Stripe");
  }

  logMembership("document_before_update", {
    document_id: document.id,
    club_id: document.user_id,
    status: document.status,
    payment_method: document.payment_method,
    stripe_checkout_session_id: document.stripe_checkout_session_id,
    stripe_payment_intent_id: document.stripe_payment_intent_id,
  });

  if (isMembershipPaidStatus(document.status)) {
    logMembership("already_paid", {
      document_id: document.id,
      status: document.status,
    });
    return;
  }

  const paidAt = new Date().toISOString().slice(0, 10);
  const supabase = createAdminClient();
  const { data: updated, error: updateError } = await supabase
    .from("documents")
    .update({
      status: "accepte",
      date_paiement: paidAt,
      stripe_checkout_session_id:
        params.sessionId || document.stripe_checkout_session_id,
      stripe_payment_intent_id: params.paymentIntentId,
      stripe_charge_id: params.chargeId,
    })
    .eq("id", document.id)
    .eq("user_id", document.user_id)
    .neq("status", "accepte")
    .select(
      "id, status, date_paiement, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id"
    )
    .maybeSingle();

  if (updateError) {
    logMembership("update_error", {
      document_id: document.id,
      error: updateError.message,
      code: updateError.code ?? null,
    });
    throw updateError;
  }

  logMembership("update_result", {
    document_id: document.id,
    updated: Boolean(updated),
    status: updated?.status ?? null,
    date_paiement: updated?.date_paiement ?? null,
    stripe_checkout_session_id: updated?.stripe_checkout_session_id ?? null,
    stripe_payment_intent_id: updated?.stripe_payment_intent_id ?? null,
    stripe_charge_id: updated?.stripe_charge_id ?? null,
    amount_cents: params.amountCents,
  });
}

export async function handleMembershipCheckoutSession(
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

  logMembership("checkout_event", {
    event_id: event.id,
    event_type: event.type,
    event_account: connectedAccount,
    session_id: hydrated.id,
    payment_status: hydrated.payment_status,
    metadata: metadataPreview(hydrated.metadata),
  });

  const document = await findMembershipDocument({
    documentId: hydrated.metadata?.document_id || hydrated.client_reference_id,
    clubId: hydrated.metadata?.club_id,
    sessionId: hydrated.id,
  });

  logMembership("document_resolved", {
    event_id: event.id,
    session_id: hydrated.id,
    document_id: document?.id ?? hydrated.metadata?.document_id ?? null,
    found: Boolean(document),
    status: document?.status ?? null,
  });

  if (!document) {
    throw new Error("Metadata cotisation manquante sur la session Checkout");
  }

  const paid =
    hydrated.payment_status === "paid" ||
    event.type === "checkout.session.async_payment_succeeded";
  if (!paid) {
    logMembership("checkout_not_paid_yet", {
      event_id: event.id,
      session_id: hydrated.id,
      payment_status: hydrated.payment_status,
    });
    return;
  }

  await markMembershipPaidFromStripe({
    documentId: document.id,
    clubId: document.user_id,
    expectedAccountId: hydrated.metadata?.connected_account_id || null,
    eventAccountId: connectedAccount,
    sessionId: hydrated.id,
    paymentIntentId: paymentIntentIdOf(hydrated.payment_intent),
    chargeId: chargeIdFromExpanded(hydrated.payment_intent),
    amountCents: hydrated.amount_total ?? 0,
  });
}

export async function handleMembershipPaymentIntent(
  event: Stripe.Event,
  paymentIntent: Stripe.PaymentIntent,
  connectedAccount: string | null
): Promise<void> {
  logMembership("payment_intent_event", {
    event_id: event.id,
    event_type: event.type,
    event_account: connectedAccount,
    payment_intent_id: paymentIntent.id,
    metadata: metadataPreview(paymentIntent.metadata),
  });

  if (!membershipPurposeFromMetadata(paymentIntent.metadata)) return;

  const documentId = paymentIntent.metadata?.document_id;
  const clubId = paymentIntent.metadata?.club_id;
  if (!documentId || !clubId) {
    throw new Error("Metadata cotisation manquante sur le PaymentIntent");
  }

  await markMembershipPaidFromStripe({
    documentId,
    clubId,
    expectedAccountId: paymentIntent.metadata.connected_account_id || null,
    eventAccountId: connectedAccount,
    sessionId: paymentIntent.metadata.checkout_session_id || null,
    paymentIntentId: paymentIntent.id,
    chargeId: chargeIdFromExpanded(paymentIntent),
    amountCents: paymentIntent.amount ?? 0,
  });
}

export { MEMBERSHIP_STRIPE_PURPOSE };
