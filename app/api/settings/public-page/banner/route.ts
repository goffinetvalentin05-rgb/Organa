import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { PUBLIC_PAGE_BRANDING_MIGRATION_HINT } from "@/lib/public-page/branding";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

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

    const { data: profile } = await admin
      .from("profiles")
      .select("public_page_banner_path")
      .eq("user_id", clubId)
      .maybeSingle();

    const oldPath =
      typeof profile?.public_page_banner_path === "string" ? profile.public_page_banner_path : null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${clubId}/public-page-banner-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("Logos")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: "Erreur lors de l'upload de la bannière", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: pub } = supabase.storage.from("Logos").getPublicUrl(fileName);
    const bannerUrl = pub?.publicUrl ?? null;

    if (!bannerUrl) {
      await supabase.storage.from("Logos").remove([fileName]);
      return NextResponse.json({ error: "Impossible de générer l'URL publique" }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        public_page_banner_url: bannerUrl,
        public_page_banner_path: fileName,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", clubId);

    if (updateError) {
      await supabase.storage.from("Logos").remove([fileName]);
      return NextResponse.json(
        { error: PUBLIC_PAGE_BRANDING_MIGRATION_HINT },
        { status: 500 }
      );
    }

    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("Logos").remove([oldPath]).catch(() => undefined);
    }

    return NextResponse.json({ bannerUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const admin = createAdminClient();
    const clubId = guard.clubId;

    const { data: profile } = await admin
      .from("profiles")
      .select("public_page_banner_path")
      .eq("user_id", clubId)
      .maybeSingle();

    const bannerPath =
      typeof profile?.public_page_banner_path === "string" ? profile.public_page_banner_path : null;

    if (bannerPath) {
      await supabase.storage.from("Logos").remove([bannerPath]).catch(() => undefined);
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        public_page_banner_url: null,
        public_page_banner_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", clubId);

    if (updateError) {
      return NextResponse.json(
        { error: PUBLIC_PAGE_BRANDING_MIGRATION_HINT },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
