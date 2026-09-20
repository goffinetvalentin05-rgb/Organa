import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSaleColumn, mapReservation, normalizeSaleRow } from "./map";
import { loadEligibleMembers } from "./members";
import {
  buildDashboard,
  loadSaleRelations,
  mapSalesWithRelations,
  SUPPORT_SALE_SELECT,
} from "./service";
import { SUPPORT_SALE_SELECT_CORE, type SupportSaleRow } from "./types";

export async function loadSupportSalePdfContext(
  supabase: SupabaseClient,
  clubId: string,
  saleId: string
) {
  let { data: saleRow, error } = await supabase
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("id", saleId)
    .eq("club_id", clubId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error && isMissingSaleColumn(error)) {
    const fallback = await supabase
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT_CORE)
      .eq("id", saleId)
      .eq("club_id", clubId)
      .is("deleted_at", null)
      .maybeSingle();
    saleRow = fallback.data as typeof saleRow;
  }

  if (!saleRow) return null;

  const saleMapped = normalizeSaleRow(saleRow as SupportSaleRow);
  const [{ data: reservationRows }, relations] = await Promise.all([
    supabase
      .from("support_sale_reservations")
      .select(
        "id, sale_id, member_id, member_name, member_category, buyer_first_name, quantity, unit_price_cents, total_cents, status, created_at"
      )
      .eq("club_id", clubId)
      .eq("sale_id", saleId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: true }),
    loadSaleRelations(supabase, clubId, [saleId]),
  ]);

  const sale = mapSalesWithRelations([saleMapped], relations)[0];
  const reservations = (reservationRows || []).map(mapReservation);
  const eligible = await loadEligibleMembers({
    clubId,
    scope: sale.memberScope,
    categories: sale.categories,
    memberIds: sale.memberIds,
  });

  return {
    sale,
    dashboard: buildDashboard(sale, reservations, eligible),
  };
}

export function formatSalePdfDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
