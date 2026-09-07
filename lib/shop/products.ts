import type { ShopProduct, ShopProductImage, ShopProductVariant } from "./types";
import { effectiveUnitPriceCents } from "./money";

type ProductRow = {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  promotional_price_cents: number | null;
  currency: string;
  track_stock: boolean;
  stock_quantity: number | null;
  has_variants: boolean;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
};

type VariantRow = {
  id: string;
  product_id: string;
  label: string;
  attributes: Record<string, string> | null;
  sku: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  sort_order: number;
};

export function mapImage(row: ImageRow): ShopProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
  };
}

export function mapVariant(row: VariantRow): ShopProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    label: row.label,
    attributes: row.attributes && typeof row.attributes === "object" ? row.attributes : {},
    sku: row.sku,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export function mapProduct(
  row: ProductRow,
  images: ImageRow[] = [],
  variants: VariantRow[] = []
): ShopProduct {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCents: row.price_cents,
    promotionalPriceCents: row.promotional_price_cents,
    currency: "CHF",
    trackStock: row.track_stock,
    stockQuantity: row.stock_quantity,
    hasVariants: row.has_variants,
    status: row.status as ShopProduct["status"],
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: images
      .filter((img) => img.product_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapImage),
    variants: variants
      .filter((v) => v.product_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapVariant),
  };
}

export function publicProductPayload(product: ShopProduct) {
  const unit = effectiveUnitPriceCents(product.priceCents, product.promotionalPriceCents);
  const variants = product.hasVariants
    ? product.variants
        .filter((v) => v.isActive)
        .map((v) => ({
          id: v.id,
          label: v.label,
          attributes: v.attributes,
          inStock: !product.trackStock || (v.stockQuantity ?? 0) > 0,
          stockQuantity: product.trackStock ? v.stockQuantity : null,
        }))
    : [];

  const inStock = product.hasVariants
    ? variants.some((v) => v.inStock)
    : !product.trackStock || (product.stockQuantity ?? 0) > 0;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    priceCents: product.priceCents,
    promotionalPriceCents: product.promotionalPriceCents,
    unitPriceCents: unit,
    currency: product.currency,
    trackStock: product.trackStock,
    hasVariants: product.hasVariants,
    inStock,
    stockQuantity:
      product.trackStock && !product.hasVariants ? product.stockQuantity : null,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.publicUrl,
      alt: img.altText,
    })),
    variants,
  };
}

const PRODUCT_SELECT =
  "id, club_id, name, description, category, price_cents, promotional_price_cents, currency, track_stock, stock_quantity, has_variants, status, sort_order, created_at, updated_at";

export { PRODUCT_SELECT };
export type { ProductRow, ImageRow, VariantRow };
