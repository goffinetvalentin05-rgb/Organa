import { isBankSystemCode } from "./financialAccounts";
import { roundChf } from "./money";

/** Compte de produit déduit du document, sans rubrique inventée. */
export function revenueCategoryForDocument(doc: {
  type: string;
  sponsorContractId?: string | null;
  notes?: string | null;
  title?: string | null;
  eventId?: string | null;
}): string {
  if (doc.type === "quote") return "membership";
  if (doc.sponsorContractId) return "sponsoring";
  const text = `${doc.notes || ""} ${doc.title || ""}`.toLowerCase();
  if (text.includes("buvette")) return "buvette";
  if (doc.eventId) return "event_income";
  return "other_income";
}

export const REVENUE_CATEGORY_LABELS: Record<string, string> = {
  membership: "Cotisations",
  sponsoring: "Sponsoring",
  donation: "Dons et soutiens",
  event_income: "Manifestations",
  shop: "Boutique",
  supporters: "Cartes supporters",
  support_sale: "Ventes de soutien",
  grant: "Subventions",
  buvette: "Buvette",
  other_income: "Autres produits",
};

/** Banque, compte postal (banque ajoutée) ou caisse. Stripe seulement si le paiement l'est. */
export function isTreasuryAccount(systemCode: string | null | undefined, allowStripe = false): boolean {
  if (systemCode === "cash" || isBankSystemCode(systemCode)) return true;
  return allowStripe && systemCode === "stripe";
}

export function isCashPaidStatus(type: string, status: string | null | undefined): boolean {
  if (type === "quote") return status === "accepte" || status === "paye";
  return status === "paye";
}

export function paidStatusFor(type: string): "accepte" | "paye" {
  return type === "quote" ? "accepte" : "paye";
}

export function sourceTypeForDocument(type: string): "membership" | "invoice" {
  return type === "quote" ? "membership" : "invoice";
}

export function remainingDue(total: number, already: number): number {
  return roundChf(Math.max(0, roundChf(total) - roundChf(already)));
}

export type ReceiptPlan =
  | { ok: true; amount: number; received: number; remaining: number; paid: boolean }
  | { ok: false; reason: "settled" | "amount" };

/**
 * Un encaissement intégral produit exactement une écriture et solde le document.
 * Un montant partiel laisse le document ouvert.
 */
export function planReceipt(total: number, already: number, amount: number): ReceiptPlan {
  const remaining = remainingDue(total, already);
  if (remaining <= 0) return { ok: false, reason: "settled" };
  const value = roundChf(amount);
  if (value <= 0 || value > remaining) return { ok: false, reason: "amount" };
  const received = roundChf(already + value);
  return {
    ok: true,
    amount: value,
    received,
    remaining: roundChf(remaining - value),
    paid: received >= roundChf(total),
  };
}

export function receiptLines(amount: number): { debit: number; credit: number } {
  const value = roundChf(amount);
  return { debit: value, credit: value };
}

export type CashSide = "treasury" | "category";

/**
 * Charge : débit du compte de charge, crédit de la trésorerie.
 * Revenu : débit de la trésorerie, crédit du compte de produit.
 * Le montant confirmé est passé tel quel (TTC s'il l'est déjà). Pas de ligne de TVA ajoutée.
 */
export function paymentJournalLines(input: {
  direction: "in" | "out";
  amount: number;
  treasuryAccountId: string;
  categoryAccountId: string;
}): Array<{ accountId: string; debit: number; credit: number }> {
  const amount = roundChf(input.amount);
  if (input.direction === "out") {
    return [
      { accountId: input.categoryAccountId, debit: amount, credit: 0 },
      { accountId: input.treasuryAccountId, debit: 0, credit: amount },
    ];
  }
  return [
    { accountId: input.treasuryAccountId, debit: amount, credit: 0 },
    { accountId: input.categoryAccountId, debit: 0, credit: amount },
  ];
}

/**
 * Une confirmation couvre le montant restant en une seule écriture.
 * Un second appel, une fois le total couvert, ne crée plus rien.
 */
export function fullCashPayment(total: number, already: number, amount: number):
  | { ok: true; amount: number }
  | { ok: false; reason: "settled" | "amount" } {
  const remaining = remainingDue(total, already);
  if (remaining <= 0) return { ok: false, reason: "settled" };
  const value = roundChf(amount);
  if (value !== remaining || value <= 0) return { ok: false, reason: "amount" };
  return { ok: true, amount: value };
}
