import { parseChfToCents } from "./money";
import { PRODUCT_STATUSES, type ProductStatus } from "./types";

export type ProductInput = {
  name: string;
  description: string | null;
  category: string | null;
  priceCents: number;
  promotionalPriceCents: number | null;
  trackStock: boolean;
  stockQuantity: number | null;
  hasVariants: boolean;
  status: ProductStatus;
  variants: Array<{
    id?: string;
    label: string;
    attributes: Record<string, string>;
    sku: string | null;
    stockQuantity: number | null;
    isActive: boolean;
    sortOrder: number;
  }>;
};

function asString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

export function parseProductInput(body: unknown): ProductInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "Données invalides." };
  const o = body as Record<string, unknown>;
  const name = asString(o.name, 160);
  if (name.length < 1) return { error: "Le nom du produit est requis." };

  const priceCents =
    typeof o.priceCents === "number"
      ? Math.round(o.priceCents)
      : parseChfToCents(o.price);
  if (priceCents === null || priceCents < 0) {
    return { error: "Prix invalide." };
  }

  let promotionalPriceCents: number | null = null;
  if (o.promotionalPriceCents !== undefined && o.promotionalPriceCents !== null && o.promotionalPriceCents !== "") {
    promotionalPriceCents =
      typeof o.promotionalPriceCents === "number"
        ? Math.round(o.promotionalPriceCents)
        : parseChfToCents(o.promotionalPrice);
    if (promotionalPriceCents === null || promotionalPriceCents < 0) {
      return { error: "Prix promotionnel invalide." };
    }
    if (promotionalPriceCents >= priceCents) {
      return { error: "Le prix promotionnel doit être inférieur au prix." };
    }
  } else if (o.promotionalPrice) {
    promotionalPriceCents = parseChfToCents(o.promotionalPrice);
    if (promotionalPriceCents === null) return { error: "Prix promotionnel invalide." };
    if (promotionalPriceCents >= priceCents) {
      return { error: "Le prix promotionnel doit être inférieur au prix." };
    }
  }

  const statusRaw = asString(o.status, 20) || "hidden";
  if (!PRODUCT_STATUSES.includes(statusRaw as ProductStatus)) {
    return { error: "Statut produit invalide." };
  }

  const hasVariants = o.hasVariants === true;
  const trackStock = o.trackStock !== false;
  const stockQuantity = trackStock && !hasVariants ? asInt(o.stockQuantity) : null;

  const variantsRaw = Array.isArray(o.variants) ? o.variants : [];
  const variants = variantsRaw.map((raw, index) => {
    const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const attributes =
      v.attributes && typeof v.attributes === "object"
        ? Object.fromEntries(
            Object.entries(v.attributes as Record<string, unknown>).map(([k, val]) => [
              String(k).slice(0, 40),
              String(val ?? "").slice(0, 80),
            ])
          )
        : {};
    return {
      id: typeof v.id === "string" ? v.id : undefined,
      label: asString(v.label, 80) || `Variante ${index + 1}`,
      attributes,
      sku: asString(v.sku, 40) || null,
      stockQuantity: trackStock ? asInt(v.stockQuantity) : null,
      isActive: v.isActive !== false,
      sortOrder: index,
    };
  });

  if (hasVariants && variants.length === 0) {
    return { error: "Ajoutez au moins une variante, ou désactivez les variantes." };
  }

  return {
    name,
    description: asString(o.description, 4000) || null,
    category: asString(o.category, 80) || null,
    priceCents,
    promotionalPriceCents,
    trackStock,
    stockQuantity,
    hasVariants,
    status: statusRaw as ProductStatus,
    variants: hasVariants ? variants : [],
  };
}
