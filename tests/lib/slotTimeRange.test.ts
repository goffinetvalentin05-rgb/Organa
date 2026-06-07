import { describe, expect, it } from "vitest";
import {
  getSlotEndDateYmd,
  getSlotTimeRangeError,
  isOvernightSlot,
  isValidSlotTimeRange,
} from "@/lib/planning/slotTimeRange";

describe("slotTimeRange", () => {
  it("accepte un créneau normal le même jour", () => {
    expect(isValidSlotTimeRange("18:00", "22:00")).toBe(true);
    expect(isOvernightSlot("18:00", "22:00")).toBe(false);
    expect(getSlotTimeRangeError("18:00", "22:00")).toBeNull();
    expect(getSlotEndDateYmd("2026-06-09", "18:00", "22:00")).toBe("2026-06-09");
  });

  it("accepte un créneau overnight", () => {
    expect(isValidSlotTimeRange("23:00", "01:00")).toBe(true);
    expect(isOvernightSlot("23:00", "01:00")).toBe(true);
    expect(getSlotTimeRangeError("23:00", "01:00")).toBeNull();
    expect(getSlotEndDateYmd("2026-06-09", "23:00", "01:00")).toBe("2026-06-10");
  });

  it("accepte un créneau commençant à minuit", () => {
    expect(isValidSlotTimeRange("00:00", "04:00")).toBe(true);
    expect(isOvernightSlot("00:00", "04:00")).toBe(false);
  });

  it("refuse un créneau de durée nulle", () => {
    expect(isValidSlotTimeRange("10:00", "10:00")).toBe(false);
    expect(isValidSlotTimeRange("23:00", "23:00")).toBe(false);
    expect(getSlotTimeRangeError("23:00", "23:00")).toBe(
      "L'heure de fin doit être différente de l'heure de début"
    );
  });
});
