import { NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { loadClubMembersForSale } from "@/lib/support-sales/members";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const members = await loadClubMembersForSale(guard.clubId);
    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
