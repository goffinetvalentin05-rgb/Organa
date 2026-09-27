import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { getAccountingAccess } from "@/lib/accounting/service";
import {
  REVENUE_CATEGORY_LABELS,
  isCashPaidStatus,
  isTreasuryAccount,
  remainingDue,
  revenueCategoryForDocument,
} from "@/lib/accounting/receipts";
import { recordDocumentReceipt, receiptFailureMessage } from "@/lib/accounting/recordReceipt";
import { zurichToday } from "@/lib/accounting/format";
import { roundChf } from "@/lib/accounting/money";

export const runtime = "nodejs";

async function guardReceipt() {
  const invoices = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
  if (!("error" in invoices)) return invoices;
  return requirePermission(PERMISSIONS.MANAGE_DOCUMENTS);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await guardReceipt();
  if ("error" in guard) return guard.error;
  const { id } = await Promise.resolve(params);
  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, type, status, total_ttc, title, numero, notes, sponsor_contract_id, event_id")
    .eq("id", id)
    .eq("user_id", guard.clubId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const access = await getAccountingAccess(guard.clubId);
  const categoryCode = revenueCategoryForDocument({
    type: String(doc.type),
    sponsorContractId: doc.sponsor_contract_id as string | null,
    notes: doc.notes as string | null,
    title: doc.title as string | null,
    eventId: doc.event_id as string | null,
  });
  const sourceType = doc.type === "quote" ? "membership" : "invoice";

  let already = 0;
  let categoryAccount: { number: string; name: string } | null = null;
  let accounts: Array<{ id: string; number: string; name: string }> = [];

  if (access.onboarded) {
    const [{ data: entries }, { data: receipts }, { data: chart }, { data: mapping }] = await Promise.all([
      admin
        .from("accounting_entries")
        .select("id, amount, status")
        .eq("club_id", guard.clubId)
        .eq("source_type", sourceType)
        .eq("source_id", id)
        .eq("event_type", "payment_received")
        .in("status", ["pending", "validated"]),
      admin.from("document_receipts").select("amount, entry_id").eq("club_id", guard.clubId).eq("document_id", id),
      admin
        .from("accounting_accounts")
        .select("id, number, name, system_code, account_type, is_active")
        .eq("club_id", guard.clubId)
        .eq("is_active", true),
      admin
        .from("accounting_mappings")
        .select("account_id")
        .eq("club_id", guard.clubId)
        .eq("source_kind", categoryCode)
        .maybeSingle(),
    ]);

    const linked = new Set((receipts ?? []).map((row) => row.entry_id).filter(Boolean));
    const historical = (entries ?? [])
      .filter((row) => !linked.has(row.id))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const received = (receipts ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    already = roundChf(historical + received);

    const rows = chart ?? [];
    accounts = rows
      .filter((row) => row.account_type === "asset" && isTreasuryAccount(row.system_code as string | null))
      .map((row) => ({ id: row.id as string, number: row.number as string, name: row.name as string }))
      .sort((a, b) => a.number.localeCompare(b.number));

    const mappedId = mapping?.account_id as string | undefined;
    const category = rows.find((row) => row.id === mappedId)
      ?? rows.find((row) => row.system_code === categoryCode);
    if (category) {
      categoryAccount = { number: category.number as string, name: category.name as string };
    }
  } else if (isCashPaidStatus(String(doc.type), doc.status as string)) {
    already = roundChf(Number(doc.total_ttc) || 0);
  }

  const total = roundChf(Number(doc.total_ttc) || 0);
  return NextResponse.json({
    accounting: access.onboarded,
    today: zurichToday(),
    total,
    received: already,
    remaining: remainingDue(total, already),
    paid: isCashPaidStatus(String(doc.type), doc.status as string) || remainingDue(total, already) <= 0,
    categoryCode,
    categoryLabel: REVENUE_CATEGORY_LABELS[categoryCode] ?? categoryCode,
    categoryAccount,
    accounts,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await guardReceipt();
  if ("error" in guard) return guard.error;
  const access = await requireWriteAccess(guard.clubId);
  if (access.response) return access.response;

  const { id } = await Promise.resolve(params);
  const body = await request.json().catch(() => null);
  const receivedOn = String(body?.receivedOn ?? "");
  const amount = Number(body?.amount);
  const accountId = typeof body?.accountId === "string" ? body.accountId : null;
  const idempotencyKey = String(body?.idempotencyKey ?? "");

  try {
    const result = await recordDocumentReceipt({
      clubId: guard.clubId,
      userId: guard.userId,
      documentId: id,
      receivedOn,
      amount,
      accountId,
      idempotencyKey,
    });
    revalidatePath("/tableau-de-bord/factures");
    revalidatePath(`/tableau-de-bord/factures/${id}`);
    revalidatePath("/tableau-de-bord/devis");
    revalidatePath(`/tableau-de-bord/devis/${id}`);
    revalidatePath("/tableau-de-bord/comptabilite/journal");
    return NextResponse.json(result);
  } catch (error) {
    const message = receiptFailureMessage(error);
    const status = message.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
