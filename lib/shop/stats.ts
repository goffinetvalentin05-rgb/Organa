import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShopStats } from "./types";

export async function computeShopStats(
  supabase: SupabaseClient,
  clubId: string
): Promise<ShopStats> {
  const { data: orders, error } = await supabase
    .from("shop_orders")
    .select("id, total_cents, paid_at, payment_status")
    .eq("club_id", clubId)
    .eq("payment_status", "paid");

  if (error) throw error;

  const paid = orders || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const revenueTotalCents = paid.reduce((s, o) => s + (o.total_cents || 0), 0);
  const monthPaid = paid.filter((o) => o.paid_at && o.paid_at >= monthStart);
  const revenueMonthCents = monthPaid.reduce((s, o) => s + (o.total_cents || 0), 0);

  const { count: toPrepare } = await supabase
    .from("shop_orders")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("payment_status", "paid")
    .eq("fulfillment_status", "to_prepare");

  const paidIds = paid.map((o) => o.id);
  let unitsSold = 0;
  const topMap = new Map<string, { name: string; units: number; revenueCents: number }>();

  if (paidIds.length > 0) {
    const { data: items } = await supabase
      .from("shop_order_items")
      .select("product_name, quantity, line_total_cents")
      .eq("club_id", clubId)
      .in("order_id", paidIds);

    for (const item of items || []) {
      unitsSold += item.quantity || 0;
      const current = topMap.get(item.product_name) || {
        name: item.product_name,
        units: 0,
        revenueCents: 0,
      };
      current.units += item.quantity || 0;
      current.revenueCents += item.line_total_cents || 0;
      topMap.set(item.product_name, current);
    }
  }

  const topProducts = [...topMap.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  return {
    revenueTotalCents,
    revenueMonthCents,
    ordersCount: paid.length,
    ordersToPrepare: toPrepare || 0,
    unitsSold,
    averageBasketCents: paid.length ? Math.round(revenueTotalCents / paid.length) : 0,
    topProducts,
  };
}
