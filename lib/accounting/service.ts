import { createAdminClient } from "@/lib/supabase/admin";
import {
  decidePosting,
  linesAreBalanced,
  officialTotals,
} from "./engine";
import { roundChf } from "./money";
import { zurichToday } from "./format";
import { isAccountingDevEmail } from "./devAccess";
import { isFinancialSystemCode } from "./financialAccounts";
import {
  ADVANCED_EVENT,
  ADVANCED_SOURCE,
  assessAdvancedLines,
  buildReversalLines,
  canModifyAdvancedEntry,
} from "./advancedEntry";
import {
  coverageSentence,
  normalizeOnboardingInput,
  resolveCoverageType,
} from "./onboarding";
import {
  OPENING_PLAN_USER_MESSAGE,
  buildFinalizePayload,
  readOpeningDiagnostic,
} from "./openingPlan";
import type { AccountType, DraftLine, EntryStatus, ReportLine } from "./types";

type Admin = ReturnType<typeof createAdminClient>;

export type AccountRecord = {
  id: string;
  number: string;
  name: string;
  accountType: AccountType;
  accountClass: number;
  systemCode: string | null;
  isActive: boolean;
  isSystem: boolean;
};

export type PeriodRecord = {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
  status: "open" | "closed";
};

type InboxRow = {
  id: string;
  idempotency_key: string;
  source_type: string;
  source_id: string;
  event_type: string;
  direction: "in" | "out" | "reversal";
  amount: number | string;
  fee_amount: number | string;
  entry_date: string;
  description: string;
  party_name: string | null;
  financial_account_code: string | null;
  category_code: string | null;
  status: string;
};

function num(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? roundChf(parsed) : 0;
}

function mapAccount(row: Record<string, unknown>): AccountRecord {
  return {
    id: String(row.id),
    number: String(row.number),
    name: String(row.name),
    accountType: row.account_type as AccountType,
    accountClass: Number(row.account_class),
    systemCode: (row.system_code as string | null) ?? null,
    isActive: Boolean(row.is_active),
    isSystem: Boolean(row.is_system),
  };
}

export function addonIsEntitled(row: {
  status: string;
  current_period_end: string | null;
} | null): boolean {
  if (!row) return false;
  if (row.status !== "active" && row.status !== "past_due") return false;
  if (!row.current_period_end) return true;
  return new Date(row.current_period_end).getTime() > Date.now();
}

async function audit(
  admin: Admin,
  clubId: string,
  action: string,
  userId: string | null,
  entryId: string | null,
  oldValue: unknown,
  newValue: unknown
) {
  await admin.from("accounting_audit_log").insert({
    club_id: clubId,
    entry_id: entryId,
    user_id: userId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

export async function getAccountingAccess(clubId: string) {
  const admin = createAdminClient();
  const [{ data: addon }, { data: settings }] = await Promise.all([
    admin
      .from("club_addons")
      .select("status, current_period_end")
      .eq("club_id", clubId)
      .eq("addon_key", "accounting")
      .maybeSingle(),
    admin
      .from("accounting_settings")
      .select("onboarding_completed_at, start_date, auto_validate, start_mode, history_import_status")
      .eq("club_id", clubId)
      .maybeSingle(),
  ]);

  const paid = addonIsEntitled(addon);
  const internal = paid ? null : await internalAccountingGrant(admin, clubId);
  const entitled = paid || internal !== null;
  const onboarded = Boolean(settings?.onboarding_completed_at);
  return {
    entitled,
    grant: paid ? "stripe" : internal,
    onboarded,
    canViewHistory: onboarded,
    canWrite: entitled && onboarded,
    autoValidate: Boolean(settings?.auto_validate),
    startDate: (settings?.start_date as string | undefined) ?? null,
    startMode: (settings?.start_mode as string | undefined) ?? null,
    historyImportStatus: (settings?.history_import_status as string | undefined) ?? null,
  };
}

/** Fondateur ou e-mail développeur. N'écrit aucune ligne d'abonnement Stripe. */
async function internalAccountingGrant(
  admin: Admin,
  clubId: string
): Promise<"founder" | "developer" | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("is_founder")
    .eq("user_id", clubId)
    .maybeSingle();
  if (profile?.is_founder === true) return "founder";

  const { data, error } = await admin.auth.admin.getUserById(clubId);
  if (error) return null;
  return isAccountingDevEmail(data?.user?.email) ? "developer" : null;
}

async function loadAccounts(admin: Admin, clubId: string): Promise<AccountRecord[]> {
  const { data, error } = await admin
    .from("accounting_accounts")
    .select("id, number, name, account_type, account_class, system_code, is_active, is_system")
    .eq("club_id", clubId)
    .order("number");
  if (error) throw error;
  return (data ?? []).map((row) => mapAccount(row as Record<string, unknown>));
}

async function loadPeriods(admin: Admin, clubId: string): Promise<PeriodRecord[]> {
  const { data, error } = await admin
    .from("accounting_periods")
    .select("id, label, starts_on, ends_on, status")
    .eq("club_id", clubId)
    .order("starts_on");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: row.label as string,
    startsOn: row.starts_on as string,
    endsOn: row.ends_on as string,
    status: row.status as "open" | "closed",
  }));
}

function accountByCode(accounts: AccountRecord[], code: string | null): AccountRecord | undefined {
  if (!code) return undefined;
  const bySystem = accounts.find((account) => account.isActive && account.systemCode === code);
  if (bySystem) return bySystem;
  return accounts.find((account) => account.isActive && account.number === code);
}

function periodFor(periods: PeriodRecord[], date: string, openOnly: boolean): PeriodRecord | undefined {
  return periods.find((period) => {
    if (openOnly && period.status !== "open") return false;
    return date >= period.startsOn && date <= period.endsOn;
  });
}

