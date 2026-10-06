import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/documents/documentRef";
import { roundChf } from "./money";
import type { BridgeAccount, BridgePeriod, ExistingAccrual } from "./transitory";

type Admin = ReturnType<typeof createAdminClient>;

export type TransitoryFacts = {
  ready: boolean;
  notice: string | null;
  periods: BridgePeriod[];
  accounts: BridgeAccount[];
  revenueAccountId: string | null;
  received: number;
  regularized: number;
  settled: number;
  released: number;
  openReceivable: number;
  existingAccrual: ExistingAccrual | null;
  preferredClearingId: string | null;
};

const MIGRATION_NOTICE = "L'option Transitoire demande la migration 104. L'encaissement normal reste disponible.";

function emptyFacts(notice: string | null): TransitoryFacts {
  return {
    ready: false,
    notice,
    periods: [],
    accounts: [],
    revenueAccountId: null,
    received: 0,
    regularized: 0,
    settled: 0,
    released: 0,
    openReceivable: 0,
    existingAccrual: null,
    preferredClearingId: null,
  };
}

function missingBridge(error: { message?: string } | null): boolean {
  const message = error?.message || "";
  return /bridge_mode|bridge_receipt_id|accrual_amount|accrual_entry_id|column|schema cache/i.test(message);
}

