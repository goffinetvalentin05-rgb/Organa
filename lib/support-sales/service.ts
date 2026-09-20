import type { SupabaseClient } from "@supabase/supabase-js";
import { emptyStats, mapSale } from "./map";
import { getSupportSalePublicPath } from "./slug";
import type {
  SupportSale,
  SupportSaleDashboard,
  SupportSaleMemberRow,
  SupportSaleReservation,
  SupportSaleRow,
  SupportSaleSummaryStats,
} from "./types";
import { SUPPORT_SALE_SELECT } from "./types";

type ReservationAggRow = {
  sale_id: string;
  member_id: string;
  member_name: string;
  member_category: string | null;
  buyer_first_name: string;
  quantity: number;
  total_cents: number;
  status: string;
  id?: string;
  unit_price_cents?: number;
  created_at?: string;
};

export async function loadSaleRelations(
  supabase: SupabaseClient,
  clubId: string,
  saleIds: string[]
): Promise<{
  categoriesBySale: Map<string, string[]>;
  membersBySale: Map<string, string[]>;
  statsBySale: Map<string, SupportSaleSummaryStats>;
}> {
  const categoriesBySale = new Map<string, string[]>();
  const membersBySale = new Map<string, string[]>();
  const statsBySale = new Map<string, SupportSaleSummaryStats>();
  for (const id of saleIds) {
    categoriesBySale.set(id, []);
    membersBySale.set(id, []);
    statsBySale.set(id, emptyStats());
  }
  if (saleIds.length === 0) {
    return { categoriesBySale, membersBySale, statsBySale };
  }

  const [catRes, memRes, resRes] = await Promise.all([
    supabase
      .from("support_sale_categories")
      .select("sale_id, category")
      .eq("club_id", clubId)
      .in("sale_id", saleIds),
    supabase
      .from("support_sale_members")
      .select("sale_id, client_id")
      .eq("club_id", clubId)
      .in("sale_id", saleIds),
    supabase
      .from("support_sale_reservations")
      .select("sale_id, member_id, quantity, total_cents, status")
      .eq("club_id", clubId)
      .in("sale_id", saleIds)
      .eq("status", "confirmed"),
  ]);

  for (const row of catRes.data || []) {
    categoriesBySale.get(row.sale_id)?.push(row.category);
  }
  for (const row of memRes.data || []) {
    membersBySale.get(row.sale_id)?.push(row.client_id);
  }
  for (const row of (resRes.data || []) as ReservationAggRow[]) {
    const stats = statsBySale.get(row.sale_id) || emptyStats();
    stats.reservationsCount += 1;
    stats.quantitySold += row.quantity;
    stats.revenueCents += row.total_cents;
    statsBySale.set(row.sale_id, stats);
  }
  for (const saleId of saleIds) {
    const members = new Set(
      ((resRes.data || []) as ReservationAggRow[])
        .filter((r) => r.sale_id === saleId)
        .map((r) => r.member_id)
    );
    const stats = statsBySale.get(saleId) || emptyStats();
    stats.membersSoldCount = members.size;
    statsBySale.set(saleId, stats);
  }

  return { categoriesBySale, membersBySale, statsBySale };
}

export function mapSalesWithRelations(
  rows: SupportSaleRow[],
  relations: Awaited<ReturnType<typeof loadSaleRelations>>
): SupportSale[] {
  return rows.map((row) =>
    mapSale(row, {
      categories: relations.categoriesBySale.get(row.id) || [],
      memberIds: relations.membersBySale.get(row.id) || [],
      stats: relations.statsBySale.get(row.id),
    })
  );
}

export async function replaceSaleAudience(
  supabase: SupabaseClient,
  clubId: string,
  saleId: string,
  categories: string[],
  memberIds: string[]
) {
  await supabase.from("support_sale_categories").delete().eq("club_id", clubId).eq("sale_id", saleId);
  await supabase.from("support_sale_members").delete().eq("club_id", clubId).eq("sale_id", saleId);

  if (categories.length > 0) {
    const { error } = await supabase.from("support_sale_categories").insert(
      categories.map((category) => ({
        club_id: clubId,
        sale_id: saleId,
        category,
      }))
    );
    if (error) throw new Error(error.message);
  }
  if (memberIds.length > 0) {
    const { error } = await supabase.from("support_sale_members").insert(
      memberIds.map((clientId) => ({
        club_id: clubId,
        sale_id: saleId,
        client_id: clientId,
      }))
    );
    if (error) throw new Error(error.message);
  }
}

export function buildDashboard(
  sale: SupportSale,
  reservations: SupportSaleReservation[],
  eligibleMembers: Array<{ id: string; name: string; category: string | null }>
): SupportSaleDashboard {
  const confirmed = reservations.filter((r) => r.status === "confirmed");
  const byMember = new Map<string, SupportSaleMemberRow>();

  const ensure = (id: string, name: string, category: string | null) => {
    const existing = byMember.get(id);
    if (existing) return existing;
    const created: SupportSaleMemberRow = {
      memberId: id,
      memberName: name,
      memberCategory: category,
      buyersCount: 0,
      quantitySold: 0,
      amountCents: 0,
      goalPerMember: sale.goalPerMember,
      personalPath: getSupportSalePublicPath(sale.slug, id),
      reservations: [],
    };
    byMember.set(id, created);
    return created;
  };

  for (const member of eligibleMembers) {
    ensure(member.id, member.name, member.category);
  }
  for (const reservation of confirmed) {
    const row = ensure(
      reservation.memberId,
      reservation.memberName,
      reservation.memberCategory
    );
    row.reservations.push(reservation);
    row.quantitySold += reservation.quantity;
    row.amountCents += reservation.totalCents;
  }
  for (const row of byMember.values()) {
    row.buyersCount = row.reservations.length;
  }

  const members = [...byMember.values()].sort((a, b) => {
    if (b.quantitySold !== a.quantitySold) return b.quantitySold - a.quantitySold;
    return a.memberName.localeCompare(b.memberName, "fr");
  });

  const remainingQuantity =
    sale.availableQuantity == null
      ? null
      : Math.max(0, sale.availableQuantity - sale.stats.quantitySold);

  return { sale, remainingQuantity, members };
}

export { SUPPORT_SALE_SELECT };
