import { createAdminClient } from "@/lib/supabase/admin";
import type { OfferRow, SupporterRow } from "./types";
import { OFFER_SELECT, SUPPORTER_SELECT } from "./types";
import { computeValidityPeriod } from "./status";
import { createSupporterToken } from "./tokens";
import { sendSupporterWelcomeEmail } from "./email";

export async function activateSupporterFromPayment(params: {
  supporterId: string;
  clubId: string;
  expectedAccountId: string | null;
  eventAccountId: string | null;
  sessionId: string | null;
  paymentIntentId: string | null;
  amountCents: number;
}): Promise<void> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("supporters")
    .select(SUPPORTER_SELECT)
    .eq("id", params.supporterId)
    .eq("club_id", params.clubId)
    .maybeSingle();

  if (error || !row) {
    throw new Error("Supporter introuvable pour le paiement");
  }
  const supporter = row as SupporterRow;

  if (
    params.expectedAccountId &&
    params.eventAccountId &&
    params.expectedAccountId !== params.eventAccountId
  ) {
    throw new Error("Compte Stripe connecté incohérent (multi-tenant)");
  }
  if (
    supporter.stripe_connected_account_id &&
    params.eventAccountId &&
    supporter.stripe_connected_account_id !== params.eventAccountId
  ) {
    throw new Error("L’adhésion n’appartient pas à ce compte Stripe");
  }

  if (supporter.status === "cancelled") {
    console.warn("[SUPPORTERS][activate] skipped cancelled", supporter.id);
    return;
  }

  if (supporter.status === "active" && supporter.supporter_number) {
    if (!supporter.emails_sent_at) {
      await sendSupporterWelcomeEmail(supporter.id).catch((err) => {
        console.error("[SUPPORTERS][email] retry after active", err);
      });
    }
    return;
  }

  const { data: offerRow, error: offerError } = await supabase
    .from("supporter_offers")
    .select(OFFER_SELECT)
    .eq("id", supporter.supporter_offer_id)
    .eq("club_id", params.clubId)
    .maybeSingle();

  if (offerError || !offerRow) {
    throw new Error("Offre introuvable pour l’activation supporter");
  }
  const offer = offerRow as OfferRow;
  const validity = computeValidityPeriod({
    durationType: offer.duration_type,
    offerStartDate: offer.start_date,
    offerEndDate: offer.end_date,
  });

  let supporterNumber = supporter.supporter_number;
  if (!supporterNumber) {
    const { data: nextNumber, error: numError } = await supabase.rpc(
      "next_supporter_number",
      { p_club_id: params.clubId }
    );
    if (numError || typeof nextNumber !== "number") {
      throw new Error(numError?.message || "Impossible d’attribuer un numéro supporter");
    }
    supporterNumber = nextNumber;
  }

  const cardToken = supporter.card_token || createSupporterToken();
  const qrToken = supporter.qr_token || createSupporterToken();
  const paidCents =
    params.amountCents > 0 ? params.amountCents : offer.price_cents;

  const { error: updError } = await supabase
    .from("supporters")
    .update({
      status: "active",
      start_date: validity.startDate,
      end_date: validity.endDate,
      amount_paid_cents: paidCents,
      supporter_number: supporterNumber,
      card_token: cardToken,
      qr_token: qrToken,
      stripe_checkout_session_id:
        params.sessionId || supporter.stripe_checkout_session_id,
      stripe_payment_intent_id:
        params.paymentIntentId || supporter.stripe_payment_intent_id,
      activated_at: supporter.activated_at || new Date().toISOString(),
    })
    .eq("id", supporter.id)
    .eq("club_id", params.clubId);

  if (updError) throw updError;

  await sendSupporterWelcomeEmail(supporter.id).catch((err) => {
    console.error("[SUPPORTERS][email] send after paid", err);
  });
}

export async function markSupporterCheckoutTerminal(params: {
  sessionId: string;
  status: "cancelled" | "expired";
}): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("supporters")
    .select("id, club_id, status")
    .eq("stripe_checkout_session_id", params.sessionId)
    .maybeSingle();
  if (!data) return;
  if (data.status === "active") return;
  if (data.status === params.status || data.status === "cancelled") return;

  await supabase
    .from("supporters")
    .update({ status: "cancelled" })
    .eq("id", data.id)
    .eq("club_id", data.club_id)
    .eq("status", "pending");
}
