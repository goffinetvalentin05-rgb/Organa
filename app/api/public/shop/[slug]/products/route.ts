import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePublicShop } from "@/lib/shop/public";
import { mapProduct, PRODUCT_SELECT, publicProductPayload, type ImageRow, type ProductRow, type VariantRow } from "@/lib/shop/products";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const resolved = await resolvePublicShop(slug);
    if (!resolved) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    if (!resolved.catalog.isEnabled) {
      return NextResponse.json({ products: [] });
    }

    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("club_id", resolved.clubId)
      .eq("status", "active")
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
        supabase.from("shop_product_images").select("*").eq("club_id", resolved.clubId).in("product_id", ids),
        supabase.from("shop_product_variants").select("*").eq("club_id", resolved.clubId).in("product_id", ids),
      ]);
      images = (imgRes.data || []) as ImageRow[];
      variants = (varRes.data || []) as VariantRow[];
    }

    return NextResponse.json({
      products: products.map((row) => publicProductPayload(mapProduct(row, images, variants))),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
