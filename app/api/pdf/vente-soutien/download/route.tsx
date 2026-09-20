import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { SupportSaleRecapPdf } from "@/lib/pdf/SupportSaleRecapPdf";
import { centsToChf } from "@/lib/shop/money";
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
import { getClubCompanyPdfData } from "@/lib/utils/pdf-data";

export const runtime = "nodejs";

function periodLabel(sale: { startDate: string | null; reservationDeadline: string | null }) {
  const format = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("fr-CH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (sale.startDate && sale.reservationDeadline) {
    return `${format(sale.startDate)} – ${format(sale.reservationDeadline)}`;
  }
  if (sale.reservationDeadline) return `Fin le ${format(sale.reservationDeadline)}`;
  if (sale.startDate) return `Depuis le ${format(sale.startDate)}`;
  return "Sans date limite";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || !isUuid(id)) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }

    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const { data: saleRow } = await supabase
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!saleRow) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }

    const saleMapped = saleRow as SupportSaleRow;
    if (saleMapped.status !== "ended") {
      return NextResponse.json(
        { error: "Le récapitulatif PDF est disponible une fois la vente terminée." },
        { status: 400 }
      );
    }

    const [{ data: reservationRows }, relations] = await Promise.all([
      supabase
        .from("support_sale_reservations")
        .select(
          "id, sale_id, member_id, member_name, member_category, buyer_first_name, quantity, unit_price_cents, total_cents, status, created_at"
        )
        .eq("club_id", guard.clubId)
        .eq("sale_id", id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: true }),
      loadSaleRelations(supabase, guard.clubId, [id]),
    ]);

    const sale = mapSalesWithRelations([saleMapped], relations)[0];
    const reservations = (reservationRows || []).map(mapReservation);
    const eligible = await loadEligibleMembers({
      clubId: guard.clubId,
      scope: sale.memberScope,
      categories: sale.categories,
      memberIds: sale.memberIds,
    });
    const dashboard = buildDashboard(sale, reservations, eligible);
    const { company, primaryColor } = await getClubCompanyPdfData(supabase, guard.clubId);
    const members = dashboard.members
      .filter((row) => row.quantitySold > 0)
      .map((row) => ({
        memberName: row.memberName,
        memberCategory: row.memberCategory,
        quantitySold: row.quantitySold,
        amountChf: centsToChf(row.amountCents),
        reservations: row.reservations.map((reservation) => ({
          buyerFirstName: reservation.buyerFirstName,
          quantity: reservation.quantity,
          amountChf: centsToChf(reservation.totalCents),
        })),
      }));

    const pdfBuffer = await renderToBuffer(
      <SupportSaleRecapPdf
        company={{ name: company.name || "Club", logoUrl: company.logoUrl }}
        sale={{
          name: sale.name,
          productName: sale.productName,
          periodLabel: periodLabel(sale),
          unitPriceChf: centsToChf(sale.priceCents),
        }}
        summary={{
          reservationsCount: sale.stats.reservationsCount,
          quantitySold: sale.stats.quantitySold,
          membersSoldCount: sale.stats.membersSoldCount,
          amountChf: centsToChf(sale.stats.revenueCents),
        }}
        members={members}
        primaryColor={primaryColor}
      />
    );

    const filename = `vente-soutien-${sale.slug}.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
