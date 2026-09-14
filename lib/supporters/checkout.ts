import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClubStripeAccount, getStripe } from "@/lib/shop/stripe-connect";
import { isPaymentReady } from "@/lib/shop/payment-provider";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";
import { computeApplicationFeeCents } from "@/lib/shop/money";
import { SUPPORTERS_STRIPE_PURPOSE, type OfferRow } from "./types";
import { OFFER_SELECT } from "./types";
import { mapOffer } from "./map";
import { parseCheckoutCustomer } from "./input";
import { resolveClubIdByPublicSlug } from "./slug";
import { isSupporterActive, offerAllowsCheckout } from "./status";
import { durationLabel } from "./format";
import { createSupporterToken } from "./tokens";

async function countOccupiedSlots(clubId: string, offerId: string): Promise<number> {
  const supabase = createAdminClient();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("supporters")
    .select("id, status, start_date, end_date, created_at")
    .eq("club_id", clubId)
    .eq("supporter_offer_id", offerId)
    .in("status", ["pending", "active"]);

  return (data || []).filter((row) => {
    if (row.status === "active") {
      return isSupporterActive({
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
      });
    }
    return row.created_at >= hourAgo;
  }).length;
}

export async function createSupporterCheckoutSession(params: {
  slug: string;
  body: unknown;
}): Promise<{ url: string; supporterId: string } | { error: string; status: number }> {
  const customer = parseCheckoutCustomer(params.body);
  if ("error" in customer) return { error: customer.error, status: 400 };

  const clubId = await resolveClubIdByPublicSlug(params.slug);
  if (!clubId) return { error: "Page supporters introuvable.", status: 404 };

  const supabase = createAdminClient();
  const { data: offerRow, error: offerError } = await supabase
    .from("supporter_offers")
    .select(OFFER_SELECT)
    .eq("id", customer.offerId)
    .eq("club_id", clubId)
    .is("deleted_at", null)
    .maybeSingle();

  if (offerError || !offerRow) {
    return { error: "Offre introuvable.", status: 404 };
  }

  const offer = mapOffer(offerRow as OfferRow);
  const checkoutOk = offerAllowsCheckout(offer);
  if (!checkoutOk.ok) return { error: checkoutOk.error, status: 400 };

  if (offer.maxSupporters != null) {
    const occupied = await countOccupiedSlots(clubId, offer.id);
    if (occupied >= offer.maxSupporters) {
      return { error: "Cette offre est complète.", status: 409 };
    }
  }

  const account = await getClubStripeAccount(supabase, clubId);
  if (!isPaymentReady(account) || !account?.providerAccountId) {
    return { error: "Paiements du club non configurés.", status: 400 };
  }

  const amountCents = offer.priceCents;
  if (!amountCents || amountCents < 100) {
    return { error: "Montant d’offre invalide.", status: 400 };
  }

  const { data: supporter, error: insertError } = await supabase
    .from("supporters")
    .insert({
      club_id: clubId,
      supporter_offer_id: offer.id,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      public_name_enabled: customer.publicNameEnabled,
      status: "pending",
      currency: "CHF",
      stripe_connected_account_id: account.providerAccountId,
      card_token: createSupporterToken(),
      qr_token: createSupporterToken(),
    })
    .select("id")
    .single();

  if (insertError || !supporter) {
    return {
      error: insertError?.message || "Impossible de créer l’adhésion.",
      status: 500,
    };
  }

  const stripe = getStripe();
  const base = appBaseUrl();
  const successUrl = `${base}/club/${params.slug}/supporters/succes?s=${supporter.id}`;
  const cancelUrl = `${base}/club/${params.slug}/supporters/checkout?offer=${offer.id}&cancelled=1`;
  const applicationFee = computeApplicationFeeCents(amountCents);
  const label = `${offer.name} — ${durationLabel(offer)}`;

  const metadata = {
    obillz_purpose: SUPPORTERS_STRIPE_PURPOSE,
    club_id: clubId,
    supporter_id: supporter.id,
    offer_id: offer.id,
    connected_account_id: account.providerAccountId,
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_email: customer.email,
    locale: "fr",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: supporter.id,
    metadata,
    payment_intent_data: {
      metadata,
      ...(applicationFee > 0 ? { application_fee_amount: applicationFee } : {}),
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

  try {
    const session = await stripe.checkout.sessions.create(sessionParams, {
      stripeAccount: account.providerAccountId,
    });
    if (!session.url) throw new Error("Session Stripe sans URL");

    await supabase
      .from("supporters")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .eq("id", supporter.id)
      .eq("club_id", clubId);

    return { url: session.url, supporterId: supporter.id };
  } catch (err) {
    await supabase
      .from("supporters")
      .update({ status: "cancelled" })
      .eq("id", supporter.id)
      .eq("club_id", clubId);
    const message = err instanceof Error ? err.message : "Erreur Stripe Checkout.";
    console.error("[SUPPORTERS][checkout]", err);
    return { error: message, status: 502 };
  }
}
