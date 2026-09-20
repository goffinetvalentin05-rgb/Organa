import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitGuard } from "@/lib/security/rateLimit";
import { lineTotalCents } from "@/lib/shop/money";
import { isUuid, parseBuyerFirstName, parseQuantity } from "@/lib/support-sales/input";
import { loadEligibleMembers } from "@/lib/support-sales/members";
import { loadPublicSaleRecord } from "@/lib/support-sales/public";
import { isValidSupportSaleSlug } from "@/lib/support-sales/slug";
import { saleAcceptsReservations } from "@/lib/support-sales/status";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rl = rateLimitGuard(request, "support-sales:reserve", {
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    if (!isValidSupportSaleSlug(slug)) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }

    const sale = await loadPublicSaleRecord(slug);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const buyerFirstName = parseBuyerFirstName(
      body && typeof body === "object" ? (body as { buyerFirstName?: unknown }).buyerFirstName : null
    );
    const quantity = parseQuantity(
      body && typeof body === "object" ? (body as { quantity?: unknown }).quantity : null
    );
    const memberId =
      body && typeof body === "object" ? (body as { memberId?: unknown }).memberId : null;

    if (!buyerFirstName) {
      return NextResponse.json({ error: "Indiquez votre prénom." }, { status: 400 });
    }
    if (!quantity) {
      return NextResponse.json({ error: "Choisissez une quantité." }, { status: 400 });
    }
    if (!isUuid(memberId)) {
      return NextResponse.json(
        { error: "Sélectionnez le membre qui vous a proposé cette vente." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const [{ data: categories }, { data: memberLinks }, { data: existing }] = await Promise.all([
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
    ]);

    const quantitySold = (existing || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const remainingQuantity =
      sale.available_quantity == null ? null : Math.max(0, sale.available_quantity - quantitySold);

    if (
      !saleAcceptsReservations({
        status: sale.status,
        reservationDeadline: sale.reservation_deadline,
        remainingQuantity,
      })
    ) {
      return NextResponse.json(
        { error: "Les réservations ne sont plus ouvertes pour cette vente." },
        { status: 400 }
      );
    }
    if (remainingQuantity != null && quantity > remainingQuantity) {
      return NextResponse.json(
        { error: `Il ne reste que ${remainingQuantity} produit(s).` },
        { status: 400 }
      );
    }

    const eligible = await loadEligibleMembers({
      clubId: sale.club_id,
      scope: sale.member_scope,
      categories: (categories || []).map((c) => c.category),
      memberIds: (memberLinks || []).map((m) => m.client_id),
    });
    const member = eligible.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json({ error: "Ce membre n’est pas associé à cette vente." }, { status: 400 });
    }

    const unitPriceCents = sale.price_cents;
    const totalCents = lineTotalCents(unitPriceCents, quantity);
    const { data: reservation, error } = await admin
      .from("support_sale_reservations")
      .insert({
        club_id: sale.club_id,
        sale_id: sale.id,
        member_id: member.id,
        member_name: member.name,
        member_category: member.category,
        buyer_first_name: buyerFirstName,
        quantity,
        unit_price_cents: unitPriceCents,
        total_cents: totalCents,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (error || !reservation) {
      return NextResponse.json({ error: error?.message || "Réservation impossible" }, { status: 500 });
    }

    return NextResponse.json(
      {
        reservation: {
          id: reservation.id,
          saleName: sale.name,
          productName: sale.product_name,
          buyerFirstName,
          quantity,
          unitPriceCents,
          totalCents,
          memberName: member.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
