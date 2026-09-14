import { createAdminClient } from "@/lib/supabase/admin";
import { OBILLZ_BRAND_PRIMARY, normalizeHexColor } from "@/lib/public-page/colors";
import { isPaymentReady } from "@/lib/shop/payment-provider";
import { mapPaymentAccount } from "@/lib/shop/stripe-connect";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";
import type {
  BenefitRow,
  CardPublicData,
  OfferRow,
  PublicSupportersPage,
  SupporterRow,
  VerifyPublicData,
} from "./types";
import { OFFER_SELECT, SUPPORTER_SELECT } from "./types";
import { mapOffer } from "./map";
import { resolveClubIdByPublicSlug } from "./slug";
import {
  durationLabel,
  durationShortLabel,
  formatSupporterNumberLabel,
  formatSwissDate,
  formatSwissDateLong,
  publicDisplayName,
  seasonLabel,
} from "./format";
import { isSupporterActive, offerAllowsCheckout, supporterDisplayStatus } from "./status";

const WALL_LIMIT = 30;

export async function loadClubBranding(clubId: string): Promise<{
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
}> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, logo_url, primary_color, public_page_primary_color")
    .eq("user_id", clubId)
    .maybeSingle();

  return {
    clubName: profile?.company_name?.trim() || "Club",
    logoUrl: typeof profile?.logo_url === "string" ? profile.logo_url : null,
    primaryColor: normalizeHexColor(
      profile?.public_page_primary_color || profile?.primary_color,
      OBILLZ_BRAND_PRIMARY
    ),
  };
}

async function countValidForOffer(
  clubId: string,
  offerId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("supporters")
    .select("id, status, start_date, end_date")
    .eq("club_id", clubId)
    .eq("supporter_offer_id", offerId)
    .eq("status", "active");
  return (data || []).filter((row) =>
    isSupporterActive({
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
    })
  ).length;
}

