import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { mapProduct, PRODUCT_SELECT, type ImageRow, type ProductRow, type VariantRow } from "@/lib/shop/products";
import { parseProductInput } from "@/lib/shop/product-input";
import { removeStorageObjects } from "@/lib/storage/removeObjects";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function loadOne(clubId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_products")
    .select(PRODUCT_SELECT)
    .eq("club_id", clubId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  const [images, variants] = await Promise.all([
    supabase.from("shop_product_images").select("*").eq("club_id", clubId).eq("product_id", id),
    supabase.from("shop_product_variants").select("*").eq("club_id", clubId).eq("product_id", id),
  ]);
  return mapProduct(data as ProductRow, (images.data || []) as ImageRow[], (variants.data || []) as VariantRow[]);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    const product = await loadOne(guard.clubId, id);
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = parseProductInput(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("shop_products")
      .select("id")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    const { error } = await supabase
      .from("shop_products")
      .update({
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        price_cents: parsed.priceCents,
        promotional_price_cents: parsed.promotionalPriceCents,
        track_stock: parsed.trackStock,
        stock_quantity: parsed.stockQuantity,
        has_variants: parsed.hasVariants,
        status: parsed.status,
        updated_by: guard.userId,
      })
      .eq("id", id)
      .eq("club_id", guard.clubId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: currentVariants } = await supabase
      .from("shop_product_variants")
      .select("id")
      .eq("product_id", id)
      .eq("club_id", guard.clubId);
    const keepIds = new Set(parsed.variants.map((v) => v.id).filter(Boolean) as string[]);
    const toDelete = (currentVariants || []).filter((v) => !keepIds.has(v.id)).map((v) => v.id);
    if (toDelete.length > 0) {
      await supabase
        .from("shop_product_variants")
        .delete()
        .eq("club_id", guard.clubId)
        .in("id", toDelete);
    }

    for (const variant of parsed.variants) {
      const payload = {
        club_id: guard.clubId,
        product_id: id,
        label: variant.label,
        attributes: variant.attributes,
        sku: variant.sku,
        stock_quantity: variant.stockQuantity,
        is_active: variant.isActive,
        sort_order: variant.sortOrder,
      };
      if (variant.id && keepIds.has(variant.id)) {
        await supabase
          .from("shop_product_variants")
          .update(payload)
          .eq("id", variant.id)
          .eq("club_id", guard.clubId);
      } else {
        await supabase.from("shop_product_variants").insert(payload);
      }
    }

    const product = await loadOne(guard.clubId, id);
    return NextResponse.json({ product });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function DELETE(
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
    const { data: images } = await supabase
      .from("shop_product_images")
      .select("storage_path")
      .eq("product_id", id)
      .eq("club_id", guard.clubId);
    const { error } = await supabase
      .from("shop_products")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: guard.userId,
        status: "archived",
      })
      .eq("id", id)
      .eq("club_id", guard.clubId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await removeStorageObjects(
      supabase,
      "shop-products",
      (images || []).map((row) => row.storage_path)
    );
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
