import { createAdminClient } from "@/lib/supabase/admin";
import { loadClubBranding } from "@/lib/supporters/public";
import { loadEligibleMembers } from "./members";
import { saleAcceptsReservations } from "./status";
import type { PublicSupportSale, SupportSaleRow } from "./types";
import { SUPPORT_SALE_SELECT } from "./types";

export async function loadPublicSupportSale(
  slug: string
): Promise<PublicSupportSale | null> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !row) return null;
  const sale = row as SupportSaleRow;
  if (sale.status === "draft") return null;

  const [{ data: categories }, { data: memberLinks }, { data: reservations }, branding] =
    await Promise.all([
      admin
        .from("support_sale_categories")
        .select("category")
        .eq("club_id", sale.club_id)
        .eq("sale_id", sale.id),
      admin
        .from("support_sale_members")
        .select("client_id")
        .eq("club_id", sale.club_id)
        .eq("sale_id", sale.id),
      admin
        .from("support_sale_reservations")
        .select("quantity")
        .eq("club_id", sale.club_id)
        .eq("sale_id", sale.id)
        .eq("status", "confirmed"),
      loadClubBranding(sale.club_id),
    ]);

  const quantitySold = (reservations || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const remainingQuantity =
    sale.available_quantity == null ? null : Math.max(0, sale.available_quantity - quantitySold);

  const members = await loadEligibleMembers({
    clubId: sale.club_id,
    scope: sale.member_scope,
    categories: (categories || []).map((c) => c.category),
    memberIds: (memberLinks || []).map((m) => m.client_id),
  });

  return {
    name: sale.name,
    productName: sale.product_name,
    slug: sale.slug,
    description: sale.description,
    imageUrl: sale.image_url,
    priceCents: sale.price_cents,
    currency: sale.currency,
    reservationDeadline: sale.reservation_deadline,
    distributionInfo: sale.distribution_info,
    sponsorName: sale.sponsor_name,
    sponsorLogoUrl: sale.sponsor_logo_url,
    sponsorText: sale.sponsor_text,
    status: sale.status,
    acceptsReservations: saleAcceptsReservations({
      status: sale.status,
      reservationDeadline: sale.reservation_deadline,
      remainingQuantity,
    }),
    remainingQuantity,
    clubName: branding.clubName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.theme.primaryColor,
    secondaryColor: branding.theme.secondaryColor,
    members,
  };
}

export async function loadPublicSaleRecord(slug: string): Promise<SupportSaleRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return data as SupportSaleRow;
}
