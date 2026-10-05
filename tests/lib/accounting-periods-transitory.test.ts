import { describe, expect, it } from "vitest";
import { planOpenFollowingPeriod } from "@/lib/accounting/closePeriod";
import { paymentJournalLines } from "@/lib/accounting/receipts";
import { buildBalanceSheet, buildIncomeStatement, type ReportAccount, type ReportEntry } from "@/lib/accounting/reports";
import {
  bridgeOutcome,
  clearingSystemCode,
  CLOSED_ALLOCATION_MESSAGE,
  CLOSED_PAYMENT_DATE_MESSAGE,
  openAllocationPeriods,
  planBridgeCorrection,
  planTransitory,
  straddlingSuggestion,
  transitoryEngaged,
  VAT_TRANSITORY_MESSAGE,
  type BridgeAccount,
  type BridgeEffect,
  type BridgePeriod,
} from "@/lib/accounting/transitory";

const y2026: BridgePeriod = { id: "y2026", label: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31", status: "open" };
const y2027: BridgePeriod = { id: "y2027", label: "2027", startsOn: "2027-01-01", endsOn: "2027-12-31", status: "open" };
const y2028: BridgePeriod = { id: "y2028", label: "2028", startsOn: "2028-01-01", endsOn: "2028-12-31", status: "open" };
const season: BridgePeriod = { id: "season", label: "2026–2027", startsOn: "2026-07-01", endsOn: "2027-06-30", status: "open" };

const accounts: BridgeAccount[] = [
  { id: "bank", number: "1020", name: "Banque", systemCode: "bank" },
  { id: "debtors", number: "1100", name: "Débiteurs", systemCode: "debtors" },
  { id: "prepaid", number: "1300", name: "Actifs transitoires", systemCode: "prepaid" },
  { id: "accrued", number: "2300", name: "Passifs transitoires", systemCode: "accrued" },
  { id: "revenue", number: "3900", name: "Autres produits", systemCode: "other_income" },
];

function base(overrides: Partial<Parameters<typeof planTransitory>[0]> = {}) {
  return planTransitory({
    invoiceTotal: 500,
    alreadyReceived: 0,
    paymentAmount: 500,
    paymentDate: "2027-01-15",
    documentType: "invoice",
    documentStatus: "envoye",
    totalHt: 500,
    totalTva: 0,
    totalTtc: 500,
    periods: [y2026, y2027, y2028],
    productPeriodId: "y2026",
    recognitionDate: "2026-12-31",
    treasuryAccountId: "bank",
    revenueAccountId: "revenue",
    accounts,
    regularized: 0,
    settled: 0,
    released: 0,
    ...overrides,
  });
}

function revenueEffects(effects: BridgeEffect[]) {
  return effects.filter((effect) => effect.recognizesRevenue);
}

function treasuryEffects(effects: BridgeEffect[]) {
  return effects.filter((effect) => effect.movesTreasury);
}

describe("exercices ouverts", () => {
  it("ouvre l'exercice suivant sans clôturer le précédent", () => {
    const plan = planOpenFollowingPeriod(y2026, [y2026]);
    expect(plan).toEqual({ action: "insert", startsOn: "2027-01-01", endsOn: "2027-12-31", label: "2027" });
  });

  it("conserve une saison juillet–juin", () => {
    const plan = planOpenFollowingPeriod(season, [season]);
    expect(plan).toEqual({
      action: "insert",
      startsOn: "2027-07-01",
      endsOn: "2028-06-30",
      label: "2027–2028",
    });
  });

  it("refuse une période qui chevauche", () => {
    const plan = planOpenFollowingPeriod(season, [season, y2027]);
    expect(plan.action).toBe("overlap");
  });

  it("ne recrée pas un exercice déjà ouvert", () => {
    const plan = planOpenFollowingPeriod(y2026, [y2026, y2027]);
    expect(plan).toEqual({ action: "exists", startsOn: "2027-01-01" });
  });
});

describe("encaissement transitoire", () => {
  it("laisse un paiement normal sur une seule écriture", () => {
    expect(transitoryEngaged(false)).toBe(false);
    const lines = paymentJournalLines({
      direction: "in",
      amount: 500,
      treasuryAccountId: "bank",
      categoryAccountId: "revenue",
    });
    expect(lines).toEqual([
      { accountId: "bank", debit: 500, credit: 0 },
      { accountId: "revenue", debit: 0, credit: 500 },
    ]);
  });

  it("ne régularise pas une facture de décembre seulement parce qu'elle est créée en 2026", () => {
    const suggestion = straddlingSuggestion({
      invoiceDate: "2026-12-20",
      paymentDate: "2027-01-15",
      periods: [y2026, y2027],
    });
    expect(suggestion).toBeTruthy();
    expect(transitoryEngaged(false)).toBe(false);
  });

  it("rattache le produit 2026 et la trésorerie 2027 sans doublon", () => {
    const viewedPeriodId = "y2026";
    const plan = base();
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.paymentPeriodId).toBe("y2027");
    expect(plan.paymentPeriodId).not.toBe(viewedPeriodId);
    expect(plan.paymentDate).toBe("2027-01-15");
    expect(plan.clearingCode).toBe("debtors");
    expect(plan.effects).toHaveLength(2);
    expect(revenueEffects(plan.effects).map((effect) => effect.periodId)).toEqual(["y2026"]);
    expect(treasuryEffects(plan.effects).map((effect) => effect.periodId)).toEqual(["y2027"]);
    expect(plan.effects[0].lines).toEqual([
      { accountId: "debtors", debit: 500, credit: 0 },
      { accountId: "revenue", debit: 0, credit: 500 },
    ]);
    expect(plan.effects[1].lines).toEqual([
      { accountId: "bank", debit: 500, credit: 0 },
      { accountId: "debtors", debit: 0, credit: 500 },
    ]);
  });

  it("utilise les actifs transitoires pour une facture encore en brouillon", () => {
    expect(clearingSystemCode({ mode: "prior", documentType: "invoice", documentStatus: "brouillon" })).toBe("prepaid");
    const plan = base({ documentStatus: "brouillon" });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.clearingAccountId).toBe("prepaid");
  });

  it("retire les exercices clôturés des nouvelles affectations", () => {
    const closed = { ...y2026, status: "closed" };
    expect(openAllocationPeriods([closed, y2027]).map((period) => period.id)).toEqual(["y2027"]);
    const plan = base({ periods: [closed, y2027], productPeriodId: "y2026" });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.message).toBe(CLOSED_ALLOCATION_MESSAGE);
    expect(plan.paymentDate).toBe("2027-01-15");
  });

  it("refuse une date de paiement dans un exercice clôturé sans la changer", () => {
    const plan = base({
      paymentDate: "2026-03-01",
      periods: [{ ...y2026, status: "closed" }, y2027],
      productPeriodId: "y2027",
      recognitionDate: "2027-01-01",
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.message).toBe(CLOSED_PAYMENT_DATE_MESSAGE);
    expect(plan.paymentDate).toBe("2026-03-01");
  });

  it("solde en 2027 une créance régularisée en 2026 puis clôturée", () => {
    const plan = base({
      periods: [{ ...y2026, status: "closed" }, y2027],
      productPeriodId: null,
      recognitionDate: null,
      regularized: 500,
      settled: 0,
      existingAccrual: {
        entryId: "accrual-2026",
        periodId: "y2026",
        periodLabel: "2026",
        periodStatus: "closed",
        amount: 500,
        openAmount: 500,
      },
      preferredClearingId: "debtors",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.kind).toBe("settle");
    expect(plan.accrualAmount).toBe(0);
    expect(plan.effects).toHaveLength(1);
    expect(plan.effects[0].periodId).toBe("y2027");
    expect(revenueEffects(plan.effects)).toHaveLength(0);
    expect(plan.effects.some((effect) => effect.periodId === "y2026")).toBe(false);
    expect(plan.info).toContain("accrual-2026");
  });

  it("encaisse en 2027 un produit de 2028", () => {
    const plan = base({ productPeriodId: "y2028", recognitionDate: "2028-01-01" });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.kind).toBe("future");
    expect(plan.clearingCode).toBe("accrued");
    expect(treasuryEffects(plan.effects).map((effect) => effect.periodId)).toEqual(["y2027"]);
    expect(revenueEffects(plan.effects).map((effect) => effect.periodId)).toEqual(["y2028"]);
    expect(plan.effects[0].lines[1].accountId).toBe("accrued");
    expect(plan.effects[1].lines).toEqual([
      { accountId: "accrued", debit: 500, credit: 0 },
      { accountId: "revenue", debit: 0, credit: 500 },
    ]);
  });

  it("réutilise une régularisation et n'en crée pas une seconde pour le même montant", () => {
    const plan = base({ regularized: 200, settled: 0, paymentAmount: 200 });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.kind).toBe("settle");
    expect(plan.accrualAmount).toBe(0);
    expect(plan.settlementAmount).toBe(200);
  });

  it("ajoute seulement le complément d'un paiement partiel", () => {
    const plan = base({ regularized: 200, settled: 200, paymentAmount: 150, recognitionDate: "2026-12-31" });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.accrualAmount).toBe(150);
    expect(plan.settlementAmount).toBe(150);
    expect(revenueEffects(plan.effects)[0].lines[1].credit).toBe(150);
  });

  it("bloque la TVA au lieu d'écrire un montant incorrect", () => {
    const plan = base({ totalHt: 500, totalTva: 40.5, totalTtc: 540.5, invoiceTotal: 540.5, paymentAmount: 540.5 });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.message).toBe(VAT_TRANSITORY_MESSAGE);
  });

  it("retrouve le même encaissement et n'enregistre rien si une étape échoue", () => {
    const steps = ["receipt", "accrual", "cash"];
    expect(bridgeOutcome({ existingKey: "same", key: "same", steps, failAt: null })).toEqual({
      created: false,
      already: true,
      posted: steps,
    });
    expect(bridgeOutcome({ existingKey: null, key: "new", steps, failAt: "cash" })).toEqual({
      created: false,
      already: false,
      posted: [],
    });
  });

  it("refuse une correction qui touche un exercice clôturé et retire les deux moitiés ensemble", () => {
    expect(planBridgeCorrection([
      { id: "accrual", periodStatus: "closed", status: "validated" },
      { id: "cash", periodStatus: "open", status: "validated" },
    ])).toEqual({ ok: false, message: expect.stringContaining("Aucune partie") });
    expect(planBridgeCorrection([
      { id: "accrual", periodStatus: "open", status: "validated" },
      { id: "cash", periodStatus: "open", status: "validated" },
    ])).toEqual({ ok: true, voidIds: ["accrual", "cash"] });
  });

  it("garde le journal, le bilan et le résultat cohérents sur les deux exercices", () => {
    const plan = base();
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const reportAccounts: ReportAccount[] = [
      { id: "bank", number: "1020", name: "Banque", accountType: "asset", accountClass: 1 },
      { id: "debtors", number: "1100", name: "Débiteurs", accountType: "asset", accountClass: 1 },
      { id: "revenue", number: "3900", name: "Autres produits", accountType: "revenue", accountClass: 3 },
    ];
    const entries: ReportEntry[] = plan.effects.map((effect, index) => ({
      id: effect.role,
      entry_number: index + 1,
      entry_date: effect.date,
      description: effect.role,
      status: "validated",
      period_id: effect.periodId,
      event_type: effect.eventType,
      source_type: "invoice",
    }));
    const lines = Object.fromEntries(plan.effects.map((effect) => [effect.role, effect.lines]));
    const income2026 = buildIncomeStatement({ accounts: reportAccounts, entries, linesByEntry: lines, period: y2026 });
    const income2027 = buildIncomeStatement({ accounts: reportAccounts, entries, linesByEntry: lines, period: y2027 });
    const balance2026 = buildBalanceSheet({ accounts: reportAccounts, entries, linesByEntry: lines, period: y2026 });
    const balance2027 = buildBalanceSheet({ accounts: reportAccounts, entries, linesByEntry: lines, period: y2027 });
    expect(income2026.productTotal).toBe(500);
    expect(income2027.productTotal).toBe(0);
    expect(balance2026.gap).toBe(0);
    expect(balance2027.gap).toBe(0);
    expect(balance2026.assetTotal).toBe(500);
    expect(balance2027.assetTotal).toBe(500);

    const future = base({ productPeriodId: "y2028", recognitionDate: "2028-01-01" });
    expect(future.ok).toBe(true);
    if (!future.ok) return;
    const futureAccounts: ReportAccount[] = [
      ...reportAccounts,
      { id: "accrued", number: "2300", name: "Passifs transitoires", accountType: "liability", accountClass: 2 },
    ];
    const futureEntries: ReportEntry[] = future.effects.map((effect, index) => ({
      id: effect.role,
      entry_number: index + 1,
      entry_date: effect.date,
      description: effect.role,
      status: "validated",
      period_id: effect.periodId,
      event_type: effect.eventType,
    }));
    const futureLines = Object.fromEntries(future.effects.map((effect) => [effect.role, effect.lines]));
    expect(buildIncomeStatement({ accounts: futureAccounts, entries: futureEntries, linesByEntry: futureLines, period: y2027 }).productTotal).toBe(0);
    expect(buildIncomeStatement({ accounts: futureAccounts, entries: futureEntries, linesByEntry: futureLines, period: y2028 }).productTotal).toBe(500);
    expect(buildBalanceSheet({ accounts: futureAccounts, entries: futureEntries, linesByEntry: futureLines, period: y2027 }).gap).toBe(0);
    expect(buildBalanceSheet({ accounts: futureAccounts, entries: futureEntries, linesByEntry: futureLines, period: y2028 }).gap).toBe(0);
  });
});
