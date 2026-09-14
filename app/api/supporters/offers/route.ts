import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { parseOfferInput } from "@/lib/supporters/input";
import { mapOffer } from "@/lib/supporters/map";
import { OFFER_SELECT, type BenefitRow, type OfferRow } from "@/lib/supporters/types";
import { isSupporterActive } from "@/lib/supporters/status";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function loadBenefits(clubId: string, offerIds: string[]) {
  if (offerIds.length === 0) return [] as BenefitRow[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("supporter_offer_benefits")
    .select("id, club_id, supporter_offer_id, label, position")
    .eq("club_id", clubId)
    .in("supporter_offer_id", offerIds)
    .order("position", { ascending: true });
  return (data || []) as BenefitRow[];
}

async function replaceBenefits(
  clubId: string,
  offerId: string,
  labels: string[]
) {
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

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from("supporter_offers")
      .select(OFFER_SELECT)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const offers = (rows || []) as OfferRow[];
    const benefits = await loadBenefits(
      guard.clubId,
      offers.map((o) => o.id)
    );

    const { data: supporters } = await supabase
      .from("supporters")
      .select("supporter_offer_id, status, start_date, end_date")
      .eq("club_id", guard.clubId)
      .eq("status", "active");

    const countMap = new Map<string, number>();
    for (const s of supporters || []) {
      if (
        !isSupporterActive({
          status: s.status,
          startDate: s.start_date,
          endDate: s.end_date,
        })
      ) {
        continue;
      }
      countMap.set(s.supporter_offer_id, (countMap.get(s.supporter_offer_id) || 0) + 1);
    }

    return NextResponse.json({
      offers: offers.map((row) => ({
        ...mapOffer(row, benefits),
        activeCount: countMap.get(row.id) || 0,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = parseOfferInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: offer, error } = await supabase
      .from("supporter_offers")
      .insert({
        club_id: guard.clubId,
        name: parsed.name,
        description: parsed.description,
        price_cents: parsed.priceCents,
        currency: "CHF",
        duration_type: parsed.durationType,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        max_supporters: parsed.maxSupporters,
        is_active: parsed.isActive,
        is_featured: parsed.isFeatured,
        show_supporter_count: parsed.showSupporterCount,
        created_by: guard.userId,
        updated_by: guard.userId,
      })
      .select(OFFER_SELECT)
      .single();

    if (error || !offer) {
      return NextResponse.json(
        { error: error?.message || "Impossible de créer l’offre." },
        { status: 500 }
      );
    }

    await replaceBenefits(guard.clubId, offer.id, parsed.benefits);
    const benefits = await loadBenefits(guard.clubId, [offer.id]);
    return NextResponse.json({ offer: mapOffer(offer as OfferRow, benefits) }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
