import { createAdminClient } from "@/lib/supabase/admin";
import {
  decidePosting,
  inboxHoldMessage,
  linesAreBalanced,
  officialTotals,
} from "./engine";
import { roundChf } from "./money";
import { zurichToday } from "./format";
import { isAccountingDevEmail } from "./devAccess";
import { isFinancialSystemCode } from "./financialAccounts";
import {
  CLOSED_PERIOD_MESSAGE,
  accountAllowed,
  explainJournalError,
  journalLinesBalanced,
  resolveJournalStatus,
} from "./journalGrid";
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
import { fetchAllPages } from "./paging";
import { BRIDGE_EDIT_MESSAGE, planBridgeCorrection } from "./transitory";
import {
  accumulatePnl,
  assertExplicitClose,
  closingTransferLines,
  followingPeriod,
  inboxProcessingDecision,
  operationsBlockingClose,
  periodCoveringDate,
  planOpenFollowingPeriod,
  type CloseEntry,
  type InboxActor,
} from "./closePeriod";
import { groupUsesNumber, loadAccountingExtras } from "./extras";
import {
  OPENING_PLAN_USER_MESSAGE,
  buildFinalizePayload,
  readOpeningDiagnostic,
} from "./openingPlan";
import {
  planOpeningCorrection,
  planTakeover,
  takeoverInputFromBody,
  takeoverRpcPayload,
} from "./takeover";
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
  const [{ data: addon }, settingsResult] = await Promise.all([
    admin
      .from("club_addons")
      .select("status, current_period_end")
      .eq("club_id", clubId)
      .eq("addon_key", "accounting")
      .maybeSingle(),
    admin
      .from("accounting_settings")
      .select("onboarding_completed_at, start_date, auto_validate, start_mode, history_import_status, numbering_notice, stripe_payout_account_id")
      .eq("club_id", clubId)
      .maybeSingle(),
  ]);
  let settings = settingsResult.data;
  if (settingsResult.error && /numbering_notice|stripe_payout_account_id/.test(settingsResult.error.message || "")) {
    const legacy = await admin
      .from("accounting_settings")
      .select("onboarding_completed_at, start_date, auto_validate, start_mode, history_import_status")
      .eq("club_id", clubId)
      .maybeSingle();
    settings = legacy.data
      ? { ...legacy.data, numbering_notice: null, stripe_payout_account_id: null }
      : null;
  }

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
    numberingNotice: (settings?.numbering_notice as string | null) || null,
    stripePayoutAccountId: (settings?.stripe_payout_account_id as string | null) || null,
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
  return periodCoveringDate(periods, date, openOnly);
}

