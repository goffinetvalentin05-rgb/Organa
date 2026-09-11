import { describe, expect, it } from "vitest";
import { isLegalAccepted, legalAcceptanceError } from "@/lib/legal/requireAcceptance";
import { DPA_VERSION, LEGAL_ACCEPTANCE_ERROR, TERMS_VERSION } from "@/lib/legal/versions";

describe("acceptation CGU/DPA", () => {
  it("versions initiales explicites", () => {
    expect(TERMS_VERSION).toBe("2026-09");
    expect(DPA_VERSION).toBe("2026-09");
  });

  it("uniquement true strict", () => {
    expect(isLegalAccepted(true)).toBe(true);
    expect(isLegalAccepted(false)).toBe(false);
    expect(isLegalAccepted("true")).toBe(false);
    expect(isLegalAccepted(1)).toBe(false);
    expect(isLegalAccepted(undefined)).toBe(false);
  });

  it("refuse un body sans case cochée", () => {
    expect(legalAcceptanceError({ acceptLegal: false })).toBe(LEGAL_ACCEPTANCE_ERROR);
    expect(legalAcceptanceError({})).toBe(LEGAL_ACCEPTANCE_ERROR);
    expect(legalAcceptanceError({ acceptLegal: true })).toBeNull();
  });
});