async function postEntry(
  admin: Admin,
  payload: Record<string, unknown>
): Promise<{ id: string; created: boolean }> {
  const { data, error } = await admin.rpc("accounting_post_entry", { p_payload: payload });
  if (error) throw error;
  const result = data as { id: string; created: boolean };
  return result;
}

async function entryKey(admin: Admin, clubId: string, base: string): Promise<string> {
  const { data } = await admin
    .from("accounting_entries")
    .select("status")
    .eq("club_id", clubId)
    .eq("idempotency_key", base)
    .maybeSingle();
  if (!data) return base;
  if (data.status === "voided" || data.status === "reversed") {
    return `${base}:repost:${Date.now()}`;
  }
  return base;
}

export async function processAccountingInbox(clubId: string, userId: string | null = null) {
  const admin = createAdminClient();
  const access = await getAccountingAccess(clubId);
  if (!access.onboarded) return { posted: 0 };

  const [accounts, periods] = await Promise.all([
    loadAccounts(admin, clubId),
    loadPeriods(admin, clubId),
  ]);

  const { data: rows, error } = await admin
    .from("accounting_inbox")
    .select("*")
    .eq("club_id", clubId)
    .eq("status", "pending");
  if (error) throw error;

  let posted = 0;
  for (const raw of rows ?? []) {
    const row = raw as InboxRow;
    try {
      const did = await processInboxRow(
        admin,
        clubId,
        userId,
        row,
        accounts,
        periods,
        access.autoValidate,
        access.startDate
      );
      if (did) posted += 1;
    } catch (err) {
      console.error("[accounting] inbox", row.id, err);
    }
  }
  return { posted };
}

async function processInboxRow(
  admin: Admin,
  clubId: string,
  userId: string | null,
  row: InboxRow,
  accounts: AccountRecord[],
  periods: PeriodRecord[],
  autoValidate: boolean,
  startDate: string | null
): Promise<boolean> {
  if (row.event_type === "payment_reversed") {
    return reverseFromInbox(admin, clubId, userId, row, periods);
  }

  const closed = periods.some(
    (period) => period.status === "closed" && row.entry_date >= period.startsOn && row.entry_date <= period.endsOn
  );
  const decision = decidePosting({
    amount: num(row.amount),
    feeAmount: num(row.fee_amount),
    entryDate: row.entry_date,
    sourceType: row.source_type,
    sourceId: row.source_id,
    eventType: row.event_type === "payment_sent" ? "payment_sent" : "payment_received",
    direction: row.direction === "out" ? "out" : "in",
    financialAccountCode: row.financial_account_code,
    categoryCode: row.category_code,
    autoValidate,
    periodClosed: closed,
    beforeStart: Boolean(startDate && row.entry_date < startDate),
  });

  if (decision.kind === "ignore") {
    await admin.from("accounting_inbox").update({ status: "ignored_before_start" }).eq("id", row.id);
    return false;
  }
  if (decision.kind === "blocked" || decision.kind === "awaiting") {
    const status = decision.kind === "blocked"
      ? "blocked_closed_period"
      : decision.missing.length > 1
        ? "awaiting_details"
        : decision.missing[0] === "account"
          ? "awaiting_account"
          : "awaiting_category";
    await admin.from("accounting_inbox").update({ status }).eq("id", row.id);
    return false;
  }

  const period = periodFor(periods, row.entry_date, true);
  if (!period) {
    await admin.from("accounting_inbox").update({ status: "blocked_closed_period" }).eq("id", row.id);
    return false;
  }

  const mapped = mapLines(decision.lines, accounts);
  if (!mapped) {
    await admin.from("accounting_inbox").update({ status: "awaiting_category" }).eq("id", row.id);
    return false;
  }

  const financial = accountByCode(accounts, row.financial_account_code);
  const category = accountByCode(accounts, row.category_code);
  const key = await entryKey(admin, clubId, row.idempotency_key);

  await postEntry(admin, {
    club_id: clubId,
    period_id: period.id,
    entry_date: row.entry_date,
    description: row.description || "Opération",
    amount: num(row.amount),
    direction: row.direction === "out" ? "out" : "in",
    source_type: row.source_type,
    source_id: row.source_id,
    event_type: row.event_type,
    idempotency_key: key,
    status: decision.status,
    counter_account_id: financial?.id ?? null,
    category_account_id: category?.id ?? null,
    party_name: row.party_name,
    created_by: userId,
    audit_action: decision.autoValidated ? "auto_validate" : "create",
    lines: mapped,
  });

  await admin.from("accounting_inbox").update({ status: "posted", updated_at: new Date().toISOString() }).eq("id", row.id);
  return true;
}

function mapLines(lines: DraftLine[], accounts: AccountRecord[]) {
  const mapped = [];
  for (const line of lines) {
    const account = accountByCode(accounts, line.accountCode);
    if (!account) return null;
    mapped.push({
      account_id: account.id,
      debit: line.debit,
      credit: line.credit,
    });
  }
  return linesAreBalanced(lines) ? mapped : null;
}

