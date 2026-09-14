import { describe, expect, it } from "vitest";
import {
  addCalendarYearsYmd,
  computeValidityPeriod,
  isSupporterActive,
  offerAllowsCheckout,
  supporterDisplayStatus,
  todayYmd,
} from "@/lib/supporters/status";
import {
  formatSupporterNumber,
  formatSupporterNumberLabel,
  publicDisplayName,
  seasonLabel,
} from "@/lib/supporters/format";
import { parseCheckoutCustomer, parseOfferInput } from "@/lib/supporters/input";

describe("supporter validity", () => {
  it("treats active + current dates as valid", () => {
    expect(
      isSupporterActive(
        { status: "active", startDate: "2026-01-01", endDate: "2027-06-30" },
        new Date("2026-09-14T12:00:00Z")
      )
    ).toBe(true);
  });

  it("treats past end_date as expired even if status is active", () => {
    expect(
      isSupporterActive(
        { status: "active", startDate: "2025-07-01", endDate: "2026-06-30" },
        new Date("2026-09-14T12:00:00Z")
      )
    ).toBe(false);
    expect(
      supporterDisplayStatus(
        { status: "active", startDate: "2025-07-01", endDate: "2026-06-30" },
        new Date("2026-09-14T12:00:00Z")
      )
    ).toBe("expired");
  });

  it("never treats pending as valid", () => {
    expect(
      isSupporterActive({
        status: "pending",
        startDate: "2026-01-01",
        endDate: "2027-06-30",
      })
    ).toBe(false);
  });

  it("never treats cancelled as valid", () => {
    expect(
      isSupporterActive({
        status: "cancelled",
        startDate: "2026-01-01",
        endDate: "2027-06-30",
      })
    ).toBe(false);
  });
});

describe("validity period", () => {
  it("uses season dates and starts at payment if later", () => {
    const period = computeValidityPeriod({
      durationType: "season",
      offerStartDate: "2026-07-01",
      offerEndDate: "2027-06-30",
      paidAt: new Date("2026-08-15T10:00:00Z"),
    });
    expect(period.startDate).toBe(todayYmd(new Date("2026-08-15T10:00:00Z")));
    expect(period.endDate).toBe("2027-06-30");
  });

  it("covers one calendar year from payment", () => {
    const period = computeValidityPeriod({
      durationType: "year",
      offerStartDate: null,
      offerEndDate: null,
      paidAt: new Date("2026-09-14T10:00:00+02:00"),
    });
    expect(period.endDate).toBe(addCalendarYearsYmd(period.startDate, 1));
  });
});

describe("formatting", () => {
  it("pads supporter numbers", () => {
    expect(formatSupporterNumber(1)).toBe("0001");
    expect(formatSupporterNumber(42)).toBe("0042");
    expect(formatSupporterNumber(182)).toBe("0182");
    expect(formatSupporterNumberLabel(42)).toBe("#0042");
  });

  it("shows first name + last initial only", () => {
    expect(publicDisplayName("Valentin", "Goffinet")).toBe("Valentin G.");
  });

  it("builds a season label", () => {
    expect(seasonLabel("2026-07-01", "2027-06-30")).toBe("2026/27");
  });
});

describe("offer input", () => {
  it("rejects too-low prices", () => {
    const parsed = parseOfferInput({
      name: "Supporter+",
      price: "0.50",
      durationType: "year",
    });
    expect("error" in parsed).toBe(true);
  });

  it("parses a valid season offer", () => {
    const parsed = parseOfferInput({
      name: "Supporter+",
      price: "50",
      durationType: "season",
      startDate: "2026-07-01",
      endDate: "2027-06-30",
      benefits: ["Nom sur le mur", "10 % boutique"],
    });
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.priceCents).toBe(5000);
    expect(parsed.benefits).toHaveLength(2);
  });
});

describe("checkout customer", () => {
  it("requires offerId and ignores client amount", () => {
    const parsed = parseCheckoutCustomer({
      firstName: "Valentin",
      lastName: "Goffinet",
      email: "valentin@example.com",
      offerId: "offer-1",
      amount: 1,
      price: 1,
    });
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.offerId).toBe("offer-1");
    expect("amount" in parsed).toBe(false);
  });
});

describe("offer checkout window", () => {
  it("blocks inactive offers", () => {
    const result = offerAllowsCheckout({
      isActive: false,
      durationType: "year",
      startDate: null,
      endDate: null,
    });
    expect(result.ok).toBe(false);
  });
});
