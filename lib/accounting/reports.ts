import { ACCOUNT_CLASS_LABELS, RECOMMENDED_CHART } from "./chart";
import type { AccountGroup } from "./groups";
import { roundChf } from "./money";
import { toJournalRows } from "./journalGrid";

export type ReportKind = "balance" | "result" | "journal" | "ledger";

export const REPORT_KIND_TITLE: Record<ReportKind, string> = {
  balance: "Bilan",
  result: "Compte de résultat",
  journal: "Journal",
  ledger: "Extrait de compte",
};

export const JOURNAL_SCOPE =
  "Même ensemble que le journal de comptabilité pour cet exercice : écritures à vérifier, vérifiées et extournées. Les écritures retirées restent dans l'historique d'audit.";

export const LEDGER_SCOPE =
  "Extrait limité au compte choisi. Écritures vérifiées et extournées. Les écritures à vérifier et retirées ne figurent pas.";

export const BALANCE_ASSET_CURRENT = "Actif circulant";
export const BALANCE_ASSET_FIXED = "Actif immobilisé";
export const BALANCE_LIABILITY_SHORT = "Dettes à court terme";
export const BALANCE_LIABILITY_LONG = "Dettes à long terme";
export const BALANCE_EQUITY = "Fonds propres";
export const BALANCE_ASSET_TOTAL_LABEL = "Total de l'actif";
export const BALANCE_FUNDING_TOTAL_LABEL = "Total du passif";

/** Plan suisse PME : immobilisé à partir de 1500, dettes à long terme à partir de 2400. */
export const FIXED_ASSET_FROM = 1500;
export const LONG_TERM_LIABILITY_FROM = 2400;

export function balanceSubtotalLabel(title: string): string {
  return `Sous-total ${title.toLowerCase()}`;
}

export function reportLineLabel(line: { name: string; kind?: "account" | "group" }): string {
  return line.kind === "group" ? `Rubrique ${line.name}` : line.name;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "À vérifier",
  validated: "Vérifiée",
  reversed: "Extournée",
  voided: "Écartée",
};

export type ReportAccount = {
  id: string;
  number: string;
  name: string;
  accountType: string;
  accountClass: number;
};

export type ReportEntry = {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  status: string;
  reference?: string | null;
  party_name?: string | null;
  source_type?: string | null;
  event_type?: string | null;
  period_id?: string | null;
};

export type ReportMovement = { accountId: string; debit: number; credit: number };

export type ReportPeriod = {
  id?: string;
  label: string;
  startsOn: string;
  endsOn: string;
};

export type AmountLine = { number: string; name: string; amount: number; kind?: "account" | "group" };

export type AmountGroup = { title: string; lines: AmountLine[]; total: number };

export type BalanceSheetReport = {
  kind: "balance";
  title: "Bilan";
  asOf: string;
  periodLabel: string;
  assets: AmountGroup[];
  assetTotal: number;
  funding: AmountGroup[];
  fundingTotal: number;
  gap: number;
};

export type IncomeOutcome = {
  label: "Bénéfice de l'exercice" | "Perte de l'exercice" | "Résultat nul";
  amount: number;
};

export type IncomeReport = {
  kind: "result";
  title: "Compte de résultat";
  periodLabel: string;
  from: string;
  to: string;
  charges: AmountGroup[];
  chargeTotal: number;
  products: AmountGroup[];
  productTotal: number;
  result: number;
  outcome: IncomeOutcome;
};

export type JournalReportRow = {
  entryId: string;
  lineIndex: number;
  date: string;
  number: number;
  piece: string;
  label: string;
  debit: string;
  credit: string;
  amount: number;
  remark: string;
  status: string;
};

export type JournalReport = {
  kind: "journal";
  title: "Journal";
  periodLabel: string;
  from: string;
  to: string;
  scope: string;
  rows: JournalReportRow[];
  /** Nombre de lignes exportées, identique à l'aperçu, au PDF et au CSV. */
  lineCount: number;
};

export type LedgerMovement = {
  date: string;
  number: number;
  piece: string;
  label: string;
  counterpart: string;
  debit: number;
  credit: number;
  balance: number;
};

export type LedgerReport = {
  kind: "ledger";
  title: "Extrait de compte";
  accountId: string;
  accountNumber: string;
  accountName: string;
  periodLabel: string;
  from: string;
  to: string;
  scope: string;
  opening: number;
  movements: LedgerMovement[];
  closing: number;
};

