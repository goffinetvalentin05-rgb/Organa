import { describe, expect, it } from "vitest";
import { RECOMMENDED_CHART } from "@/lib/accounting/chart";
import { buildOpeningLines, linesAreBalanced } from "@/lib/accounting/engine";
import { isBankSystemCode, isExtraBankSystemCode, isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { OPENING_PLAN_USER_MESSAGE, buildFinalizePayload, mapOpeningLines, planOnboardingAccounts, planOpening, readOpeningDiagnostic } from "@/lib/accounting/openingPlan";
import {
  coverageSentence,
  coverageType,
  nextAccountingPeriod,
  normalizeOnboardingInput,
  PATRIMONY_ITEMS,
  resolveCoverageType,
  allocateExtraBankNumbers,
  suggestBankNumber,
} from "@/lib/accounting/onboarding";

describe("exercice et date de départ", () => {
  it("décale un exercice civil d’un an, sans saison sportive", () => {
    expect(nextAccountingPeriod("2026-01-01", "2026-12-31")).toEqual({
      startsOn: "2027-01-01",
      endsOn: "2027-12-31",
    });
  });

  it("décale un exercice décalé de la même façon", () => {
    expect(nextAccountingPeriod("2026-07-01", "2027-06-30")).toEqual({
      startsOn: "2027-07-01",
      endsOn: "2028-06-30",
    });
  });

  it("signale un démarrage en cours d’exercice", () => {
    expect(coverageType("2026-01-01", "2026-09-23")).toBe("partial_period");
    expect(coverageType("2026-01-01", "2026-01-01")).toBe("full_period");
    expect(
      coverageSentence({
        coverageType: "partial_period",
        accountingStartDate: "2026-09-23",
        periodEnd: "2026-12-31",
      })
    ).toBe("Les données présentées couvrent la période du 23.09.2026 au 31.12.2026.");
    expect(
      coverageSentence({
        coverageType: "full_period",
        accountingStartDate: "2027-01-01",
        periodEnd: "2027-12-31",
      })
    ).toBeNull();
  });

  it("laisse la reprise partielle tant que l’historique n’est pas importé", () => {
    expect(resolveCoverageType({
      periodStart: "2026-01-01",
      accountingStartDate: "2026-01-01",
      startMode: "resume_current",
      historyImportStatus: "planned",
    })).toBe("partial_period");
    expect(resolveCoverageType({
      periodStart: "2027-01-01",
      accountingStartDate: "2027-01-01",
      startMode: "next_period",
      historyImportStatus: "not_requested",
    })).toBe("full_period");
    expect(
      coverageSentence({
        coverageType: "partial_period",
        accountingStartDate: "2026-09-23",
        periodEnd: "2026-12-31",
        historyPending: true,
      })
    ).toContain("n’est pas encore repris");
  });

  it("reconnaît les banques ajoutées comme comptes financiers", () => {
    expect(isFinancialSystemCode("bank")).toBe(true);
    expect(isBankSystemCode("bank_1021")).toBe(true);
    expect(isFinancialSystemCode("bank_1022")).toBe(true);
    expect(isFinancialSystemCode("cash")).toBe(true);
    expect(isFinancialSystemCode("debtors")).toBe(false);
    expect(isExtraBankSystemCode("bank_fees")).toBe(false);
    expect(isBankSystemCode("bank_fees")).toBe(false);
    expect(isFinancialSystemCode("bank_fees")).toBe(false);
  });

  it("propose des numéros bancaires en sautant Stripe", () => {
    expect(suggestBankNumber(0)).toBe("1020");
    expect(suggestBankNumber(1)).toBe("1021");
    expect(suggestBankNumber(5)).toBe("1026");
    expect(allocateExtraBankNumbers(["1020", "1021", "1025"], 2)).toEqual(["1022", "1023"]);
    expect(allocateExtraBankNumbers(["1020", "1021", "1022", "1023", "1024"], 1)).toEqual(["1026"]);
  });
});

describe("situation de départ", () => {
  it("conserve l’ancien formulaire comme exercice complet", () => {
    const input = normalizeOnboardingInput({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bank: 100,
      cash: 0,
      stripe: 40,
    });
    expect(input.periodStart).toBe("2026-01-01");
    expect(input.accountingStartDate).toBe("2026-01-01");
    expect(input.banks[0]).toMatchObject({ number: "1020", amount: 100 });
    expect(input.stripeAmount).toBe(40);
    expect(coverageType(input.periodStart, input.accountingStartDate)).toBe("full_period");
  });

  it("attribue les numéros bancaires sans tenir compte d’une saisie", () => {
    const input = normalizeOnboardingInput({
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      accountingStartDate: "2026-09-23",
      startMode: "from_today",
      banks: [
        { name: "Compte courant Raiffeisen", number: "9999", amount: "18'420" },
        { name: "Compte épargne", number: "1000", amount: "7500" },
      ],
      useCash: true,
      cashAmount: "1'350",
      useStripe: true,
      stripeAmount: 430,
    });
    expect(input.banks.map((bank) => bank.number)).toEqual(["1020", "1021"]);
    expect(input.cashAmount).toBe(1350);

    const opening = buildOpeningLines({
      bank: input.banks[0].amount,
      cash: input.cashAmount,
      stripe: input.stripeAmount,
      others: input.banks.slice(1).map((bank) => ({
        accountCode: `bank_${bank.number}`,
        amount: bank.amount,
        side: "asset" as const,
      })),
      equityAccountCode: "equity",
    });
    expect(linesAreBalanced(opening.lines)).toBe(true);
    expect(opening.equityAmount).toBe(27700);
  });

  it("n’ouvre pas les comptes de régularisation comme fourre-tout", () => {
    expect(PATRIMONY_ITEMS.map((item) => item.number)).toEqual(["1100", "2000", "1500", "1200"]);
    const input = normalizeOnboardingInput({
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      accountingStartDate: "2026-09-23",
      banks: [{ name: "Courant", amount: 0 }],
      others: [
        { accountCode: "debtors", amount: 100, side: "liability" },
        { accountCode: "prepaid", amount: 50 },
        { accountCode: "accrued", amount: 40 },
      ],
    });
    expect(input.others).toEqual([{ accountCode: "debtors", amount: 100, side: "asset", note: undefined }]);
    expect(RECOMMENDED_CHART.find((account) => account.number === "1300")?.name).toBe(
      "Actifs de régularisation / actifs transitoires"
    );
    expect(RECOMMENDED_CHART.find((account) => account.number === "2300")?.name).toBe(
      "Passifs de régularisation / passifs transitoires"
    );
  });
});

function openingCase(body: Record<string, unknown>) {
  const params = normalizeOnboardingInput({
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    accountingStartDate: "2026-09-24",
    startMode: "from_today",
    useCash: false,
    useStripe: true,
    stripeAmount: 0,
    ...body,
  });
  const accounts = planOnboardingAccounts(params);
  const opening = planOpening(params, accounts);
  const mapped = mapOpeningLines(
    opening.lines,
    accounts.map((account) => ({
      id: `id-${account.systemCode}`,
      systemCode: account.systemCode,
      number: account.number,
      isActive: true,
    }))
  );
  const plan = buildFinalizePayload("club", "user", params, "partial_period");
  return { params, accounts, opening, mapped, plan };
}

function debitOf(lines: Array<{ system_code: string | null; number: string; debit: number; credit: number }>, code: string) {
  return lines.filter((line) => line.system_code === code).reduce((sum, line) => sum + line.debit, 0);
}

describe("finalisation de l’ouverture", () => {
  it("ouvre deux banques, sans caisse, Stripe à zéro, contrepartie 2800", () => {
    const { accounts, opening, mapped, plan } = openingCase({
      banks: [
        { name: "Compte courant", amount: 1000 },
        { name: "Compte épargne", amount: 2000 },
      ],
    });

    expect(mapped.ok).toBe(true);
    expect(mapped.missing_account_codes).toEqual([]);
    expect(mapped.missing_account_ids).toEqual([]);
    expect(linesAreBalanced(opening.lines)).toBe(true);
    expect(accounts.filter((account) => account.number === "1021")).toHaveLength(1);
    expect(accounts.find((account) => account.systemCode === "bank_fees")?.number).toBe("6800");
    expect(accounts.find((account) => account.number === "2800")?.systemCode).toBe("equity");
    expect(opening.lines.map((line) => line.accountCode).sort()).toEqual(["bank", "bank_1021", "equity"]);
    expect(debitOf(mapped.lines, "bank") + debitOf(mapped.lines, "bank_1021")).toBe(3000);
    expect(mapped.lines.find((line) => line.number === "2800")).toMatchObject({
      account_id: "id-equity",
      credit: 3000,
      debit: 0,
    });
    expect(plan.payload.opening).toMatchObject({ amount: 3000 });
    expect(plan.payload.accounts.filter((account) => account.system_code === "bank_1021")).toHaveLength(1);

    const again = openingCase({
      banks: [
        { name: "Compte courant", amount: 1000 },
        { name: "Compte épargne", amount: 2000 },
      ],
    });
    expect(again.accounts.filter((account) => account.systemCode === "bank_1021")).toHaveLength(1);
    expect(again.plan.payload.opening?.lines).toHaveLength(3);
  });

  it("n’exige pas la caisse ni Stripe quand leur solde est nul", () => {
    const { opening } = openingCase({
      banks: [{ name: "Compte courant", amount: 1000 }],
      useCash: false,
      useStripe: true,
      stripeAmount: 0,
    });
    expect(opening.lines.map((line) => line.accountCode).sort()).toEqual(["bank", "equity"]);
    expect(opening.equityAmount).toBe(1000);
  });

  it("équilibre deux banques et une caisse", () => {
    const { opening, mapped } = openingCase({
      banks: [
        { name: "Compte courant", amount: 1000 },
        { name: "Compte épargne", amount: 2000 },
      ],
      useCash: true,
      cashAmount: 100,
    });
    expect(mapped.ok).toBe(true);
    expect(debitOf(mapped.lines, "bank") + debitOf(mapped.lines, "bank_1021") + debitOf(mapped.lines, "cash")).toBe(3100);
    expect(mapped.lines.find((line) => line.number === "2800")?.credit).toBe(3100);
    expect(opening.lines.some((line) => line.accountCode === "stripe")).toBe(false);
  });

  it("équilibre une banque et une dette", () => {
    const { mapped } = openingCase({
      banks: [{ name: "Compte courant", amount: 1000 }],
      others: [{ accountCode: "creditors", amount: 400, side: "liability" }],
    });
    expect(mapped.ok).toBe(true);
    expect(mapped.lines.find((line) => line.number === "2000")).toMatchObject({ credit: 400, account_id: "id-creditors" });
    expect(mapped.lines.find((line) => line.number === "2800")?.credit).toBe(600);
  });

  it("équilibre une banque et une immobilisation", () => {
    const { mapped } = openingCase({
      banks: [{ name: "Compte courant", amount: 1000 }],
      others: [{ accountCode: "fixed_assets", amount: 500, side: "asset" }],
    });
    expect(mapped.ok).toBe(true);
    expect(debitOf(mapped.lines, "bank") + debitOf(mapped.lines, "fixed_assets")).toBe(1500);
    expect(mapped.lines.find((line) => line.number === "1500")?.account_id).toBe("id-fixed_assets");
    expect(mapped.lines.find((line) => line.number === "2800")?.credit).toBe(1500);
  });

  it("termine sans écriture quand tous les soldes sont à zéro", () => {
    const { opening, plan, accounts } = openingCase({
      banks: [{ name: "Compte courant", amount: 0 }],
      useCash: false,
      useStripe: true,
      stripeAmount: 0,
    });
    expect(opening.lines).toEqual([]);
    expect(plan.payload.opening).toBeNull();
    expect(accounts.find((account) => account.number === "2800")?.systemCode).toBe("equity");
    expect(accounts.some((account) => account.number === "1000")).toBe(true);
    expect(accounts.some((account) => account.number === "1025")).toBe(true);
  });

  it("journalise les codes manquants sans les montrer au club", () => {
    const diagnostic = readOpeningDiagnostic({
      message: "missing_account_codes=bank_1021,equity missing_account_ids=",
    });
    expect(diagnostic).toEqual({
      missing_account_codes: ["bank_1021", "equity"],
      missing_account_ids: [],
    });
    expect(OPENING_PLAN_USER_MESSAGE).not.toContain("bank_");
    expect(OPENING_PLAN_USER_MESSAGE).toContain("étape Plan");
  });
});
