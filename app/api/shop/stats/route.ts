import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { computeShopStats } from "@/lib/shop/stats";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();
    const stats = await computeShopStats(supabase, guard.clubId);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
