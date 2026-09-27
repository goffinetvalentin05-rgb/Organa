import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { completeSupportSale, type SupportSaleSplit } from "@/lib/support-sales/complete";
import { isUuid } from "@/lib/support-sales/input";
import { loadSupportSaleSettlement } from "@/lib/support-sales/settlement";

export const runtime = "nodejs";

function splitsFrom(value: unknown): SupportSaleSplit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { accountId?: unknown; amount?: unknown };
    const accountId = typeof row.accountId === "string" ? row.accountId : "";
    const amount = Number(row.amount);
    if (!accountId || !Number.isFinite(amount)) return [];
    return [{ accountId, amount }];
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    const settlement = await loadSupportSaleSettlement(guard.clubId);
    return NextResponse.json(settlement);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const receivedOn = body && typeof body === "object" ? String((body as { receivedOn?: unknown }).receivedOn || "") : "";
    const amount = body && typeof body === "object" ? Number((body as { amount?: unknown }).amount) : NaN;
    const categoryAccountId = body && typeof body === "object"
      ? ((body as { categoryAccountId?: unknown }).categoryAccountId ? String((body as { categoryAccountId?: unknown }).categoryAccountId) : null)
      : null;
    if (!receivedOn) {
      return NextResponse.json({ error: "Confirmez la date et les sommes encaissées pour terminer la vente." }, { status: 400 });
    }

    const result = await completeSupportSale({
      clubId: guard.clubId,
      userId: guard.userId,
      saleId: id,
      receivedOn,
      amount,
      categoryAccountId,
      splits: splitsFrom(body && typeof body === "object" ? (body as { splits?: unknown }).splits : null),
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
