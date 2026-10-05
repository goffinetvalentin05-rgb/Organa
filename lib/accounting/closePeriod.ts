import { nextAccountingPeriod, periodLabel } from "./onboarding";
import { roundChf } from "./money";

export type InboxActor = "user" | "system";

export type CloseEntry = {
  id: string;
  status: string;
  entryDate: string;
  periodId?: string | null;
  sourceType?: string | null;
  eventType?: string | null;
  sourceId?: string | null;
};

export type CloseLine = { accountId: string; debit: number; credit: number };

export type PnlBalance = {
  accountId: string;
  accountType: "revenue" | "expense";
  debit: number;
  credit: number;
};

export type TransferLine = { account_id: string; debit: number; credit: number };

export const CLOSE_BLOCKING_INBOX = [
  "pending",
  "awaiting_account",
  "awaiting_category",
  "awaiting_details",
  "blocked_closed_period",
] as const;

export function isOfficialEntry(status: string): boolean {
  return status === "validated" || status === "reversed";
}

/** Produit : crédit − débit. Charge : débit − crédit. Le signe nul est soldé aussi. */
export function pnlNet(balance: PnlBalance): number {
  return balance.accountType === "revenue"
    ? roundChf(balance.credit - balance.debit)
    : roundChf(balance.debit - balance.credit);
}

/**
 * Écritures officielles de l'exercice, hors ouverture et hors report déjà passé.
 * Le périmètre de dates est celui du compte de résultat.
 */
export function accumulatePnl(
  entries: CloseEntry[],
  linesByEntry: Record<string, CloseLine[]>,
  accountTypes: Map<string, string>,
  period: { startsOn: string; endsOn: string }
): PnlBalance[] {
  const totals = new Map<string, PnlBalance>();
  for (const entry of entries) {
    if (!isOfficialEntry(entry.status)) continue;
    if (entry.entryDate < period.startsOn || entry.entryDate > period.endsOn) continue;
    if (entry.sourceType === "opening" || entry.eventType === "opening") continue;
    if (entry.sourceType === "period_close") continue;
    for (const line of linesByEntry[entry.id] || []) {
      const accountType = accountTypes.get(line.accountId);
      if (accountType !== "revenue" && accountType !== "expense") continue;
      const current = totals.get(line.accountId) ?? {
        accountId: line.accountId,
        accountType,
        debit: 0,
        credit: 0,
      };
      current.debit = roundChf(current.debit + line.debit);
      current.credit = roundChf(current.credit + line.credit);
      totals.set(line.accountId, current);
    }
  }
  return [...totals.values()];
}

/** Solde chaque compte, quel que soit le sens. Le 2900 n'apparaît que si le résultat n'est pas nul. */
export function closingTransferLines(balances: PnlBalance[], retainedAccountId: string): TransferLine[] {
  const lines: TransferLine[] = [];
  for (const balance of balances) {
    const net = pnlNet(balance);
    if (net === 0) continue;
    const amount = roundChf(Math.abs(net));
    if (balance.accountType === "revenue") {
      lines.push(net > 0
        ? { account_id: balance.accountId, debit: amount, credit: 0 }
        : { account_id: balance.accountId, debit: 0, credit: amount });
    } else {
      lines.push(net > 0
        ? { account_id: balance.accountId, debit: 0, credit: amount }
        : { account_id: balance.accountId, debit: amount, credit: 0 });
    }
  }
  if (lines.length === 0) return [];
  const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
  const plug = roundChf(debit - credit);
  if (plug > 0) lines.push({ account_id: retainedAccountId, debit: 0, credit: plug });
  else if (plug < 0) lines.push({ account_id: retainedAccountId, debit: roundChf(Math.abs(plug)), credit: 0 });
  return lines;
}

export function transferResultAmount(lines: TransferLine[], retainedAccountId: string): number {
  const retained = lines.find((line) => line.account_id === retainedAccountId);
  if (!retained) return 0;
  return roundChf(retained.credit - retained.debit);
}

