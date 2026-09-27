import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import {
  financeFailureMessage,
  loadFinancePaymentPreview,
  recordFinancePayment,
} from "@/lib/accounting/recordFinancePayment";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
  if ("error" in guard) return guard.error;
  const { id } = await Promise.resolve(params);
  const preview = await loadFinancePaymentPreview({ clubId: guard.clubId, source: "club_revenue", id });
  if (!preview) return NextResponse.json({ error: "Revenu introuvable" }, { status: 404 });
  return NextResponse.json(preview);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
  if ("error" in guard) return guard.error;
  const access = await requireWriteAccess(guard.clubId);
  if (access.response) return access.response;
  const { id } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  try {
    const result = await recordFinancePayment({
      clubId: guard.clubId,
      userId: guard.userId,
      source: "club_revenue",
      id,
      paidOn: String(body.paidOn || ""),
      amount: Number(body.amount),
      accountId: body.accountId ? String(body.accountId) : null,
      categoryAccountId: body.categoryAccountId ? String(body.categoryAccountId) : null,
      idempotencyKey: String(body.idempotencyKey || ""),
    });
    revalidatePath("/tableau-de-bord/produits");
    revalidatePath("/tableau-de-bord/comptabilite");
    return NextResponse.json(result);
  } catch (error) {
    const message = financeFailureMessage(error);
    const status = message.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
