import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { isUuid } from "@/lib/support-sales/input";
import { mapReservation } from "@/lib/support-sales/map";
import { loadEligibleMembers } from "@/lib/support-sales/members";
import {
  buildDashboard,
  loadSaleRelations,
  mapSalesWithRelations,
  SUPPORT_SALE_SELECT,
} from "@/lib/support-sales/service";
import type { SupportSaleRow } from "@/lib/support-sales/types";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const supabase = await createClient();
    const { data: saleRow } = await supabase
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!saleRow) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const [{ data: reservationRows }, relations] = await Promise.all([
      supabase
        .from("support_sale_reservations")
        .select(
          "id, sale_id, member_id, member_name, member_category, buyer_first_name, quantity, unit_price_cents, total_cents, status, created_at"
        )
        .eq("club_id", guard.clubId)
        .eq("sale_id", id)
        .order("created_at", { ascending: false }),
      loadSaleRelations(supabase, guard.clubId, [id]),
    ]);

    const sale = mapSalesWithRelations([saleRow as SupportSaleRow], relations)[0];
    const reservations = (reservationRows || []).map(mapReservation);
    const eligible = await loadEligibleMembers({
      clubId: guard.clubId,
      scope: sale.memberScope,
      categories: sale.categories,
      memberIds: sale.memberIds,
    });

    return NextResponse.json(buildDashboard(sale, reservations, eligible));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