async function bridgeHalves(admin: Admin, clubId: string, entryId: string) {
  const { data, error } = await admin
    .from("document_receipts")
    .select("id, entry_id, release_entry_id, accrual_entry_id")
    .eq("club_id", clubId)
    .or(`entry_id.eq.${entryId},accrual_entry_id.eq.${entryId},release_entry_id.eq.${entryId}`)
    .limit(1);
  if (error) {
    if (/column|schema cache|accrual_entry_id/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  const receipt = data?.[0];
  if (!receipt) return null;
  const ids = [receipt.entry_id, receipt.release_entry_id].filter((id): id is string => Boolean(id));
  const { data: direct, error: directError } = ids.length
    ? await admin.from("accounting_entries").select("id, status, period_id, bridge_receipt_id").eq("club_id", clubId).in("id", ids)
    : { data: [], error: null };
  if (directError) {
    if (/bridge_receipt_id|column|schema cache/i.test(directError.message)) return null;
    throw new Error(directError.message);
  }
  const { data: bridged, error: bridgedError } = await admin
    .from("accounting_entries")
    .select("id, status, period_id, bridge_receipt_id")
    .eq("club_id", clubId)
    .eq("bridge_receipt_id", receipt.id);
  if (bridgedError) {
    if (/bridge_receipt_id|column|schema cache/i.test(bridgedError.message)) return null;
    throw new Error(bridgedError.message);
  }
  const rows = new Map<string, { id: string; status: string; period_id: string | null }>();
  for (const row of [...(direct ?? []), ...(bridged ?? [])]) {
    if (row.bridge_receipt_id && row.bridge_receipt_id !== receipt.id) continue;
    rows.set(String(row.id), { id: String(row.id), status: String(row.status), period_id: row.period_id ? String(row.period_id) : null });
  }
  return [...rows.values()];
}

async function refuseBridgeEdit(admin: Admin, clubId: string, entryId: string) {
  const halves = await bridgeHalves(admin, clubId, entryId);
  if (!halves || halves.length === 0) return;
  const periods = await loadPeriods(admin, clubId);
  const decision = planBridgeCorrection(halves.map((half) => ({
    id: half.id,
    status: half.status,
    periodStatus: periods.find((period) => period.id === half.period_id)?.status || "closed",
  })));
  if (!decision.ok) throw new Error(decision.message);
  throw new Error(BRIDGE_EDIT_MESSAGE);
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

export async function processAccountingInbox(
  clubId: string,
  userId: string | null = null,
  actor: InboxActor = userId ? "user" : "system"
) {
  const admin = createAdminClient();
  const access = await getAccountingAccess(clubId);
  const decision = inboxProcessingDecision({
    actor,
    onboarded: access.onboarded,
    canWrite: access.canWrite,
    userId,
  });
  if (!decision.ok) {
    if (decision.silent) return { posted: 0, created: 0, already: 0, voided: 0, held: [] };
    throw new Error(decision.reason);
  }

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
  let created = 0;
  let already = 0;
  let voided = 0;
  const held: Array<{ label: string; reason: string }> = [];
  for (const raw of rows ?? []) {
    const row = raw as InboxRow;
    const label = (row.party_name || row.description || "Opération").trim() || "Opération";
    try {
      const outcome = await processInboxRow(
        admin,
        clubId,
        actor === "user" ? userId : null,
        row,
        accounts,
        periods,
        access.autoValidate,
        access.startDate,
        actor
      );
      if (outcome.kind === "created" || outcome.kind === "already" || outcome.kind === "voided") posted += 1;
      if (outcome.kind === "created") created += 1;
      if (outcome.kind === "already") already += 1;
      if (outcome.kind === "voided") voided += 1;
      if (outcome.kind === "held") held.push({ label, reason: outcome.reason });
    } catch (err) {
      console.error("[accounting] inbox", row.id, err);
      held.push({ label, reason: err instanceof Error ? err.message : "Écriture impossible." });
    }
  }
  return { posted, created, already, voided, held };
}

async function processInboxRow(
  admin: Admin,
  clubId: string,
  userId: string | null,
  row: InboxRow,
  accounts: AccountRecord[],
  periods: PeriodRecord[],
  autoValidate: boolean,
  startDate: string | null,
  actor: InboxActor
): Promise<{ kind: "created" | "already" | "voided" | "skipped" } | { kind: "held"; reason: string }> {
  if (row.event_type === "payment_reversed") {
    return reverseFromInbox(admin, clubId, userId, row, periods, actor);
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
    return { kind: "held", reason: inboxHoldMessage("before_start") };
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
    const reason = decision.kind === "blocked"
      ? inboxHoldMessage("closed_period")
      : inboxHoldMessage(status === "awaiting_account" ? "awaiting_account" : status === "awaiting_details" ? "awaiting_details" : "awaiting_category");
    return { kind: "held", reason };
  }

  const period = periodFor(periods, row.entry_date, true);
  if (!period) {
    await admin.from("accounting_inbox").update({ status: "blocked_closed_period" }).eq("id", row.id);
    return { kind: "held", reason: inboxHoldMessage("closed_period") };
  }

  const mapped = mapLines(decision.lines, accounts);
  if (!mapped) {
    await admin.from("accounting_inbox").update({ status: "awaiting_category" }).eq("id", row.id);
    return { kind: "held", reason: inboxHoldMessage("unknown_account") };
  }

  const financial = accountByCode(accounts, row.financial_account_code);
  const category = accountByCode(accounts, row.category_code);
  const key = await entryKey(admin, clubId, row.idempotency_key);

  const posted = await postEntry(admin, {
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
    audit_action: actor === "system"
      ? (decision.autoValidated ? "system_auto_validate" : "system_create")
      : (decision.autoValidated ? "auto_validate" : "create"),
    lines: mapped,
  });

  await admin.from("accounting_inbox").update({ status: "posted", updated_at: new Date().toISOString() }).eq("id", row.id);
  return posted.created ? { kind: "created" } : { kind: "already" };
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
  periods: PeriodRecord[],
  actor: InboxActor
): Promise<{ kind: "created" | "already" | "voided" | "skipped" } | { kind: "held"; reason: string }> {
  const today = zurichToday();
  const period = periodFor(periods, today, true);
  if (!period) {
    await admin.from("accounting_inbox").update({ status: "blocked_closed_period" }).eq("id", row.id);
    return { kind: "held", reason: inboxHoldMessage("closed_period") };
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
    return { kind: "skipped" };
  }

  if (entry.status === "pending") {
    await admin.from("accounting_entries").update({ status: "voided" }).eq("id", entry.id).eq("club_id", clubId);
    await audit(admin, clubId, "void", userId, entry.id as string, { status: "pending" }, { status: "voided" });
    await admin.from("accounting_inbox").update({ status: "reversed" }).eq("id", row.id);
    return { kind: "voided" };
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

  const reversal = await postEntry(admin, {
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
    audit_action: actor === "system" ? "system_reversal" : "reversal",
    lines: reversed,
  });

  await admin.from("accounting_inbox").update({ status: "reversed" }).eq("id", row.id);
  return reversal.created ? { kind: "created" } : { kind: "already" };
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
  return processAccountingInbox(params.clubId, params.userId, "user");
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

export async function saveJournalEntry(params: {
  clubId: string;
  userId: string;
  entryId?: string;
  entryNumber?: number;
  date: string;
  description: string;
  reference?: string;
  remark?: string;
  status?: string;
  material?: boolean;
  idempotencyKey?: string;
  lines: Array<{ accountId: string; debit: number; credit: number }>;
}) {
  const admin = createAdminClient();
  const access = await getAccountingAccess(params.clubId);
  if (!access.canWrite) throw new Error("Comptabilité inactive");
  if (access.startDate && params.date < access.startDate) {
    throw new Error("Cette date est antérieure au démarrage de la comptabilité");
  }
  const accounts = await loadAccounts(admin, params.clubId);
  const known = accounts.map((account) => ({ id: account.id, clubId: params.clubId, isActive: account.isActive }));
  for (const line of params.lines) {
    if (!accountAllowed(known.find((account) => account.id === line.accountId), params.clubId)) {
      throw new Error("Compte introuvable dans le plan de ce club.");
    }
  }
  if (!journalLinesBalanced(params.lines)) {
    throw new Error("L’écriture doit être équilibrée avant d’être enregistrée.");
  }
  const assessed = assessAdvancedLines({ clubId: params.clubId, lines: params.lines, accounts: known });
  if (!assessed.ok) throw new Error(assessed.message);

  if (params.entryId) {
    const { data: current } = await admin
      .from("accounting_entries")
      .select("id, status, entry_number, entry_date, description, reference, party_name, amount, period_id, reversed_by_entry_id, reversal_of_entry_id, source_type")
      .eq("id", params.entryId)
      .eq("club_id", params.clubId)
      .maybeSingle();
    if (!current) throw new Error("Écriture introuvable");
    await refuseBridgeEdit(admin, params.clubId, params.entryId);
    if (current.status === "voided") throw new Error("Cette écriture a déjà été retirée du journal.");
    if (!["pending", "validated", "reversed"].includes(String(current.status))) {
      throw new Error("Cette écriture ne peut plus être modifiée");
    }
    const periods = await loadPeriods(admin, params.clubId);
    const currentPeriod = periods.find((period) => period.id === current.period_id);
    if (!currentPeriod || currentPeriod.status !== "open") throw new Error(CLOSED_PERIOD_MESSAGE);
    const target = periodFor(periods, params.date, false);
    if (target?.status === "closed") throw new Error(CLOSED_PERIOD_MESSAGE);
    if (!target || target.status !== "open") throw new Error("Aucun exercice ouvert pour cette date");
    const counterpartId = (current.reversed_by_entry_id || current.reversal_of_entry_id) as string | null;
    let voidCounterpartId: string | null = null;
    if (counterpartId) {
      const { data: counterpart } = await admin
        .from("accounting_entries")
        .select("id, status, period_id")
        .eq("id", counterpartId)
        .eq("club_id", params.clubId)
        .maybeSingle();
      if (counterpart && counterpart.status !== "voided") {
        const counterpartPeriod = periods.find((period) => period.id === counterpart.period_id);
        if (!counterpartPeriod || counterpartPeriod.status !== "open") throw new Error(CLOSED_PERIOD_MESSAGE);
        voidCounterpartId = String(counterpart.id);
      }
    }
    const nextNumber = params.entryNumber && params.entryNumber > 0 ? Math.trunc(params.entryNumber) : Number(current.entry_number);
    const numberManual = nextNumber !== Number(current.entry_number);
    const resolved = resolveJournalStatus({
      previous: String(current.status),
      requested: params.status === "validated" ? "validated" : "pending",
      material: Boolean(params.material),
      balanced: true,
    });
    if ("error" in resolved) throw new Error(resolved.error);
    const { data: previousLineRows } = await admin
      .from("accounting_entry_lines")
      .select("account_id, debit, credit, line_order")
      .eq("entry_id", params.entryId)
      .eq("club_id", params.clubId)
      .order("line_order");
    const previousLines = (previousLineRows || []).map((line) => ({
      accountId: String(line.account_id),
      debit: num(line.debit as number),
      credit: num(line.credit as number),
    }));
    const { data: updated, error } = await admin.rpc("accounting_update_pending_entry", {
      p_payload: {
        club_id: params.clubId,
        entry_id: params.entryId,
        entry_date: params.date,
        entry_number: nextNumber,
        number_manual: numberManual,
        user_id: params.userId,
        period_id: target.id,
        description: params.description.trim() || "Écriture",
        reference: params.reference?.trim() || "",
        remark: params.remark?.trim() || "",
        status: resolved.status,
        void_counterpart_id: voidCounterpartId,
        lines: params.lines.map((line) => ({
          account_id: line.accountId,
          debit: roundChf(line.debit),
          credit: roundChf(line.credit),
        })),
      },
    });
    if (error) throw new Error(explainJournalError(error.message));
    const savedRow = (updated ?? {}) as { entry_number?: number; notice?: string | null };
    await audit(admin, params.clubId, "journal_update", params.userId, params.entryId, {
      entryNumber: current.entry_number,
      date: current.entry_date,
      description: current.description,
      reference: current.reference,
      remark: current.party_name,
      amount: current.amount,
      status: current.status,
      lines: previousLines,
    }, {
      entryNumber: Number(savedRow.entry_number || nextNumber),
      date: params.date,
      description: params.description,
      reference: params.reference || "",
      remark: params.remark || "",
      status: resolved.status,
      lines: params.lines,
    });
    return {
      id: params.entryId,
      status: resolved.status,
      entryNumber: Number(savedRow.entry_number || nextNumber),
      notice: savedRow.notice || null,
    };
  }

  const periods = await loadPeriods(admin, params.clubId);
  const covering = periodFor(periods, params.date, false);
  if (covering?.status === "closed") throw new Error(CLOSED_PERIOD_MESSAGE);
  const period = covering?.status === "open" ? covering : undefined;
  if (!period) throw new Error("Aucun exercice ouvert pour cette date");
  const sourceId = crypto.randomUUID();
  return postEntry(admin, {
    club_id: params.clubId,
    period_id: period.id,
    entry_date: params.date,
    description: params.description.trim() || "Écriture",
    amount: assessed.debit,
    direction: "adjustment",
    source_type: "manual",
    source_id: sourceId,
    event_type: "manual_journal",
    idempotency_key: params.idempotencyKey || `journal:${sourceId}`,
    status: "pending",
    party_name: params.remark?.trim() || null,
    created_by: params.userId,
    audit_action: "journal_create",
    lines: params.lines.map((line) => ({
      account_id: line.accountId,
      debit: roundChf(line.debit),
      credit: roundChf(line.credit),
    })),
  }).then(async (posted) => {
    if (params.reference?.trim()) {
      await admin.from("accounting_entries").update({ reference: params.reference.trim() }).eq("id", posted.id).eq("club_id", params.clubId);
    }
    return posted;
  });
}

export async function voidJournalEntry(clubId: string, userId: string, entryId: string) {
  const admin = createAdminClient();
  const { data: entry } = await admin
    .from("accounting_entries")
    .select("id, status, entry_number, entry_date, description, amount, reference, party_name, source_type, event_type, period_id, reversed_by_entry_id, reversal_of_entry_id")
    .eq("id", entryId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!entry) throw new Error("Écriture introuvable");
  const halves = await bridgeHalves(admin, clubId, entryId);
  if (halves && halves.length > 0) {
    const bridgePeriods = await loadPeriods(admin, clubId);
    const decision = planBridgeCorrection(halves.map((half) => ({
      id: half.id,
      status: half.status,
      periodStatus: bridgePeriods.find((item) => item.id === half.period_id)?.status || "closed",
    })));
    if (!decision.ok) throw new Error(decision.message);
    const { error: bridgeError } = await admin.rpc("accounting_void_receipt_bridge", {
      p_club: clubId,
      p_entry: entryId,
    });
    if (bridgeError) {
      if (/schema cache|Could not find the function/i.test(bridgeError.message)) {
        throw new Error("Le retrait d'un encaissement transitoire demande la migration 104. Aucune écriture n'a été retirée.");
      }
      throw new Error(bridgeError.message.split("\n")[0] || bridgeError.message);
    }
    await audit(admin, clubId, "journal_void", userId, entryId, entry, {
      status: "voided",
      voidedCounterpart: decision.voidIds.filter((id) => id !== entryId).join(","),
    });
    return {
      id: entryId,
      sourceType: String(entry.source_type),
      voidedCounterpart: decision.voidIds.find((id) => id !== entryId) || null,
    };
  }
  if (entry.status === "voided") throw new Error("Cette écriture a déjà été retirée du journal.");
  if (!["pending", "validated", "reversed"].includes(String(entry.status))) {
    throw new Error("Cette écriture ne peut plus être supprimée");
  }
  const periods = await loadPeriods(admin, clubId);
  const period = periods.find((item) => item.id === entry.period_id);
  if (!period || period.status !== "open") throw new Error(CLOSED_PERIOD_MESSAGE);
  const counterpartId = (entry.reversed_by_entry_id || entry.reversal_of_entry_id) as string | null;
  if (counterpartId) {
    const { data: counterpart } = await admin
      .from("accounting_entries")
      .select("id, status, period_id")
      .eq("id", counterpartId)
      .eq("club_id", clubId)
      .maybeSingle();
    if (counterpart && counterpart.status !== "voided") {
      const counterpartPeriod = periods.find((item) => item.id === counterpart.period_id);
      if (!counterpartPeriod || counterpartPeriod.status !== "open") throw new Error(CLOSED_PERIOD_MESSAGE);
    }
  }
  const { data: lineRows } = await admin
    .from("accounting_entry_lines")
    .select("account_id, debit, credit")
    .eq("entry_id", entryId)
    .eq("club_id", clubId);
  const { data: voided, error } = await admin.rpc("accounting_void_journal_entry", {
    p_club: clubId,
    p_entry: entryId,
  });
  let counterpart: string | null = null;
  if (error && /accounting_void_journal_entry|schema cache|Could not find the function/i.test(error.message)) {
    if (entry.status === "reversed" || counterpartId) {
      throw new Error("La base doit d’abord recevoir la migration du journal pour retirer une écriture extournée ou liée.");
    }
    const { error: legacyError } = await admin
      .from("accounting_entries")
      .update({ status: "voided" })
      .eq("id", entryId)
      .eq("club_id", clubId);
    if (legacyError) throw new Error(legacyError.message);
  } else if (error) {
    throw new Error(error.message);
  } else {
    counterpart = (voided as { voided_counterpart?: string | null } | null)?.voided_counterpart || null;
  }
  await audit(admin, clubId, "journal_void", userId, entryId, { ...entry, lines: lineRows || [] }, {
    status: "voided",
    voidedCounterpart: counterpart,
  });
  return { id: entryId, sourceType: String(entry.source_type), voidedCounterpart: counterpart };
}

export async function correctJournalEntry(clubId: string, userId: string, entryId: string) {
  const admin = createAdminClient();
  const { data: entry } = await admin
    .from("accounting_entries")
    .select("id, status, description, amount, reference, party_name, entry_date, reversed_by_entry_id")
    .eq("id", entryId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!entry) throw new Error("Écriture introuvable");
  await refuseBridgeEdit(admin, clubId, entryId);
  if (entry.status !== "validated" || entry.reversed_by_entry_id) {
    throw new Error("Seule une écriture validée non extournée peut être corrigée");
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
  const original = (lines ?? []).map((line) => ({
    accountId: String(line.account_id),
    debit: num(line.debit as number),
    credit: num(line.credit as number),
  }));
  const reversed = buildReversalLines(original);
  await postEntry(admin, {
    club_id: clubId,
    period_id: period.id,
    entry_date: today,
    description: `Extourne — ${entry.description}`,
    amount: num(entry.amount as number),
    direction: "reversal",
    source_type: "manual",
    source_id: entryId,
    event_type: "reversal",
    idempotency_key: `reversal:journal:${entryId}`,
    status: "validated",
    reversal_of_entry_id: entryId,
    created_by: userId,
    audit_action: "journal_reversal",
    lines: reversed.map((line) => ({
      account_id: line.accountId,
      debit: line.debit,
      credit: line.credit,
    })),
  });
  const sourceId = crypto.randomUUID();
  return postEntry(admin, {
    club_id: clubId,
    period_id: period.id,
    entry_date: String(entry.entry_date),
    description: String(entry.description || "Correction"),
    amount: num(entry.amount as number),
    direction: "adjustment",
    source_type: "manual",
    source_id: sourceId,
    event_type: "manual_journal",
    idempotency_key: `correction:${entryId}`,
    status: "pending",
    party_name: entry.party_name ? String(entry.party_name) : null,
    created_by: userId,
    audit_action: "journal_correction",
    lines: original.map((line) => ({
      account_id: line.accountId,
      debit: line.debit,
      credit: line.credit,
    })),
  });
}

export async function clearNumberingNotice(clubId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("accounting_settings")
    .update({ numbering_notice: null })
    .eq("club_id", clubId);
  if (error && !/numbering_notice/.test(error.message || "")) throw error;
}

export async function updateSettings(
  clubId: string,
  userId: string,
  autoValidate: boolean,
  payoutAccountId?: string | null,
) {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    auto_validate: autoValidate,
    updated_at: new Date().toISOString(),
  };
  if (payoutAccountId !== undefined) patch.stripe_payout_account_id = payoutAccountId || null;
  const { error } = await admin.from("accounting_settings").update(patch).eq("club_id", clubId);
  if (error) {
    if (/stripe_payout_account_id/.test(error.message || "")) {
      throw new Error("Le compte de versement Stripe n'est pas encore disponible. Appliquez la migration 102.");
    }
    throw error;
  }
  if (payoutAccountId) {
    const pending = await admin.rpc("accounting_post_pending_payouts", {
      p_club: clubId,
      p_user: userId,
    });
    if (pending.error && !/accounting_post_pending_payouts|schema cache|Could not find the function/i.test(pending.error.message || "")) {
      throw new Error(pending.error.message);
    }
  }
  await audit(admin, clubId, "settings", userId, null, null, { autoValidate, payoutAccountId: payoutAccountId ?? null });
}

const ENTRY_COLUMNS = "id, entry_number, entry_date, description, amount, direction, source_type, source_id, event_type, status, party_name, reference, counter_account_id, category_account_id, reversal_of_entry_id, reversed_by_entry_id, period_id, created_at, validated_at";

async function loadAllEntries(admin: Admin, clubId: string) {
  try {
    return await fetchAllPages((from, to) => admin
      .from("accounting_entries")
      .select(`${ENTRY_COLUMNS}, entry_number_manual`)
      .eq("club_id", clubId)
      .order("id", { ascending: true })
      .range(from, to));
  } catch (error) {
    if (!(error instanceof Error) || !/entry_number_manual/.test(error.message)) throw error;
    const legacy = await fetchAllPages((from, to) => admin
      .from("accounting_entries")
      .select(ENTRY_COLUMNS)
      .eq("club_id", clubId)
      .order("id", { ascending: true })
      .range(from, to));
    return legacy.map((row) => ({ ...row, entry_number_manual: false }));
  }
}

export async function loadWorkspace(clubId: string) {
  const admin = createAdminClient();
  const access = await getAccountingAccess(clubId);
  const [accounts, periods, entries, lineRows, inbox, attachments, extras] = await Promise.all([
    loadAccounts(admin, clubId),
    loadPeriods(admin, clubId),
    loadAllEntries(admin, clubId),
    fetchAllPages((from, to) => admin
      .from("accounting_entry_lines")
      .select("entry_id, account_id, debit, credit, line_order")
      .eq("club_id", clubId)
      .order("entry_id", { ascending: true })
      .order("line_order", { ascending: true })
      .range(from, to)),
    fetchAllPages((from, to) => admin
      .from("accounting_inbox")
      .select("id, description, amount, fee_amount, entry_date, status, source_type, source_id, party_name, financial_account_code, category_code, direction, event_type")
      .eq("club_id", clubId)
      .in("status", ["awaiting_account", "awaiting_category", "awaiting_details", "blocked_closed_period", "pending"])
      .order("id", { ascending: true })
      .range(from, to)),
    fetchAllPages((from, to) => admin
      .from("accounting_attachments")
      .select("id, entry_id, file_name, storage_path")
      .eq("club_id", clubId)
      .order("id", { ascending: true })
      .range(from, to)),
    loadAccountingExtras(admin, clubId),
  ]);

  const current = periods.find((period) => period.status === "open") ?? periods[periods.length - 1];

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const entryStatus = new Map(entries.map((entry) => [entry.id as string, entry.status as EntryStatus]));
  const entryDate = new Map(entries.map((entry) => [entry.id as string, entry.entry_date as string]));
  const entryEvent = new Map(entries.map((entry) => [entry.id as string, entry.event_type as string]));
  const entrySource = new Map(entries.map((entry) => [entry.id as string, entry.source_type as string]));

  const reportLines: ReportLine[] = lineRows.map((line) => {
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
  });

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
  const orderedLineRows = [...(lineRows ?? [])].sort((a, b) => {
    const byEntry = String(a.entry_id).localeCompare(String(b.entry_id));
    if (byEntry !== 0) return byEntry;
    return Number(a.line_order) - Number(b.line_order);
  });
  for (const line of orderedLineRows) {
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
    groups: extras.groups,
    budgets: extras.budgets,
    extensionsReady: extras.ready,
    incomeLines,
    balanceLines,
    takeoverItems: await loadTakeoverItems(admin, clubId),
  };
}

async function loadTakeoverItems(admin: Admin, clubId: string) {
  const { data, error } = await admin
    .from("accounting_open_items")
    .select("id, period_id, account_id, label, side, amount, settled_amount")
    .eq("club_id", clubId);
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: String(item.id),
    periodId: item.period_id ? String(item.period_id) : null,
    accountId: item.account_id ? String(item.account_id) : null,
    label: String(item.label),
    side: item.side === "payable" ? "payable" as const : "receivable" as const,
    amount: num(item.amount),
    settledAmount: num(item.settled_amount),
  }));
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
  if (raw.takeoverMode === "fresh" || raw.takeoverMode === "full_period" || raw.takeoverMode === "from_date") {
    await completeTakeover(clubId, userId, raw);
    return;
  }
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

async function completeTakeover(clubId: string, userId: string, raw: Record<string, unknown>) {
  const input = takeoverInputFromBody(raw);
  if ("error" in input) throw new Error(input.error);
  const plan = planTakeover(input);
  if (!plan.ok) throw new Error(plan.message);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("accounting_settings")
    .select("onboarding_completed_at")
    .eq("club_id", clubId)
    .maybeSingle();
  if (existing?.onboarding_completed_at) return;
  const { data, error } = await admin.rpc("accounting_finalize_takeover", {
    p_payload: takeoverRpcPayload(clubId, userId, input, plan),
  });
  if (error) {
    if (/finalize_takeover|does not exist|n'existe pas/i.test(error.message)) {
      throw new Error("La reprise demande la migration 105. Aucune écriture n'a été créée.");
    }
    if (input.mode === "fresh" && /start_mode|accounting_settings_start_mode/i.test(error.message)) {
      throw new Error("Le démarrage sans historique demande la migration 106. Aucune écriture n'a été créée.");
    }
    if (/accounting_settings_history_import/i.test(error.message)) {
      throw new Error("L'import des écritures demande la migration 107. Aucune écriture n'a été créée.");
    }
    throw new Error(error.message);
  }
  void data;
}

export async function applyHistoryImport(clubId: string, userId: string, raw: Record<string, unknown>) {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("accounting_settings")
    .select("start_mode, start_date, history_import_status")
    .eq("club_id", clubId)
    .maybeSingle();
  const periods = await loadPeriods(admin, clubId);
  const period = periods.find((item) => item.id === String(raw.periodId || "")) || periods.find((item) => item.status === "open");
  if (!period) throw new Error("Aucun exercice ouvert pour cette reprise.");
  if (settings?.start_mode === "fresh") {
    throw new Error("Une comptabilité sans historique n'importe pas d'anciennes opérations.");
  }
  const input = takeoverInputFromBody({
    ...raw,
    takeoverMode: raw.takeoverMode || settings?.start_mode,
    periodStart: period.startsOn,
    periodEnd: period.endsOn,
    takeoverDate: settings?.start_mode === "from_date"
      ? String(raw.takeoverDate || settings?.start_date || period.startsOn)
      : period.endsOn,
  });
  if ("error" in input) throw new Error(input.error);
  const plan = planTakeover({ ...input, balances: [] });
  if (!plan.ok) throw new Error(plan.message);
  if (!plan.journal.length && !plan.rollup) throw new Error("Le fichier ne contient aucune écriture à reprendre.");
  const { data: applied, error: appliedError } = await admin
    .from("accounting_history_imports")
    .select("fingerprint")
    .eq("club_id", clubId)
    .eq("period_id", period.id)
    .eq("status", "applied");
  if (appliedError) {
    if (/fingerprint|history_imports|does not exist|n'existe pas/i.test(appliedError.message)) {
      throw new Error("L'import demande la migration 105. Aucune écriture n'a été créée.");
    }
    throw new Error(appliedError.message);
  }
  const fingerprints = (applied ?? []).map((row) => String(row.fingerprint || "")).filter(Boolean);
  if (fingerprints.includes(plan.fingerprint)) return { already: true };
  if (fingerprints.length) {
    throw new Error("Un import a déjà repris cet exercice. Un second lot compterait les mêmes opérations deux fois.");
  }
  const { error } = await admin.rpc("accounting_apply_history_import", {
    p_payload: {
      ...takeoverRpcPayload(clubId, userId, input, plan),
      period_id: period.id,
      opening: null,
      open_items: [],
    },
  });
  if (error) {
    if (/apply_history_import|does not exist|n'existe pas/i.test(error.message)) {
      throw new Error("L'import demande la migration 105. Aucune écriture n'a été créée.");
    }
    throw new Error(error.message);
  }
  return { already: false };
}

export async function correctOpening(clubId: string, userId: string, raw: Record<string, unknown>) {
  const admin = createAdminClient();
  const periods = await loadPeriods(admin, clubId);
  const period = periods.find((item) => item.id === String(raw.periodId || ""));
  if (!period) throw new Error("Exercice introuvable.");
  const { data: opening } = await admin
    .from("accounting_entries")
    .select("id, entry_number, entry_date, description, status, source_type")
    .eq("club_id", clubId)
    .eq("period_id", period.id)
    .eq("source_type", "opening")
    .neq("status", "voided")
    .maybeSingle();
  const decision = planOpeningCorrection({
    openingEntryId: opening?.id ? String(opening.id) : null,
    periodStatus: period.status,
  });
  if (!decision.ok) throw new Error(decision.message);
  const { data: settings } = await admin
    .from("accounting_settings")
    .select("start_mode, start_date")
    .eq("club_id", clubId)
    .maybeSingle();
  const accounts = await loadAccounts(admin, clubId);
  const rollup = await admin
    .from("accounting_entries")
    .select("id")
    .eq("club_id", clubId)
    .eq("period_id", period.id)
    .eq("event_type", "history_rollup")
    .neq("status", "voided")
    .maybeSingle();
  let cumulatives: Array<{ code: string; amount: number }> = [];
  if (rollup.data?.id) {
    const { data: lines } = await admin
      .from("accounting_entry_lines")
      .select("account_id, debit, credit")
      .eq("entry_id", rollup.data.id);
    cumulatives = (lines ?? []).flatMap((line) => {
      const account = accounts.find((item) => item.id === line.account_id);
      if (!account || (account.accountType !== "revenue" && account.accountType !== "expense")) return [];
      const amount = account.accountType === "revenue" ? num(line.credit) : num(line.debit);
      if (!(amount > 0)) return [];
      return [{ code: account.systemCode || account.number, amount }];
    });
  }
  const input = takeoverInputFromBody({
    ...raw,
    takeoverMode: settings?.start_mode === "from_date" ? "from_date" : "full_period",
    periodStart: period.startsOn,
    periodEnd: period.endsOn,
    takeoverDate: settings?.start_mode === "from_date" ? settings.start_date : period.endsOn,
    journal: [],
    cumulatives,
  });
  if ("error" in input) throw new Error(input.error);
  const plan = planTakeover(input);
  if (!plan.ok) throw new Error(plan.message);
  const lines = plan.openingLines.map((line) => {
    const account = accounts.find((item) => item.systemCode === line.accountCode || item.number === line.accountCode);
    if (!account) throw new Error(`Compte de reprise introuvable : ${line.accountCode}.`);
    return { account_id: account.id, debit: line.debit, credit: line.credit };
  });
  const { error } = await admin.rpc("accounting_update_pending_entry", {
    p_payload: {
      club_id: clubId,
      entry_id: decision.entryId,
      entry_date: plan.openingDate,
      entry_number: opening?.entry_number,
      number_manual: false,
      user_id: userId,
      period_id: period.id,
      description: plan.openingDescription,
      reference: "",
      remark: "",
      status: "validated",
      lines,
    },
  });
  if (error) throw new Error(explainJournalError(error.message));
  await audit(admin, clubId, "opening_correction", userId, decision.entryId, {
    description: opening?.description,
  }, { lines, description: plan.openingDescription });
}

export async function settleTakeoverItem(clubId: string, userId: string, raw: Record<string, unknown>) {
  const admin = createAdminClient();
  const accounts = await loadAccounts(admin, clubId);
  const financial = accounts.find((account) => account.systemCode === String(raw.financialAccountCode || "") || account.id === String(raw.financialAccountId || ""));
  if (!financial) throw new Error("Choisissez le compte de trésorerie du règlement.");
  const { data, error } = await admin.rpc("accounting_settle_open_item", {
    p_payload: {
      club_id: clubId,
      user_id: userId,
      item_id: String(raw.itemId || ""),
      financial_account_id: financial.id,
      amount: Number(raw.amount),
      entry_date: String(raw.date || zurichToday()),
      description: String(raw.description || "Règlement d'une somme reprise"),
    },
  });
  if (error) {
    if (/settle_open_item|does not exist|n'existe pas|accounting_open_items/i.test(error.message)) {
      throw new Error("Le suivi des sommes reprises demande la migration 105.");
    }
    throw new Error(error.message);
  }
  return data;
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

}

export async function closePeriod(params: {
  clubId: string;
  userId: string;
  periodId: string;
  transferResult: boolean;
  confirmed: boolean;
}) {
  assertExplicitClose(params.confirmed);
  const admin = createAdminClient();
  const workspace = await loadWorkspace(params.clubId);
  const period = workspace.periods.find((item) => item.id === params.periodId);
  if (!period || period.status !== "open") throw new Error("Exercice introuvable");
  const closeEntries: CloseEntry[] = (workspace.entries as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    status: String(row.status),
    entryDate: String(row.entry_date),
    periodId: row.period_id ? String(row.period_id) : null,
    sourceType: row.source_type ? String(row.source_type) : null,
    eventType: row.event_type ? String(row.event_type) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
  }));
  const blocking = operationsBlockingClose({
    entries: closeEntries,
    inbox: (workspace.review.inbox as Array<{ status: string; entry_date: string }>).map((item) => ({
      status: item.status,
      entryDate: item.entry_date,
    })),
    period,
  });
  if (blocking > 0) throw new Error("Il reste des opérations à vérifier");

  let lines: Array<{ account_id: string; debit: number; credit: number }> = [];
  if (params.transferResult) {
    const retained = workspace.accounts.find((account) => account.systemCode === "retained");
    if (!retained) throw new Error("Compte 2900 introuvable");
    const accountTypes = new Map(workspace.accounts.map((account) => [account.id, account.accountType]));
    lines = closingTransferLines(
      accumulatePnl(closeEntries, workspace.linesByEntry, accountTypes, period),
      retained.id
    );
  }

  const next = followingPeriod(period);
  const { error } = await admin.rpc("accounting_close_period", {
    p_club: params.clubId,
    p_period: period.id,
    p_user: params.userId,
    p_transfer: params.transferResult,
    p_lines: lines,
    p_next_start: next.startsOn,
    p_next_end: next.endsOn,
    p_next_label: next.label,
  });
  if (error) {
    const message = error.message || "";
    if (/accounting_close_period|schema cache|Could not find the function/i.test(message)) {
      throw new Error("La clôture comptable n'est pas disponible. Appliquez la migration 102 dans Supabase, puis réessayez.");
    }
    const line = message.split("\n")[0] || "La clôture n'a pas abouti. L'exercice reste ouvert.";
    throw new Error(line);
  }
}

export async function openFollowingPeriod(params: { clubId: string; userId: string; periodId: string }) {
  const admin = createAdminClient();
  const periods = await loadPeriods(admin, params.clubId);
  const anchor = periods.find((period) => period.id === params.periodId);
  if (!anchor) throw new Error("Exercice introuvable");
  const plan = planOpenFollowingPeriod(anchor, periods);
  if (plan.action === "overlap") throw new Error("Cette période chevauche un exercice existant.");
  if (plan.action === "exists") throw new Error("L'exercice suivant existe déjà. Il n'a pas été recréé.");
  const { error } = await admin.rpc("accounting_open_following_period", {
    p_club: params.clubId,
    p_anchor: anchor.id,
    p_user: params.userId,
    p_start: plan.startsOn,
    p_end: plan.endsOn,
    p_label: plan.label,
  });
  if (error) {
    const message = error.message || "";
    if (/schema cache|Could not find the function/i.test(message)) {
      throw new Error("L'ouverture de l'exercice suivant n'est pas disponible. Appliquez la migration 104.");
    }
    throw new Error(message.split("\n")[0] || "L'exercice suivant n'a pas été ouvert.");
  }
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
  if (await groupUsesNumber(admin, params.clubId, number)) {
    throw new Error("Ce numéro est une rubrique de regroupement. Une rubrique ne reçoit pas d’écritures.");
  }
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
    if (await groupUsesNumber(admin, params.clubId, nextNumber)) {
      throw new Error("Ce numéro est une rubrique de regroupement. Une rubrique ne reçoit pas d’écritures.");
    }
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

export async function recordExport(clubId: string, userId: string, kind: string) {
  const admin = createAdminClient();
  await audit(admin, clubId, "export", userId, null, null, { kind });
}
