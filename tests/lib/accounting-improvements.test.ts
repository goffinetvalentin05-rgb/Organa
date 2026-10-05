import { describe, expect, it } from "vitest";
import { assessAdvancedLines } from "@/lib/accounting/advancedEntry";
import {
  assessBudgetLines,
  buildBudgetComparison,
  planBudgetRevision,
  planBudgetValidation,
} from "@/lib/accounting/budget";
import { assertExplicitClose, periodCoveringDate } from "@/lib/accounting/closePeriod";
import { assessAccountGroup, findGroupCycle } from "@/lib/accounting/groups";
import {
  BALANCE_ASSET_FIXED,
  BALANCE_ASSET_TOTAL_LABEL,
  BALANCE_EQUITY,
  BALANCE_FUNDING_TOTAL_LABEL,
  BALANCE_LIABILITY_LONG,
  BALANCE_LIABILITY_SHORT,
  buildBalanceSheet,
  buildIncomeStatement,
  isFixedAsset,
  isLongTermLiability,
  balanceSubtotalLabel,
} from "@/lib/accounting/reports";
import type { ReportAccount, ReportEntry, ReportMovement } from "@/lib/accounting/reports";

const period = { id: "season", label: "2026–2027", startsOn: "2026-07-01", endsOn: "2027-06-30" };

function account(id: string, number: string, name: string, accountType: string, accountClass = 1): ReportAccount {
  return { id, number, name, accountType, accountClass };
}

const accounts: ReportAccount[] = [
  account("cash", "1000", "Caisse", "asset"),
  account("bank-a", "1021", "Banque A", "asset"),
  account("bank-b", "1022", "Banque B", "asset"),
  account("fixed", "1500", "Immobilisations", "asset"),
  account("creditors", "2000", "Créanciers", "liability", 2),
  account("vat", "2200", "TVA due", "liability", 2),
  account("accrued", "2300", "Passifs transitoires", "liability", 2),
  account("loan", "2450", "Emprunt", "liability", 2),
  account("equity", "2800", "Fortune", "equity", 2),
  account("retained", "2900", "Résultats reportés", "equity", 2),
  account("result", "2979", "Résultat de l’exercice", "equity", 2),
  account("revenue", "3000", "Cotisations", "revenue", 3),
  account("expense", "6500", "Frais", "expense", 6),
];

function entry(id: string, date: string, status = "validated", source = "manual", event = "payment_received"): ReportEntry {
  return {
    id,
    entry_number: 1,
    entry_date: date,
    description: id,
    status,
    source_type: source,
    event_type: event,
    period_id: period.id,
  };
}

