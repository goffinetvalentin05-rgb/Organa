import { getSupportSalePublicPath } from "./slug";
import type {
  SupportSale,
  SupportSaleMemberScope,
  SupportSaleReservation,
  SupportSaleReservationStatus,
  SupportSaleRow,
  SupportSaleStatus,
  SupportSaleSummaryStats,
} from "./types";

export function emptyStats(): SupportSaleSummaryStats {
  return {
    reservationsCount: 0,
    quantitySold: 0,
    revenueCents: 0,
    membersSoldCount: 0,
  };
}

export function mapSale(
  row: SupportSaleRow,
  extras: {
    categories?: string[];
    memberIds?: string[];
    stats?: SupportSaleSummaryStats;
  } = {}
): SupportSale {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    productName: row.product_name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    priceCents: row.price_cents,
    currency: row.currency || "CHF",
    availableQuantity: row.available_quantity,
    startDate: row.start_date,
    reservationDeadline: row.reservation_deadline,
    distributionInfo: row.distribution_info,
    memberScope: row.member_scope as SupportSaleMemberScope,
    goalPerMember: row.goal_per_member,
    categories: extras.categories || [],
    memberIds: extras.memberIds || [],
    sponsorName: row.sponsor_name,
    sponsorLogoUrl: row.sponsor_logo_url,
    sponsorText: row.sponsor_text,
    collectionMode: row.collection_mode === "online" ? "online" : "reservation",
    status: row.status as SupportSaleStatus,
    publicPath: getSupportSalePublicPath(row.slug),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stats: extras.stats || emptyStats(),
  };
}

export function mapReservation(row: {
  id: string;
  sale_id: string;
  member_id: string;
  member_name: string;
  member_category: string | null;
  buyer_first_name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
}): SupportSaleReservation {
  return {
    id: row.id,
    saleId: row.sale_id,
    memberId: row.member_id,
    memberName: row.member_name,
    memberCategory: row.member_category,
    buyerFirstName: row.buyer_first_name,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    totalCents: row.total_cents,
    status: row.status as SupportSaleReservationStatus,
    createdAt: row.created_at,
  };
}
