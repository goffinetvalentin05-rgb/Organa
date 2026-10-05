/**
 * Budget de charges et de produits pour un exercice.
 * Aucune fonction de ce module ne crée d’écriture comptable.
 */
import type { AccountGroup } from "./groups";
import { roundChf } from "./money";
import { officialIncomeBalances, type ReportAccount, type ReportEntry, type ReportMovement, type ReportPeriod } from "./reports";

export type BudgetStatus = "draft" | "validated" | "superseded";

export type BudgetTarget = {
  accountId: string | null;
  groupId: string | null;
  amount: number;
  number?: string;
  name?: string;
};

export type BudgetAccountRef = {
  id: string;
  number: string;
  name: string;
  accountType: string;
};

export type BudgetRow = {
  key: string;
  number: string;
  name: string;
  kind: "account" | "group";
  nature: "revenue" | "expense";
  budget: number;
  actual: number;
  variance: number;
};

export type BudgetFigures = {
  budget: number;
  actual: number;
  variance: number;
};

export type BudgetComparison = {
  rows: BudgetRow[];
  revenue: BudgetFigures;
  expense: BudgetFigures;
  result: BudgetFigures;
  pendingCount: number;
  pendingAmount: number;
  pendingLabel: string;
};

function natureOf(accountType: string): "revenue" | "expense" | null {
  if (accountType === "revenue" || accountType === "expense") return accountType;
  return null;
}

export function assessBudgetLines(input: {
  lines: BudgetTarget[];
  accounts: BudgetAccountRef[];
  groups: AccountGroup[];
}): { ok: true; lines: BudgetTarget[] } | { ok: false; message: string } {
  const accounts = new Map(input.accounts.map((account) => [account.id, account]));
  const groups = new Map(input.groups.map((group) => [group.id, group]));
  const kept: BudgetTarget[] = [];
  const seenAccounts = new Set<string>();
  const seenGroups = new Set<string>();

  for (const raw of input.lines) {
    const amount = roundChf(raw.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, message: "Un montant de budget ne peut pas être négatif." };
    }
    if (amount === 0) continue;
    const accountId = raw.accountId || null;
    const groupId = raw.groupId || null;
    if ((accountId && groupId) || (!accountId && !groupId)) {
      return { ok: false, message: "Chaque ligne de budget vise un compte ou une rubrique." };
    }
    if (accountId) {
      const account = accounts.get(accountId);
      if (!account) return { ok: false, message: "Compte de budget introuvable." };
      if (!natureOf(account.accountType)) {
        return { ok: false, message: "Le budget porte sur les charges et les produits." };
      }
      if (seenAccounts.has(accountId)) return { ok: false, message: "Ce compte est déjà dans le budget." };
      seenAccounts.add(accountId);
      kept.push({ accountId, groupId: null, amount, number: account.number, name: account.name });
      continue;
    }
    const group = groups.get(groupId as string);
    if (!group) return { ok: false, message: "Rubrique de budget introuvable." };
    if (seenGroups.has(group.id)) return { ok: false, message: "Cette rubrique est déjà dans le budget." };
    const members = group.accountIds.map((id) => accounts.get(id)).filter((account): account is BudgetAccountRef => Boolean(account));
    if (members.length !== group.accountIds.length) {
      return { ok: false, message: "Une rubrique du budget contient un compte introuvable." };
    }
    const natures = new Set(members.map((account) => natureOf(account.accountType)));
    if (natures.has(null) || natures.size !== 1) {
      return { ok: false, message: "Une rubrique budgétaire ne mélange pas les charges, les produits et les autres comptes." };
    }
    seenGroups.add(group.id);
    kept.push({ accountId: null, groupId: group.id, amount, number: group.number, name: group.name });
  }

  for (const line of kept) {
    if (!line.groupId) continue;
    const group = groups.get(line.groupId);
    if (!group) continue;
    for (const accountId of group.accountIds) {
      if (seenAccounts.has(accountId)) {
        const account = accounts.get(accountId);
        return {
          ok: false,
          message: `Le compte ${account?.number || ""} est déjà inclus dans la rubrique ${group.number}. Le budget ne le compte pas deux fois.`,
        };
      }
    }
  }

  return { ok: true, lines: kept };
}

