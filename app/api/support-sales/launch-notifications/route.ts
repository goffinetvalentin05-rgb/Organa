import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { isMissingSaleColumn, normalizeSaleRow } from "@/lib/support-sales/map";
import { launchNotificationCopy, supportSaleLaunchKey } from "@/lib/support-sales/notifications";
import { SUPPORT_SALE_SELECT, SUPPORT_SALE_SELECT_CORE, type SupportSaleRow } from "@/lib/support-sales/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    let { data: rows, error } = await supabase
      .from("support_sales")
      .select(SUPPORT_SALE_SELECT)
      .eq("club_id", guard.clubId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(10);

    if (error && isMissingSaleColumn(error)) {
      const fallback = await supabase
        .from("support_sales")
        .select(SUPPORT_SALE_SELECT_CORE)
        .eq("club_id", guard.clubId)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      rows = fallback.data as typeof rows;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sales = (rows || [])
      .map((row) => normalizeSaleRow(row as SupportSaleRow))
      .filter((row) => Boolean(row.published_at));

    const keys = sales.map((sale) => supportSaleLaunchKey(sale.id));
    const seen = new Set<string>();
    if (keys.length > 0) {
      const { data: seenRows } = await supabase
        .from("feature_announcements_seen")
        .select("announcement_key")
        .eq("user_id", guard.userId)
        .eq("club_id", guard.clubId)
        .in("announcement_key", keys);
      for (const row of seenRows || []) seen.add(row.announcement_key);
    }

    return NextResponse.json({
      notifications: sales.map((sale) => {
        const copy = launchNotificationCopy({
          name: sale.name,
          goalPerMember: sale.goal_per_member,
        });
        const id = supportSaleLaunchKey(sale.id);
        return {
          id,
          title: copy.title,
          message: copy.message,
          cta: copy.cta,
          href: `/tableau-de-bord/ventes-soutien/${sale.id}`,
          date: sale.published_at
            ? new Date(sale.published_at).toLocaleDateString("fr-CH")
            : undefined,
          icon: "gift" as const,
          read: seen.has(id),
        };
      }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