async function reverseFromInbox(
  admin: Admin,
  clubId: string,
  userId: string | null,
  row: InboxRow,
  periods: PeriodRecord[]
): Promise<boolean> {
  const today = zurichToday();
  const period = periodFor(periods, today, true);
  if (!period) {
    await admin.from("accounting_inbox").update({ status: "blocked_closed_period" }).eq("id", row.id);
    return false;
  }

  const eventType = row.source_type === "expense" ? "payment_sent" : "payment_received";
  const { data: entry } = await admin
    .from("accounting_entries")
    .select("id, status, description, amount, source_type, source_id")
    .eq("club_id", clubId)
    .eq("source_type", row.source_type)
    .eq("source_id", row.source_id)
    .eq("event_type", eventType)
    .in("status", ["pending", "validated"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!entry) {
    await admin.from("accounting_inbox").update({ status: "posted" }).eq("id", row.id);
    return false;
  }

  if (entry.status === "pending") {
    await admin.from("accounting_entries").update({ status: "voided" }).eq("id", entry.id).eq("club_id", clubId);
    await audit(admin, clubId, "void", userId, entry.id as string, { status: "pending" }, { status: "voided" });
    await admin.from("accounting_inbox").update({ status: "reversed" }).eq("id", row.id);
    return true;
  }

  const { data: lines } = await admin
    .from("accounting_entry_lines")
    .select("account_id, debit, credit, line_order")
    .eq("entry_id", entry.id)
    .order("line_order");

  const reversed = (lines ?? []).map((line) => ({
    account_id: line.account_id,
    debit: num(line.credit as number),
    credit: num(line.debit as number),
  }));

  await postEntry(admin, {
    club_id: clubId,
    period_id: period.id,
    entry_date: today,
    description: `Extourne — ${entry.description}`,
    amount: num(entry.amount as number),
    direction: "reversal",
    source_type: row.source_type,
    source_id: row.source_id,
    event_type: "reversal",
    idempotency_key: row.idempotency_key,
    status: "validated",
    reversal_of_entry_id: entry.id,
    created_by: userId,
    audit_action: "reversal",
    lines: reversed,
  });

  await admin.from("accounting_inbox").update({ status: "reversed" }).eq("id", row.id);
  return true;
}

export async function confirmInbox(params: {
  clubId: string;
  userId: string;
  inboxId: string;
  financialAccountCode: string;
  categoryCode: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("accounting_inbox")
    .update({
      financial_account_code: params.financialAccountCode,
      category_code: params.categoryCode,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.inboxId)
    .eq("club_id", params.clubId)
    .in("status", ["awaiting_account", "awaiting_category", "awaiting_details", "pending"]);
  if (error) throw error;
  await audit(admin, params.clubId, "confirm_account", params.userId, null, null, {
    inboxId: params.inboxId,
    financialAccountCode: params.financialAccountCode,
    categoryCode: params.categoryCode,
  });
  return processAccountingInbox(params.clubId, params.userId);
}

export async function validateEntry(clubId: string, userId: string, entryId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("accounting_entries")
    .update({
      status: "validated",
      validated_by: userId,
      validated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("club_id", clubId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Écriture introuvable ou déjà traitée");
  await audit(admin, clubId, "validate", userId, entryId, { status: "pending" }, { status: "validated" });
}

export async function voidPendingEntry(clubId: string, userId: string, entryId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("accounting_entries")
    .update({ status: "voided" })
    .eq("id", entryId)
    .eq("club_id", clubId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Seule une écriture à vérifier peut être écartée");
  await audit(admin, clubId, "void", userId, entryId, { status: "pending" }, { status: "voided" });
}

export async function createManualEntry(params: {
  clubId: string;
  userId: string;
  date: string;
  amount: number;
  description: string;
  direction: "in" | "out";
  financialAccountCode: string;
  categoryCode: string;
  partyName?: string;
}) {
  const admin = createAdminClient();
  const access = await getAccountingAccess(params.clubId);
  if (!access.canWrite) throw new Error("Comptabilité inactive");
  if (access.startDate && params.date < access.startDate) {
    throw new Error("Cette date est antérieure au démarrage de la comptabilité");
  }
  const [accounts, periods] = await Promise.all([
    loadAccounts(admin, params.clubId),
    loadPeriods(admin, params.clubId),
  ]);
  const period = periodFor(periods, params.date, true);
  if (!period) throw new Error("Aucun exercice ouvert pour cette date");
  const financialAccount = accountByCode(accounts, params.financialAccountCode);
  if (!financialAccount || !isFinancialSystemCode(financialAccount.systemCode)) {
    throw new Error("Choisissez le compte qui a reçu ou payé ce montant");
  }
  const decision = decidePosting({
    amount: params.amount,
    entryDate: params.date,
    sourceType: "manual",
    sourceId: crypto.randomUUID(),
    eventType: params.direction === "out" ? "payment_sent" : "payment_received",
    direction: params.direction,
    financialAccountCode: params.financialAccountCode,
    categoryCode: params.categoryCode,
    autoValidate: access.autoValidate,
    periodClosed: false,
    beforeStart: access.startDate ? params.date < access.startDate : false,
  });
  if (decision.kind !== "post") {
    throw new Error("Compte ou catégorie à préciser");
  }
  const sourceId = crypto.randomUUID();
  const mapped = mapLines(decision.lines, accounts);
  if (!mapped) throw new Error("Compte introuvable dans le plan");
  return postEntry(admin, {
    club_id: params.clubId,
    period_id: period.id,
    entry_date: params.date,
    description: params.description,
    amount: roundChf(params.amount),
    direction: params.direction,
    source_type: "manual",
    source_id: sourceId,
    event_type: params.direction === "out" ? "payment_sent" : "payment_received",
    idempotency_key: `manual:${sourceId}:${params.direction === "out" ? "payment_sent" : "payment_received"}`,
    status: decision.status,
    counter_account_id: accountByCode(accounts, params.financialAccountCode)?.id,
    category_account_id: accountByCode(accounts, params.categoryCode)?.id,
    party_name: params.partyName ?? null,
    created_by: params.userId,
    audit_action: "manual_create",
    lines: mapped,
  });
}

export async function createTransfer(params: {
  clubId: string;
  userId: string;
  date: string;
  amount: number;
  description: string;
  fromAccountCode: string;
  toAccountCode: string;
}) {
  if (params.fromAccountCode === params.toAccountCode) {
    throw new Error("Choisissez deux comptes différents");
  }
  const amount = roundChf(params.amount);
  if (amount <= 0) throw new Error("Montant invalide");
  const admin = createAdminClient();
  const access = await getAccountingAccess(params.clubId);
  if (!access.canWrite) throw new Error("Comptabilité inactive");
  if (access.startDate && params.date < access.startDate) {
    throw new Error("Cette date est antérieure au démarrage de la comptabilité");
  }
  const [accounts, periods] = await Promise.all([
    loadAccounts(admin, params.clubId),
    loadPeriods(admin, params.clubId),
  ]);
  const period = periodFor(periods, params.date, true);
  if (!period) throw new Error("Aucun exercice ouvert pour cette date");
  const from = accountByCode(accounts, params.fromAccountCode);
  const to = accountByCode(accounts, params.toAccountCode);
  if (!from || !to || !isFinancialSystemCode(from.systemCode) || !isFinancialSystemCode(to.systemCode)) {
    throw new Error("Le transfert se fait entre deux comptes financiers");
  }
  const sourceId = crypto.randomUUID();
  return postEntry(admin, {
    club_id: params.clubId,
    period_id: period.id,
    entry_date: params.date,
    description: params.description || `Transfert vers ${to.name}`,
    amount,
    direction: "transfer",
    source_type: "manual",
    source_id: sourceId,
    event_type: "transfer",
    idempotency_key: `transfer:${sourceId}`,
    status: "pending",
    counter_account_id: from.id,
    category_account_id: to.id,
    created_by: params.userId,
    audit_action: "transfer",
    lines: [
      { account_id: to.id, debit: amount, credit: 0 },
      { account_id: from.id, debit: 0, credit: amount },
    ],
  });
}

export async function createAdvancedEntry(params: {
  clubId: string;
  userId: string;
  date: string;
  description: string;
  reference?: string;
  remark?: string;
  validateNow?: boolean;
  idempotencyKey?: string;
  lines: Array<{ accountId: string; debit: number; credit: number }>;
}) {
  const admin = createAdminClient();
  const access = await getAccountingAccess(params.clubId);
  if (!access.canWrite) throw new Error("Comptabilité inactive");
  if (access.startDate && params.date < access.startDate) {
    throw new Error("Cette date est antérieure au démarrage de la comptabilité");
  }
  const [accounts, periods] = await Promise.all([
    loadAccounts(admin, params.clubId),
    loadPeriods(admin, params.clubId),
  ]);
  const period = periodFor(periods, params.date, true);
  if (!period) throw new Error("Aucun exercice ouvert pour cette date");
  const assessed = assessAdvancedLines({
    clubId: params.clubId,
    lines: params.lines,
    accounts: accounts.map((account) => ({ id: account.id, clubId: params.clubId, isActive: account.isActive })),
  });
  if (!assessed.ok) throw new Error(assessed.message);
  const sourceId = crypto.randomUUID();
  const posted = await postEntry(admin, {
    club_id: params.clubId,
    period_id: period.id,
    entry_date: params.date,
    description: params.description.trim() || "Écriture comptable",
    amount: assessed.debit,
    direction: "adjustment",
    source_type: ADVANCED_SOURCE,
    source_id: sourceId,
    event_type: ADVANCED_EVENT,
    idempotency_key: params.idempotencyKey || `advanced:${sourceId}`,
    status: "pending",
    party_name: params.remark?.trim() || null,
    created_by: params.userId,
    audit_action: "advanced_create",
    lines: params.lines.map((line) => ({
      account_id: line.accountId,
      debit: roundChf(line.debit),
      credit: roundChf(line.credit),
    })),
  });
  if (params.reference?.trim()) {
    const { error } = await admin
      .from("accounting_entries")
      .update({ reference: params.reference.trim() })
      .eq("id", posted.id)
      .eq("club_id", params.clubId)
      .eq("status", "pending");
    if (error) throw error;
  }
  if (params.validateNow) await validateEntry(params.clubId, params.userId, posted.id);
  return posted;
}

export async function updateAdvancedEntry(params: {
  clubId: string;
  userId: string;
  entryId: string;
  date: string;
  description: string;
  reference?: string;
  remark?: string;
  lines: Array<{ accountId: string; debit: number; credit: number }>;
}) {
  const admin = createAdminClient();
  const { data: entry } = await admin
    .from("accounting_entries")
    .select("status, source_type, event_type")
    .eq("id", params.entryId)
    .eq("club_id", params.clubId)
    .maybeSingle();
  if (!entry || !canModifyAdvancedEntry({
    status: String(entry.status),
    sourceType: String(entry.source_type),
    eventType: String(entry.event_type),
  })) {
    throw new Error("Seule une écriture avancée à vérifier peut être modifiée");
  }
  const accounts = await loadAccounts(admin, params.clubId);
  const assessed = assessAdvancedLines({
    clubId: params.clubId,
    lines: params.lines,
    accounts: accounts.map((account) => ({ id: account.id, clubId: params.clubId, isActive: account.isActive })),
  });
  if (!assessed.ok) throw new Error(assessed.message);
  const { error } = await admin.rpc("accounting_update_advanced_entry", {
    p_payload: {
      club_id: params.clubId,
      entry_id: params.entryId,
      entry_date: params.date,
      description: params.description.trim() || "Écriture comptable",
      reference: params.reference?.trim() || "",
      remark: params.remark?.trim() || "",
      lines: params.lines.map((line) => ({
        account_id: line.accountId,
        debit: roundChf(line.debit),
        credit: roundChf(line.credit),
      })),
    },
  });
  if (error) throw new Error(error.message);
  await audit(admin, params.clubId, "advanced_update", params.userId, params.entryId, null, {
    description: params.description,
    lines: params.lines,
  });
}

export async function reverseAdvancedEntry(clubId: string, userId: string, entryId: string) {
  const admin = createAdminClient();
  const { data: entry } = await admin
    .from("accounting_entries")
    .select("id, status, description, amount, source_type, event_type, reversed_by_entry_id")
    .eq("id", entryId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!entry || entry.source_type !== ADVANCED_SOURCE || entry.event_type !== ADVANCED_EVENT) {
    throw new Error("Cette écriture ne s’extourne pas depuis le journal avancé");
  }
  if (entry.status !== "validated" || entry.reversed_by_entry_id) {
    throw new Error("Seule une écriture validée non extournée peut être extournée");
  }
  const periods = await loadPeriods(admin, clubId);
  const today = zurichToday();
  const period = periodFor(periods, today, true);
  if (!period) throw new Error("Aucun exercice ouvert pour cette date");
  const { data: lines } = await admin
    .from("accounting_entry_lines")
    .select("account_id, debit, credit")
    .eq("entry_id", entryId)
    .eq("club_id", clubId)
    .order("line_order");
  const reversed = buildReversalLines((lines ?? []).map((line) => ({
    accountId: String(line.account_id),
    debit: num(line.debit as number),
    credit: num(line.credit as number),
  })));
  return postEntry(admin, {
    club_id: clubId,
    period_id: period.id,
    entry_date: today,
    description: `Extourne — ${entry.description}`,
    amount: num(entry.amount as number),
    direction: "reversal",
    source_type: ADVANCED_SOURCE,
    source_id: entryId,
    event_type: "reversal",
    idempotency_key: `reversal:advanced:${entryId}`,
    status: "validated",
    reversal_of_entry_id: entryId,
    created_by: userId,
    audit_action: "advanced_reversal",
    lines: reversed.map((line) => ({
      account_id: line.accountId,
      debit: line.debit,
      credit: line.credit,
    })),
  });
}

export async function updateSettings(clubId: string, userId: string, autoValidate: boolean) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("accounting_settings")
    .update({ auto_validate: autoValidate, updated_at: new Date().toISOString() })
    .eq("club_id", clubId);
  if (error) throw error;
  await audit(admin, clubId, "settings", userId, null, null, { autoValidate });
}

export async function loadWorkspace(clubId: string) {
  await processAccountingInbox(clubId).catch((error) => {
    console.error("[accounting] process", error);
  });
  const admin = createAdminClient();
  const access = await getAccountingAccess(clubId);
  const [accounts, periods] = await Promise.all([
    loadAccounts(admin, clubId),
    loadPeriods(admin, clubId),
  ]);

  const current = periods.find((period) => period.status === "open") ?? periods[periods.length - 1];

  const [{ data: entries }, { data: lineRows }, { data: inbox }, { data: attachments }] = await Promise.all([
    admin
      .from("accounting_entries")
      .select("id, entry_number, entry_date, description, amount, direction, source_type, source_id, event_type, status, party_name, reference, counter_account_id, category_account_id, reversal_of_entry_id, reversed_by_entry_id, period_id, created_at, validated_at")
      .eq("club_id", clubId)
      .order("entry_date", { ascending: false })
      .limit(500),
    admin
      .from("accounting_entry_lines")
      .select("entry_id, account_id, debit, credit, line_order")
      .eq("club_id", clubId),
    admin
      .from("accounting_inbox")
      .select("id, description, amount, entry_date, status, source_type, source_id, party_name, financial_account_code, category_code, direction")
      .eq("club_id", clubId)
      .in("status", ["awaiting_account", "awaiting_category", "awaiting_details", "blocked_closed_period", "pending"])
      .order("entry_date", { ascending: false }),
    admin
      .from("accounting_attachments")
      .select("id, entry_id, file_name, storage_path")
      .eq("club_id", clubId),
  ]);

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const entryStatus = new Map((entries ?? []).map((entry) => [entry.id as string, entry.status as EntryStatus]));
  const entryDate = new Map((entries ?? []).map((entry) => [entry.id as string, entry.entry_date as string]));
  const entryEvent = new Map((entries ?? []).map((entry) => [entry.id as string, entry.event_type as string]));
  const entrySource = new Map((entries ?? []).map((entry) => [entry.id as string, entry.source_type as string]));

  const reportLines: ReportLine[] = (lineRows ?? []).map((line) => {
    const account = accountMap.get(line.account_id as string);
    return {
      entryId: line.entry_id as string,
      entryStatus: entryStatus.get(line.entry_id as string) ?? "pending",
      accountType: account?.accountType ?? "asset",
      accountNumber: account?.number ?? "",
      systemCode: account?.systemCode ?? null,
      debit: num(line.debit as number),
      credit: num(line.credit as number),
    };
  }).filter((line) => entrySource.get(line.entryId) !== "period_close" || line.accountType === "asset" || line.accountType === "liability" || line.accountType === "equity"
    ? true
    : true);

  const incomeLines = reportLines.filter((line) => {
    if (!current) return false;
    const date = entryDate.get(line.entryId);
    if (!date || date < current.startsOn || date > current.endsOn) return false;
    if (access.startDate && date < access.startDate) return false;
    if (entrySource.get(line.entryId) === "period_close") return false;
    if (entryEvent.get(line.entryId) === "opening") return false;
    return line.accountType === "revenue" || line.accountType === "expense";
  });

  const balanceLines = reportLines.filter((line) => {
    if (!current) return false;
    const date = entryDate.get(line.entryId);
    if (!date || date > current.endsOn) return false;
    if (access.startDate && date < access.startDate) return false;
    return true;
  });

  const income = officialTotals(incomeLines);
  const balance = officialTotals(balanceLines);
  const pendingEntries = (entries ?? []).filter((entry) => entry.status === "pending");
  const reviewInbox = inbox ?? [];
  const reviewAmount = roundChf(
    pendingEntries.reduce((sum, entry) => sum + num(entry.amount as number), 0) +
      reviewInbox.reduce((sum, item) => sum + num(item.amount as number), 0)
  );

  const linesByEntry = new Map<string, Array<{ accountId: string; debit: number; credit: number }>>();
  for (const line of lineRows ?? []) {
    const list = linesByEntry.get(line.entry_id as string) ?? [];
    list.push({
      accountId: line.account_id as string,
      debit: num(line.debit as number),
      credit: num(line.credit as number),
    });
    linesByEntry.set(line.entry_id as string, list);
  }

  const historyPending = access.startMode === "resume_current" && access.historyImportStatus !== "applied";
  const type = access.startDate && current
    ? resolveCoverageType({
        periodStart: current.startsOn,
        accountingStartDate: access.startDate,
        startMode: access.startMode,
        historyImportStatus: access.historyImportStatus,
      })
    : "full_period";
  const note = access.startDate && current
    ? coverageSentence({
        coverageType: type,
        accountingStartDate: access.startDate,
        periodEnd: current.endsOn,
        historyPending,
      })
    : null;

  return {
    access,
    accounts,
    periods,
    currentPeriod: current ?? null,
    coverage: {
      type,
      accountingStartDate: access.startDate,
      periodEnd: current?.endsOn ?? null,
      note,
    },
    summary: {
      revenue: income.revenue,
      expense: income.expense,
      result: income.result,
      bank: balance.bank,
      cash: balance.cash,
      stripe: balance.stripe,
      treasury: balance.treasury,
    },
    review: {
      count: pendingEntries.length + reviewInbox.length,
      amount: reviewAmount,
      inbox: reviewInbox,
      entries: pendingEntries,
    },
    entries: entries ?? [],
    linesByEntry: Object.fromEntries(linesByEntry),
    attachments: attachments ?? [],
    incomeLines,
    balanceLines,
  };
}

export async function clubUsesStripe(clubId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("club_payment_accounts")
    .select("status, provider_account_id")
    .eq("club_id", clubId)
    .eq("provider", "stripe")
    .maybeSingle();
  if (!data?.provider_account_id) return false;
  return data.status !== "not_connected" && data.status !== "disabled";
}

export async function completeOnboarding(
  clubId: string,
  userId: string,
  raw: Record<string, unknown>
) {
  const params = normalizeOnboardingInput(raw);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("accounting_settings")
    .select("onboarding_completed_at")
    .eq("club_id", clubId)
    .maybeSingle();
  if (existing?.onboarding_completed_at) return;

  const covered = resolveCoverageType({
    periodStart: params.periodStart,
    accountingStartDate: params.accountingStartDate,
    startMode: params.startMode,
    historyImportStatus: params.historyImportStatus,
  });
  const plan = buildFinalizePayload(clubId, userId, params, covered);
  if (!plan.resolved.ok) {
    console.error("[accounting][onboarding]", {
      missing_account_codes: plan.resolved.missing_account_codes,
      missing_account_ids: plan.resolved.missing_account_ids,
      cause: plan.resolved.missing_account_codes.length || plan.resolved.missing_account_ids.length
        ? "missing_opening_account"
        : "unbalanced_opening",
    });
    throw new Error(OPENING_PLAN_USER_MESSAGE);
  }

  const { data, error } = await admin.rpc("accounting_finalize_onboarding", {
    p_payload: plan.payload,
  });
  if (error) {
    const diagnostic = readOpeningDiagnostic(error);
    console.error("[accounting][onboarding]", {
      missing_account_codes: diagnostic.missing_account_codes,
      missing_account_ids: diagnostic.missing_account_ids,
      cause: error.message,
    });
    throw new Error(OPENING_PLAN_USER_MESSAGE);
  }

  const finalized = (data ?? {}) as { already?: boolean };
  if (finalized.already) return;

  if (params.includeExisting) {
    await backfillSince(admin, clubId, params.accountingStartDate);
  }
  await processAccountingInbox(clubId, userId);
  await audit(admin, clubId, "onboarding", userId, null, null, {
    accountingStartDate: params.accountingStartDate,
    periodStart: params.periodStart,
    coverage: covered,
    includeExisting: params.includeExisting,
    patrimony: params.others,
  });
}

async function backfillSince(admin: Admin, clubId: string, startDate: string) {
  const enqueue = async (args: Record<string, unknown>) => {
    const { error } = await admin.rpc("accounting_enqueue", args);
    if (error) console.error("[accounting] backfill", error.message);
  };

  const { data: docs } = await admin
    .from("documents")
    .select("id, type, status, total_ttc, date_paiement, title, numero, payment_method, stripe_payment_intent_id, sponsor_contract_id, notes")
    .eq("user_id", clubId)
    .is("deleted_at", null);

  for (const doc of docs ?? []) {
    const paid = doc.type === "quote"
      ? doc.status === "accepte" || doc.status === "paye"
      : doc.status === "paye";
    if (!paid) continue;
    const date = doc.date_paiement as string | null;
    if (!date || date < startDate) continue;
    const source = doc.type === "quote" ? "membership" : "invoice";
    const category = doc.type === "quote"
      ? "membership"
      : doc.sponsor_contract_id
        ? "sponsoring"
        : String(doc.notes || "").toLowerCase().includes("buvette")
          ? "buvette"
          : null;
    const financial = doc.payment_method === "stripe" || doc.stripe_payment_intent_id ? "stripe" : null;
    await enqueue({
      p_club: clubId,
      p_source_type: source,
      p_source_id: doc.id,
      p_event_type: "payment_received",
      p_direction: "in",
      p_amount: doc.total_ttc,
      p_fee: 0,
      p_entry_date: date,
      p_description: doc.title || doc.numero || "Paiement",
      p_party: null,
      p_financial: financial,
      p_category: category,
    });
  }

  const { data: expenses } = await admin
    .from("expenses")
    .select("id, amount, description, status, date")
    .eq("user_id", clubId)
    .eq("status", "paye")
    .is("deleted_at", null);
  for (const expense of expenses ?? []) {
    await enqueue({
      p_club: clubId,
      p_source_type: "expense",
      p_source_id: expense.id,
      p_event_type: "payment_sent",
      p_direction: "out",
      p_amount: expense.amount,
      p_fee: 0,
      p_entry_date: expense.date || startDate,
      p_description: expense.description,
      p_party: null,
      p_financial: null,
      p_category: null,
    });
  }

  const { data: orders } = await admin
    .from("shop_orders")
    .select("id, total_cents, paid_at, customer_first_name, customer_last_name")
    .eq("club_id", clubId)
    .eq("payment_status", "paid");
  for (const order of orders ?? []) {
    const date = order.paid_at ? String(order.paid_at).slice(0, 10) : null;
    if (!date || date < startDate) continue;
    await enqueue({
      p_club: clubId,
      p_source_type: "shop_order",
      p_source_id: order.id,
      p_event_type: "payment_received",
      p_direction: "in",
      p_amount: num(order.total_cents) / 100,
      p_fee: 0,
      p_entry_date: date,
      p_description: "Boutique",
      p_party: [order.customer_first_name, order.customer_last_name].filter(Boolean).join(" "),
      p_financial: "stripe",
      p_category: "shop",
    });
  }

  const { data: supporters } = await admin
    .from("supporters")
    .select("id, amount_paid_cents, activated_at, first_name, last_name")
    .eq("club_id", clubId)
    .eq("status", "active");
  for (const supporter of supporters ?? []) {
    const date = supporter.activated_at ? String(supporter.activated_at).slice(0, 10) : null;
    if (!date || date < startDate) continue;
    await enqueue({
      p_club: clubId,
      p_source_type: "supporter",
      p_source_id: supporter.id,
      p_event_type: "payment_received",
      p_direction: "in",
      p_amount: num(supporter.amount_paid_cents) / 100,
      p_fee: 0,
      p_entry_date: date,
      p_description: "Carte supporter",
      p_party: [supporter.first_name, supporter.last_name].filter(Boolean).join(" "),
      p_financial: "stripe",
      p_category: "supporters",
    });
  }

  const { data: revenues } = await admin
    .from("club_revenues")
    .select("id, amount, revenue_date, name, source_type, source_id")
    .eq("user_id", clubId)
    .is("deleted_at", null);
  for (const revenue of revenues ?? []) {
    const date = (revenue.revenue_date as string) || startDate;
    if (date < startDate) continue;
    const sourceType = revenue.source_type || "club_revenue";
    await enqueue({
      p_club: clubId,
      p_source_type: sourceType,
      p_source_id: revenue.source_id || revenue.id,
      p_event_type: "payment_received",
      p_direction: "in",
      p_amount: revenue.amount,
      p_fee: 0,
      p_entry_date: date,
      p_description: revenue.name,
      p_party: null,
      p_financial: null,
      p_category: sourceType === "support_sale" ? "support_sale" : null,
    });
  }
}

export async function closePeriod(params: {
  clubId: string;
  userId: string;
  periodId: string;
  transferResult: boolean;
}) {
  const admin = createAdminClient();
  const workspace = await loadWorkspace(params.clubId);
  const period = workspace.periods.find((item) => item.id === params.periodId);
  if (!period || period.status !== "open") throw new Error("Exercice introuvable");
  if (workspace.review.count > 0) {
    throw new Error("Il reste des opérations à vérifier");
  }

  if (params.transferResult && workspace.summary.result !== 0) {
    const accounts = workspace.accounts;
    const lines: Array<{ account_id: string; debit: number; credit: number }> = [];
    const balances = new Map<string, { type: AccountType; debit: number; credit: number }>();
    for (const line of workspace.balanceLines) {
      if (line.entryStatus !== "validated") continue;
      if (line.accountType !== "revenue" && line.accountType !== "expense") continue;
      const account = accounts.find((item) => item.number === line.accountNumber);
      if (!account) continue;
      const current = balances.get(account.id) ?? { type: line.accountType, debit: 0, credit: 0 };
      current.debit = roundChf(current.debit + line.debit);
      current.credit = roundChf(current.credit + line.credit);
      balances.set(account.id, current);
    }
    for (const [accountId, balance] of balances) {
      const net = balance.type === "revenue"
        ? roundChf(balance.credit - balance.debit)
        : roundChf(balance.debit - balance.credit);
      if (net <= 0) continue;
      if (balance.type === "revenue") lines.push({ account_id: accountId, debit: net, credit: 0 });
      else lines.push({ account_id: accountId, debit: 0, credit: net });
    }
    const retained = accounts.find((account) => account.systemCode === "retained");
    if (!retained) throw new Error("Compte 2900 introuvable");
    const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
    const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
    const plug = roundChf(debit - credit);
    if (plug > 0) lines.push({ account_id: retained.id, debit: 0, credit: plug });
    else if (plug < 0) lines.push({ account_id: retained.id, debit: roundChf(Math.abs(plug)), credit: 0 });
    if (lines.length >= 2) {
      await postEntry(admin, {
        club_id: params.clubId,
        period_id: period.id,
        entry_date: period.endsOn,
        description: "Report du résultat",
        amount: Math.abs(plug),
        direction: "adjustment",
        source_type: "period_close",
        source_id: period.id,
        event_type: "adjustment",
        idempotency_key: `period_close:${period.id}`,
        status: "validated",
        category_account_id: retained.id,
        created_by: params.userId,
        audit_action: "period_close",
        lines,
      });
    }
  }

  await admin
    .from("accounting_periods")
    .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: params.userId })
    .eq("id", period.id)
    .eq("club_id", params.clubId);

  const nextStart = addDays(period.endsOn, 1);
  const nextEnd = `${Number(nextStart.slice(0, 4))}-12-31`;
  await admin.from("accounting_periods").upsert({
    club_id: params.clubId,
    label: nextStart.slice(0, 4),
    starts_on: nextStart,
    ends_on: nextEnd,
    status: "open",
  }, { onConflict: "club_id,starts_on" });

  await audit(admin, params.clubId, "close_period", params.userId, null, null, {
    periodId: period.id,
    transferResult: params.transferResult,
  });
}

export async function reopenPeriod(clubId: string, userId: string, periodId: string, reason: string) {
  const admin = createAdminClient();
  if (!reason.trim()) throw new Error("Un motif de réouverture est requis");
  const { error } = await admin
    .from("accounting_periods")
    .update({
      status: "open",
      reopened_at: new Date().toISOString(),
      reopened_by: userId,
      reopen_reason: reason.trim(),
    })
    .eq("id", periodId)
    .eq("club_id", clubId)
    .eq("status", "closed");
  if (error) throw error;
  await audit(admin, clubId, "reopen_period", userId, null, null, { periodId, reason });
}

export async function createAccount(params: {
  clubId: string;
  userId: string;
  number: string;
  name: string;
  accountType: AccountType;
}) {
  const admin = createAdminClient();
  const number = params.number.trim();
  const name = params.name.trim();
  if (!/^\d{3,6}$/.test(number)) throw new Error("Numéro comptable invalide");
  if (!name) throw new Error("Le compte a besoin d’un nom");
  const { data: existing } = await admin
    .from("accounting_accounts")
    .select("id")
    .eq("club_id", params.clubId)
    .eq("number", number)
    .maybeSingle();
  if (existing) throw new Error("Ce numéro comptable est déjà utilisé");
  const accountClass = Number(number.charAt(0)) || 1;
  const { error } = await admin.from("accounting_accounts").insert({
    club_id: params.clubId,
    number,
    name,
    account_type: params.accountType,
    account_class: accountClass,
    is_active: true,
    is_system: false,
  });
  if (error) throw error;
  await audit(admin, params.clubId, "create_account", params.userId, null, null, {
    number,
    name,
  });
}

export async function updateAccount(params: {
  clubId: string;
  userId: string;
  accountId: string;
  name?: string;
  number?: string;
  isActive?: boolean;
}) {
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounting_accounts")
    .select("id, number, name, is_system, is_active")
    .eq("id", params.accountId)
    .eq("club_id", params.clubId)
    .maybeSingle();
  if (!account) throw new Error("Compte introuvable");

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.name) patch.name = params.name.trim();
  if (typeof params.isActive === "boolean") {
    if (params.isActive === false && account.is_system) {
      throw new Error("Ce compte système ne peut pas être désactivé");
    }
    patch.is_active = params.isActive;
  }
  if (params.number && params.number !== account.number) {
    const nextNumber = params.number.trim();
    if (!/^\d{3,6}$/.test(nextNumber)) throw new Error("Numéro comptable invalide");
    if (account.is_system) {
      throw new Error("Le numéro d’un compte système ne change pas. Le libellé reste modifiable.");
    }
    const { data: clash } = await admin
      .from("accounting_accounts")
      .select("id")
      .eq("club_id", params.clubId)
      .eq("number", nextNumber)
      .neq("id", params.accountId)
      .maybeSingle();
    if (clash) throw new Error("Ce numéro comptable est déjà utilisé");
    const { data: lines } = await admin
      .from("accounting_entry_lines")
      .select("entry_id")
      .eq("account_id", params.accountId);
    const entryIds = [...new Set((lines ?? []).map((line) => line.entry_id as string))];
    if (entryIds.length > 0) {
      const { count } = await admin
        .from("accounting_entries")
        .select("id", { count: "exact", head: true })
        .in("id", entryIds)
        .in("status", ["validated", "reversed"]);
      if (count) throw new Error("Le numéro ne peut plus changer : des écritures validées utilisent ce compte");
    }
    patch.number = nextNumber;
  }
  const { error } = await admin.from("accounting_accounts").update(patch).eq("id", params.accountId);
  if (error) throw error;
  await audit(admin, params.clubId, "update_account", params.userId, null, account, patch);
}

export async function attachFile(params: {
  clubId: string;
  userId: string;
  entryId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("accounting_attachments").insert({
    club_id: params.clubId,
    entry_id: params.entryId,
    storage_bucket: "expenses",
    storage_path: params.storagePath,
    file_name: params.fileName,
    mime_type: params.mimeType,
    created_by: params.userId,
  });
  if (error) throw error;
  await audit(admin, params.clubId, "attachment", params.userId, params.entryId, null, {
    fileName: params.fileName,
  });
}

export async function listOpenItems(clubId: string, endDate: string) {
  const admin = createAdminClient();
  const [{ data: docs }, { data: expenses }] = await Promise.all([
    admin
      .from("documents")
      .select("id, type, numero, title, total_ttc, status, date_echeance")
      .eq("user_id", clubId)
      .is("deleted_at", null)
      .lte("date_creation", endDate),
    admin
      .from("expenses")
      .select("id, description, amount, date, status")
      .eq("user_id", clubId)
      .is("deleted_at", null)
      .lte("date", endDate),
  ]);

  const receivables = (docs ?? []).filter((doc) => {
    if (doc.type === "quote") return doc.status !== "accepte" && doc.status !== "paye" && doc.status !== "refuse" && doc.status !== "annule";
    return doc.status !== "paye" && doc.status !== "annule";
  });
  const payables = (expenses ?? []).filter((expense) => expense.status === "a_payer");
  return {
    receivables,
    payables,
    receivableTotal: roundChf(receivables.reduce((sum, doc) => sum + num(doc.total_ttc as number), 0)),
    payableTotal: roundChf(payables.reduce((sum, expense) => sum + num(expense.amount as number), 0)),
  };
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function recordExport(clubId: string, userId: string, kind: string) {
  const admin = createAdminClient();
  await audit(admin, clubId, "export", userId, null, null, { kind });
}
