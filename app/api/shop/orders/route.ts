import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { mapOrder, ORDER_ITEM_SELECT, ORDER_SELECT, type ItemRow, type OrderRow } from "@/lib/shop/orders";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("shop_orders")
      .select(ORDER_SELECT)
      .eq("club_id", guard.clubId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const orders = (rows || []) as OrderRow[];
    const ids = orders.map((o) => o.id);
    let items: ItemRow[] = [];
    if (ids.length > 0) {
      const { data } = await admin
        .from("shop_order_items")
        .select(ORDER_ITEM_SELECT)
        .eq("club_id", guard.clubId)
        .in("order_id", ids);
      items = (data || []) as ItemRow[];
    }

    return NextResponse.json({
      orders: orders.map((row) =>
        mapOrder(
          row,
          items.filter((item) => item.order_id === row.id)
        )
      ),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
