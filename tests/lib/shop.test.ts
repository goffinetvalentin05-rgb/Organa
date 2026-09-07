import { describe, expect, it } from "vitest";
import {
  computeApplicationFeeCents,
  effectiveUnitPriceCents,
  lineTotalCents,
  parseChfToCents,
} from "@/lib/shop/money";
import { assertStockAvailable } from "@/lib/shop/stock";
import { isPaymentReady, deriveAccountStatus } from "@/lib/shop/payment-provider";
import { quoteCart } from "@/lib/shop/checkout";
import type { ShopProduct } from "@/lib/shop/types";

const product = (overrides: Partial<ShopProduct> = {}): ShopProduct => ({
  id: "p1",
  clubId: "c1",
  name: "Maillot domicile",
  description: null,
  category: "Maillot",
  priceCents: 7900,
  promotionalPriceCents: 6900,
  currency: "CHF",
  trackStock: true,
  stockQuantity: 10,
  hasVariants: false,
  status: "active",
  sortOrder: 0,
  createdAt: "",
  updatedAt: "",
  images: [],
  variants: [],
  ...overrides,
});

describe("shop money", () => {
  it("parses CHF strings to cents", () => {
    expect(parseChfToCents("79.90")).toBe(7990);
    expect(parseChfToCents("79,50")).toBe(7950);
    expect(parseChfToCents("-1")).toBeNull();
  });

  it("uses promotional price only when strictly lower", () => {
    expect(effectiveUnitPriceCents(7900, 6900)).toBe(6900);
    expect(effectiveUnitPriceCents(7900, 7900)).toBe(7900);
    expect(effectiveUnitPriceCents(7900, null)).toBe(7900);
  });

  it("computes line totals and keeps Obillz fee at 0", () => {
    expect(lineTotalCents(6900, 2)).toBe(13800);
    expect(computeApplicationFeeCents(13800)).toBe(0);
  });
});

describe("shop stock", () => {
  it("rejects oversell when tracking is on", () => {
    const result = assertStockAvailable(product({ stockQuantity: 2 }), 3);
    expect(result.ok).toBe(false);
  });

  it("ignores stock when tracking is off", () => {
    const result = assertStockAvailable(product({ trackStock: false, stockQuantity: 0 }), 5);
    expect(result.ok).toBe(true);
  });
});

describe("shop quote", () => {
  it("recalculates totals from server prices, not client input", () => {
    const quoted = quoteCart(
      [{ productId: "p1", quantity: 2 }],
      [product()]
    );
    expect("error" in quoted).toBe(false);
    if ("error" in quoted) return;
    expect(quoted.totalCents).toBe(13800);
  });

  it("requires a variant when the product has variants", () => {
    const withVariant = product({
      hasVariants: true,
      variants: [
        {
          id: "v1",
          productId: "p1",
          label: "M",
          attributes: { Taille: "M" },
          sku: null,
          stockQuantity: 5,
          isActive: true,
          sortOrder: 0,
        },
      ],
    });
    const quoted = quoteCart([{ productId: "p1", quantity: 1 }], [withVariant]);
    expect("error" in quoted).toBe(true);
  });
});

describe("payment provider readiness", () => {
  it("is not ready without a connected account", () => {
    expect(isPaymentReady(null)).toBe(false);
    expect(
      isPaymentReady({
        provider: "stripe",
        providerAccountId: "acct_123",
        status: "onboarding",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        displayName: null,
        accountEmail: null,
        livemode: false,
      })
    ).toBe(false);
  });

  it("is ready when charges are enabled and details submitted", () => {
    expect(
      isPaymentReady({
        provider: "stripe",
        providerAccountId: "acct_123",
        status: "complete",
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        displayName: "FC Test",
        accountEmail: null,
        livemode: false,
      })
    ).toBe(true);
  });

  it("derives onboarding vs complete", () => {
    expect(
      deriveAccountStatus({
        providerAccountId: "acct_1",
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      })
    ).toBe("onboarding");
    expect(
      deriveAccountStatus({
        providerAccountId: "acct_1",
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
      })
    ).toBe("complete");
  });
});
