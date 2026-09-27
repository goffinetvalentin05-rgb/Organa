import { describe, expect, it } from "vitest";
import {
  clubStripeFeeCents,
  compoundReceiptLines,
  linesBalanced,
  stripeCollectionLines,
  stripePayoutLines,
} from "@/lib/accounting/stripeCash";

describe("encaissement Stripe", () => {
  it("crédite le produit une seule fois et isole les frais réels", () => {
    const lines = stripeCollectionLines({
      gross: 100,
      fee: 2.9,
      treasuryAccountId: "stripe",
      feeAccountId: "fees",
      categoryAccountId: "shop",
    });
    expect(lines).toEqual([
      { account_id: "stripe", debit: 97.1, credit: 0 },
      { account_id: "fees", debit: 2.9, credit: 0 },
      { account_id: "shop", debit: 0, credit: 100 },
    ]);
    expect(lines.filter((line) => line.account_id === "shop")).toHaveLength(1);
    expect(linesBalanced(lines)).toBe(true);
  });

  it("ignore un frais nul, négatif ou supérieur au montant", () => {
    expect(clubStripeFeeCents({ amountCents: 10000, processingFeeCents: 0, applicationFeeCents: 0 })).toBe(0);
    expect(clubStripeFeeCents({ amountCents: 10000, processingFeeCents: -5, applicationFeeCents: 0 })).toBe(0);
    expect(clubStripeFeeCents({ amountCents: 10000, processingFeeCents: 10000, applicationFeeCents: 0 })).toBe(0);
    expect(clubStripeFeeCents({ amountCents: 10000, processingFeeCents: 180, applicationFeeCents: 0 })).toBe(180);
    const lines = stripeCollectionLines({
      gross: 100,
      fee: 100,
      treasuryAccountId: "stripe",
      feeAccountId: "fees",
      categoryAccountId: "shop",
    });
    expect(lines).toEqual([
      { account_id: "stripe", debit: 100, credit: 0 },
      { account_id: "shop", debit: 0, credit: 100 },
    ]);
  });

  it("verse Stripe vers la banque sans produit", () => {
    const lines = stripePayoutLines({ amount: 97.1, bankAccountId: "bank", stripeAccountId: "stripe" });
    expect(lines).toEqual([
      { account_id: "bank", debit: 97.1, credit: 0 },
      { account_id: "stripe", debit: 0, credit: 97.1 },
    ]);
    expect(lines.some((line) => line.account_id === "shop")).toBe(false);
    expect(linesBalanced(lines)).toBe(true);
    expect(stripePayoutLines({ amount: 10, bankAccountId: "bank", stripeAccountId: "bank" })).toEqual([]);
  });
});

describe("vente de soutien", () => {
  it("réunit plusieurs comptes dans une seule écriture équilibrée", () => {
    const lines = compoundReceiptLines({
      categoryAccountId: "income",
      splits: [
        { accountId: "cash", amount: 40 },
        { accountId: "bank", amount: 60.5 },
      ],
    });
    expect(lines).toEqual([
      { account_id: "cash", debit: 40, credit: 0 },
      { account_id: "bank", debit: 60.5, credit: 0 },
      { account_id: "income", debit: 0, credit: 100.5 },
    ]);
    expect(lines.filter((line) => line.credit > 0)).toHaveLength(1);
    expect(linesBalanced(lines)).toBe(true);
  });
});
