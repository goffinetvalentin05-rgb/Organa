import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { mapSupporter } from "@/lib/supporters/map";
import { SUPPORTER_SELECT, type SupporterRow, type SupporterStatus } from "@/lib/supporters/types";

export const runtime = "nodejs";

const STATUSES: SupporterStatus[] = ["pending", "active", "expired", "cancelled"];

export async function GET(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();
    const url = request.nextUrl;
    const status = url.searchParams.get("status");
    const offerId = url.searchParams.get("offerId");
    const q = (url.searchParams.get("q") || "").trim();

    let query = supabase
      .from("supporters")
      .select(`${SUPPORTER_SELECT}, offer:supporter_offers(name)`)
      .eq("club_id", guard.clubId)
      .order("created_at", { ascending: false });

    if (status && STATUSES.includes(status as SupporterStatus)) {
      query = query.eq("status", status);
    }
    if (offerId) query = query.eq("supporter_offer_id", offerId);
    if (q) {
      const safe = q.replace(/,/g, " ").slice(0, 80);
      query = query.or(
        `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`
      );
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const supporters = (data || []).map((row) => {
      const r = row as SupporterRow & {
        offer: { name: string } | { name: string }[] | null;
      };
      const offer = Array.isArray(r.offer) ? r.offer[0] : r.offer;
      return mapSupporter(r, offer?.name || null);
    });

    return NextResponse.json({ supporters });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
