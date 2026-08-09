import { describe, expect, it } from "vitest";
import { mapStripeSubscriptionStatus } from "@/lib/billing/stripeStatusMap";

describe("stripeStatusMap exhaustif", () => {
  const cases: Array<{
    status:
      | "active"
      | "trialing"
      | "past_due"
      | "unpaid"
      | "canceled"
      | "incomplete"
      | "incomplete_expired"
      | "paused";
    entitled: boolean;
    obillz: "active" | "expired";
  }> = [
    { status: "active", entitled: true, obillz: "active" },
    { status: "trialing", entitled: true, obillz: "active" },
    { status: "past_due", entitled: true, obillz: "active" },
    { status: "unpaid", entitled: false, obillz: "expired" },
    { status: "canceled", entitled: false, obillz: "expired" },
    { status: "incomplete", entitled: false, obillz: "expired" },
    { status: "incomplete_expired", entitled: false, obillz: "expired" },
    { status: "paused", entitled: false, obillz: "expired" },
  ];

  for (const c of cases) {
    it(`${c.status} → ${c.obillz} (entitled=${c.entitled})`, () => {
      const d = mapStripeSubscriptionStatus(c.status);
      expect(d.entitled).toBe(c.entitled);
      expect(d.obillzStatus).toBe(c.obillz);
    });
  }
});
