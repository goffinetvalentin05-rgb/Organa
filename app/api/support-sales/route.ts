import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { parseSupportSaleInput } from "@/lib/support-sales/input";
import { isMissingSaleColumn, normalizeSaleRow } from "@/lib/support-sales/map";
import { assertMembersBelongToClub } from "@/lib/support-sales/members";
import {
  loadSaleRelations,
  mapSalesWithRelations,
  replaceSaleAudience,
  SUPPORT_SALE_SELECT,
} from "@/lib/support-sales/service";
import { SUPPORT_SALE_SELECT_CORE } from "@/lib/support-sales/types";
import { allocateSupportSaleSlug } from "@/lib/support-sales/slug";
import type { SupportSaleRow } from "@/lib/support-sales/types";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();

    let { data: rows, error } = await supabase
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error && isMissingSaleColumn(error)) {
      const fallback = await supabase
        .from("support_sales")
        .select(SUPPORT_SALE_SELECT_CORE)
        .eq("club_id", guard.clubId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      rows = fallback.data as typeof rows;
      error = fallback.error;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const salesRows = (rows || []).map((row) => normalizeSaleRow(row as SupportSaleRow));
    const relations = await loadSaleRelations(
      supabase,
      guard.clubId,
      salesRows.map((row) => row.id)
    );

    return NextResponse.json({
      sales: mapSalesWithRelations(salesRows, relations),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = parseSupportSaleInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (!(await assertMembersBelongToClub(guard.clubId, parsed.data.memberIds))) {
      return NextResponse.json({ error: "Certains membres sont introuvables." }, { status: 400 });
    }

    const supabase = await createClient();
    const slug = await allocateSupportSaleSlug(parsed.data.name);
    const payload = {
      club_id: guard.clubId,
      name: parsed.data.name,
      product_name: parsed.data.productName,
      slug,
      description: parsed.data.description,
      price_cents: parsed.data.priceCents,
      currency: "CHF",
      available_quantity: parsed.data.availableQuantity,
      start_date: parsed.data.startDate,
      reservation_deadline: parsed.data.reservationDeadline,
      distribution_info: parsed.data.distributionInfo,
      member_scope: parsed.data.memberScope,
      goal_per_member: parsed.data.goalPerMember,
      sponsor_name: parsed.data.sponsorName,
      sponsor_text: parsed.data.sponsorText,
      sponsor_url: parsed.data.sponsorUrl,
      collection_mode: "reservation",
      status: parsed.data.status === "active" ? "active" : "draft",
      published_at: parsed.data.status === "active" ? new Date().toISOString() : null,
      created_by: guard.userId,
      updated_by: guard.userId,
    };
    let { data: sale, error } = await supabase
      .from("support_sales")
      .insert(payload)
      .select(SUPPORT_SALE_SELECT)
      .single();
    if (error && isMissingSaleColumn(error)) {
      const { sponsor_url: _sponsorUrl, published_at: _publishedAt, ...corePayload } = payload;
      const fallback = await supabase
        .from("support_sales")
        .insert(corePayload)
        .select(SUPPORT_SALE_SELECT_CORE)
        .single();
      sale = fallback.data as typeof sale;
      error = fallback.error;
    }

    if (error || !sale) {
      return NextResponse.json({ error: error?.message || "Création impossible" }, { status: 500 });
    }

    await replaceSaleAudience(
      supabase,
      guard.clubId,
      sale.id,
      parsed.data.categories,
      parsed.data.memberIds
    );

    const relations = await loadSaleRelations(supabase, guard.clubId, [sale.id]);
    return NextResponse.json(
      { sale: mapSalesWithRelations([normalizeSaleRow(sale as SupportSaleRow)], relations)[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