export function sameTransferLines(existing: CloseLine[], proposed: TransferLine[]): boolean {
  const key = (accountId: string, debit: number, credit: number) =>
    `${accountId}:${roundChf(debit).toFixed(2)}:${roundChf(credit).toFixed(2)}`;
  const left = existing.map((line) => key(line.accountId, line.debit, line.credit)).sort();
  const right = proposed.map((line) => key(line.account_id, line.debit, line.credit)).sort();
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function operationsBlockingClose(input: {
  entries: CloseEntry[];
  inbox: Array<{ status: string; entryDate: string }>;
  period: { id: string; startsOn: string; endsOn: string };
}): number {
  const { period } = input;
  let count = 0;
  for (const entry of input.entries) {
    if (entry.status !== "pending") continue;
    const tagged = entry.periodId === period.id;
    const dated = entry.entryDate >= period.startsOn && entry.entryDate <= period.endsOn;
    if (tagged || dated) count += 1;
  }
  for (const item of input.inbox) {
    if (!CLOSE_BLOCKING_INBOX.includes(item.status as (typeof CLOSE_BLOCKING_INBOX)[number])) continue;
    if (item.entryDate >= period.startsOn && item.entryDate <= period.endsOn) count += 1;
  }
  return count;
}

export function followingPeriod(period: { startsOn: string; endsOn: string }): {
  startsOn: string;
  endsOn: string;
  label: string;
} {
  const next = nextAccountingPeriod(period.startsOn, period.endsOn);
  return { ...next, label: periodLabel(next.startsOn, next.endsOn) };
}

/**
 * Exercice dont la période contient la date.
 * Un exercice encore ouvert reste recevable pour ses propres dates,
 * même si un exercice suivant existe déjà. Cette fonction ne clôture rien.
 */
export function periodCoveringDate<T extends { startsOn: string; endsOn: string; status: string }>(
  periods: T[],
  date: string,
  openOnly = false,
): T | undefined {
  return periods.find((period) => {
    if (openOnly && period.status !== "open") return false;
    return date >= period.startsOn && date <= period.endsOn;
  });
}

export function assertExplicitClose(confirmed: boolean): void {
  if (confirmed !== true) {
    throw new Error("La clôture demande une confirmation explicite.");
  }
}

/** Un exercice qui commence déjà à la date suivante est laissé tel quel, même clôturé. */
export function planFollowingPeriod(
  period: { startsOn: string; endsOn: string },
  existing: { startsOn: string; endsOn: string; status: string } | null
): { action: "insert"; startsOn: string; endsOn: string; label: string } | { action: "keep" } {
  const next = followingPeriod(period);
  if (existing && existing.startsOn === next.startsOn) return { action: "keep" };
  return { action: "insert", ...next };
}

export function rangesOverlap(
  left: { startsOn: string; endsOn: string },
  right: { startsOn: string; endsOn: string },
): boolean {
  return left.startsOn <= right.endsOn && right.startsOn <= left.endsOn;
}

/**
 * Ouvre l'exercice suivant sans clôturer le précédent et sans recopier de solde.
 * Une période déjà présente au même départ est conservée. Un chevauchement est refusé.
 */
export function planOpenFollowingPeriod(
  anchor: { startsOn: string; endsOn: string },
  existing: Array<{ startsOn: string; endsOn: string }>,
):
  | { action: "insert"; startsOn: string; endsOn: string; label: string }
  | { action: "exists"; startsOn: string }
  | { action: "overlap" } {
  const next = followingPeriod(anchor);
  if (existing.some((period) => period.startsOn === next.startsOn)) {
    return { action: "exists", startsOn: next.startsOn };
  }
  if (rangesOverlap(anchor, next) || existing.some((period) => rangesOverlap(period, next))) {
    return { action: "overlap" };
  }
  return { action: "insert", ...next };
}

export function inboxProcessingDecision(input: {
  actor: InboxActor;
  onboarded: boolean;
  canWrite: boolean;
  userId: string | null;
}): { ok: true } | { ok: false; silent: boolean; reason: string } {
  if (!input.onboarded || !input.canWrite) {
    return {
      ok: false,
      silent: input.actor === "system",
      reason: "Comptabilité inactive",
    };
  }
  if (input.actor === "user" && !input.userId) {
    return { ok: false, silent: false, reason: "Utilisateur requis" };
  }
  return { ok: true };
}
