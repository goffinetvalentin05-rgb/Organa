import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { parseOfferInput } from "@/lib/supporters/input";
import { mapOffer } from "@/lib/supporters/map";
import { OFFER_SELECT, type BenefitRow, type OfferRow } from "@/lib/supporters/types";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function loadBenefits(clubId: string, offerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supporter_offer_benefits")
    .select("id, club_id, supporter_offer_id, label, position")
    .eq("club_id", clubId)
    .eq("supporter_offer_id", offerId)
    .order("position", { ascending: true });
  return (data || []) as BenefitRow[];
}

async function replaceBenefits(clubId: string, offerId: string, labels: string[]) {
  const supabase = await createClient();
  const { error: delError } = await supabase
    .from("supporter_offer_benefits")
    .delete()
    .eq("club_id", clubId)
    .eq("supporter_offer_id", offerId);
  if (delError) throw delError;
  if (labels.length === 0) return;
  const { error } = await supabase.from("supporter_offer_benefits").insert(
    labels.map((label, position) => ({
      club_id: clubId,
      supporter_offer_id: offerId,
      label,
      position,
    }))
  );
  if (error) throw error;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("supporter_offers")
      .select(OFFER_SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }
    const benefits = await loadBenefits(guard.clubId, id);
    return NextResponse.json({ offer: mapOffer(data as OfferRow, benefits) });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = parseOfferInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("supporter_offers")
      .select("id")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const { data: offer, error } = await supabase
      .from("supporter_offers")
      .update({
        name: parsed.name,
        description: parsed.description,
        price_cents: parsed.priceCents,
        duration_type: parsed.durationType,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        max_supporters: parsed.maxSupporters,
        is_active: parsed.isActive,
        is_featured: parsed.isFeatured,
        show_supporter_count: parsed.showSupporterCount,
        updated_by: guard.userId,
      })
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .select(OFFER_SELECT)
      .single();

    if (error || !offer) {
      return NextResponse.json(
        { error: error?.message || "Impossible de modifier l’offre." },
        { status: 500 }
      );
    }

    await replaceBenefits(guard.clubId, id, parsed.benefits);
    const benefits = await loadBenefits(guard.clubId, id);
    return NextResponse.json({ offer: mapOffer(offer as OfferRow, benefits) });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const supabase = await createClient();

    const { count } = await supabase
      .from("supporters")
      .select("id", { count: "exact", head: true })
      .eq("club_id", guard.clubId)
      .eq("supporter_offer_id", id)
      .in("status", ["pending", "active"]);

    if ((count || 0) > 0) {
      const { error } = await supabase
        .from("supporter_offers")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          deleted_by: guard.userId,
          updated_by: guard.userId,
        })
        .eq("id", id)
        .eq("club_id", guard.clubId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, deactivated: true });
    }

    const { error } = await supabase
      .from("supporter_offers")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: guard.userId,
        updated_by: guard.userId,
      })
      .eq("id", id)
      .eq("club_id", guard.clubId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
