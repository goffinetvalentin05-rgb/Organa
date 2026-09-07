import type { ShopProduct, ShopProductVariant } from "./types";

export type StockCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

export function availableStock(
  product: Pick<ShopProduct, "trackStock" | "hasVariants" | "stockQuantity">,
  variant?: Pick<ShopProductVariant, "stockQuantity"> | null
): number | null {
  if (!product.trackStock) return null;
  if (product.hasVariants) {
    return variant?.stockQuantity ?? 0;
  }
  return product.stockQuantity ?? 0;
}

export function assertStockAvailable(
  product: Pick<ShopProduct, "trackStock" | "hasVariants" | "stockQuantity" | "name">,
  quantity: number,
  variant?: Pick<ShopProductVariant, "stockQuantity" | "label"> | null
): StockCheckResult {
  if (quantity <= 0) {
    return { ok: false, reason: "Quantité invalide." };
  }
  if (!product.trackStock) return { ok: true };

  const stock = availableStock(product, variant);
  if (stock === null) return { ok: true };
  if (stock <= 0) {
    const label = variant?.label ? ` (${variant.label})` : "";
    return { ok: false, reason: `${product.name}${label} est en rupture de stock.` };
  }
  if (quantity > stock) {
    const label = variant?.label ? ` (${variant.label})` : "";
    return {
      ok: false,
      reason: `Stock insuffisant pour ${product.name}${label} (disponible : ${stock}).`,
    };
  }
  return { ok: true };
}

export function decrementStockValue(
  current: number | null | undefined,
  quantity: number
): number {
  return Math.max(0, (current ?? 0) - quantity);
}

export function incrementStockValue(
  current: number | null | undefined,
  quantity: number
): number {
  return Math.max(0, (current ?? 0) + quantity);
}
