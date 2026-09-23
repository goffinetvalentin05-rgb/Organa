import { roundChf } from "./money";
import type {
  CashEvent,
  DraftLine,
  EntryStatus,
  OfficialTotals,
  OpeningInput,
  PostingDecision,
  ReportLine,
} from "./types";

const FEE_ACCOUNT = "bank_fees";

export function paymentIdempotencyKey(
  sourceType: string,
  sourceId: string,
  eventType: string,
  generation = 1
): string {
  const base = `${sourceType}:${sourceId}:${eventType}`;
  return generation <= 1 ? base : `${base}:${generation}`;
}

/**
 * Une opération active (pending ou validated) bloque un second posting.
 * Après extourne, une nouvelle génération est possible.
 */
export function nextPaymentGeneration(input: {
  activeCount: number;
  existingCount: number;
}): number | null {
  if (input.activeCount > 0) return null;
  return input.existingCount + 1;
}

export function linesAreBalanced(lines: DraftLine[]): boolean {
  if (lines.length < 2) return false;
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    const d = roundChf(line.debit);
    const c = roundChf(line.credit);
    if (d < 0 || c < 0) return false;
    if (d > 0 && c > 0) return false;
    if (d === 0 && c === 0) return false;
    debit = roundChf(debit + d);
    credit = roundChf(credit + c);
  }
  return debit === credit && debit > 0;
}

/**
 * L’auto-validation n’est possible que si montant, date, compte financier,
 * catégorie et source sont tous connus. Une hypothèse n’est jamais validée.
 */
export function canAutoValidate(event: CashEvent): boolean {
  if (!event.autoValidate) return false;
  if (!isPositiveChfSafe(event.amount)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.entryDate)) return false;
  if (!event.financialAccountCode) return false;
  if (!event.categoryCode) return false;
  if (!event.sourceType || !event.sourceId) return false;
  if (event.periodClosed || event.beforeStart) return false;
  return true;
}

function isPositiveChfSafe(value: number): boolean {
  return Number.isFinite(value) && roundChf(value) > 0;
}

export function buildCashLines(event: Pick<
  CashEvent,
  "amount" | "feeAmount" | "direction" | "financialAccountCode" | "categoryCode"
>): DraftLine[] | null {
  if (!event.financialAccountCode || !event.categoryCode) return null;
  const amount = roundChf(event.amount);
  const fee = roundChf(event.feeAmount ?? 0);
  if (amount <= 0) return null;

  if (event.direction === "in") {
    if (fee > 0 && fee < amount) {
      return [
        {
          accountCode: event.financialAccountCode,
          debit: roundChf(amount - fee),
          credit: 0,
        },
        { accountCode: FEE_ACCOUNT, debit: fee, credit: 0 },
        { accountCode: event.categoryCode, debit: 0, credit: amount },
      ];
    }
    return [
      { accountCode: event.financialAccountCode, debit: amount, credit: 0 },
      { accountCode: event.categoryCode, debit: 0, credit: amount },
    ];
  }

  if (event.direction === "out") {
    return [
      { accountCode: event.categoryCode, debit: amount, credit: 0 },
      { accountCode: event.financialAccountCode, debit: 0, credit: amount },
    ];
  }

  return null;
}

export function missingDetails(event: CashEvent): Array<"account" | "category"> {
  const missing: Array<"account" | "category"> = [];
  if (!event.financialAccountCode) missing.push("account");
  if (!event.categoryCode) missing.push("category");
  return missing;
}

/**
 * Décide s’il faut ignorer, bloquer, demander une confirmation,
 * ou proposer une seule écriture.
 * Un compte inconnu ne devient jamais « Banque » par défaut.
 */
export function decidePosting(event: CashEvent): PostingDecision {
  if (event.beforeStart) return { kind: "ignore", reason: "before_start" };
  if (event.periodClosed) return { kind: "blocked", reason: "closed_period" };

  const missing = missingDetails(event);
  if (missing.length > 0) return { kind: "awaiting", missing };

  const lines = buildCashLines(event);
  if (!lines || !linesAreBalanced(lines)) {
    return { kind: "awaiting", missing: ["category"] };
  }

  const autoValidated = canAutoValidate(event);
  return {
    kind: "post",
    status: autoValidated ? "validated" : "pending",
    lines,
    autoValidated,
  };
}

export function reverseLines(lines: DraftLine[]): DraftLine[] {
  return lines.map((line) => ({
    accountCode: line.accountCode,
    debit: roundChf(line.credit),
    credit: roundChf(line.debit),
  }));
}

export function buildOpeningLines(input: OpeningInput): {
  lines: DraftLine[];
  equityAmount: number;
} {
  const lines: DraftLine[] = [];
  const pushAsset = (code: string, amount: number) => {
    const value = roundChf(amount);
    if (value > 0) lines.push({ accountCode: code, debit: value, credit: 0 });
  };
  const pushLiability = (code: string, amount: number) => {
    const value = roundChf(amount);
    if (value > 0) lines.push({ accountCode: code, debit: 0, credit: value });
  };

  pushAsset("bank", input.bank);
  pushAsset("cash", input.cash);
  pushAsset("stripe", input.stripe);
  for (const other of input.others) {
    if (other.side === "liability") pushLiability(other.accountCode, other.amount);
    else pushAsset(other.accountCode, other.amount);
  }

  const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
  const equityAmount = roundChf(debit - credit);

  if (lines.length === 0 || (equityAmount === 0 && debit === 0)) {
    return { lines: [], equityAmount: 0 };
  }

  if (equityAmount > 0) {
    lines.push({ accountCode: input.equityAccountCode, debit: 0, credit: equityAmount });
  } else if (equityAmount < 0) {
    lines.push({
      accountCode: input.equityAccountCode,
      debit: roundChf(Math.abs(equityAmount)),
      credit: 0,
    });
  }

  return { lines, equityAmount };
}

function signedBalance(type: ReportLine["accountType"], debit: number, credit: number): number {
  if (type === "asset" || type === "expense") return roundChf(debit - credit);
  return roundChf(credit - debit);
}

/** Livres officiels : validées, et écritures annulées compensées par une extourne validée. */
function inOfficialBooks(status: ReportLine["entryStatus"]): boolean {
  return status === "validated" || status === "reversed";
}
export function officialTotals(lines: ReportLine[]): OfficialTotals {
  const validated = lines.filter((line) => inOfficialBooks(line.entryStatus));
  let revenue = 0;
  let expense = 0;
  let bank = 0;
  let cash = 0;
  let stripe = 0;

  for (const line of validated) {
    const balance = signedBalance(line.accountType, line.debit, line.credit);
    if (line.accountType === "revenue") revenue = roundChf(revenue + balance);
    if (line.accountType === "expense") expense = roundChf(expense + balance);
    if (line.systemCode === "bank") bank = roundChf(bank + balance);
    if (line.systemCode === "cash") cash = roundChf(cash + balance);
    if (line.systemCode === "stripe") stripe = roundChf(stripe + balance);
  }

  return {
    revenue,
    expense,
    result: roundChf(revenue - expense),
    bank,
    cash,
    stripe,
    treasury: roundChf(bank + cash + stripe),
  };
}

export function reviewAmount(
  entries: Array<{ status: EntryStatus; amount: number }>
): { count: number; amount: number } {
  const pending = entries.filter((entry) => entry.status === "pending");
  return {
    count: pending.length,
    amount: roundChf(pending.reduce((sum, entry) => sum + entry.amount, 0)),
  };
}

export function isOfficialStatus(status: EntryStatus): boolean {
  return status === "validated" || status === "reversed";
}
