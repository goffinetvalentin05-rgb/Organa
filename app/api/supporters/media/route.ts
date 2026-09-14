import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024;
const KINDS = ["banner", "background"] as const;
type MediaKind = (typeof KINDS)[number];

function parseKind(value: string | null): MediaKind | null {
  if (value === "banner" || value === "background") return value;
  return null;
}

const COLUMNS: Record<
  MediaKind,
  { url: string; path: string; filePrefix: string }
> = {
  banner: {
    url: "supporters_public_banner_url",
    path: "supporters_public_banner_path",
    filePrefix: "supporters-banner",
  },
  background: {
    url: "supporters_public_bg_image_url",
    path: "supporters_public_bg_image_path",
    filePrefix: "supporters-bg",
  },
};

function readStoredPath(row: Record<string, unknown> | null, column: string): string | null {
  const value = row?.[column];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;

    const kind = parseKind(request.nextUrl.searchParams.get("kind"));
    if (!kind) {
      return NextResponse.json({ error: "Type d’image invalide." }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();
    const clubId = guard.clubId;
    const cols = COLUMNS[kind];

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
      .select(cols.path)
      .eq("user_id", clubId)
      .maybeSingle();

    const oldPath = readStoredPath(profile as Record<string, unknown> | null, cols.path);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${clubId}/${cols.filePrefix}-${Date.now()}.${ext}`;
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
      .from("profiles")
      .update({
        [cols.url]: publicUrl,
        [cols.path]: fileName,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", clubId);

    if (updateError) {
      await supabase.storage.from("Logos").remove([fileName]);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("Logos").remove([oldPath]).catch(() => undefined);
    }

    return NextResponse.json({ url: publicUrl, kind });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;

    const kind = parseKind(request.nextUrl.searchParams.get("kind"));
    if (!kind) {
      return NextResponse.json({ error: "Type d’image invalide." }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();
    const cols = COLUMNS[kind];

    const { data: profile } = await admin
      .from("profiles")
      .select(cols.path)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    const storedPath = readStoredPath(profile as Record<string, unknown> | null, cols.path);

    if (storedPath) {
      await supabase.storage.from("Logos").remove([storedPath]).catch(() => undefined);
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        [cols.url]: null,
        [cols.path]: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", guard.clubId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, kind });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
