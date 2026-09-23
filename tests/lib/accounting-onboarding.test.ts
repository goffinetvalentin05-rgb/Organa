import { describe, expect, it } from "vitest";
import { buildOpeningLines, linesAreBalanced } from "@/lib/accounting/engine";
import {
  coverageSentence,
  coverageType,
  nextAccountingPeriod,
  normalizeOnboardingInput,
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

  it("propose des numéros bancaires en sautant Stripe", () => {
    expect(suggestBankNumber(0)).toBe("1020");
    expect(suggestBankNumber(1)).toBe("1021");
    expect(suggestBankNumber(5)).toBe("1026");
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

  it("accepte plusieurs banques et refuse un numéro réservé", () => {
    const input = normalizeOnboardingInput({
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      accountingStartDate: "2026-09-23",
      startMode: "from_today",
      banks: [
        { name: "Compte courant Raiffeisen", number: "1020", amount: "18'420" },
        { name: "Compte épargne", number: "1021", amount: "7500" },
      ],
      useCash: true,
      cashAmount: "1'350",
      useStripe: true,
      stripeAmount: 430,
    });
    expect(input.banks).toHaveLength(2);
    expect(input.cashAmount).toBe(1350);

    const opening = buildOpeningLines({
      bank: input.banks[0].amount,
      cash: input.cashAmount,
      stripe: input.stripeAmount,
      others: input.banks.slice(1).map((bank) => ({
        accountCode: bank.number,
        amount: bank.amount,
        side: "asset" as const,
      })),
      equityAccountCode: "equity",
    });
    expect(linesAreBalanced(opening.lines)).toBe(true);
    expect(opening.equityAmount).toBe(27700);

    expect(() =>
      normalizeOnboardingInput({
        periodStart: "2026-01-01",
        periodEnd: "2026-12-31",
        accountingStartDate: "2026-09-23",
        banks: [
          { name: "Courant", number: "1020", amount: 1 },
          { name: "Caisse détournée", number: "1000", amount: 1 },
        ],
      })
    ).toThrow(/réservé/);
  });
});
