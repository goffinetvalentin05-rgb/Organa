import { isOfficialStatus, linesAreBalanced } from "./engine";
import { roundChf } from "./money";

export const ADVANCED_SOURCE = "manual_accounting";
export const ADVANCED_EVENT = "manual_advanced_entry";

export const UNBALANCED_MESSAGE = "L’écriture doit être équilibrée avant d’être enregistrée.";

export type AdvancedLineInput = {
  accountId: string;
  debit: number;
  credit: number;
};

export type AdvancedAccountRef = {
  id: string;
  clubId: string;
  isActive: boolean;
};

export function assessAdvancedLines(input: {
  clubId: string;
  lines: AdvancedLineInput[];
  accounts: AdvancedAccountRef[];
}): { ok: true; debit: number; credit: number } | { ok: false; message: string } {
  if (input.lines.length < 2) {
    return { ok: false, message: "Une écriture comptable comporte au moins deux lignes." };
  }

  const drafted = [];
  for (const line of input.lines) {
    const account = input.accounts.find((item) => item.id === line.accountId);
    if (!account || account.clubId !== input.clubId) {
      return { ok: false, message: "Compte introuvable dans le plan de ce club." };
    }
    if (!account.isActive) {
      return { ok: false, message: "Un compte désactivé ne peut pas être utilisé." };
    }
    const debit = roundChf(line.debit);
    const credit = roundChf(line.credit);
    if (debit < 0 || credit < 0 || !Number.isFinite(debit) || !Number.isFinite(credit)) {
      return { ok: false, message: "Un montant ne peut pas être négatif." };
    }
    if (debit > 0 && credit > 0) {
      return { ok: false, message: "Une ligne est soit au débit, soit au crédit." };
    }
    if (debit === 0 && credit === 0) {
      return { ok: false, message: "Chaque ligne doit avoir un montant." };
    }
    drafted.push({ accountCode: account.id, debit, credit });
  }

  if (!linesAreBalanced(drafted)) {
    return { ok: false, message: UNBALANCED_MESSAGE };
  }

  return {
    ok: true,
    debit: roundChf(drafted.reduce((sum, line) => sum + line.debit, 0)),
    credit: roundChf(drafted.reduce((sum, line) => sum + line.credit, 0)),
  };
}

export function canModifyAdvancedEntry(entry: {
  status: string;
  sourceType: string;
  eventType: string;
}): boolean {
  return entry.status === "pending" && entry.sourceType === ADVANCED_SOURCE && entry.eventType === ADVANCED_EVENT;
}

export function buildReversalLines(lines: AdvancedLineInput[]): AdvancedLineInput[] {
  return lines.map((line) => ({
    accountId: line.accountId,
    debit: roundChf(line.credit),
    credit: roundChf(line.debit),
  }));
}

export function appearsInOfficialReports(status: string): boolean {
  return isOfficialStatus(status as "pending" | "validated" | "reversed" | "voided");
}