type Books = {
  accounts: ReportAccount[];
  entries: ReportEntry[];
  linesByEntry: Record<string, ReportMovement[]>;
  period: ReportPeriod;
  groups?: AccountGroup[];
};

function signed(type: string, debit: number, credit: number): number {
  if (type === "asset" || type === "expense") return roundChf(debit - credit);
  return roundChf(credit - debit);
}

function official(status: string): boolean {
  return status === "validated" || status === "reversed";
}

function inPeriod(date: string, period: ReportPeriod): boolean {
  return date >= period.startsOn && date <= period.endsOn;
}

/** Même filtre que le journal affiché : l'exercice choisi, sans les écritures retirées. */
export function shownInAccountingJournal(entry: ReportEntry, period: ReportPeriod): boolean {
  if (entry.status === "voided") return false;
  if (period.id && entry.period_id) return entry.period_id === period.id;
  return inPeriod(entry.entry_date, period);
}

export function incomeOutcome(result: number): IncomeOutcome {
  if (result > 0) return { label: "Bénéfice de l'exercice", amount: result };
  if (result < 0) return { label: "Perte de l'exercice", amount: roundChf(Math.abs(result)) };
  return { label: "Résultat nul", amount: 0 };
}

function printable(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");
}

function accountName(accounts: ReportAccount[], id: string | null): string {
  if (!id) return "";
  const account = accounts.find((item) => item.id === id);
  return account ? printable(`${account.number} ${account.name}`) : "";
}

function balances(input: Books, entries: ReportEntry[]): Map<string, number> {
  const types = new Map(input.accounts.map((account) => [account.id, account.accountType]));
  const totals = new Map<string, number>();
  for (const entry of entries) {
    for (const line of input.linesByEntry[entry.id] || []) {
      const type = types.get(line.accountId) || "asset";
      totals.set(line.accountId, roundChf((totals.get(line.accountId) || 0) + signed(type, line.debit, line.credit)));
    }
  }
  return totals;
}

function accountLines(accounts: ReportAccount[], totals: Map<string, number>, accept: (account: ReportAccount) => boolean): AmountLine[] {
  return accounts
    .filter(accept)
    .map((account) => ({ number: account.number, name: printable(account.name), amount: totals.get(account.id) || 0 }))
    .filter((line) => line.amount !== 0)
    .sort((a, b) => a.number.localeCompare(b.number, "fr"));
}

function insertGroupSubtotals(
  baseLines: AmountLine[],
  lines: AmountLine[],
  groups: AccountGroup[] | undefined,
  accounts: ReportAccount[],
  totals: Map<string, number>,
  accept: (account: ReportAccount) => boolean,
): AmountLine[] {
  if (!groups?.length) return lines;
  const base = new Set(baseLines);
  const result = [...lines];
  const ordered = [...groups].sort((a, b) => a.number.localeCompare(b.number, "fr"));
  for (const group of ordered) {
    const members = accounts.filter((account) => group.accountIds.includes(account.id) && accept(account) && baseLines.some((line) => line.number === account.number));
    if (!members.length) continue;
    const amount = roundChf(members.reduce((sum, account) => sum + (totals.get(account.id) || 0), 0));
    let insertAt = -1;
    for (let index = 0; index < result.length; index += 1) {
      if (!base.has(result[index])) continue;
      if (members.some((account) => account.number === result[index].number)) insertAt = index;
    }
    if (insertAt < 0) continue;
    result.splice(insertAt + 1, 0, {
      number: group.number,
      name: printable(group.name),
      amount,
      kind: "group",
    });
  }
  return result;
}

function finishGroup(
  input: Books,
  title: string,
  baseLines: AmountLine[],
  extraLines: AmountLine[],
  totals: Map<string, number>,
  accept: (account: ReportAccount) => boolean,
): AmountGroup {
  const lines = insertGroupSubtotals(baseLines, [...baseLines, ...extraLines], input.groups, input.accounts, totals, accept);
  return {
    title,
    lines,
    total: roundChf(lines.filter((line) => line.kind !== "group").reduce((sum, line) => sum + line.amount, 0)),
  };
}

function groupOf(input: Books, title: string, totals: Map<string, number>, accept: (account: ReportAccount) => boolean): AmountGroup {
  return finishGroup(input, title, accountLines(input.accounts, totals, accept), [], totals, accept);
}

/** Actif circulant avant 1500. Actif immobilisé à partir de 1500, comme le plan du club. */
export function isFixedAsset(number: string): boolean {
  const value = Number(number);
  return Number.isFinite(value) && value >= FIXED_ASSET_FROM;
}

