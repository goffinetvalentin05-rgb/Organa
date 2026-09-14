export const SUPPORTERS_STRIPE_PURPOSE = "club_supporters" as const;
export const SUPPORTERS_CURRENCY = "CHF" as const;

export const SUPPORTER_DURATION_TYPES = ["season", "year", "custom"] as const;
export type SupporterDurationType = (typeof SUPPORTER_DURATION_TYPES)[number];

export const SUPPORTER_STATUSES = ["pending", "active", "expired", "cancelled"] as const;
export type SupporterStatus = (typeof SUPPORTER_STATUSES)[number];

export type SupporterOfferBenefit = {
  id: string;
  offerId: string;
  label: string;
  position: number;
};

export type SupporterOffer = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: typeof SUPPORTERS_CURRENCY;
  durationType: SupporterDurationType;
  startDate: string | null;
  endDate: string | null;
  maxSupporters: number | null;
  isActive: boolean;
  isFeatured: boolean;
  showSupporterCount: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  benefits: SupporterOfferBenefit[];
  activeCount?: number;
};

export type Supporter = {
  id: string;
  clubId: string;
  offerId: string;
  offerName: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  publicNameEnabled: boolean;
  status: SupporterStatus;
  startDate: string | null;
  endDate: string | null;
  amountPaidCents: number | null;
  currency: typeof SUPPORTERS_CURRENCY;
  supporterNumber: number | null;
  cardToken: string | null;
  qrToken: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  emailsSentAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupporterStats = {
  revenueCents: number;
  activeCount: number;
  newThisMonth: number;
  topOfferName: string | null;
};

export type PublicSupporterOffer = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationType: SupporterDurationType;
  startDate: string | null;
  endDate: string | null;
  durationLabel: string;
  isFeatured: boolean;
  supporterCount: number | null;
  soldOut: boolean;
  benefits: Array<{ label: string }>;
};

export type SupportersPageStyle = "colors" | "banner" | "fullscreen";
export type SupportersImagePosition = "top" | "center" | "bottom";
export type SupportersOverlayIntensity = "light" | "normal" | "dark";

export type PublicSupportersTheme = {
  label: string;
  title: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  pageStyle: SupportersPageStyle;
  imagePosition: SupportersImagePosition;
  overlayIntensity: SupportersOverlayIntensity;
  bannerUrl: string | null;
  showStats: boolean;
};

export type PublicSupportersPage = {
  slug: string;
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  theme: PublicSupportersTheme;
  canCheckout: boolean;
  checkoutBlockedReason: string | null;
  offers: PublicSupporterOffer[];
  wall: {
    total: number;
    names: string[];
    hasMore: boolean;
  };
};

export type CardPublicData = {
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  offerName: string;
  firstName: string;
  lastName: string;
  supporterNumber: string | null;
  durationLabel: string;
  endDateLabel: string | null;
  endDate: string | null;
  qrUrl: string;
  benefits: Array<{ label: string }>;
  valid: boolean;
  statusLabel: string;
};

export type VerifyPublicData = {
  outcome: "valid" | "expired" | "disabled" | "invalid";
  clubName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  offerName: string | null;
  firstName: string | null;
  lastName: string | null;
  supporterNumber: string | null;
  endDateLabel: string | null;
};

export type OfferRow = {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  duration_type: SupporterDurationType;
  start_date: string | null;
  end_date: string | null;
  max_supporters: number | null;
  is_active: boolean;
  is_featured: boolean;
  show_supporter_count: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BenefitRow = {
  id: string;
  club_id: string;
  supporter_offer_id: string;
  label: string;
  position: number;
};

export type SupporterRow = {
  id: string;
  club_id: string;
  supporter_offer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  public_name_enabled: boolean;
  status: SupporterStatus;
  start_date: string | null;
  end_date: string | null;
  amount_paid_cents: number | null;
  currency: string;
  supporter_number: number | null;
  card_token: string | null;
  qr_token: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_connected_account_id: string | null;
  emails_sent_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export const OFFER_SELECT =
  "id, club_id, name, description, price_cents, currency, duration_type, start_date, end_date, max_supporters, is_active, is_featured, show_supporter_count, sort_order, created_at, updated_at";

export const SUPPORTER_SELECT =
  "id, club_id, supporter_offer_id, first_name, last_name, email, phone, public_name_enabled, status, start_date, end_date, amount_paid_cents, currency, supporter_number, card_token, qr_token, stripe_payment_intent_id, stripe_checkout_session_id, stripe_connected_account_id, emails_sent_at, activated_at, created_at, updated_at";
