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

export const CLOSED_PERIOD_MESSAGE =
  "Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.";

/** Écriture visible du journal : modifiable tant que l’exercice est ouvert. L’extourne n’est pas un blocage. */
export function journalLockReason(status: string, periodStatus: string | null | undefined): string | null {
  if (status === "voided") return "Cette écriture a déjà été retirée du journal.";
  if (periodStatus === "closed") return CLOSED_PERIOD_MESSAGE;
  if (status === "pending" || status === "validated" || status === "reversed") return null;
  return "Cette écriture ne peut pas être modifiée.";
}

export function canEditJournalEntry(status: string, periodStatus: string | null = "open"): boolean {
  return journalLockReason(status, periodStatus) === null;
}

export function linkedJournalEntryId(entry: {
  reversed_by_entry_id?: string | null;
  reversal_of_entry_id?: string | null;
}): string | null {
  return entry.reversed_by_entry_id || entry.reversal_of_entry_id || null;
}

export function journalEditMaterial(
  previous: {
    date: string;
    reference: string;
    rows: Array<{ debitAccountId: string | null; creditAccountId: string | null; amount: number }>;
  },
  next: {
    date: string;
    reference: string;
    rows: Array<{ debitAccountId: string | null; creditAccountId: string | null; amount: number }>;
  }
): boolean {
  if (previous.date !== next.date || previous.reference !== next.reference) return true;
  if (previous.rows.length !== next.rows.length) return true;
  return next.rows.some((row, index) => {
    const before = previous.rows[index];
    return row.debitAccountId !== before.debitAccountId
      || row.creditAccountId !== before.creditAccountId
      || roundChf(row.amount) !== roundChf(before.amount);
  });
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
  if (input.requested === "validated" && !input.balanced) {
    return { error: "L’écriture doit être équilibrée avant d’être vérifiée." };
  }
  const official = input.previous === "validated" || input.previous === "reversed";
  if (official && input.material) return { status: "pending" };
  if (input.requested === "validated") return { status: "validated" };
  return { status: "pending" };
}

export const ENTRY_NUMBER_TAKEN = "Ce numéro d’écriture est déjà utilisé dans l’exercice.";

export function explainJournalError(message: string): string {
  if (/accounting_entries_number/i.test(message)) return ENTRY_NUMBER_TAKEN;
  return message;
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

export type DraftCheck = {
  date: string;
  label: string;
  lines: Array<{ debitAccountId: string; creditAccountId: string; amount: number }>;
};

/** Une nouvelle écriture reste un brouillon d’écran tant qu’elle n’est pas explicitement enregistrée. */
export function nextDraftAction(alreadyOpen: boolean): "create" | "focus" {
  return alreadyOpen ? "focus" : "create";
}

export function draftIssues(draft: DraftCheck): string[] {
  const issues: string[] = [];
  if (!draft.date) issues.push("Indiquez la date.");
  if (!draft.label.trim()) issues.push("Indiquez le libellé.");
  if (draft.lines.length === 0) issues.push("Ajoutez une ligne.");
  const simple = draft.lines.length === 1 ? draft.lines[0] : null;
  if (simple) {
    if (!simple.debitAccountId) issues.push("Choisissez le compte au débit.");
    if (!simple.creditAccountId) issues.push("Choisissez le compte au crédit.");
    if (!(simple.amount > 0)) issues.push("Indiquez un montant supérieur à zéro.");
    return issues;
  }
  const balanced = journalLinesBalanced(rowsToLines(draft.lines));
  if (!balanced) issues.push("L’écriture composée doit être équilibrée.");
  if (draft.lines.some((line) => line.amount <= 0 || (!line.debitAccountId && !line.creditAccountId))) {
    issues.push("Chaque ligne doit avoir un compte et un montant.");
  }
  return issues;
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