export function planBudgetValidation(status: string): { ok: true } | { ok: false; message: string } {
  if (status !== "draft") return { ok: false, message: "Seul un brouillon peut être validé." };
  return { ok: true };
}

export function planBudgetRevision(input: {
  status: string;
  note: string;
  hasOpenDraft: boolean;
}): { ok: true; note: string } | { ok: false; message: string } {
  if (input.status !== "validated") {
    return { ok: false, message: "Seule une version validée peut être révisée." };
  }
  if (input.hasOpenDraft) {
    return { ok: false, message: "Une révision est déjà en brouillon pour cet exercice." };
  }
  const note = input.note.trim();
  if (!note) return { ok: false, message: "La révision demande un motif." };
  if (note.length > 500) return { ok: false, message: "Le motif de révision est trop long." };
  return { ok: true, note };
}

function figures(rows: BudgetRow[], nature: "revenue" | "expense"): BudgetFigures {
  const picked = rows.filter((row) => row.nature === nature);
  const budget = roundChf(picked.reduce((sum, row) => sum + row.budget, 0));
  const actual = roundChf(picked.reduce((sum, row) => sum + row.actual, 0));
  return { budget, actual, variance: roundChf(actual - budget) };
}

function pendingLabel(count: number): string {
  if (count === 0) {
    return "Aucune opération à vérifier sur cet exercice. Le réalisé reprend les mêmes écritures que les rapports officiels.";
  }
  const noun = count > 1 ? "opérations encore à vérifier" : "opération encore à vérifier";
  return `${count} ${noun}. Elles ne figurent pas dans le réalisé.`;
}

