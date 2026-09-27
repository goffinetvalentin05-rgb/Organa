import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fullCashPayment, paymentJournalLines } from "@/lib/accounting/receipts";
import { buildAccountExtract, buildIncomeStatement, buildJournalReport } from "@/lib/accounting/reports";
import type { ReportAccount, ReportEntry, ReportMovement, ReportPeriod } from "@/lib/accounting/reports";

const migration = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/100_accounting_finance_payments.sql"),
  "utf8"
);
const exportRoute = readFileSync(
  path.resolve(__dirname, "../../app/api/export/accounting/route.tsx"),
  "utf8"
);

const period: ReportPeriod = {
  id: "2026",
  label: "2026",
  startsOn: "2026-01-01",
  endsOn: "2026-12-31",
};

const accounts: ReportAccount[] = [
  { id: "caisse", number: "1000", name: "Caisse", accountType: "asset", accountClass: 1 },
  { id: "courant", number: "1020", name: "Compte courant", accountType: "asset", accountClass: 1 },
  { id: "equipement", number: "4100", name: "Équipements", accountType: "expense", accountClass: 4 },
  { id: "fournitures", number: "6500", name: "Frais administratifs", accountType: "expense", accountClass: 6 },
  { id: "produits", number: "3900", name: "Autres produits", accountType: "revenue", accountClass: 3 },
];

function entry(id: string, number: number, description: string, lines: ReportMovement[]): ReportEntry {
  return {
    id,
    entry_number: number,
    entry_date: "2026-09-27",
    description,
    status: "validated",
    source_type: id.startsWith("rev") ? "club_revenue" : "expense",
    event_type: id.startsWith("rev") ? "payment_received" : "payment_sent",
    period_id: "2026",
  };
}

describe("paiement confirmé d'une charge ou d'un revenu", () => {
  const bankExpense = paymentJournalLines({
    direction: "out",
    amount: 1989,
    treasuryAccountId: "courant",
    categoryAccountId: "equipement",
  });
  const cashExpense = paymentJournalLines({
    direction: "out",
    amount: 40,
    treasuryAccountId: "caisse",
    categoryAccountId: "fournitures",
  });
  const bankRevenue = paymentJournalLines({
    direction: "in",
    amount: 500,
    treasuryAccountId: "courant",
    categoryAccountId: "produits",
  });

  it("débite la charge et crédite la banque, la caisse, puis débite la banque pour un revenu", () => {
    expect(bankExpense).toEqual([
      { accountId: "equipement", debit: 1989, credit: 0 },
      { accountId: "courant", debit: 0, credit: 1989 },
    ]);
    expect(cashExpense).toEqual([
      { accountId: "fournitures", debit: 40, credit: 0 },
      { accountId: "caisse", debit: 0, credit: 40 },
    ]);
    expect(bankRevenue).toEqual([
      { accountId: "courant", debit: 500, credit: 0 },
      { accountId: "produits", debit: 0, credit: 500 },
    ]);
    expect(fullCashPayment(1989, 0, 1989)).toEqual({ ok: true, amount: 1989 });
    expect(fullCashPayment(1989, 1989, 1989)).toEqual({ ok: false, reason: "settled" });
    expect(fullCashPayment(1989, 0, 100).ok).toBe(false);
  });

  it("laisse une charge en retard hors du journal et n'écrit chaque paiement qu'une fois", () => {
    const linesByEntry: Record<string, ReportMovement[]> = {
      wsport: bankExpense,
      especes: cashExpense,
      "rev-banque": bankRevenue,
    };
    const entries = [
      entry("wsport", 1, "Wsport 2800", bankExpense),
      entry("especes", 2, "Fournitures", cashExpense),
      entry("rev-banque", 3, "Recette buvette", bankRevenue),
    ];
    const books = { accounts, entries, linesByEntry, period };
    const journal = buildJournalReport(books);
    expect(journal.lineCount).toBe(3);
    expect(journal.rows.map((row) => row.label)).toEqual(["Wsport 2800", "Fournitures", "Recette buvette"]);
    expect(journal.rows[0].debit).toContain("4100");
    expect(journal.rows[0].credit).toContain("1020");
    expect(journal.rows[0].amount).toBe(1989);

    const courant = buildAccountExtract({ ...books, accountId: "courant" });
    const caisse = buildAccountExtract({ ...books, accountId: "caisse" });
    expect("error" in courant).toBe(false);
    expect("error" in caisse).toBe(false);
    if (!("error" in courant) && !("error" in caisse)) {
      expect(courant.movements.map((row) => row.credit)).toContain(1989);
      expect(courant.movements.map((row) => row.debit)).toContain(500);
      expect(caisse.movements.map((row) => row.credit)).toEqual([40]);
      expect(courant.closing).toBe(-1489);
      expect(caisse.closing).toBe(-40);
    }

    const income = buildIncomeStatement(books);
    expect(income.chargeTotal).toBe(2029);
    expect(income.productTotal).toBe(500);
    expect(income.result).toBe(-1529);
    expect(income.outcome.label).toBe("Perte de l'exercice");
    expect(income.charges.some((group) => group.lines.some((line) => line.number === "4100" && line.amount === 1989))).toBe(true);
    expect(income.products.some((group) => group.lines.some((line) => line.number === "3900" && line.amount === 500))).toBe(true);
  });
});

describe("migration et export", () => {
  it("n'efface pas l'historique et n'écrit qu'à la confirmation", () => {
    expect(migration).toContain("Créer une charge ou la laisser ouverte ne comptabilise rien");
    expect(migration).toContain("Prévoir un revenu ne comptabilise rien");
    expect(migration).toContain("finance_payments_idem");
    expect(migration).toContain("Choisissez une catégorie de charge");
    expect(migration).toContain("Choisissez une catégorie de produit");
    expect(migration).not.toContain("DELETE FROM public.accounting_entries");
    const expenseUpdates = migration.match(/UPDATE public\.expenses[\s\S]*?WHERE id = p_source AND user_id = p_club;/g) ?? [];
    expect(expenseUpdates.length).toBe(3);
    expect(expenseUpdates.every((statement) => !statement.includes("updated_at"))).toBe(true);
    expect(exportRoute).toContain("Ne crée aucune écriture comptable");
    expect(exportRoute).not.toContain("accounting_enqueue");
  });
});
