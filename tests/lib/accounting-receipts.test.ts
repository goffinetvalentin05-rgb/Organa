import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isTreasuryAccount,
  planReceipt,
  receiptLines,
  remainingDue,
  revenueCategoryForDocument,
} from "@/lib/accounting/receipts";

const migration = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/099_accounting_cash_receipts.sql"),
  "utf8"
);

describe("catégorie de produit du document", () => {
  it("crédite les cotisations pour une cotisation", () => {
    expect(revenueCategoryForDocument({ type: "quote" })).toBe("membership");
  });

  it("crédite le sponsoring, la buvette ou les manifestations selon le document", () => {
    expect(revenueCategoryForDocument({ type: "invoice", sponsorContractId: "s1" })).toBe("sponsoring");
    expect(revenueCategoryForDocument({ type: "invoice", notes: "Service buvette" })).toBe("buvette");
    expect(revenueCategoryForDocument({ type: "invoice", eventId: "e1" })).toBe("event_income");
    expect(revenueCategoryForDocument({ type: "invoice" })).toBe("other_income");
  });
});

describe("encaissement banque ou caisse", () => {
  it("accepte la caisse, la banque et un compte postal ajouté", () => {
    expect(isTreasuryAccount("cash")).toBe(true);
    expect(isTreasuryAccount("bank")).toBe(true);
    expect(isTreasuryAccount("bank_1021")).toBe(true);
    expect(isTreasuryAccount("stripe")).toBe(false);
    expect(isTreasuryAccount("stripe", true)).toBe(true);
    expect(isTreasuryAccount("bank_fees")).toBe(false);
  });

  it("passe une écriture équilibrée : débit trésorerie, crédit produit", () => {
    expect(receiptLines(80)).toEqual({ debit: 80, credit: 80 });
  });

  it("solde le document avec un seul encaissement intégral", () => {
    const bank = planReceipt(120, 0, 120);
    expect(bank).toMatchObject({ ok: true, paid: true, received: 120, remaining: 0, amount: 120 });
    const cash = planReceipt(40, 0, 40);
    expect(cash).toMatchObject({ ok: true, paid: true, remaining: 0 });
  });

  it("laisse le document ouvert tant que le total n'est pas reçu", () => {
    const first = planReceipt(100, 0, 40);
    expect(first).toMatchObject({ ok: true, paid: false, received: 40, remaining: 60 });
    if (!first.ok) return;
    const second = planReceipt(100, first.received, 60);
    expect(second).toMatchObject({ ok: true, paid: true, received: 100, remaining: 0 });
    expect(planReceipt(100, 100, 10)).toEqual({ ok: false, reason: "settled" });
    expect(planReceipt(100, 40, 70)).toEqual({ ok: false, reason: "amount" });
  });

  it("calcule le reste dû sans réintroduire un montant déjà encaissé", () => {
    expect(remainingDue(200, 50)).toBe(150);
    expect(remainingDue(200, 200)).toBe(0);
  });
});

describe("migration des encaissements", () => {
  it("coupe la création à l'émission et ne supprime aucune écriture", () => {
    expect(migration).toContain("Créer, envoyer ou laisser le document ouvert ne comptabilise rien");
    expect(migration).toContain("RETURN NEW");
    expect(migration).not.toContain("DELETE FROM public.accounting_entries");
    expect(migration).toContain("accounting_record_document_receipt");
    expect(migration).toContain("document_receipts_idem");
    expect(migration).toContain("format_type");
    expect(migration).not.toContain("document_id UUID NOT NULL");
    expect(migration).toContain("status = 'skipped'");
    expect(migration).toContain("Choisissez un compte de trésorerie");
  });
});
