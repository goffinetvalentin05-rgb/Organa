import { roundChf } from "@/lib/accounting/money";

export type Account = {
  id: string;
  number: string;
  name: string;
  accountType: string;
  accountClass: number;
  systemCode: string | null;
  isActive: boolean;
  isSystem?: boolean;
};

export type Entry = {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  amount: number;
  direction: string;
  source_type: string;
  source_id: string | null;
  status: string;
  party_name: string | null;
  counter_account_id: string | null;
  category_account_id: string | null;
  reversed_by_entry_id: string | null;
  period_id?: string | null;
  event_type?: string;
  reference?: string | null;
  created_at?: string | null;
  validated_at?: string | null;
};

export type JournalLine = { accountId: string; debit: number; credit: number };

export type InboxItem = {
  id: string;
  description: string;
  amount: number;
  entry_date: string;
  status: string;
  source_type: string;
  source_id: string;
  party_name: string | null;
  direction: string;
  financial_account_code: string | null;
  category_code: string | null;
};

export type Attachment = { id: string; entry_id: string; file_name: string | null };

export type Period = {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
  status: string;
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "À vérifier",
  validated: "Validée",
  reversed: "Extournée",
  voided: "Écartée",
  awaiting_account: "Compte à confirmer",
  awaiting_category: "Catégorie à confirmer",
  awaiting_details: "Compte et catégorie à confirmer",
  blocked_closed_period: "Exercice clôturé",
};

export function isOfficialStatus(status: string): boolean {
  return status === "validated" || status === "reversed";
}

export function signedBalance(accountType: string, debit: number, credit: number): number {
  if (accountType === "asset" || accountType === "expense") return roundChf(debit - credit);
  return roundChf(credit - debit);
}

export function accountBalances(
  entries: Entry[],
  linesByEntry: Record<string, JournalLine[]>,
  accounts: Account[]
): Map<string, number> {
  const types = new Map(accounts.map((account) => [account.id, account.accountType]));
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!isOfficialStatus(entry.status)) continue;
    for (const line of linesByEntry[entry.id] || []) {
      const type = types.get(line.accountId) || "asset";
      const next = roundChf((totals.get(line.accountId) || 0) + signedBalance(type, line.debit, line.credit));
      totals.set(line.accountId, next);
    }
  }
  return totals;
}

export function accountLabel(account: Account | undefined): string {
  if (!account) return "—";
  return `${account.number} ${account.name}`;
}

export function sideSummary(lines: JournalLine[], accounts: Account[], side: "debit" | "credit"): string {
  const picked = lines.filter((line) => (side === "debit" ? line.debit > 0 : line.credit > 0));
  if (picked.length === 0) return "—";
  return picked
    .map((line) => accountLabel(accounts.find((account) => account.id === line.accountId)))
    .join(" · ");
}