describe("structure du bilan", () => {
  it("classe les comptes existants et sépare court terme, long terme et fonds propres", () => {
    expect(isFixedAsset("1000")).toBe(false);
    expect(isFixedAsset("1300")).toBe(false);
    expect(isFixedAsset("1500")).toBe(true);
    expect(isLongTermLiability("2000")).toBe(false);
    expect(isLongTermLiability("2200")).toBe(false);
    expect(isLongTermLiability("2300")).toBe(false);
    expect(isLongTermLiability("2450")).toBe(true);

    const opening = entry("opening", "2026-07-01", "validated", "opening", "opening");
    const lines: Record<string, ReportMovement[]> = {
      opening: [
        { accountId: "cash", debit: 100, credit: 0 },
        { accountId: "bank-a", debit: 400, credit: 0 },
        { accountId: "bank-b", debit: 250, credit: 0 },
        { accountId: "fixed", debit: 800, credit: 0 },
        { accountId: "creditors", debit: 0, credit: 50 },
        { accountId: "vat", debit: 0, credit: 20 },
        { accountId: "accrued", debit: 0, credit: 30 },
        { accountId: "loan", debit: 0, credit: 300 },
        { accountId: "equity", debit: 0, credit: 1150 },
      ],
    };
    const report = buildBalanceSheet({ accounts, entries: [opening], linesByEntry: lines, period });
    expect(report.assets.map((group) => group.title)).toEqual(["Actif circulant", BALANCE_ASSET_FIXED]);
    expect(report.assets[0].total).toBe(750);
    expect(report.assets[1].total).toBe(800);
    expect(report.assetTotal).toBe(1550);
    expect(report.funding.map((group) => group.title)).toEqual([
      BALANCE_LIABILITY_SHORT,
      BALANCE_LIABILITY_LONG,
      BALANCE_EQUITY,
    ]);
    expect(report.funding[0].total).toBe(100);
    expect(report.funding[1].total).toBe(300);
    expect(report.funding[2].total).toBe(1150);
    expect(report.fundingTotal).toBe(1550);
    expect(report.gap).toBe(0);
    expect(balanceSubtotalLabel(report.assets[0].title)).toBe("Sous-total actif circulant");
    expect(BALANCE_ASSET_TOTAL_LABEL).toBe("Total de l'actif");
    expect(BALANCE_FUNDING_TOTAL_LABEL).toBe("Total du passif");
  });

  it("n’ajoute le résultat courant qu’une fois, et plus après le report", () => {
    const opening = entry("opening", "2026-07-01", "validated", "opening", "opening");
    const sale = entry("sale", "2026-09-01");
    const lines: Record<string, ReportMovement[]> = {
      opening: [
        { accountId: "cash", debit: 1000, credit: 0 },
        { accountId: "equity", debit: 0, credit: 1000 },
      ],
      sale: [
        { accountId: "cash", debit: 150, credit: 0 },
        { accountId: "revenue", debit: 0, credit: 150 },
      ],
    };
    const open = buildBalanceSheet({ accounts, entries: [opening, sale], linesByEntry: lines, period });
    const equity = open.funding.find((group) => group.title === BALANCE_EQUITY);
    expect(equity?.lines.filter((line) => line.number === "2979")).toHaveLength(1);
    expect(equity?.lines.find((line) => line.number === "2979")?.amount).toBe(150);
    expect(open.gap).toBe(0);

    const closed = entry("close", "2027-06-30", "validated", "period_close", "adjustment");
    const after = buildBalanceSheet({
      accounts,
      entries: [opening, sale, closed],
      linesByEntry: {
        ...lines,
        close: [
          { accountId: "revenue", debit: 150, credit: 0 },
          { accountId: "retained", debit: 0, credit: 150 },
        ],
      },
      period,
    });
    const afterEquity = after.funding.find((group) => group.title === BALANCE_EQUITY);
    expect(afterEquity?.lines.find((line) => line.number === "2979")).toBeUndefined();
    expect(afterEquity?.lines.find((line) => line.number === "2900")?.amount).toBe(150);
    expect(after.assetTotal).toBe(1150);
    expect(after.gap).toBe(0);
  });
});

describe("regroupements", () => {
  const banks = {
    id: "banks",
    number: "1020",
    name: "Banques",
    accountIds: ["bank-a", "bank-b"],
  };

  it("affiche le sous-total sans changer le total, et reste identique sans rubrique", () => {
    const opening = entry("opening", "2026-07-01", "validated", "opening", "opening");
    const lines = {
      opening: [
        { accountId: "bank-a", debit: 400, credit: 0 },
        { accountId: "bank-b", debit: 250, credit: 0 },
        { accountId: "equity", debit: 0, credit: 650 },
      ],
    };
    const plain = buildBalanceSheet({ accounts, entries: [opening], linesByEntry: lines, period });
    const grouped = buildBalanceSheet({ accounts, entries: [opening], linesByEntry: lines, period, groups: [banks] });
    expect(plain.assetTotal).toBe(grouped.assetTotal);
    expect(plain.fundingTotal).toBe(grouped.fundingTotal);
    expect(plain.gap).toBe(grouped.gap);
    expect(grouped.assets[0].lines.find((line) => line.kind === "group")).toMatchObject({
      number: "1020",
      amount: 650,
    });
    expect(grouped.assets[0].total).toBe(650);
    expect(plain.assets[0].lines.some((line) => line.kind === "group")).toBe(false);
  });

  it("refuse un cycle, un double rattachement et un numéro déjà utilisé par un compte", () => {
    expect(findGroupCycle([
      { from: "a", to: "b" },
      { from: "b", to: "a" },
    ])).toEqual(["a", "b"]);
    const accountsRef = accounts.map((item) => ({ id: item.id, number: item.number }));
    expect(assessAccountGroup({
      group: { number: "1020", name: "Banques", accountIds: ["bank-a", "bank-b"] },
      accounts: accountsRef,
      otherGroups: [],
    }).ok).toBe(true);
    expect(assessAccountGroup({
      group: { number: "1000", name: "Caisse en double", accountIds: ["bank-a", "bank-b"] },
      accounts: accountsRef,
      otherGroups: [],
    }).ok).toBe(false);
    expect(assessAccountGroup({
      group: { id: "child", number: "1090", name: "Détail", accountIds: ["banks", "bank-a"] },
      accounts: accountsRef,
      otherGroups: [banks],
    }).ok).toBe(false);
    expect(assessAccountGroup({
      group: { number: "1090", name: "Autre", accountIds: ["bank-a", "cash"] },
      accounts: accountsRef,
      otherGroups: [banks],
    }).ok).toBe(false);
    const created = assessAccountGroup({
      group: { number: "1090", name: "Caisse et banque", accountIds: ["cash", "fixed"] },
      accounts: accountsRef,
      otherGroups: [],
    });
    expect(created.ok).toBe(true);
  });
});

