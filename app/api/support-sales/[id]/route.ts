import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { completeSupportSale } from "@/lib/support-sales/complete";
import { isUuid, parseSupportSaleInput } from "@/lib/support-sales/input";
import { isMissingSaleColumn, normalizeSaleRow } from "@/lib/support-sales/map";
import { assertMembersBelongToClub } from "@/lib/support-sales/members";
import {
  loadSaleRelations,
  mapSalesWithRelations,
  replaceSaleAudience,
  SUPPORT_SALE_SELECT,
} from "@/lib/support-sales/service";
import { SUPPORT_SALE_SELECT_CORE, SUPPORT_SALE_STATUSES, type SupportSaleRow, type SupportSaleStatus } from "@/lib/support-sales/types";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function loadOwnedSale(clubId: string, id: string) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("id", id)
    .eq("club_id", clubId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error && isMissingSaleColumn(error)) {
    const fallback = await supabase
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT_CORE)
      .eq("id", id)
      .eq("club_id", clubId)
      .is("deleted_at", null)
      .maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  return { supabase, sale: data ? normalizeSaleRow(data as SupportSaleRow) : null, error };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const { supabase, sale } = await loadOwnedSale(guard.clubId, id);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const relations = await loadSaleRelations(supabase, guard.clubId, [sale.id]);
    return NextResponse.json({
      sale: mapSalesWithRelations([sale], relations)[0],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const parsed = parseSupportSaleInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (!(await assertMembersBelongToClub(guard.clubId, parsed.data.memberIds))) {
      return NextResponse.json({ error: "Certains membres sont introuvables." }, { status: 400 });
    }

    const { supabase, sale } = await loadOwnedSale(guard.clubId, id);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const nextStatus = parsed.data.status || sale.status;
    const payload = {
      name: parsed.data.name,
      product_name: parsed.data.productName,
      description: parsed.data.description,
      price_cents: parsed.data.priceCents,
      available_quantity: parsed.data.availableQuantity,
      start_date: parsed.data.startDate,
      reservation_deadline: parsed.data.reservationDeadline,
      distribution_info: parsed.data.distributionInfo,
      member_scope: parsed.data.memberScope,
      goal_per_member: parsed.data.goalPerMember,
      sponsor_name: parsed.data.sponsorName,
      sponsor_text: parsed.data.sponsorText,
      sponsor_url: parsed.data.sponsorUrl,
      status: nextStatus,
      updated_by: guard.userId,
    };
    let { data: updated, error } = await supabase
      .from("support_sales")
      .update(payload)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .select(SUPPORT_SALE_SELECT)
      .single();
    if (error && isMissingSaleColumn(error)) {
      const { sponsor_url: _sponsorUrl, ...corePayload } = payload;
      const fallback = await supabase
        .from("support_sales")
        .update(corePayload)
        .eq("id", id)
        .eq("club_id", guard.clubId)
        .is("deleted_at", null)
        .select(SUPPORT_SALE_SELECT_CORE)
        .single();
      updated = fallback.data as typeof updated;
      error = fallback.error;
    }

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Mise à jour impossible" }, { status: 500 });
    }

    await replaceSaleAudience(
      supabase,
      guard.clubId,
      id,
      parsed.data.categories,
      parsed.data.memberIds
    );
    const relations = await loadSaleRelations(supabase, guard.clubId, [id]);
    return NextResponse.json({
      sale: mapSalesWithRelations([normalizeSaleRow(updated as SupportSaleRow)], relations)[0],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const status = body && typeof body === "object" ? (body as { status?: string }).status : null;
    if (!status || !SUPPORT_SALE_STATUSES.includes(status as SupportSaleStatus)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    if (status === "ended") {
      const completed = await completeSupportSale({
        clubId: guard.clubId,
        userId: guard.userId,
        saleId: id,
      });
      if (!completed.ok) {
        return NextResponse.json({ error: completed.error }, { status: completed.status });
      }
      return NextResponse.json({ sale: completed.sale, revenueId: completed.revenueId });
    }

    const { supabase, sale } = await loadOwnedSale(guard.clubId, id);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const { data: updated, error } = await supabase
      .from("support_sales")
      .update({ status, updated_by: guard.userId })
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .select(SUPPORT_SALE_SELECT)
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Mise à jour impossible" }, { status: 500 });
    }

    const relations = await loadSaleRelations(supabase, guard.clubId, [id]);
    return NextResponse.json({
      sale: mapSalesWithRelations([updated as SupportSaleRow], relations)[0],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const { supabase, sale } = await loadOwnedSale(guard.clubId, id);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const { count } = await supabase
      .from("support_sale_reservations")
      .select("id", { count: "exact", head: true })
      .eq("club_id", guard.clubId)
      .eq("sale_id", id)
      .eq("status", "confirmed");

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une vente qui a déjà des réservations. Terminez-la plutôt." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("support_sales")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: guard.userId,
        updated_by: guard.userId,
        status: "ended",
      })
      .eq("id", id)
      .eq("club_id", guard.clubId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
