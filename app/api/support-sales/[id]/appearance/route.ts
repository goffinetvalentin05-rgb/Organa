import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { isUuid } from "@/lib/support-sales/input";
import {
  brandingUpdatesFromPatch,
  mapAppearanceFromSale,
} from "@/lib/support-sales/page-settings";
import { getSupportSalePublicPath } from "@/lib/support-sales/slug";
import { SUPPORT_SALE_SELECT, type SupportSaleRow } from "@/lib/support-sales/types";
import { loadClubBranding } from "@/lib/supporters/public";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function loadOwnedSale(clubId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("id", id)
    .eq("club_id", clubId)
    .is("deleted_at", null)
    .maybeSingle();
  return { supabase, sale: (data || null) as SupportSaleRow | null };
}

async function appearancePayload(clubId: string, sale: SupportSaleRow) {
  const branding = await loadClubBranding(clubId);
  return mapAppearanceFromSale(sale, {
    clubName: branding.clubName,
    logoUrl: branding.logoUrl,
    fallbackPrimary: branding.theme.primaryColor,
    publicPath: sale.status === "draft" ? null : getSupportSalePublicPath(sale.slug),
  });
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

    const { sale } = await loadOwnedSale(guard.clubId, id);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    return NextResponse.json({ appearance: await appearancePayload(guard.clubId, sale) });
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
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const { supabase, sale } = await loadOwnedSale(guard.clubId, id);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const updates = brandingUpdatesFromPatch(body as Record<string, unknown>);
    const { data: updated, error } = await supabase
      .from("support_sales")
      .update({ ...updates, updated_by: guard.userId })
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .select(SUPPORT_SALE_SELECT)
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Mise à jour impossible" }, { status: 500 });
    }

    return NextResponse.json({
      appearance: await appearancePayload(guard.clubId, updated as SupportSaleRow),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
