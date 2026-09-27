import { createAdminClient } from "@/lib/supabase/admin";
import { zurichToday } from "./format";
import { roundChf } from "./money";
import { isTreasuryAccount, remainingDue } from "./receipts";
import { getAccountingAccess } from "./service";

export type FinanceSource = "expense" | "club_revenue";

export type FinancePreview = {
  accounting: boolean;
  today: string;
  title: string;
  total: number;
  received: number;
  remaining: number;
  paid: boolean;
  categoryAccountId: string | null;
  accounts: Array<{ id: string; number: string; name: string }>;
  categories: Array<{ id: string; number: string; name: string }>;
};

const USER_ERRORS = [
  "Le montant confirmé doit correspondre",
  "Choisissez un compte de trésorerie",
  "Choisissez une catégorie",
  "Aucun exercice ouvert",
  "Date de paiement invalide",
  "Charge introuvable",
  "Revenu introuvable",
  "Paiement incomplet",
];

export function financeFailureMessage(error: unknown): string {
  const raw = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  const line = raw.split("\n")[0] ?? "";
  if (USER_ERRORS.some((prefix) => line.includes(prefix))) return line;
  return "L'écriture n'a pas pu être créée. Le statut n'a pas changé.";
}

async function loadSource(clubId: string, source: FinanceSource, id: string) {
  const admin = createAdminClient();
  if (source === "expense") {
    const { data } = await admin
      .from("expenses")
      .select("id, description, amount, status, category_account_id, deleted_at")
      .eq("id", id)
      .eq("user_id", clubId)
      .maybeSingle();
    if (!data || data.deleted_at) return null;
    return {
      title: String(data.description || "Charge"),
      total: roundChf(Number(data.amount) || 0),
      paid: data.status === "paye",
      categoryAccountId: (data.category_account_id as string | null) ?? null,
      event: "payment_sent",
    };
  }
  const { data, error } = await admin
    .from("club_revenues")
    .select("id, name, amount, status, category_account_id, source_id, deleted_at")
    .eq("id", id)
    .eq("user_id", clubId)
    .maybeSingle();
  if (error && /status|category_account_id|source_id/.test(error.message || "")) {
    const legacy = await admin
      .from("club_revenues")
      .select("id, name, amount")
      .eq("id", id)
      .eq("user_id", clubId)
      .maybeSingle();
    if (!legacy.data) return null;
    return {
      title: String(legacy.data.name || "Revenu"),
      total: roundChf(Number(legacy.data.amount) || 0),
      paid: true,
      categoryAccountId: null,
      event: "payment_received",
      legacySourceId: null as string | null,
    };
  }
  if (!data || data.deleted_at) return null;
  return {
    title: String(data.name || "Revenu"),
    total: roundChf(Number(data.amount) || 0),
    paid: data.status !== "prevu",
    categoryAccountId: (data.category_account_id as string | null) ?? null,
    event: "payment_received",
    legacySourceId: (data.source_id as string | null) ?? null,
  };
}

export async function loadFinancePaymentPreview(input: {
  clubId: string;
  source: FinanceSource;
  id: string;
}): Promise<FinancePreview | null> {
  const row = await loadSource(input.clubId, input.source, input.id);
  if (!row) return null;
  const access = await getAccountingAccess(input.clubId);
  const admin = createAdminClient();
  let received = 0;
  let accounts: FinancePreview["accounts"] = [];
  let categories: FinancePreview["categories"] = [];

  if (access.onboarded) {
    const categoryType = input.source === "expense" ? "expense" : "revenue";
    const [{ data: payments }, { data: entries }, { data: chart }] = await Promise.all([
      admin
        .from("finance_payments")
        .select("amount, entry_id")
        .eq("club_id", input.clubId)
        .eq("source_type", input.source)
        .eq("source_id", input.id),
      admin
        .from("accounting_entries")
        .select("id, amount, source_id")
        .eq("club_id", input.clubId)
        .eq("event_type", row.event)
        .in("status", ["pending", "validated"]),
      admin
        .from("accounting_accounts")
        .select("id, number, name, system_code, account_type, is_active")
        .eq("club_id", input.clubId)
        .eq("is_active", true),
    ]);
    const linked = new Set((payments ?? []).map((item) => item.entry_id).filter(Boolean));
    const legacyId = "legacySourceId" in row ? row.legacySourceId : null;
    const historical = (entries ?? [])
      .filter((entry) => (entry.source_id === input.id || (legacyId && entry.source_id === legacyId)) && !linked.has(entry.id))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const booked = (payments ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    received = roundChf(historical + booked);
    const rows = chart ?? [];
    accounts = rows
      .filter((account) => account.account_type === "asset" && isTreasuryAccount(account.system_code as string | null))
      .map((account) => ({ id: account.id as string, number: account.number as string, name: account.name as string }))
      .sort((a, b) => a.number.localeCompare(b.number, "fr"));
    categories = rows
      .filter((account) => account.account_type === categoryType)
      .map((account) => ({ id: account.id as string, number: account.number as string, name: account.name as string }))
      .sort((a, b) => a.number.localeCompare(b.number, "fr"));
  } else if (row.paid) {
    received = row.total;
  }

  return {
    accounting: access.onboarded,
    today: zurichToday(),
    title: row.title,
    total: row.total,
    received,
    remaining: remainingDue(row.total, received),
    paid: row.paid || remainingDue(row.total, received) <= 0,
    categoryAccountId: row.categoryAccountId,
    accounts,
    categories,
  };
}

export async function recordFinancePayment(input: {
  clubId: string;
  userId: string | null;
  source: FinanceSource;
  id: string;
  paidOn: string;
  amount: number;
  accountId?: string | null;
  categoryAccountId?: string | null;
  idempotencyKey: string;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) throw new Error("Date de paiement invalide");
  if (!input.idempotencyKey.trim()) throw new Error("Paiement incomplet");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("accounting_record_finance_payment", {
    p_club: input.clubId,
    p_source_type: input.source,
    p_source: input.id,
    p_user: input.userId,
    p_paid_on: input.paidOn,
    p_account: input.accountId || null,
    p_amount: input.amount,
    p_key: input.idempotencyKey.trim(),
    p_category: input.categoryAccountId || null,
  });
  if (error) throw new Error(financeFailureMessage(error));
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    created: Boolean(row.created),
    already: Boolean(row.already),
    paid: Boolean(row.paid),
    status: String(row.status ?? ""),
    received: roundChf(Number(row.received) || 0),
    remaining: roundChf(Number(row.remaining) || 0),
    entryId: (row.entry_id as string | null) ?? null,
  };
}