describe("budget", () => {
  it("compare le réalisé officiel, signale le pending et ignore une révision sans motif", () => {
    const sale = entry("sale", "2026-09-01");
    const pending = entry("pending", "2026-09-02", "pending");
    const linesByEntry = {
      sale: [
        { accountId: "cash", debit: 200, credit: 0 },
        { accountId: "revenue", debit: 0, credit: 200 },
      ],
      pending: [
        { accountId: "cash", debit: 999, credit: 0 },
        { accountId: "revenue", debit: 0, credit: 999 },
      ],
    };
    const books = { accounts, entries: [sale, pending], linesByEntry, period };
    const income = buildIncomeStatement(books);
    const comparison = buildBudgetComparison({
      ...books,
      groups: [],
      lines: [{ accountId: "revenue", groupId: null, amount: 150 }],
    });
    expect(comparison.result.actual).toBe(income.result);
    expect(comparison.revenue.actual).toBe(200);
    expect(comparison.revenue.budget).toBe(150);
    expect(comparison.revenue.variance).toBe(50);
    expect(comparison.pendingCount).toBe(1);
    expect(comparison.pendingLabel).toMatch(/encore à vérifier/);
    expect(planBudgetValidation("validated").ok).toBe(false);
    expect(planBudgetValidation("draft").ok).toBe(true);
    expect(planBudgetRevision({ status: "validated", note: "  ", hasOpenDraft: false }).ok).toBe(false);
    const revision = planBudgetRevision({ status: "validated", note: "Assemblée", hasOpenDraft: false });
    expect(revision.ok).toBe(true);
    expect(planBudgetRevision({ status: "validated", note: "Assemblée", hasOpenDraft: true }).ok).toBe(false);
  });

  it("additionne une rubrique sans compter deux fois ses comptes", () => {
    const group = { id: "products", number: "3900", name: "Produits groupés", accountIds: ["revenue"] };
    const rejected = assessBudgetLines({
      lines: [
        { accountId: null, groupId: "products", amount: 100 },
        { accountId: "revenue", groupId: null, amount: 40 },
      ],
      accounts: accounts.map((item) => ({ ...item })),
      groups: [group],
    });
    expect(rejected.ok).toBe(false);
    const sale = entry("sale", "2026-09-01");
    const comparison = buildBudgetComparison({
      accounts,
      groups: [group],
      entries: [sale],
      linesByEntry: {
        sale: [
          { accountId: "cash", debit: 80, credit: 0 },
          { accountId: "revenue", debit: 0, credit: 80 },
        ],
      },
      period,
      lines: [
        { accountId: null, groupId: "products", amount: 100 },
        { accountId: "revenue", groupId: null, amount: 40 },
      ],
    });
    expect(comparison.rows.filter((row) => row.number === "3000" || row.number === "3900")).toHaveLength(1);
    expect(comparison.revenue.actual).toBe(80);
    expect(comparison.revenue.budget).toBe(100);
  });
});

describe("clôture manuelle et exercice ouvert", () => {
  const past = { id: "past", startsOn: "2025-07-01", endsOn: "2026-06-30", status: "open" };
  const next = { id: "next", startsOn: "2026-07-01", endsOn: "2027-06-30", status: "open" };

  it("accepte une date de l’exercice ouvert même si le suivant a commencé", () => {
    expect(periodCoveringDate([past, next], "2026-03-15")?.id).toBe("past");
    expect(periodCoveringDate([past, next], "2026-08-01")?.id).toBe("next");
    expect(periodCoveringDate([{ ...past, status: "closed" }, next], "2026-03-15", true)).toBeUndefined();
  });

  it("exige une confirmation explicite", () => {
    expect(() => assertExplicitClose(false)).toThrow(/confirmation/);
    expect(() => assertExplicitClose(true)).not.toThrow();
  });

  it("accepte une écriture de régularisation dans la saisie existante", () => {
    const assessed = assessAdvancedLines({
      clubId: "club",
      accounts: [
        { id: "prepaid", clubId: "club", isActive: true },
        { id: "bank", clubId: "club", isActive: true },
        { id: "accrued", clubId: "club", isActive: true },
      ],
      lines: [
        { accountId: "prepaid", debit: 120, credit: 0 },
        { accountId: "bank", debit: 0, credit: 80 },
        { accountId: "accrued", debit: 0, credit: 40 },
      ],
    });
    expect(assessed.ok).toBe(true);
  });
});