/**
 * Dettes à long terme : comptes de passif à partir de 2400.
 * Les comptes du plan recommandé 2000, 2200 et 2300 restent à court terme.
 */
export function isLongTermLiability(number: string): boolean {
  const value = Number(number);
  return Number.isFinite(value) && value >= LONG_TERM_LIABILITY_FROM;
}

export const PRIOR_UNCLOSED_RESULT = "Résultats antérieurs non reportés";

/**
 * Résultat encore porté par les comptes de produits et de charges.
 * Calculé sur les mouvements, pas sur l'écart du bilan.
 * Un report déjà passé ramène ce montant à zéro et laisse le solde au 2900.
 */
export function unclosedResults(input: Books, entries: ReportEntry[]): { prior: number; current: number } {
  const types = new Map(input.accounts.map((account) => [account.id, account.accountType]));
  let prior = 0;
  let current = 0;
  for (const entry of entries) {
    const bucket = entry.entry_date < input.period.startsOn ? "prior" : "current";
    for (const line of input.linesByEntry[entry.id] || []) {
      const type = types.get(line.accountId);
      if (type !== "revenue" && type !== "expense") continue;
      // Bénéfice = crédits − débits des produits et des charges. Une charge débitrice diminue le résultat.
      const contribution = roundChf(line.credit - line.debit);
      if (bucket === "prior") prior = roundChf(prior + contribution);
      else current = roundChf(current + contribution);
    }
  }
  return { prior, current };
}

export function buildBalanceSheet(input: Books): BalanceSheetReport {
  const included = input.entries.filter((entry) => official(entry.status) && entry.entry_date <= input.period.endsOn);
  const totals = balances(input, included);
  const assets = [
    groupOf(input, BALANCE_ASSET_CURRENT, totals, (account) => account.accountType === "asset" && !isFixedAsset(account.number)),
    groupOf(input, BALANCE_ASSET_FIXED, totals, (account) => account.accountType === "asset" && isFixedAsset(account.number)),
  ];
  const equityBase = accountLines(input.accounts, totals, (account) => account.accountType === "equity");
  const unclosed = unclosedResults(input, included);
  const chartResult = RECOMMENDED_CHART.find((account) => account.systemCode === "result");
  const resultAccount = input.accounts.find((account) => account.number === chartResult?.number);
  const equityExtra: AmountLine[] = [];
  if (unclosed.prior !== 0) {
    equityExtra.push({ number: "", name: printable(PRIOR_UNCLOSED_RESULT), amount: unclosed.prior });
  }
  if (unclosed.current !== 0) {
    equityExtra.push({
      number: resultAccount?.number || chartResult?.number || "",
      name: printable(resultAccount?.name || chartResult?.name || "Résultat de l'exercice"),
      amount: unclosed.current,
    });
  }
  const equity = finishGroup(
    input,
    BALANCE_EQUITY,
    equityBase,
    equityExtra,
    totals,
    (account) => account.accountType === "equity",
  );
  const funding = [
    groupOf(input, BALANCE_LIABILITY_SHORT, totals, (account) => account.accountType === "liability" && !isLongTermLiability(account.number)),
    groupOf(input, BALANCE_LIABILITY_LONG, totals, (account) => account.accountType === "liability" && isLongTermLiability(account.number)),
    equity,
  ];
  const assetTotal = roundChf(assets.reduce((sum, group) => sum + group.total, 0));
  const fundingTotal = roundChf(funding.reduce((sum, group) => sum + group.total, 0));
  return {
    kind: "balance",
    title: "Bilan",
    asOf: input.period.endsOn,
    periodLabel: input.period.label,
    assets,
    assetTotal,
    funding,
    fundingTotal,
    gap: roundChf(assetTotal - fundingTotal),
  };
}

function classGroups(input: Books, totals: Map<string, number>, type: "revenue" | "expense"): AmountGroup[] {
  const classes = [...new Set(input.accounts.filter((account) => account.accountType === type).map((account) => account.accountClass))].sort((a, b) => a - b);
  return classes
    .map((accountClass) => groupOf(
      input,
      ACCOUNT_CLASS_LABELS[accountClass] || (type === "revenue" ? "Produits" : "Charges"),
      totals,
      (account) => account.accountType === type && account.accountClass === accountClass,
    ))
    .filter((group) => group.lines.some((line) => line.kind !== "group"));
}

function incomeEntries(input: Books): ReportEntry[] {
  return input.entries.filter((entry) => {
    if (!official(entry.status) || !inPeriod(entry.entry_date, input.period)) return false;
    if (entry.source_type === "opening" || entry.event_type === "opening" || entry.source_type === "period_close") return false;
    return true;
  });
}

