import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePublicShop } from "@/lib/shop/public";
import { mapProduct, PRODUCT_SELECT, publicProductPayload, type ImageRow, type ProductRow, type VariantRow } from "@/lib/shop/products";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; productId: string }> }
) {
  try {
    const { slug, productId } = await params;
    const resolved = await resolvePublicShop(slug);
    if (!resolved || !resolved.catalog.isEnabled) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("id", productId)
      .eq("club_id", resolved.clubId)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    const [images, variants] = await Promise.all([
      supabase.from("shop_product_images").select("*").eq("product_id", productId).eq("club_id", resolved.clubId),
      supabase.from("shop_product_variants").select("*").eq("product_id", productId).eq("club_id", resolved.clubId),
    ]);

    return NextResponse.json({
      product: publicProductPayload(
        mapProduct(data as ProductRow, (images.data || []) as ImageRow[], (variants.data || []) as VariantRow[])
      ),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
