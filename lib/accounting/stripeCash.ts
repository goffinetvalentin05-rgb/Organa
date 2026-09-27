import { roundChf } from "./money";

export type JournalSide = { account_id: string; debit: number; credit: number };

/** Frais réellement prélevés sur le compte Stripe du club. Un frais nul ou trop grand n'est pas inventé. */
export function clubStripeFeeCents(input: {
  amountCents: number;
  processingFeeCents: number;
  applicationFeeCents: number;
}): number {
  const amount = Math.round(input.amountCents);
  const fee = Math.max(0, Math.round(input.processingFeeCents)) + Math.max(0, Math.round(input.applicationFeeCents));
  if (amount <= 0 || fee <= 0 || fee >= amount) return 0;
  return fee;
}

/**
 * Une seule écriture : le produit est le montant brut, une fois.
 * Le compte Stripe ne reçoit que le net. Les frais sont une charge.
 */
export function stripeCollectionLines(input: {
  gross: number;
  fee: number;
  treasuryAccountId: string;
  feeAccountId: string;
  categoryAccountId: string;
}): JournalSide[] {
  const gross = roundChf(input.gross);
  const fee = roundChf(input.fee);
  if (gross <= 0) return [];
  if (fee > 0 && fee < gross) {
    return [
      { account_id: input.treasuryAccountId, debit: roundChf(gross - fee), credit: 0 },
      { account_id: input.feeAccountId, debit: fee, credit: 0 },
      { account_id: input.categoryAccountId, debit: 0, credit: gross },
    ];
  }
  return [
    { account_id: input.treasuryAccountId, debit: gross, credit: 0 },
    { account_id: input.categoryAccountId, debit: 0, credit: gross },
  ];
}

/** Versement Stripe vers la banque : transfert de trésorerie, aucun produit. */
export function stripePayoutLines(input: {
  amount: number;
  bankAccountId: string;
  stripeAccountId: string;
}): JournalSide[] {
  const amount = roundChf(input.amount);
  if (amount <= 0 || input.bankAccountId === input.stripeAccountId) return [];
  return [
    { account_id: input.bankAccountId, debit: amount, credit: 0 },
    { account_id: input.stripeAccountId, debit: 0, credit: amount },
  ];
}

/** Plusieurs comptes de trésorerie, un seul crédit de produit, pour le total confirmé. */
export function compoundReceiptLines(input: {
  splits: Array<{ accountId: string; amount: number }>;
  categoryAccountId: string;
}): JournalSide[] {
  const splits = input.splits
    .map((split) => ({ accountId: split.accountId, amount: roundChf(split.amount) }))
    .filter((split) => split.amount > 0);
  const total = roundChf(splits.reduce((sum, split) => sum + split.amount, 0));
  if (splits.length === 0 || total <= 0) return [];
  return [
    ...splits.map((split) => ({ account_id: split.accountId, debit: split.amount, credit: 0 })),
    { account_id: input.categoryAccountId, debit: 0, credit: total },
  ];
}

export function linesBalanced(lines: JournalSide[]): boolean {
  if (lines.length < 2) return false;
  const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
  return debit === credit && debit > 0;
}