export async function loadTransitoryFacts(
  admin: Admin,
  input: { clubId: string; documentId: string; categoryCode: string; sourceType?: "invoice" | "membership" },
): Promise<TransitoryFacts> {
  if (!isUuid(input.documentId)) {
    throw new Error("Le document doit être ouvert par son identifiant technique, pas par son numéro visible.");
  }
  const [{ data: periodRows, error: periodError }, { data: accountRows, error: accountError }, { data: mapping }] = await Promise.all([
    admin.from("accounting_periods").select("id, label, starts_on, ends_on, status").eq("club_id", input.clubId).order("starts_on"),
    admin.from("accounting_accounts").select("id, number, name, system_code, is_active").eq("club_id", input.clubId).eq("is_active", true),
    admin.from("accounting_mappings").select("account_id").eq("club_id", input.clubId).eq("source_kind", input.categoryCode).maybeSingle(),
  ]);
  if (periodError) throw new Error(periodError.message);
  if (accountError) throw new Error(accountError.message);

  const periods: BridgePeriod[] = (periodRows ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label),
    startsOn: String(row.starts_on),
    endsOn: String(row.ends_on),
    status: String(row.status),
  }));
  const accounts: BridgeAccount[] = (accountRows ?? []).map((row) => ({
    id: String(row.id),
    number: String(row.number),
    name: String(row.name),
    systemCode: (row.system_code as string | null) ?? null,
  }));
  const mappedId = mapping?.account_id ? String(mapping.account_id) : null;
  const revenue = accounts.find((account) => account.id === mappedId)
    ?? accounts.find((account) => account.systemCode === input.categoryCode);

  const { data: receiptRows, error: receiptError } = await admin
    .from("document_receipts")
    .select("id, amount, entry_id, bridge_mode, accrual_entry_id, product_period_id")
    .eq("club_id", input.clubId)
    .eq("document_id", input.documentId);
  if (receiptError) {
    if (missingBridge(receiptError)) {
      return { ...emptyFacts(MIGRATION_NOTICE), periods, accounts, revenueAccountId: revenue?.id ?? null };
    }
    throw new Error(receiptError.message);
  }

  const receipts = receiptRows ?? [];
  const receiptIds = receipts.map((row) => String(row.id));
  const sourceQuery = await admin
    .from("accounting_entries")
    .select("id, amount, status, event_type, period_id, entry_date, bridge_receipt_id")
    .eq("club_id", input.clubId)
    .eq("source_id", input.documentId)
    .in("event_type", ["accrual_income", "deferred_release"])
    .eq("status", "validated");

  if (sourceQuery.error) {
    if (missingBridge(sourceQuery.error)) {
      return { ...emptyFacts(MIGRATION_NOTICE), periods, accounts, revenueAccountId: revenue?.id ?? null };
    }
    throw new Error(sourceQuery.error.message);
  }
  const sourceRows = sourceQuery.data ?? [];

  let bridgeRows: typeof sourceRows = [];
  if (receiptIds.length > 0) {
    const bridgeQuery = await admin
      .from("accounting_entries")
      .select("id, amount, status, event_type, period_id, entry_date, bridge_receipt_id")
      .eq("club_id", input.clubId)
      .in("bridge_receipt_id", receiptIds)
      .in("event_type", ["accrual_income", "deferred_release"])
      .eq("status", "validated");
    if (bridgeQuery.error) {
      if (missingBridge(bridgeQuery.error)) {
        return { ...emptyFacts(MIGRATION_NOTICE), periods, accounts, revenueAccountId: revenue?.id ?? null };
      }
      throw new Error(bridgeQuery.error.message);
    }
    bridgeRows = bridgeQuery.data ?? [];
  }

  const linked = new Map<string, (typeof sourceRows)[number]>();
  for (const row of [...sourceRows, ...bridgeRows]) linked.set(String(row.id), row);
  const entries = [...linked.values()];

  const regularized = roundChf(entries
    .filter((row) => row.event_type === "accrual_income")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0));
  const released = roundChf(entries
    .filter((row) => row.event_type === "deferred_release")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0));

  const settlementIds = receipts
    .filter((row) => row.bridge_mode === "prior" || row.bridge_mode === "settle")
    .map((row) => row.entry_id)
    .filter((id): id is string => Boolean(id));
  let settled = 0;
  if (settlementIds.length > 0) {
    const { data: cashRows, error: cashError } = await admin
      .from("accounting_entries")
      .select("id, status")
      .eq("club_id", input.clubId)
      .in("id", settlementIds);
    if (cashError) throw new Error(cashError.message);
    const validated = new Set((cashRows ?? []).filter((row) => row.status === "validated").map((row) => String(row.id)));
    settled = roundChf(receipts
      .filter((row) => row.entry_id && validated.has(String(row.entry_id)))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0));
  }
  const openReceivable = roundChf(regularized - settled);
  const linkedCash = new Set(receipts.map((row) => row.entry_id).filter(Boolean).map(String));
  let historical = 0;
  const historicalQuery = await admin
    .from("accounting_entries")
    .select("id, amount")
    .eq("club_id", input.clubId)
    .eq("source_type", input.sourceType || "invoice")
    .eq("source_id", input.documentId)
    .eq("event_type", "payment_received")
    .in("status", ["pending", "validated"]);
  if (historicalQuery.error) {
    throw new Error(historicalQuery.error.message);
  } else {
    historical = (historicalQuery.data ?? [])
      .filter((row) => !linkedCash.has(String(row.id)))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }
  const received = roundChf(historical + receipts.reduce((sum, row) => sum + Number(row.amount || 0), 0));

  const accrual = entries
    .filter((row) => row.event_type === "accrual_income")
    .sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date)))[0];
  let existingAccrual: ExistingAccrual | null = null;
  let preferredClearingId: string | null = null;
  if (accrual && openReceivable > 0) {
    const period = periods.find((item) => item.id === accrual.period_id);
    existingAccrual = {
      entryId: String(accrual.id),
      periodId: String(accrual.period_id || ""),
      periodLabel: period?.label || "",
      periodStatus: period?.status || "closed",
      amount: roundChf(Number(accrual.amount || 0)),
      openAmount: openReceivable,
    };
    const { data: lines } = await admin
      .from("accounting_entry_lines")
      .select("account_id, debit")
      .eq("club_id", input.clubId)
      .eq("entry_id", accrual.id);
    const debit = (lines ?? []).find((line) => Number(line.debit) > 0);
    const account = accounts.find((item) => item.id === debit?.account_id);
    if (account && (account.systemCode === "debtors" || account.systemCode === "prepaid")) {
      preferredClearingId = account.id;
    }
  }

  return {
    ready: true,
    notice: null,
    periods,
    accounts,
    revenueAccountId: revenue?.id ?? null,
    received,
    regularized,
    settled,
    released,
    openReceivable,
    existingAccrual,
    preferredClearingId,
  };
}
