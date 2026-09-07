import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClubStripeAccount, getStripe } from "@/lib/shop/stripe-connect";
import { isPaymentReady } from "@/lib/shop/payment-provider";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";
import { MEMBERSHIP_STRIPE_PURPOSE, francsToStripeCents } from "./payment-method";

export async function createMembershipCheckoutSession(params: {
  token: string;
}): Promise<{ url: string } | { error: string; status: number }> {
  const supabase = createAdminClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select(
      "id, user_id, type, status, title, numero, total_ttc, payment_method, client_id, client:clients(email, nom)"
    )
    .eq("payment_token", params.token)
    .eq("type", "quote")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !document) {
    return { error: "Cotisation introuvable.", status: 404 };
  }
  if (document.payment_method !== "stripe") {
    return { error: "Cette cotisation ne se paie pas en ligne.", status: 400 };
  }
  if (document.status === "accepte") {
    return { error: "Cette cotisation est déjà payée.", status: 409 };
  }
  if (document.status === "refuse") {
    return { error: "Cette cotisation est annulée.", status: 400 };
  }

  const clubId = document.user_id as string;
  const amountCents = francsToStripeCents(document.total_ttc);
  if (!amountCents) {
    return { error: "Montant de cotisation invalide.", status: 400 };
  }

  const account = await getClubStripeAccount(supabase, clubId);
  if (!isPaymentReady(account) || !account?.providerAccountId) {
    return { error: "Paiements du club non configurés.", status: 400 };
  }

  const client = Array.isArray(document.client) ? document.client[0] : document.client;
  const customerEmail =
    client && typeof client === "object" && "email" in client
      ? String((client as { email?: string | null }).email || "")
      : "";

  const stripe = getStripe();
  const base = appBaseUrl();
  const successUrl = `${base}/cotisation/${params.token}/succes`;
  const cancelUrl = `${base}/cotisation/${params.token}?cancelled=1`;
  const label = String(document.title || document.numero || "Cotisation");

  const metadata = {
    obillz_purpose: MEMBERSHIP_STRIPE_PURPOSE,
    club_id: clubId,
    document_id: document.id,
    connected_account_id: account.providerAccountId,
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    locale: "fr",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: document.id,
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "chf",
          unit_amount: amountCents,
          product_data: { name: label },
        },
      },
    ],
  };
  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams, {
    stripeAccount: account.providerAccountId,
  });

  if (!session.url) {
    return { error: "Session Stripe sans URL", status: 500 };
  }

  await supabase
    .from("documents")
    .update({
      stripe_checkout_session_id: session.id,
    })
    .eq("id", document.id)
    .eq("user_id", clubId);

  return { url: session.url };
}
