import { SHOP_CURRENCY } from "./types";

export function parseChfToCents(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) {
    if (input < 0) return null;
    return Math.round(input * 100);
  }
  if (typeof input !== "string") return null;
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function centsToChf(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatChf(cents: number, locale = "fr-CH"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: SHOP_CURRENCY,
  }).format(centsToChf(cents));
}

export function effectiveUnitPriceCents(
  priceCents: number,
  promotionalPriceCents: number | null | undefined
): number {
  if (
    typeof promotionalPriceCents === "number" &&
    promotionalPriceCents >= 0 &&
    promotionalPriceCents < priceCents
  ) {
    return promotionalPriceCents;
  }
  return priceCents;
}

export function lineTotalCents(unitPriceCents: number, quantity: number): number {
  return unitPriceCents * quantity;
}

/** Commission Obillz — 0 bps pour le MVP, prêt pour un pourcentage ultérieur. */
export function computeApplicationFeeCents(amountCents: number): number {
  const feeBps = 0;
  return Math.round((amountCents * feeBps) / 10_000);
}
