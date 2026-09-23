import { describe, expect, it } from "vitest";
import { ACCOUNTING_TAGLINE } from "@/lib/accounting/copy";
import {
  buildCashLines,
  buildOpeningLines,
  canAutoValidate,
  decidePosting,
  linesAreBalanced,
  nextPaymentGeneration,
  officialTotals,
  paymentIdempotencyKey,
  reverseLines,
  reviewAmount,
} from "@/lib/accounting/engine";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import type { CashEvent, ReportLine } from "@/lib/accounting/types";

function event(overrides: Partial<CashEvent> = {}): CashEvent {
  return {
    amount: 250,
    feeAmount: 0,
    entryDate: "2026-09-23",
    sourceType: "membership",
    sourceId: "doc-1",
    eventType: "payment_received",
    direction: "in",
    financialAccountCode: "bank",
    categoryCode: "membership",
    autoValidate: false,
    periodClosed: false,
    beforeStart: false,
    ...overrides,
  };
}

describe("format suisse", () => {
  it("affiche CHF 1'250.00", () => {
    expect(formatChfAmount(1250)).toBe("CHF 1'250.00");
    expect(formatChfAmount(250)).toBe("CHF 250.00");
    expect(formatSwissDate("2026-09-23")).toBe("23.09.2026");
  });

  it("ne prétend pas à une conformité totale", () => {
    expect(ACCOUNTING_TAGLINE).toBe(
      "Comptabilité conçue selon les principes comptables suisses."
    );
    expect(ACCOUNTING_TAGLINE.toLowerCase()).not.toContain("toutes les obligations");
  });
});

describe("decidePosting", () => {
  it("crée une seule écriture équilibrée pour une cotisation connue", () => {
    const decision = decidePosting(event());
    expect(decision.kind).toBe("post");
    if (decision.kind !== "post") return;
    expect(decision.status).toBe("pending");
    expect(decision.lines).toEqual([
      { accountCode: "bank", debit: 250, credit: 0 },
      { accountCode: "membership", debit: 0, credit: 250 },
    ]);
    expect(linesAreBalanced(decision.lines)).toBe(true);
  });

  it("auto-valide seulement si tout est certain", () => {
    const stripe = event({
      autoValidate: true,
      financialAccountCode: "stripe",
      categoryCode: "membership",
    });
    expect(canAutoValidate(stripe)).toBe(true);
    const decision = decidePosting(stripe);
    expect(decision.kind).toBe("post");
    if (decision.kind !== "post") return;
    expect(decision.status).toBe("validated");
  });

  it("n’auto-valide jamais un compte ou une catégorie inconnus", () => {
    const unknownAccount = event({
      autoValidate: true,
      financialAccountCode: null,
    });
    expect(canAutoValidate(unknownAccount)).toBe(false);
    const decision = decidePosting(unknownAccount);
    expect(decision).toEqual({ kind: "awaiting", missing: ["account"] });

    const unknownCategory = event({
      autoValidate: true,
      categoryCode: null,
    });
    expect(decidePosting(unknownCategory)).toEqual({
      kind: "awaiting",
      missing: ["category"],
    });
  });

  it("ignore avant la date de départ et bloque un exercice clôturé", () => {
    expect(decidePosting(event({ beforeStart: true })).kind).toBe("ignore");
    expect(decidePosting(event({ periodClosed: true })).kind).toBe("blocked");
  });

  it("sépare les frais Stripe en une seule opération à trois lignes", () => {
    const lines = buildCashLines(
      event({
        amount: 75,
        feeAmount: 2.5,
        financialAccountCode: "stripe",
        categoryCode: "shop",
      })
    );
    expect(lines).toEqual([
      { accountCode: "stripe", debit: 72.5, credit: 0 },
      { accountCode: "bank_fees", debit: 2.5, credit: 0 },
      { accountCode: "shop", debit: 0, credit: 75 },
    ]);
    expect(linesAreBalanced(lines!)).toBe(true);
  });
});

describe("idempotence", () => {
  it("refuse un second paiement actif et autorise une génération après extourne", () => {
    expect(paymentIdempotencyKey("invoice", "a", "payment_received")).toBe(
      "invoice:a:payment_received"
    );
    expect(nextPaymentGeneration({ activeCount: 1, existingCount: 1 })).toBeNull();
    expect(nextPaymentGeneration({ activeCount: 0, existingCount: 1 })).toBe(2);
    expect(paymentIdempotencyKey("invoice", "a", "payment_received", 2)).toBe(
      "invoice:a:payment_received:2"
    );
  });
});

describe("rapports officiels", () => {
  const lines: ReportLine[] = [
    {
      entryId: "1",
      entryStatus: "validated",
      accountType: "asset",
      accountNumber: "1020",
      systemCode: "bank",
      debit: 250,
      credit: 0,
    },
    {
      entryId: "1",
      entryStatus: "validated",
      accountType: "revenue",
      accountNumber: "3000",
      systemCode: "membership",
      debit: 0,
      credit: 250,
    },
    {
      entryId: "2",
      entryStatus: "pending",
      accountType: "asset",
      accountNumber: "1020",
      systemCode: "bank",
      debit: 999,
      credit: 0,
    },
    {
      entryId: "2",
      entryStatus: "pending",
      accountType: "revenue",
      accountNumber: "3000",
      systemCode: "membership",
      debit: 0,
      credit: 999,
    },
  ];

  it("exclut les écritures à vérifier des chiffres validés", () => {
    expect(officialTotals(lines)).toEqual({
      revenue: 250,
      expense: 0,
      result: 250,
      bank: 250,
      cash: 0,
      stripe: 0,
      treasury: 250,
    });
    expect(officialTotals([{
      entryId: "bank-extra",
      entryStatus: "validated",
      accountType: "asset",
      accountNumber: "1021",
      systemCode: "bank_1021",
      debit: 7500,
      credit: 0,
    }]).treasury).toBe(7500);
    expect(reviewAmount([
      { status: "pending", amount: 999 },
      { status: "validated", amount: 250 },
    ])).toEqual({ count: 1, amount: 999 });
  });

  it("une extourne annule le montant validé", () => {
    const original = lines.filter((line) => line.entryId === "1");
    const reversed = original.map((line) => ({
      ...line,
      entryId: "3",
      entryStatus: "validated" as const,
      debit: line.credit,
      credit: line.debit,
    }));
    const marked = original.map((line) => ({
      ...line,
      entryStatus: "reversed" as const,
    }));
    expect(officialTotals([...marked, ...reversed]).result).toBe(0);
  });
});

describe("ouverture et extourne", () => {
  it("équilibre les soldes d’ouverture, y compris à zéro", () => {
    const empty = buildOpeningLines({
      bank: 0,
      cash: 0,
      stripe: 0,
      others: [],
      equityAccountCode: "equity",
    });
    expect(empty.lines).toEqual([]);

    const opened = buildOpeningLines({
      bank: 12450,
      cash: 850,
      stripe: 0,
      others: [{ accountCode: "creditors", amount: 500, side: "liability" }],
      equityAccountCode: "equity",
    });
    expect(linesAreBalanced(opened.lines)).toBe(true);
    expect(opened.equityAmount).toBe(12800);
  });

  it("inverse débit et crédit", () => {
    const lines = buildCashLines(event())!;
    expect(reverseLines(lines)).toEqual([
      { accountCode: "bank", debit: 0, credit: 250 },
      { accountCode: "membership", debit: 250, credit: 0 },
    ]);
  });
});
