import type {
  BenefitRow,
  OfferRow,
  Supporter,
  SupporterOffer,
  SupporterOfferBenefit,
  SupporterRow,
} from "./types";

export function mapBenefit(row: BenefitRow): SupporterOfferBenefit {
  return {
    id: row.id,
    offerId: row.supporter_offer_id,
    label: row.label,
    position: row.position,
  };
}

export function mapOffer(row: OfferRow, benefits: BenefitRow[] = []): SupporterOffer {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: "CHF",
    durationType: row.duration_type,
    startDate: row.start_date,
    endDate: row.end_date,
    maxSupporters: row.max_supporters,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    showSupporterCount: row.show_supporter_count,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    benefits: benefits
      .filter((b) => b.supporter_offer_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map(mapBenefit),
  };
}

export function mapSupporter(
  row: SupporterRow,
  offerName: string | null = null
): Supporter {
  return {
    id: row.id,
    clubId: row.club_id,
    offerId: row.supporter_offer_id,
    offerName,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    publicNameEnabled: row.public_name_enabled,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    amountPaidCents: row.amount_paid_cents,
    currency: "CHF",
    supporterNumber: row.supporter_number,
    cardToken: row.card_token,
    qrToken: row.qr_token,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    emailsSentAt: row.emails_sent_at,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
