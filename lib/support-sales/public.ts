import { createAdminClient } from "@/lib/supabase/admin";
import { loadClubBranding } from "@/lib/supporters/public";
import { isMissingSaleColumn, normalizeSaleRow } from "./map";
import { loadEligibleMembers } from "./members";
import { buildPublicSupportSaleTheme } from "./page-settings";
import { saleAcceptsReservations } from "./status";
import type { PublicSupportSale, SupportSaleRow } from "./types";
import { SUPPORT_SALE_SELECT, SUPPORT_SALE_SELECT_CORE } from "./types";

export async function loadPublicSupportSale(
  slug: string
): Promise<PublicSupportSale | null> {
  const admin = createAdminClient();
  let { data: row, error } = await admin
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error && isMissingSaleColumn(error)) {
    const fallback = await admin
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT_CORE)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    row = fallback.data as typeof row;
    error = fallback.error;
  }

  if (error || !row) return null;
  const sale = normalizeSaleRow(row);
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

  const theme = buildPublicSupportSaleTheme({
    saleName: sale.name,
    productName: sale.product_name,
    description: sale.description,
    label: sale.public_label,
    title: sale.public_title,
    subtitle: sale.public_subtitle,
    primaryColor: sale.public_primary_color || branding.theme.primaryColor,
    secondaryColor: sale.public_secondary_color || branding.theme.secondaryColor,
    pageStyle: sale.public_page_style,
    imagePosition: sale.public_image_position,
    overlayIntensity: sale.public_overlay_intensity,
    bannerUrl: sale.public_banner_url,
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
    sponsorUrl: sale.sponsor_url,
    status: sale.status,
    acceptsReservations: saleAcceptsReservations({
      status: sale.status,
      reservationDeadline: sale.reservation_deadline,
      remainingQuantity,
    }),
    remainingQuantity,
    clubName: branding.clubName,
    logoUrl: branding.logoUrl,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    theme,
    members,
  };
}

export async function loadPublicSaleRecord(slug: string): Promise<SupportSaleRow | null> {
  const admin = createAdminClient();
  let { data, error } = await admin
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error && isMissingSaleColumn(error)) {
    const fallback = await admin
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT_CORE)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  if (error || !data) return null;
  return normalizeSaleRow(data);
}
