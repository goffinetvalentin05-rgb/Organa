import { describe, expect, it } from "vitest";
import {
  isStaffLawfulBasisDeclared,
  isTruthyMarketingOptIn,
  withCampaignAudienceConsentFilter,
} from "@/lib/marketing/consent";

describe("marketing consent helpers", () => {
  it("opt-in uniquement si true strict", () => {
    expect(isTruthyMarketingOptIn(true)).toBe(true);
    expect(isTruthyMarketingOptIn(false)).toBe(false);
    expect(isTruthyMarketingOptIn("true")).toBe(false);
    expect(isTruthyMarketingOptIn(1)).toBe(false);
    expect(isTruthyMarketingOptIn(undefined)).toBe(false);
  });

  it("déclaration staff uniquement si true strict", () => {
    expect(isStaffLawfulBasisDeclared(true)).toBe(true);
    expect(isStaffLawfulBasisDeclared(false)).toBe(false);
  });

  it("filtre campagne : unsubscribed false + consented_at not null", () => {
    const calls: string[] = [];
    const query = {
      eq(column: string, value: unknown) {
        calls.push(`eq:${column}:${String(value)}`);
        return query;
      },
      not(column: string, operator: string, value: unknown) {
        calls.push(`not:${column}:${operator}:${String(value)}`);
        return query;
      },
    };
    withCampaignAudienceConsentFilter(query);
    expect(calls).toEqual([
      "eq:unsubscribed:false",
      "not:consented_at:is:null",
    ]);
  });
});
