import { roundChf } from "./money";
import type { DraftLine } from "./types";

export type GridLine = { accountId: string; debit: number; credit: number };

export type JournalVisualRow = {
  key: string;
  entryId: string;
  debitAccountId: string | null;
  creditAccountId: string | null;
  amount: number;
  groupIndex: number;
  groupSize: number;
};

/** Une écriture à deux lignes devient une seule ligne de journal. Une écriture composée montre chaque compte. */
export function toJournalRows(entryId: string, lines: GridLine[]): JournalVisualRow[] {
  const debits = lines.filter((line) => line.debit > 0);
  const credits = lines.filter((line) => line.credit > 0);

  if (debits.length === 1 && credits.length === 1) {
    return [{
      key: `${entryId}:0`,
      entryId,
      debitAccountId: debits[0].accountId,
      creditAccountId: credits[0].accountId,
      amount: roundChf(debits[0].debit),
      groupIndex: 0,
      groupSize: 1,
    }];
  }

  if (debits.length > 1 && credits.length === 1) {
    return debits.map((line, index) => ({
      key: `${entryId}:${index}`,
      entryId,
      debitAccountId: line.accountId,
      creditAccountId: credits[0].accountId,
      amount: roundChf(line.debit),
      groupIndex: index,
      groupSize: debits.length,
    }));
  }

  if (credits.length > 1 && debits.length === 1) {
    return credits.map((line, index) => ({
      key: `${entryId}:${index}`,
      entryId,
      debitAccountId: debits[0].accountId,
      creditAccountId: line.accountId,
      amount: roundChf(line.credit),
      groupIndex: index,
      groupSize: credits.length,
    }));
  }

  const rows = lines.filter((line) => line.debit > 0 || line.credit > 0);
  return rows.map((line, index) => ({
    key: `${entryId}:${index}`,
    entryId,
    debitAccountId: line.debit > 0 ? line.accountId : null,
    creditAccountId: line.credit > 0 ? line.accountId : null,
    amount: roundChf(line.debit || line.credit),
    groupIndex: index,
    groupSize: rows.length,
  }));
}

export function rowsToLines(rows: Array<Pick<JournalVisualRow, "debitAccountId" | "creditAccountId" | "amount">>): GridLine[] {
  const debits = new Map<string, number>();
  const credits = new Map<string, number>();
  for (const row of rows) {
    const amount = roundChf(row.amount);
    if (amount <= 0) continue;
    if (row.debitAccountId) debits.set(row.debitAccountId, roundChf((debits.get(row.debitAccountId) || 0) + amount));
    if (row.creditAccountId) credits.set(row.creditAccountId, roundChf((credits.get(row.creditAccountId) || 0) + amount));
  }
  const lines: GridLine[] = [];
  for (const [accountId, debit] of debits) lines.push({ accountId, debit, credit: 0 });
  for (const [accountId, credit] of credits) lines.push({ accountId, debit: 0, credit });
  return lines;
}

export function journalLinesBalanced(lines: GridLine[]): boolean {
  const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
  return lines.length >= 2 && debit > 0 && debit === credit;
}

export function canEditJournalEntry(status: string): boolean {
  return status === "pending" || status === "validated";
}

const MATERIAL = new Set(["date", "piece", "debit", "credit", "amount", "lines"]);

export function editIsMaterial(fields: string[]): boolean {
  return fields.some((field) => MATERIAL.has(field));
}

export function resolveJournalStatus(input: {
  previous: string;
  requested: string;
  material: boolean;
  balanced: boolean;
}): { status: "pending" | "validated" } | { error: string } {
  if (input.previous === "validated" && input.material) {
    return { status: "pending" };
  }
  if (input.requested === "validated" && !input.balanced) {
    return { error: "L’écriture doit être équilibrée avant d’être vérifiée." };
  }
  if (input.requested === "validated") return { status: "validated" };
  return { status: "pending" };
}

export function entryNumberAllowed(
  value: number,
  taken: Array<{ id: string; periodId: string | null; number: number }>,
  periodId: string | null,
  selfId: string
): boolean {
  if (!Number.isInteger(value) || value < 1) return false;
  return !taken.some((row) => row.periodId === periodId && row.number === value && row.id !== selfId);
}

export function journalImbalance(lines: GridLine[]): number {
  const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
  return roundChf(debit - credit);
}

export type JournalField = "date" | "piece" | "label" | "debit" | "credit" | "amount" | "remark";

const ORDER: JournalField[] = ["date", "piece", "label", "debit", "credit", "amount", "remark"];

export function nextJournalField(field: JournalField): JournalField | "next-row" {
  const index = ORDER.indexOf(field);
  if (index < 0 || index === ORDER.length - 1) return "next-row";
  return ORDER[index + 1];
}

export function accountAllowed(account: { id: string; clubId: string; isActive: boolean } | undefined, clubId: string): boolean {
  return Boolean(account && account.clubId === clubId && account.isActive);
}

export function linesMentionCountLabel(lines: GridLine[]): string[] {
  return lines.map((line) => line.accountId);
}

export function asDraftLines(lines: GridLine[]): DraftLine[] {
  return lines.map((line) => ({ accountCode: line.accountId, debit: line.debit, credit: line.credit }));
}
