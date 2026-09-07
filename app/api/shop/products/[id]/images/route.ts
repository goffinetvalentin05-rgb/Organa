import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const supabase = await createClient();

    const { data: product } = await supabase
      .from("shop_products")
      .select("id")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    const { count } = await supabase
      .from("shop_product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id)
      .eq("club_id", guard.clubId);
    if ((count || 0) >= MAX_IMAGES) {
      return NextResponse.json({ error: "Maximum 8 photos par produit." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté (JPG, PNG ou WebP)." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max. 5 Mo)." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${guard.clubId}/${id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("shop-products")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from("shop-products").getPublicUrl(path);
    const { data: image, error: insertError } = await supabase
      .from("shop_product_images")
      .insert({
        club_id: guard.clubId,
        product_id: id,
        storage_path: path,
        public_url: pub.publicUrl,
        alt_text: file.name,
        sort_order: count || 0,
      })
      .select("*")
      .single();

    if (insertError) {
      await supabase.storage.from("shop-products").remove([path]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ image }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const imageId = request.nextUrl.searchParams.get("imageId");
    if (!imageId) return NextResponse.json({ error: "imageId requis" }, { status: 400 });

    const supabase = await createClient();
    const { data: image } = await supabase
      .from("shop_product_images")
      .select("id, storage_path")
      .eq("id", imageId)
      .eq("product_id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();
    if (!image) return NextResponse.json({ error: "Image introuvable" }, { status: 404 });

    await supabase
      .from("shop_product_images")
      .delete()
      .eq("id", imageId)
      .eq("club_id", guard.clubId);
    await supabase.storage.from("shop-products").remove([image.storage_path]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
