import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { mapProduct, PRODUCT_SELECT, type ImageRow, type ProductRow, type VariantRow } from "@/lib/shop/products";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const supabase = await createClient();

    const { data: source, error } = await supabase
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !source) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const src = source as ProductRow;
    const { data: created, error: createError } = await supabase
      .from("shop_products")
      .insert({
        club_id: guard.clubId,
        name: `${src.name} (copie)`,
        description: src.description,
        category: src.category,
        price_cents: src.price_cents,
        promotional_price_cents: src.promotional_price_cents,
        currency: "CHF",
        track_stock: src.track_stock,
        stock_quantity: src.stock_quantity,
        has_variants: src.has_variants,
        status: "hidden",
        created_by: guard.userId,
        updated_by: guard.userId,
      })
      .select(PRODUCT_SELECT)
      .single();

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message || "Duplication impossible" }, { status: 500 });
    }

    const [{ data: images }, { data: variants }] = await Promise.all([
      supabase.from("shop_product_images").select("*").eq("product_id", id).eq("club_id", guard.clubId),
      supabase.from("shop_product_variants").select("*").eq("product_id", id).eq("club_id", guard.clubId),
    ]);

    if (images?.length) {
      await supabase.from("shop_product_images").insert(
        (images as ImageRow[]).map((img) => ({
          club_id: guard.clubId,
          product_id: created.id,
          storage_path: img.storage_path,
          public_url: img.public_url,
          alt_text: img.alt_text,
          sort_order: img.sort_order,
        }))
      );
    }
    if (variants?.length) {
      await supabase.from("shop_product_variants").insert(
        (variants as VariantRow[]).map((v, index) => ({
          club_id: guard.clubId,
          product_id: created.id,
          label: v.label,
          attributes: v.attributes,
          sku: v.sku,
          stock_quantity: v.stock_quantity,
          is_active: v.is_active,
          sort_order: index,
        }))
      );
    }

    const [newImages, newVariants] = await Promise.all([
      supabase.from("shop_product_images").select("*").eq("product_id", created.id),
      supabase.from("shop_product_variants").select("*").eq("product_id", created.id),
    ]);

    return NextResponse.json({
      product: mapProduct(
        created as ProductRow,
        (newImages.data || []) as ImageRow[],
        (newVariants.data || []) as VariantRow[]
      ),
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