export async function getPublicSupportersPage(
  slug: string,
  options: { wallLimit?: number } = {}
): Promise<PublicSupportersPage | null> {
  const clubId = await resolveClubIdByPublicSlug(slug);
  if (!clubId) return null;

  const supabase = createAdminClient();
  const branding = await loadClubBranding(clubId);
  const wallLimit = options.wallLimit ?? WALL_LIMIT;

  const { data: accountRow } = await supabase
    .from("club_payment_accounts")
    .select(
      "id, club_id, provider, provider_account_id, status, charges_enabled, payouts_enabled, details_submitted, display_name, account_email, livemode"
    )
    .eq("club_id", clubId)
    .eq("provider", "stripe")
    .maybeSingle();
  const account = accountRow ? mapPaymentAccount(accountRow) : null;
  const paymentsReady = isPaymentReady(account);

  const { data: offerRows } = await supabase
    .from("supporter_offers")
    .select(OFFER_SELECT)
    .eq("club_id", clubId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const offers = (offerRows || []) as OfferRow[];
  const offerIds = offers.map((o) => o.id);

  let benefits: BenefitRow[] = [];
  if (offerIds.length > 0) {
    const { data: benefitRows } = await supabase
      .from("supporter_offer_benefits")
      .select("id, club_id, supporter_offer_id, label, position")
      .eq("club_id", clubId)
      .in("supporter_offer_id", offerIds)
      .order("position", { ascending: true });
    benefits = (benefitRows || []) as BenefitRow[];
  }

  const mapped = offers.map((row) => mapOffer(row, benefits));
  const publicOffers = [];
  for (const offer of mapped) {
    const checkoutOk = offerAllowsCheckout(offer);
    const count = await countValidForOffer(clubId, offer.id);
    const soldOut =
      offer.maxSupporters != null && count >= offer.maxSupporters;
    publicOffers.push({
      id: offer.id,
      name: offer.name,
      description: offer.description,
      priceCents: offer.priceCents,
      durationType: offer.durationType,
      startDate: offer.startDate,
      endDate: offer.endDate,
      durationLabel: durationShortLabel(offer),
      isFeatured: offer.isFeatured,
      supporterCount: offer.showSupporterCount ? count : null,
      soldOut: soldOut || !checkoutOk.ok,
      benefits: offer.benefits.map((b) => ({ label: b.label })),
    });
  }

  const { data: wallRows } = await supabase
    .from("supporters")
    .select("first_name, last_name, status, start_date, end_date, activated_at, created_at")
    .eq("club_id", clubId)
    .eq("status", "active")
    .eq("public_name_enabled", true)
    .order("activated_at", { ascending: false });

  const validWall = (wallRows || []).filter((row) =>
    isSupporterActive({
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
    })
  );
  const names = validWall.map((row) =>
    publicDisplayName(row.first_name, row.last_name)
  );

  const canCheckout = paymentsReady && publicOffers.some((o) => !o.soldOut);

  return {
    slug,
    clubName: branding.clubName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    canCheckout,
    checkoutBlockedReason: !paymentsReady
      ? "Les paiements ne sont pas encore configurés."
      : null,
    offers: publicOffers,
    wall: {
      total: names.length,
      names: names.slice(0, wallLimit),
      hasMore: names.length > wallLimit,
    },
  };
}

export async function getPublicWallAll(slug: string): Promise<string[] | null> {
  const page = await getPublicSupportersPage(slug, { wallLimit: 5000 });
  if (!page) return null;
  return page.wall.names;
}

function cardDurationLabel(row: {
  duration_type?: string;
  start_date: string | null;
  end_date: string | null;
  offer_start?: string | null;
  offer_end?: string | null;
  offer_duration?: string | null;
}): string {
  const type = (row.offer_duration || "season") as "season" | "year" | "custom";
  if (type === "year") return "1 année";
  if (type === "season") {
    return seasonLabel(row.offer_start || row.start_date, row.offer_end || row.end_date);
  }
  return durationLabel({
    durationType: type,
    startDate: row.start_date,
    endDate: row.end_date,
  });
}

export async function getCardByToken(cardToken: string): Promise<CardPublicData | null> {
  const token = cardToken.trim();
  if (!token || token.length < 20) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("supporters")
    .select(
      `${SUPPORTER_SELECT}, offer:supporter_offers(name, duration_type, start_date, end_date)`
    )
    .eq("card_token", token)
    .maybeSingle();

  if (!data) return null;
  const row = data as SupporterRow & {
    offer:
      | { name: string; duration_type: string; start_date: string | null; end_date: string | null }
      | { name: string; duration_type: string; start_date: string | null; end_date: string | null }[]
      | null;
  };
  const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
  const branding = await loadClubBranding(row.club_id);
  const valid = isSupporterActive({
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
  });
  const display = supporterDisplayStatus({
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
  });

  const { data: benefits } = await supabase
    .from("supporter_offer_benefits")
    .select("label, position")
    .eq("supporter_offer_id", row.supporter_offer_id)
    .eq("club_id", row.club_id)
    .order("position", { ascending: true });

  const statusLabel =
    display === "active"
      ? "Supporter actif"
      : display === "expired"
        ? "Carte expirée"
        : display === "pending"
          ? "En cours de confirmation"
          : "Carte désactivée";

  return {
    clubName: branding.clubName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    offerName: offer?.name || "Supporter",
    firstName: row.first_name,
    lastName: row.last_name,
    supporterNumber: formatSupporterNumberLabel(row.supporter_number),
    durationLabel: cardDurationLabel({
      start_date: row.start_date,
      end_date: row.end_date,
      offer_start: offer?.start_date || null,
      offer_end: offer?.end_date || null,
      offer_duration: offer?.duration_type || null,
    }),
    endDateLabel: formatSwissDate(row.end_date),
    endDate: row.end_date,
    qrUrl:
      row.status === "pending" || !row.qr_token
        ? ""
        : `${appBaseUrl()}/supporter/verify/${row.qr_token}`,
    benefits: (benefits || []).map((b) => ({ label: b.label })),
    valid,
    statusLabel,
  };
}

export async function getVerifyByToken(qrToken: string): Promise<VerifyPublicData> {
  const token = qrToken.trim();
  if (!token || token.length < 20) {
    return {
      outcome: "invalid",
      clubName: null,
      offerName: null,
      firstName: null,
      lastName: null,
      supporterNumber: null,
      endDateLabel: null,
    };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("supporters")
    .select(
      `${SUPPORTER_SELECT}, offer:supporter_offers(name)`
    )
    .eq("qr_token", token)
    .maybeSingle();

  if (!data) {
    return {
      outcome: "invalid",
      clubName: null,
      offerName: null,
      firstName: null,
      lastName: null,
      supporterNumber: null,
      endDateLabel: null,
    };
  }

  const row = data as SupporterRow & {
    offer: { name: string } | { name: string }[] | null;
  };
  const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
  const branding = await loadClubBranding(row.club_id);
  const display = supporterDisplayStatus({
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
  });

  let outcome: VerifyPublicData["outcome"] = "invalid";
  if (display === "active") outcome = "valid";
  else if (display === "expired") outcome = "expired";
  else outcome = "disabled";

  return {
    outcome,
    clubName: branding.clubName,
    offerName: offer?.name || "Supporter",
    firstName: row.first_name,
    lastName: row.last_name,
    supporterNumber: formatSupporterNumberLabel(row.supporter_number),
    endDateLabel: formatSwissDateLong(row.end_date),
  };
}
