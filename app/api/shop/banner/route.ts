import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { selectShopSettingsRow } from "@/lib/shop/page-settings";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024;

function readStoredPath(row: { public_banner_path?: string | null } | null): string | null {
  const value = row?.public_banner_path;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const supabase = await createClient();
    const admin = createAdminClient();
    const clubId = guard.clubId;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG ou PNG." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max. 5 Mo)." }, { status: 400 });
    }

    const row = await selectShopSettingsRow(admin, clubId);
    const oldPath = readStoredPath(row);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${clubId}/shop-banner-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("Logos")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: "Erreur lors de l'upload", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: pub } = supabase.storage.from("Logos").getPublicUrl(fileName);
    const publicUrl = pub?.publicUrl ?? null;
    if (!publicUrl) {
      await supabase.storage.from("Logos").remove([fileName]);
      return NextResponse.json({ error: "Impossible de générer l'URL publique" }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from("shop_settings")
      .update({
        public_banner_url: publicUrl,
        public_banner_path: fileName,
        updated_at: new Date().toISOString(),
      })
      .eq("club_id", clubId);

    if (updateError) {
      await supabase.storage.from("Logos").remove([fileName]);
      return NextResponse.json(
        {
          error:
            "Impossible d’enregistrer l’image. Appliquez la migration 082_shop_public_page_settings.sql.",
        },
        { status: 500 }
      );
    }

    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("Logos").remove([oldPath]).catch(() => undefined);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const supabase = await createClient();
    const admin = createAdminClient();
    const row = await selectShopSettingsRow(admin, guard.clubId);
    const storedPath = readStoredPath(row);

    if (storedPath) {
      await supabase.storage.from("Logos").remove([storedPath]).catch(() => undefined);
    }

    const { error: updateError } = await admin
      .from("shop_settings")
      .update({
        public_banner_url: null,
        public_banner_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("club_id", guard.clubId);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            "Impossible de retirer l’image. Vérifiez que la migration 082_shop_public_page_settings.sql est appliquée.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
