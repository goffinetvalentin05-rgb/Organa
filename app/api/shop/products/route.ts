import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { mapProduct, PRODUCT_SELECT, type ImageRow, type ProductRow, type VariantRow } from "@/lib/shop/products";
import { parseProductInput } from "@/lib/shop/product-input";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const products = (rows || []) as ProductRow[];
    const ids = products.map((p) => p.id);

    let images: ImageRow[] = [];
    let variants: VariantRow[] = [];
    if (ids.length > 0) {
      const [imgRes, varRes] = await Promise.all([
        supabase.from("shop_product_images").select("*").eq("club_id", guard.clubId).in("product_id", ids),
        supabase.from("shop_product_variants").select("*").eq("club_id", guard.clubId).in("product_id", ids),
      ]);
      images = (imgRes.data || []) as ImageRow[];
      variants = (varRes.data || []) as VariantRow[];
    }

    return NextResponse.json({
      products: products.map((row) => mapProduct(row, images, variants)),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = parseProductInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from("shop_products")
      .insert({
        club_id: guard.clubId,
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        price_cents: parsed.priceCents,
        promotional_price_cents: parsed.promotionalPriceCents,
        currency: "CHF",
        track_stock: parsed.trackStock,
        stock_quantity: parsed.stockQuantity,
        has_variants: parsed.hasVariants,
        status: parsed.status,
        created_by: guard.userId,
        updated_by: guard.userId,
      })
      .select(PRODUCT_SELECT)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: error?.message || "Création impossible" }, { status: 500 });
    }

    if (parsed.variants.length > 0) {
      const { error: vErr } = await supabase.from("shop_product_variants").insert(
        parsed.variants.map((v) => ({
          club_id: guard.clubId,
          product_id: product.id,
          label: v.label,
          attributes: v.attributes,
          sku: v.sku,
          stock_quantity: v.stockQuantity,
          is_active: v.isActive,
          sort_order: v.sortOrder,
        }))
      );
      if (vErr) {
        return NextResponse.json({ error: vErr.message }, { status: 500 });
      }
    }

    const { data: variants } = await supabase
      .from("shop_product_variants")
      .select("*")
      .eq("product_id", product.id);

    return NextResponse.json(
      { product: mapProduct(product as ProductRow, [], (variants || []) as VariantRow[]) },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