/** Soldes des produits et des charges sur le même périmètre que le compte de résultat. */
export function officialIncomeBalances(input: Books): Map<string, number> {
  return balances(input, incomeEntries(input));
}

export function buildIncomeStatement(input: Books): IncomeReport {
  const totals = officialIncomeBalances(input);
  const products = classGroups(input, totals, "revenue");
  const charges = classGroups(input, totals, "expense");
  const productTotal = roundChf(products.reduce((sum, group) => sum + group.total, 0));
  const chargeTotal = roundChf(charges.reduce((sum, group) => sum + group.total, 0));
  const result = roundChf(productTotal - chargeTotal);
  return {
    kind: "result",
    title: "Compte de résultat",
    periodLabel: input.period.label,
    from: input.period.startsOn,
    to: input.period.endsOn,
    charges,
    chargeTotal,
    products,
    productTotal,
    result,
    outcome: incomeOutcome(result),
  };
}

export function buildJournalReport(input: Books): JournalReport {
  const included = input.entries
    .filter((entry) => shownInAccountingJournal(entry, input.period))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.entry_number - b.entry_number);
  const rows: JournalReportRow[] = [];
  for (const entry of included) {
    const visual = toJournalRows(entry.id, input.linesByEntry[entry.id] || []);
    visual.forEach((row, index) => {
      rows.push({
        entryId: entry.id,
        lineIndex: index,
        date: entry.entry_date,
        number: entry.entry_number,
        piece: printable(entry.reference?.trim() || "-"),
        label: index === 0 ? printable(entry.description) : "même écriture",
        debit: accountName(input.accounts, row.debitAccountId),
        credit: accountName(input.accounts, row.creditAccountId),
        amount: row.amount,
        remark: index === 0 ? (entry.party_name?.trim() || "") : "",
        status: STATUS_LABEL[entry.status] || entry.status,
      });
    });
  }
  return {
    kind: "journal",
    title: "Journal",
    periodLabel: input.period.label,
    from: input.period.startsOn,
    to: input.period.endsOn,
    scope: JOURNAL_SCOPE,
    rows,
    lineCount: rows.length,
  };
}

export function buildAccountExtract(input: Books & { accountId: string }): LedgerReport | { error: string } {
  const account = input.accounts.find((item) => item.id === input.accountId);
  if (!account) return { error: "Choisissez un compte pour l’extrait." };
  const dated = input.entries
    .filter((entry) => official(entry.status))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.entry_number - b.entry_number);
  let opening = 0;
  const movements: LedgerMovement[] = [];
  let running = 0;
  for (const entry of dated) {
    const lines = input.linesByEntry[entry.id] || [];
    const own = lines.filter((line) => line.accountId === account.id && (line.debit > 0 || line.credit > 0));
    if (!own.length) continue;
    const debit = roundChf(own.reduce((sum, line) => sum + line.debit, 0));
    const credit = roundChf(own.reduce((sum, line) => sum + line.credit, 0));
    const delta = signed(account.accountType, debit, credit);
    if (entry.entry_date < input.period.startsOn) {
      opening = roundChf(opening + delta);
      continue;
    }
    if (!inPeriod(entry.entry_date, input.period)) continue;
    running = roundChf(running + delta);
    const side = debit > 0 && credit === 0 ? "debit" : credit > 0 && debit === 0 ? "credit" : "both";
    const counterparts = lines
      .filter((line) => {
        if (line.accountId === account.id || (line.debit <= 0 && line.credit <= 0)) return false;
        if (side === "debit") return line.credit > 0;
        if (side === "credit") return line.debit > 0;
        return true;
      })
      .map((line) => accountName(input.accounts, line.accountId))
      .filter(Boolean);
    movements.push({
      date: entry.entry_date,
      number: entry.entry_number,
      piece: printable(entry.reference?.trim() || "-"),
      label: printable(entry.description),
      counterpart: [...new Set(counterparts)].join(" · "),
      debit,
      credit,
      balance: roundChf(opening + running),
    });
  }
  return {
    kind: "ledger",
    title: "Extrait de compte",
    accountId: account.id,
    accountNumber: account.number,
    accountName: account.name,
    periodLabel: input.period.label,
    from: input.period.startsOn,
    to: input.period.endsOn,
    scope: LEDGER_SCOPE,
    opening,
    movements,
    closing: roundChf(opening + running),
  };
}
