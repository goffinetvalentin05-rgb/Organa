import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupporterStats } from "./types";
import { isSupporterActive } from "./status";

export async function computeSupporterStats(
  supabase: SupabaseClient,
  clubId: string
): Promise<SupporterStats> {
  const { data, error } = await supabase
    .from("supporters")
    .select(
      "id, status, start_date, end_date, amount_paid_cents, activated_at, supporter_offer_id, offer:supporter_offers(name)"
    )
    .eq("club_id", clubId)
    .in("status", ["active", "expired", "cancelled"]);

  if (error) throw error;

  const rows = data || [];
  const paid = rows.filter(
    (row) => typeof row.amount_paid_cents === "number" && row.amount_paid_cents > 0
  );

  const revenueCents = paid.reduce((sum, row) => sum + (row.amount_paid_cents || 0), 0);

  const activeCount = rows.filter((row) =>
    isSupporterActive({
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
    })
  ).length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const newThisMonth = paid.filter(
    (row) => row.activated_at && row.activated_at >= monthStart
  ).length;

  const countByOffer = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    if (
      !isSupporterActive({
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
      })
    ) {
      continue;
    }
    const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
    const name = offer && typeof offer === "object" && "name" in offer
      ? String(offer.name)
      : "Offre";
    const current = countByOffer.get(row.supporter_offer_id) || { name, count: 0 };
    current.count += 1;
    countByOffer.set(row.supporter_offer_id, current);
  }
  const top = [...countByOffer.values()].sort((a, b) => b.count - a.count)[0];

  return {
    revenueCents,
    activeCount,
    newThisMonth,
    topOfferName: top?.name || null,
  };
}
