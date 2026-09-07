import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveUnitPriceCents, lineTotalCents } from "./money";
import { assertStockAvailable, decrementStockValue, incrementStockValue } from "./stock";
import { mapProduct, PRODUCT_SELECT, type ImageRow, type ProductRow, type VariantRow } from "./products";
import type { CartItemInput, ShopProduct } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

export type QuotedLine = {
  product: ShopProduct;
  variant: ShopProduct["variants"][number] | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export function parseCustomer(body: unknown): CheckoutCustomer | { error: string } {
  if (!body || typeof body !== "object") return { error: "Données invalides." };
  const o = body as Record<string, unknown>;
  const firstName = typeof o.firstName === "string" ? o.firstName.trim() : "";
  const lastName = typeof o.lastName === "string" ? o.lastName.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  if (firstName.length < 1) return { error: "Le prénom est requis." };
  if (lastName.length < 1) return { error: "Le nom est requis." };
  if (!EMAIL_RE.test(email)) return { error: "E-mail invalide." };
  return { firstName, lastName, email, phone: phone || null };
}

export function parseCartItems(input: unknown): CartItemInput[] | { error: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { error: "Le panier est vide." };
  }
  const items: CartItemInput[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      return { error: "Panier invalide." };
    }
    const o = raw as Record<string, unknown>;
    const productId = typeof o.productId === "string" ? o.productId : "";
    const variantId =
      typeof o.variantId === "string" && o.variantId ? o.variantId : null;
    const quantity = Number(o.quantity);
    if (!productId) return { error: "Produit manquant dans le panier." };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: "Quantité invalide." };
    }
    items.push({ productId, variantId, quantity });
  }
  return items;
}

export async function loadClubProductsForQuote(
  supabase: SupabaseClient,
  clubId: string,
  productIds: string[]
): Promise<ShopProduct[]> {
  const unique = [...new Set(productIds)];
  const { data: rows, error } = await supabase
    .from("shop_products")
    .select(PRODUCT_SELECT)
    .eq("club_id", clubId)
    .in("id", unique)
    .is("deleted_at", null);

  if (error) throw error;
  const products = (rows || []) as ProductRow[];
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return [];

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase.from("shop_product_images").select("*").eq("club_id", clubId).in("product_id", ids),
    supabase.from("shop_product_variants").select("*").eq("club_id", clubId).in("product_id", ids),
  ]);

  return products.map((row) =>
    mapProduct(row, (images || []) as ImageRow[], (variants || []) as VariantRow[])
  );
}

export function quoteCart(
  items: CartItemInput[],
  products: ShopProduct[]
): { lines: QuotedLine[]; totalCents: number } | { error: string } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const merged = new Map<string, CartItemInput>();

  for (const item of items) {
    const key = `${item.productId}:${item.variantId || ""}`;
    const prev = merged.get(key);
    merged.set(key, {
      ...item,
      quantity: (prev?.quantity || 0) + item.quantity,
    });
  }

  const lines: QuotedLine[] = [];
  for (const item of merged.values()) {
    const product = byId.get(item.productId);
    if (!product || product.status !== "active") {
      return { error: "Un produit du panier n’est plus disponible." };
    }
    let variant: ShopProduct["variants"][number] | null = null;
    if (product.hasVariants) {
      variant = product.variants.find((v) => v.id === item.variantId && v.isActive) || null;
      if (!variant) {
        return { error: `Choisissez une variante pour ${product.name}.` };
      }
    }
    const stock = assertStockAvailable(product, item.quantity, variant);
    if (!stock.ok) return { error: stock.reason };

    const unit = effectiveUnitPriceCents(product.priceCents, product.promotionalPriceCents);
    lines.push({
      product,
      variant,
      quantity: item.quantity,
      unitPriceCents: unit,
      lineTotalCents: lineTotalCents(unit, item.quantity),
    });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  if (totalCents <= 0) return { error: "Le montant de la commande est invalide." };
  return { lines, totalCents };
}

export async function nextOrderNumber(
  supabase: SupabaseClient,
  clubId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const { data: existing } = await supabase
    .from("shop_order_counters")
    .select("last_number")
    .eq("club_id", clubId)
    .eq("year", year)
    .maybeSingle();

  const next = (existing?.last_number || 0) + 1;

  if (existing) {
    const { error } = await supabase
      .from("shop_order_counters")
      .update({ last_number: next })
      .eq("club_id", clubId)
      .eq("year", year)
      .eq("last_number", existing.last_number);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("shop_order_counters").insert({
      club_id: clubId,
      year,
      last_number: next,
    });
    if (error) {
      const retry = await supabase
        .from("shop_order_counters")
        .select("last_number")
        .eq("club_id", clubId)
        .eq("year", year)
        .maybeSingle();
      const n = (retry.data?.last_number || 0) + 1;
      const { error: upd } = await supabase
        .from("shop_order_counters")
        .update({ last_number: n })
        .eq("club_id", clubId)
        .eq("year", year);
      if (upd) throw upd;
      return `B-${year}-${String(n).padStart(4, "0")}`;
    }
  }

  return `B-${year}-${String(next).padStart(4, "0")}`;
}

export async function applyStockDelta(
  supabase: SupabaseClient,
  clubId: string,
  lines: QuotedLine[],
  direction: "reserve" | "restore"
) {
  const sign = direction === "reserve" ? -1 : 1;
  for (const line of lines) {
    if (!line.product.trackStock) continue;
    if (line.product.hasVariants && line.variant) {
      const next =
        sign < 0
          ? decrementStockValue(line.variant.stockQuantity, line.quantity)
          : incrementStockValue(line.variant.stockQuantity, line.quantity);
      const { error } = await supabase
        .from("shop_product_variants")
        .update({ stock_quantity: next })
        .eq("id", line.variant.id)
        .eq("club_id", clubId);
      if (error) throw error;
      line.variant.stockQuantity = next;
    } else {
      const next =
        sign < 0
          ? decrementStockValue(line.product.stockQuantity, line.quantity)
          : incrementStockValue(line.product.stockQuantity, line.quantity);
      const { error } = await supabase
        .from("shop_products")
        .update({ stock_quantity: next })
        .eq("id", line.product.id)
        .eq("club_id", clubId);
      if (error) throw error;
      line.product.stockQuantity = next;
    }
  }
}

export function quotedLinesFromOrderItems(
  items: Array<{
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    variant_label: string | null;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
  }>,
  products: ShopProduct[]
): QuotedLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: QuotedLine[] = [];
  for (const item of items) {
    if (!item.product_id) continue;
    const product = byId.get(item.product_id);
    if (!product) continue;
    const variant = item.variant_id
      ? product.variants.find((v) => v.id === item.variant_id) || null
      : null;
    lines.push({
      product,
      variant,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents,
    });
  }
  return lines;
}

export function adminShopClient() {
  return createAdminClient();
}