export function buildBudgetComparison(input: {
  accounts: ReportAccount[];
  groups: AccountGroup[];
  entries: ReportEntry[];
  linesByEntry: Record<string, ReportMovement[]>;
  period: ReportPeriod;
  lines: BudgetTarget[];
}): BudgetComparison {
  const books = {
    accounts: input.accounts,
    entries: input.entries,
    linesByEntry: input.linesByEntry,
    period: input.period,
  };
  const actuals = officialIncomeBalances(books);
  const accounts = new Map(input.accounts.map((account) => [account.id, account]));
  const groups = new Map(input.groups.map((group) => [group.id, group]));
  const groupedAccounts = new Set<string>();
  for (const line of input.lines) {
    if (!line.groupId || line.amount === 0) continue;
    const group = groups.get(line.groupId);
    for (const accountId of group?.accountIds || []) groupedAccounts.add(accountId);
  }
  const covered = new Set<string>();
  const rows: BudgetRow[] = [];

  for (const line of input.lines) {
    if (line.accountId && groupedAccounts.has(line.accountId)) continue;
    if (line.accountId) {
      const account = accounts.get(line.accountId);
      const nature = account ? natureOf(account.accountType) : null;
      if (!account || !nature) continue;
      covered.add(account.id);
      const actual = actuals.get(account.id) || 0;
      rows.push({
        key: `account:${account.id}`,
        number: account.number,
        name: account.name,
        kind: "account",
        nature,
        budget: line.amount,
        actual,
        variance: roundChf(actual - line.amount),
      });
      continue;
    }
    if (!line.groupId && line.number) {
      rows.push({
        key: `snapshot:${line.number}:${line.name || ""}`,
        number: line.number,
        name: line.name || "Rubrique retirée",
        kind: "group",
        nature: "expense",
        budget: line.amount,
        actual: 0,
        variance: roundChf(0 - line.amount),
      });
      continue;
    }
    const group = line.groupId ? groups.get(line.groupId) : undefined;
    if (!group) continue;
    const members = group.accountIds.map((id) => accounts.get(id)).filter((account): account is ReportAccount => Boolean(account));
    const nature = members.length ? natureOf(members[0].accountType) : null;
    if (!nature || members.some((account) => natureOf(account.accountType) !== nature)) continue;
    for (const member of members) covered.add(member.id);
    const actual = roundChf(members.reduce((sum, member) => sum + (actuals.get(member.id) || 0), 0));
    rows.push({
      key: `group:${group.id}`,
      number: group.number,
      name: group.name,
      kind: "group",
      nature,
      budget: line.amount,
      actual,
      variance: roundChf(actual - line.amount),
    });
  }

  for (const account of input.accounts) {
    const nature = natureOf(account.accountType);
    const actual = actuals.get(account.id) || 0;
    if (!nature || actual === 0 || covered.has(account.id)) continue;
    rows.push({
      key: `account:${account.id}`,
      number: account.number,
      name: account.name,
      kind: "account",
      nature,
      budget: 0,
      actual,
      variance: actual,
    });
  }

  rows.sort((a, b) => a.number.localeCompare(b.number, "fr") || a.name.localeCompare(b.name, "fr"));
  const revenue = figures(rows, "revenue");
  const expense = figures(rows, "expense");
  const result = {
    budget: roundChf(revenue.budget - expense.budget),
    actual: roundChf(revenue.actual - expense.actual),
    variance: roundChf((revenue.actual - expense.actual) - (revenue.budget - expense.budget)),
  };

  let pendingCount = 0;
  let pendingAmount = 0;
  for (const entry of input.entries) {
    if (entry.status !== "pending") continue;
    const inPeriod = input.period.id && entry.period_id
      ? entry.period_id === input.period.id
      : entry.entry_date >= input.period.startsOn && entry.entry_date <= input.period.endsOn;
    if (!inPeriod) continue;
    pendingCount += 1;
    const debit = roundChf((input.linesByEntry[entry.id] || []).reduce((sum, line) => sum + line.debit, 0));
    pendingAmount = roundChf(pendingAmount + debit);
  }

  return {
    rows,
    revenue,
    expense,
    result,
    pendingCount,
    pendingAmount,
    pendingLabel: pendingLabel(pendingCount),
  };
}

export type BudgetPdfView = "forecast" | "comparison";

export type BudgetDocument = {
  view: BudgetPdfView;
  title: string;
  periodLabel: string;
  from: string;
  to: string;
  statusLine: string;
  products: BudgetRow[];
  charges: BudgetRow[];
  revenue: BudgetFigures;
  expense: BudgetFigures;
  result: BudgetFigures;
  pendingLabel: string | null;
};

/** Le PDF de début d'année ne garde que les postes budgétés. Le comparatif reprend aussi le réalisé. */
export function buildBudgetDocument(input: {
  view: BudgetPdfView;
  comparison: BudgetComparison;
  periodLabel: string;
  from: string;
  to: string;
  status: "draft" | "validated";
  version: number;
}): BudgetDocument {
  const rows = input.view === "forecast"
    ? input.comparison.rows.filter((row) => row.budget > 0)
    : input.comparison.rows;
  return {
    view: input.view,
    title: input.view === "forecast" ? "Budget" : "Budget et réalisé",
    periodLabel: input.periodLabel,
    from: input.from,
    to: input.to,
    statusLine: input.status === "validated"
      ? `Budget validé, version ${input.version}`
      : `Brouillon enregistré, version ${input.version}`,
    products: rows.filter((row) => row.nature === "revenue"),
    charges: rows.filter((row) => row.nature === "expense"),
    revenue: input.comparison.revenue,
    expense: input.comparison.expense,
    result: input.comparison.result,
    pendingLabel: input.view === "comparison" ? input.comparison.pendingLabel : null,
  };
}
