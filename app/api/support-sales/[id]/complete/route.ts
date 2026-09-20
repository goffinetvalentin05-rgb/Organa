import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { completeSupportSale } from "@/lib/support-sales/complete";
import { isUuid } from "@/lib/support-sales/input";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const result = await completeSupportSale({
      clubId: guard.clubId,
      userId: guard.userId,
      saleId: id,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      sale: result.sale,
      revenueId: result.revenueId,
      amount: result.amount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
