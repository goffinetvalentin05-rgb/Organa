import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  MATCH_PROGRAM_BUCKET,
  buildMatchProgramStoragePath,
} from "@/lib/public-page/match-program";
import { mapProfileToSettings } from "@/lib/public-page/db";
import { getMatchProgramPdfPublicUrl } from "@/lib/public-page/match-program";

export const runtime = "nodejs";

const SETTINGS_SELECT =
  "user_id, company_name, logo_url, primary_color, buvette_slug, public_page_enabled, public_page_slug, public_page_title, public_page_description, public_page_primary_color, public_page_instagram_url, public_page_facebook_url, public_page_website_url, public_page_show_buvette, public_page_show_match_program, public_page_match_program_type, public_page_match_program_url, public_page_match_program_pdf_path, public_page_match_program_pdf_name, public_page_show_public_links";

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier PDF requis" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Format invalide", details: "Seuls les fichiers PDF sont acceptés." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux", details: "Taille maximum : 10 Mo." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("public_page_match_program_pdf_path")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    const oldPath =
      typeof profile?.public_page_match_program_pdf_path === "string"
        ? profile.public_page_match_program_pdf_path
        : null;

    const storagePath = buildMatchProgramStoragePath(guard.clubId, file.name || "programme.pdf");
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(MATCH_PROGRAM_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Erreur lors de l'upload du PDF", details: uploadError.message },
        { status: 500 }
      );
    }

    const displayName = file.name?.trim() || "programme-matchs.pdf";

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        public_page_match_program_type: "pdf",
        public_page_match_program_pdf_path: storagePath,
        public_page_match_program_pdf_name: displayName,
        public_page_match_program_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", guard.clubId)
      .select(SETTINGS_SELECT)
      .single();

    if (updateError) {
      await supabase.storage.from(MATCH_PROGRAM_BUCKET).remove([storagePath]);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (oldPath && oldPath !== storagePath) {
      await supabase.storage.from(MATCH_PROGRAM_BUCKET).remove([oldPath]).catch(() => undefined);
    }

    const pdfUrl = getMatchProgramPdfPublicUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      storagePath
    );

    return NextResponse.json({
      settings: mapProfileToSettings(updated as Record<string, unknown>, pdfUrl),
      pdfUrl,
      pdfName: displayName,
    });
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("public_page_match_program_pdf_path, public_page_match_program_pdf_name")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    const pdfPath =
      typeof profile?.public_page_match_program_pdf_path === "string"
        ? profile.public_page_match_program_pdf_path
        : null;

    if (!pdfPath) {
      return NextResponse.json({ error: "Aucun PDF à supprimer" }, { status: 400 });
    }

    await supabase.storage.from(MATCH_PROGRAM_BUCKET).remove([pdfPath]).catch(() => undefined);

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        public_page_match_program_pdf_path: null,
        public_page_match_program_pdf_name: null,
        public_page_match_program_type: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", guard.clubId)
      .select(SETTINGS_SELECT)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: mapProfileToSettings(updated as Record<string, unknown>, null),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
